import { z } from "zod";
import { Prisma, type InsuranceProduct, type InsurancePlan } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  category: z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export const CreatePlanSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  basePremium: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  config: z.record(z.unknown()).optional(),
});

export const UpdatePlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  basePremium: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export const CreateCoverageSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  type: z.string().min(1),
  isOptional: z.boolean().default(false),
  config: z.record(z.unknown()).optional(),
  limits: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.coerce.number().positive(),
        period: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  deductibles: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.coerce.number().min(0),
        type: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export const UpdateCoverageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  isOptional: z.boolean().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type CreateCoverageInput = z.infer<typeof CreateCoverageSchema>;
export type UpdateCoverageInput = z.infer<typeof UpdateCoverageSchema>;

export interface ProductListFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PlanListFilters {
  productId?: string;
  isActive?: boolean;
  minPremium?: number;
  maxPremium?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  async createProduct(data: CreateProductInput): Promise<InsuranceProduct> {
    const validated = CreateProductSchema.parse(data);

    const existing = await prisma.insuranceProduct.findFirst({
      where: { OR: [{ name: validated.name }, { code: validated.code }] },
    });

    if (existing) {
      throw new ConflictError(
        `Product with name "${validated.name}" or code "${validated.code}" already exists`
      );
    }

    return prisma.insuranceProduct.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        category: validated.category,
        config: validated.config ?? undefined,
      },
    });
  }

  async getProductById(id: string): Promise<InsuranceProduct> {
    const product = await prisma.insuranceProduct.findUnique({
      where: { id },
      include: {
        plans: {
          where: { isActive: true },
          include: {
            coverages: {
              where: { isActive: true },
              include: { limits: true, deductibles: true },
            },
            _count: { select: { quotes: true, coverages: true } },
          },
          orderBy: { basePremium: "asc" },
        },
        _count: { select: { plans: true } },
      },
    });

    if (!product) throw new NotFoundError("InsuranceProduct", id);
    return product;
  }

  async listProducts(filters: ProductListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";

    const where: Prisma.InsuranceProductWhereInput = {};

    if (filters.category) where.category = filters.category;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.insuranceProduct.findMany({
        where,
        include: {
          plans: { select: { id: true, name: true, basePremium: true, isActive: true } },
          _count: { select: { plans: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insuranceProduct.count({ where }),
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

  async updateProduct(id: string, data: UpdateProductInput): Promise<InsuranceProduct> {
    const existing = await prisma.insuranceProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("InsuranceProduct", id);

    const validated = UpdateProductSchema.parse(data);

    if (validated.name || validated.code) {
      const conflict = await prisma.insuranceProduct.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(validated.name ? [{ name: validated.name }] : []),
            ...(validated.code ? [{ code: validated.code }] : []),
          ],
        },
      });

      if (conflict) {
        throw new ConflictError("Product with this name or code already exists");
      }
    }

    return prisma.insuranceProduct.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.category && { category: validated.category }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.config && { config: validated.config }),
      },
    });
  }

  async deactivateProduct(id: string): Promise<void> {
    const product = await prisma.insuranceProduct.findUnique({
      where: { id },
      include: {
        plans: {
          where: { isActive: true },
          include: {
            quotes: { where: { status: "DRAFT" } },
          },
        },
      },
    });

    if (!product) throw new NotFoundError("InsuranceProduct", id);

    const activeQuoteCount = product.plans.reduce(
      (sum, plan) => sum + plan.quotes.length,
      0
    );

    if (activeQuoteCount > 0) {
      throw new ConflictError(
        `Cannot deactivate product with ${activeQuoteCount} active quotes`
      );
    }

    await prisma.insuranceProduct.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.insurancePlan.updateMany({
      where: { productId: id },
      data: { isActive: false },
    });
  }

  async createPlan(data: CreatePlanInput): Promise<InsurancePlan> {
    const validated = CreatePlanSchema.parse(data);

    const product = await prisma.insuranceProduct.findUnique({
      where: { id: validated.productId },
    });

    if (!product) throw new NotFoundError("InsuranceProduct", validated.productId);
    if (!product.isActive) throw new ConflictError("Cannot create plan for inactive product");

    const existingPlan = await prisma.insurancePlan.findFirst({
      where: {
        productId: validated.productId,
        OR: [{ name: validated.name }, { code: validated.code }],
      },
    });

    if (existingPlan) {
      throw new ConflictError(
        `Plan with name "${validated.name}" or code "${validated.code}" already exists in this product`
      );
    }

    return prisma.insurancePlan.create({
      data: {
        productId: validated.productId,
        name: validated.name,
        code: validated.code,
        description: validated.description,
        basePremium: new Prisma.Decimal(validated.basePremium),
        currency: validated.currency,
        config: validated.config ?? undefined,
      },
      include: { product: true },
    });
  }

  async getPlanById(id: string): Promise<InsurancePlan> {
    const plan = await prisma.insurancePlan.findUnique({
      where: { id },
      include: {
        product: true,
        coverages: {
          where: { isActive: true },
          include: { limits: true, deductibles: true },
          orderBy: { name: "asc" },
        },
        _count: { select: { quotes: true, coverages: true } },
      },
    });

    if (!plan) throw new NotFoundError("InsurancePlan", id);
    return plan;
  }

  async listPlans(filters: PlanListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const where: Prisma.InsurancePlanWhereInput = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.minPremium || filters.maxPremium) {
      where.basePremium = {};
      if (filters.minPremium) where.basePremium.gte = new Prisma.Decimal(filters.minPremium);
      if (filters.maxPremium) where.basePremium.lte = new Prisma.Decimal(filters.maxPremium);
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.insurancePlan.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, category: true } },
          coverages: { select: { id: true, name: true, type: true, isOptional: true } },
          _count: { select: { quotes: true, coverages: true } },
        },
        orderBy: { basePremium: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insurancePlan.count({ where }),
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

  async updatePlan(id: string, data: UpdatePlanInput): Promise<InsurancePlan> {
    const existing = await prisma.insurancePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("InsurancePlan", id);

    const validated = UpdatePlanSchema.parse(data);

    return prisma.insurancePlan.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.basePremium && { basePremium: new Prisma.Decimal(validated.basePremium) }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.config && { config: validated.config }),
      },
      include: { product: true },
    });
  }

  async createCoverage(data: CreateCoverageInput) {
    const validated = CreateCoverageSchema.parse(data);

    const plan = await prisma.insurancePlan.findUnique({
      where: { id: validated.planId },
    });

    if (!plan) throw new NotFoundError("InsurancePlan", validated.planId);
    if (!plan.isActive) throw new ConflictError("Cannot add coverage to inactive plan");

    const existing = await prisma.coverage.findFirst({
      where: {
        planId: validated.planId,
        OR: [{ name: validated.name }, { code: validated.code }],
      },
    });

    if (existing) {
      throw new ConflictError(
        `Coverage with name "${validated.name}" or code "${validated.code}" already exists in this plan`
      );
    }

    return prisma.$transaction(async (tx) => {
      const coverage = await tx.coverage.create({
        data: {
          planId: validated.planId,
          name: validated.name,
          code: validated.code,
          description: validated.description,
          type: validated.type,
          isOptional: validated.isOptional,
          config: validated.config ?? undefined,
        },
      });

      if (validated.limits && validated.limits.length > 0) {
        await tx.coverageLimit.createMany({
          data: validated.limits.map((limit) => ({
            coverageId: coverage.id,
            name: limit.name,
            amount: new Prisma.Decimal(limit.amount),
            period: limit.period,
            description: limit.description,
          })),
        });
      }

      if (validated.deductibles && validated.deductibles.length > 0) {
        await tx.deductible.createMany({
          data: validated.deductibles.map((deductible) => ({
            coverageId: coverage.id,
            name: deductible.name,
            amount: new Prisma.Decimal(deductible.amount),
            type: deductible.type,
            description: deductible.description,
          })),
        });
      }

      return tx.coverage.findUnique({
        where: { id: coverage.id },
        include: { limits: true, deductibles: true },
      });
    });
  }

  async getCoverageById(id: string) {
    const coverage = await prisma.coverage.findUnique({
      where: { id },
      include: {
        plan: { include: { product: true } },
        limits: true,
        deductibles: true,
      },
    });

    if (!coverage) throw new NotFoundError("Coverage", id);
    return coverage;
  }

  async updateCoverage(id: string, data: UpdateCoverageInput) {
    const existing = await prisma.coverage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Coverage", id);

    const validated = UpdateCoverageSchema.parse(data);

    return prisma.coverage.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.type && { type: validated.type }),
        ...(validated.isOptional !== undefined && { isOptional: validated.isOptional }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.config && { config: validated.config }),
      },
      include: { limits: true, deductibles: true },
    });
  }

  async deleteCoverage(id: string): Promise<void> {
    const coverage = await prisma.coverage.findUnique({
      where: { id },
      include: {
        _count: { select: { policyCoverages: true, quotes: true } },
      },
    });

    if (!coverage) throw new NotFoundError("Coverage", id);

    if (coverage._count.policyCoverages > 0) {
      throw new ConflictError(
        "Cannot delete coverage associated with active policies. Deactivate instead."
      );
    }

    if (coverage._count.quotes > 0) {
      throw new ConflictError(
        "Cannot delete coverage with existing quotes. Deactivate instead."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.coverageLimit.deleteMany({ where: { coverageId: id } });
      await tx.deductible.deleteMany({ where: { coverageId: id } });
      await tx.coverage.delete({ where: { id } });
    });
  }

  async getProductCategories(): Promise<string[]> {
    const categories = await prisma.insuranceProduct.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { isActive: true },
      orderBy: { category: "asc" },
    });

    return categories.map((c) => c.category);
  }

  async getProductComparison(productId: string) {
    const product = await prisma.insuranceProduct.findUnique({
      where: { id: productId },
      include: {
        plans: {
          where: { isActive: true },
          include: {
            coverages: {
              where: { isActive: true },
              include: { limits: true, deductibles: true },
            },
          },
          orderBy: { basePremium: "asc" },
        },
      },
    });

    if (!product) throw new NotFoundError("InsuranceProduct", id);

    const planComparison = product.plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      code: plan.code,
      basePremium: Number(plan.basePremium),
      currency: plan.currency,
      requiredCoverages: plan.coverages
        .filter((c) => !c.isOptional)
        .map((c) => ({
          name: c.name,
          code: c.code,
          type: c.type,
          limits: c.limits.map((l) => ({ name: l.name, amount: Number(l.amount) })),
          deductibles: c.deductibles.map((d) => ({
            name: d.name,
            amount: Number(d.amount),
            type: d.type,
          })),
        })),
      optionalCoverages: plan.coverages
        .filter((c) => c.isOptional)
        .map((c) => ({
          name: c.name,
          code: c.code,
          type: c.type,
          limits: c.limits.map((l) => ({ name: l.name, amount: Number(l.amount) })),
          deductibles: c.deductibles.map((d) => ({
            name: d.name,
            amount: Number(d.amount),
            type: d.type,
          })),
        })),
      totalCoverages: plan.coverages.length,
      maxCoverage: Math.max(
        ...plan.coverages.flatMap((c) => c.limits.map((l) => Number(l.amount)))
      ),
    }));

    return {
      product: {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        description: product.description,
      },
      plans: planComparison,
      lowestPremium: planComparison.length > 0 ? planComparison[0].basePremium : 0,
      highestPremium:
        planComparison.length > 0
          ? planComparison[planComparison.length - 1].basePremium
          : 0,
    };
  }
}

export const productService = new ProductService();
