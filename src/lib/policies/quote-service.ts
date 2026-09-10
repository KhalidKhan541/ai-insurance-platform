import { z } from "zod";
import { Prisma, type InsuranceQuote } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const CreateQuoteSchema = z.object({
  planId: z.string().min(1),
  customerId: z.string().optional(),
  agentId: z.string().optional(),
  validDays: z.number().int().positive().default(30),
  coverageSelections: z.array(
    z.object({
      coverageId: z.string().min(1),
      amount: z.coerce.number().positive(),
      rate: z.coerce.number().min(0).optional(),
    })
  ).min(1),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CompareQuotesSchema = z.object({
  quoteIds: z.array(z.string()).min(2).max(10),
  criteria: z.array(
    z.enum(["premium", "coverage", "deductible", "rating"])
  ).default(["premium", "coverage"]),
});

export const ConvertQuoteSchema = z.object({
  quoteId: z.string().min(1),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  agentId: z.string().optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "semi-annual", "annual"]).default("annual"),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type CompareQuotesInput = z.infer<typeof CompareQuotesSchema>;
export type ConvertQuoteInput = z.infer<typeof ConvertQuoteSchema>;

export interface QuoteListFilters {
  customerId?: string;
  agentId?: string;
  planId?: string;
  status?: string;
  expiringBefore?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function generateQuoteNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QTE-${timestamp}-${random}`;
}

export class QuoteService {
  async create(data: CreateQuoteInput): Promise<InsuranceQuote> {
    const validated = CreateQuoteSchema.parse(data);

    const plan = await prisma.insurancePlan.findUnique({
      where: { id: validated.planId },
      include: {
        product: true,
        coverages: {
          include: { limits: true, deductibles: true },
          where: { isActive: true },
        },
      },
    });

    if (!plan) throw new NotFoundError("InsurancePlan", validated.planId);
    if (!plan.isActive) throw new ConflictError("Insurance plan is not active");

    const selectedCoverageIds = validated.coverageSelections.map((s) => s.coverageId);
    const availableCoverages = plan.coverages.filter((c) =>
      selectedCoverageIds.includes(c.id)
    );

    if (availableCoverages.length !== selectedCoverageIds.length) {
      const missing = selectedCoverageIds.filter(
        (id) => !availableCoverages.find((c) => c.id === id)
      );
      throw new ValidationError(`Invalid coverage IDs: ${missing.join(", ")}`);
    }

    const quoteNumber = generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validated.validDays);

    let totalPremium = Number(plan.basePremium);

    const quoteItems = validated.coverageSelections.map((selection) => {
      const coverage = availableCoverages.find((c) => c.id === selection.coverageId)!;
      const rate = selection.rate ?? 0.01;
      const itemPremium = selection.amount * rate;
      totalPremium += itemPremium;

      return {
        coverageId: selection.coverageId,
        amount: new Prisma.Decimal(selection.amount),
        rate: new Prisma.Decimal(rate),
        premium: new Prisma.Decimal(itemPremium),
        metadata: {
          coverageName: coverage.name,
          coverageCode: coverage.code,
          coverageType: coverage.type,
        },
      };
    });

    const discountAmount = validated.discountPercent
      ? totalPremium * (validated.discountPercent / 100)
      : 0;
    const afterDiscount = totalPremium - discountAmount;
    const taxAmount = validated.taxRate ? afterDiscount * validated.taxRate : 0;
    const finalAmount = afterDiscount + taxAmount;

    const quote = await prisma.insuranceQuote.create({
      data: {
        quoteNumber,
        planId: validated.planId,
        customerId: validated.customerId,
        agentId: validated.agentId,
        status: "DRAFT",
        validUntil,
        totalPremium: new Prisma.Decimal(totalPremium),
        currency: plan.currency,
        discountPercent: validated.discountPercent
          ? new Prisma.Decimal(validated.discountPercent)
          : null,
        discountAmount: discountAmount > 0 ? new Prisma.Decimal(discountAmount) : null,
        taxAmount: taxAmount > 0 ? new Prisma.Decimal(taxAmount) : null,
        finalAmount: new Prisma.Decimal(finalAmount),
        metadata: {
          ...validated.metadata,
          planName: plan.name,
          productName: plan.product.name,
          basePremium: plan.basePremium,
        },
        items: {
          create: quoteItems,
        },
      },
      include: {
        plan: { include: { product: true } },
        items: { include: { coverage: true } },
      },
    });

    return quote;
  }

  async getById(id: string): Promise<InsuranceQuote> {
    const quote = await prisma.insuranceQuote.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            product: true,
            coverages: { include: { limits: true, deductibles: true } },
          },
        },
        items: { include: { coverage: true } },
        policy: { select: { id: true, policyNumber: true, status: true } },
      },
    });

    if (!quote) throw new NotFoundError("InsuranceQuote", id);
    return quote;
  }

  async list(filters: QuoteListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";

    const where: Prisma.InsuranceQuoteWhereInput = {};

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.planId) where.planId = filters.planId;
    if (filters.status) where.status = filters.status;

    if (filters.expiringBefore) {
      where.validUntil = { lte: filters.expiringBefore };
      where.status = "DRAFT";
    }

    if (filters.search) {
      where.OR = [
        { quoteNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.insuranceQuote.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true, product: { select: { name: true } } } },
          items: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insuranceQuote.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async compareQuotes(input: CompareQuotesInput) {
    const validated = CompareQuotesSchema.parse(input);

    const quotes = await prisma.insuranceQuote.findMany({
      where: { id: { in: validated.quoteIds } },
      include: {
        plan: {
          include: {
            product: true,
            coverages: { include: { limits: true, deductibles: true } },
          },
        },
        items: { include: { coverage: true } },
      },
    });

    if (quotes.length !== validated.quoteIds.length) {
      const foundIds = quotes.map((q) => q.id);
      const missing = validated.quoteIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError("Quotes", missing.join(", "));
    }

    const comparison = quotes.map((quote) => {
      const coverages = quote.items.map((item) => ({
        name: item.coverage.name,
        amount: Number(item.amount),
        premium: Number(item.premium),
        rate: item.rate ? Number(item.rate) : null,
      }));

      return {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        planName: quote.plan.name,
        productName: quote.plan.product.name,
        totalPremium: Number(quote.totalPremium),
        finalAmount: quote.finalAmount ? Number(quote.finalAmount) : null,
        discountPercent: quote.discountPercent ? Number(quote.discountPercent) : null,
        validUntil: quote.validUntil,
        coverages,
        totalCoverages: coverages.length,
        maxCoverageAmount: Math.max(...coverages.map((c) => c.amount)),
        totalDeductibles: quote.plan.coverages.reduce(
          (sum, cov) => sum + cov.deductibles.reduce((dSum, d) => dSum + Number(d.amount), 0),
          0
        ),
      };
    });

    const rankings = {
      byPremium: [...comparison].sort((a, b) => a.totalPremium - b.totalPremium),
      byCoverage: [...comparison].sort(
        (a, b) => b.maxCoverageAmount - a.maxCoverageAmount
      ),
      byValue: [...comparison].sort(
        (a, b) =>
          b.maxCoverageAmount / b.totalPremium - a.maxCoverageAmount / a.totalPremium
      ),
    };

    return {
      quotes: comparison,
      rankings,
      recommendation: rankings.byValue[0]?.id ?? null,
      generatedAt: new Date(),
    };
  }

  async convertToPolicy(input: ConvertQuoteSchema) {
    const validated = ConvertQuoteSchema.parse(input);

    const quote = await prisma.insuranceQuote.findUnique({
      where: { id: validated.quoteId },
      include: {
        plan: { include: { product: true } },
        items: { include: { coverage: true } },
      },
    });

    if (!quote) throw new NotFoundError("InsuranceQuote", validated.quoteId);

    if (quote.status === "CONVERTED") {
      throw new ConflictError("Quote has already been converted to a policy");
    }

    if (new Date() > quote.validUntil) {
      throw new ConflictError("Quote has expired and cannot be converted");
    }

    if (validated.expirationDate <= validated.effectiveDate) {
      throw new ValidationError("Expiration date must be after effective date");
    }

    if (!quote.customerId) {
      throw new ValidationError("Quote must have a customer before conversion");
    }

    const policyNumber = `POL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      const policy = await tx.policy.create({
        data: {
          policyNumber,
          policyTypeId: quote.plan.productId,
          customerId: quote.customerId!,
          agentId: validated.agentId ?? quote.agentId,
          insurerId: quote.plan.productId,
          status: "DRAFT",
          effectiveDate: validated.effectiveDate,
          expirationDate: validated.expirationDate,
          totalPremium: quote.totalPremium,
          currency: quote.currency,
          isAutoRenew: false,
          metadata: {
            ...((quote.metadata as Record<string, unknown>) ?? {}),
            convertedFromQuote: quote.quoteNumber,
            paymentFrequency: validated.paymentFrequency,
            ...(validated.metadata ?? {}),
          },
        },
      });

      await tx.insuranceQuote.update({
        where: { id: validated.quoteId },
        data: {
          status: "CONVERTED",
          convertedPolicyId: policy.id,
        },
      });

      const premiumAmount = quote.finalAmount ?? quote.totalPremium;
      const frequencyMap = {
        monthly: 12,
        quarterly: 4,
        "semi-annual": 2,
        annual: 1,
      };
      const periods = frequencyMap[validated.paymentFrequency];
      const periodPremium = Number(premiumAmount) / periods;

      const premiums = [];
      for (let i = 0; i < periods; i++) {
        const dueDate = new Date(validated.effectiveDate);
        if (validated.paymentFrequency === "monthly") {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else if (validated.paymentFrequency === "quarterly") {
          dueDate.setMonth(dueDate.getMonth() + i * 3);
        } else if (validated.paymentFrequency === "semi-annual") {
          dueDate.setMonth(dueDate.getMonth() + i * 6);
        } else {
          dueDate.setFullYear(dueDate.getFullYear() + i);
        }

        premiums.push(
          tx.premium.create({
            data: {
              policyId: policy.id,
              amount: new Prisma.Decimal(periodPremium),
              currency: quote.currency,
              dueDate,
              status: i === 0 ? "PENDING" : "PENDING",
            },
          })
        );
      }

      await Promise.all(premiums);

      await tx.auditLog.create({
        data: {
          action: "CONVERT_QUOTE",
          entity: "InsuranceQuote",
          entityId: validated.quoteId,
          newValues: {
            policyId: policy.id,
            policyNumber,
            paymentFrequency: validated.paymentFrequency,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return tx.policy.findUnique({
        where: { id: policy.id },
        include: {
          policyType: true,
          customer: true,
          insurer: true,
          premiums: { orderBy: { dueDate: "asc" } },
        },
      });
    });
  }

  async expireStaleQuotes(): Promise<number> {
    const result = await prisma.insuranceQuote.updateMany({
      where: {
        status: "DRAFT",
        validUntil: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return result.count;
  }

  async getQuoteStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalQuotes,
      activeQuotes,
      convertedQuotes,
      expiredQuotes,
      recentQuotes,
      averagePremium,
      conversionRate,
    ] = await Promise.all([
      prisma.insuranceQuote.count(),
      prisma.insuranceQuote.count({ where: { status: "DRAFT", validUntil: { gt: now } } }),
      prisma.insuranceQuote.count({ where: { status: "CONVERTED" } }),
      prisma.insuranceQuote.count({ where: { status: "EXPIRED" } }),
      prisma.insuranceQuote.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.insuranceQuote.aggregate({
        _avg: { totalPremium: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.insuranceQuote.aggregate({
        _count: { id: true },
        where: { status: "CONVERTED", updatedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const totalRecent = await prisma.insuranceQuote.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      total: totalQuotes,
      active: activeQuotes,
      converted: convertedQuotes,
      expired: expiredQuotes,
      recentQuotes,
      averagePremium: averagePremium._avg.totalPremium
        ? Number(averagePremium._avg.totalPremium)
        : 0,
      conversionRate: totalRecent > 0 ? (convertedQuotes / totalRecent) * 100 : 0,
    };
  }

  async getPopularPlans(limit = 5) {
    return prisma.insurancePlan.findMany({
      where: { isActive: true },
      include: {
        product: { select: { name: true, category: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { quotes: { _count: "desc" } },
      take: limit,
    });
  }

  async duplicateQuote(quoteId: string): Promise<InsuranceQuote> {
    const original = await prisma.insuranceQuote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });

    if (!original) throw new NotFoundError("InsuranceQuote", quoteId);

    const newQuoteNumber = generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    return prisma.insuranceQuote.create({
      data: {
        quoteNumber: newQuoteNumber,
        planId: original.planId,
        customerId: original.customerId,
        agentId: original.agentId,
        status: "DRAFT",
        validUntil,
        totalPremium: original.totalPremium,
        currency: original.currency,
        discountPercent: original.discountPercent,
        discountAmount: original.discountAmount,
        taxAmount: original.taxAmount,
        finalAmount: original.finalAmount,
        metadata: {
          ...((original.metadata as Record<string, unknown>) ?? {}),
          duplicatedFrom: original.quoteNumber,
        },
        items: {
          create: original.items.map((item) => ({
            coverageId: item.coverageId,
            amount: item.amount,
            rate: item.rate,
            premium: item.premium,
            metadata: item.metadata,
          })),
        },
      },
      include: {
        plan: { include: { product: true } },
        items: { include: { coverage: true } },
      },
    });
  }
}

export const quoteService = new QuoteService();
