import { z } from "zod";
import { Prisma, type ClaimPayment, type PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const CreatePaymentSchema = z.object({
  claimId: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const ProcessPaymentSchema = z.object({
  paymentId: z.string().min(1),
  transactionId: z.string().min(1),
  paymentMethod: z.string().min(1),
  processedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const FailPaymentSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().min(1),
  failedBy: z.string().optional(),
});

export const RefundPaymentSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  reason: z.string().min(1),
  processedBy: z.string().optional(),
});

export const CreateReserveSchema = z.object({
  claimId: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: z.enum(["CASE_RESERVE", "ALAE_RESERVE", "SALVAGE_RESERVE", "SUBROGATION_RESERVE"]),
  notes: z.string().optional(),
});

export const UpdateReserveSchema = z.object({
  reserveId: z.string().min(1),
  amount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
export type FailPaymentInput = z.infer<typeof FailPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;
export type CreateReserveInput = z.infer<typeof CreateReserveSchema>;
export type UpdateReserveInput = z.infer<typeof UpdateReserveSchema>;

export interface PaymentListFilters {
  claimId?: string;
  status?: PaymentStatus;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DisbursementRequest {
  claimId: string;
  payeeId: string;
  payeeType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

export class PaymentService {
  async createPayment(data: CreatePaymentInput, userId?: string): Promise<ClaimPayment> {
    const validated = CreatePaymentSchema.parse(data);

    const claim = await prisma.claim.findUnique({ where: { id: validated.claimId } });
    if (!claim) throw new NotFoundError("Claim", validated.claimId);

    const closedStatuses = ["CLOSED", "DENIED"];
    if (closedStatuses.includes(claim.status)) {
      throw new ConflictError(`Cannot create payment for claim in ${claim.status} status`);
    }

    if (claim.approvedAmount && claim.paidAmount) {
      const remainingApproval = Number(claim.approvedAmount) - Number(claim.paidAmount);
      if (validated.amount > remainingApproval) {
        throw new ValidationError(
          `Payment amount ${validated.amount} exceeds remaining approved amount ${remainingApproval}`
        );
      }
    }

    if (validated.amount > (claim.estimatedAmount ? Number(claim.estimatedAmount) * 1.5 : Infinity)) {
      throw new ValidationError("Payment amount exceeds 150% of estimated amount");
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.claimPayment.create({
        data: {
          claimId: validated.claimId,
          amount: new Prisma.Decimal(validated.amount),
          currency: validated.currency,
          paymentStatus: "PENDING",
          paymentMethod: validated.paymentMethod,
          notes: validated.notes,
        },
      });

      const newPaidAmount = (claim.paidAmount ? Number(claim.paidAmount) : 0) + validated.amount;
      await tx.claim.update({
        where: { id: validated.claimId },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "CREATE_PAYMENT",
          entity: "ClaimPayment",
          entityId: payment.id,
          newValues: {
            claimId: validated.claimId,
            amount: validated.amount,
            currency: validated.currency,
            paymentMethod: validated.paymentMethod,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return payment;
    });
  }

  async processPayment(data: ProcessPaymentInput): Promise<ClaimPayment> {
    const validated = ProcessPaymentSchema.parse(data);

    const payment = await prisma.claimPayment.findUnique({
      where: { id: validated.paymentId },
      include: { claim: true },
    });

    if (!payment) throw new NotFoundError("ClaimPayment", validated.paymentId);

    if (payment.paymentStatus !== "PENDING") {
      throw new ConflictError(`Cannot process payment in ${payment.paymentStatus} status`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claimPayment.update({
        where: { id: validated.paymentId },
        data: {
          paymentStatus: "COMPLETED",
          transactionId: validated.transactionId,
          paymentMethod: validated.paymentMethod,
          paidAt: new Date(),
          notes: validated.notes
            ? `${payment.notes ? payment.notes + "\n" : ""}${validated.notes}`
            : payment.notes,
        },
      });

      const claim = payment.claim;
      const totalPaid = Number(claim.paidAmount ?? 0);
      const approved = Number(claim.approvedAmount ?? 0);

      if (totalPaid >= approved && approved > 0) {
        await tx.claim.update({
          where: { id: claim.id },
          data: { status: "PAID" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: validated.processedBy ?? null,
          action: "PROCESS_PAYMENT",
          entity: "ClaimPayment",
          entityId: validated.paymentId,
          newValues: {
            transactionId: validated.transactionId,
            paymentMethod: validated.paymentMethod,
            status: "COMPLETED",
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async failPayment(data: FailPaymentInput): Promise<ClaimPayment> {
    const validated = FailPaymentSchema.parse(data);

    const payment = await prisma.claimPayment.findUnique({
      where: { id: validated.paymentId },
    });

    if (!payment) throw new NotFoundError("ClaimPayment", validated.paymentId);

    if (payment.paymentStatus !== "PENDING" && payment.paymentStatus !== "PROCESSING") {
      throw new ConflictError(`Cannot fail payment in ${payment.paymentStatus} status`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claimPayment.update({
        where: { id: validated.paymentId },
        data: {
          paymentStatus: "FAILED",
          notes: `${payment.notes ? payment.notes + "\n" : ""}Failed: ${validated.reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: validated.failedBy ?? null,
          action: "FAIL_PAYMENT",
          entity: "ClaimPayment",
          entityId: validated.paymentId,
          newValues: {
            reason: validated.reason,
            status: "FAILED",
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async refundPayment(data: RefundPaymentInput): Promise<ClaimPayment> {
    const validated = RefundPaymentSchema.parse(data);

    const payment = await prisma.claimPayment.findUnique({
      where: { id: validated.paymentId },
      include: { claim: true },
    });

    if (!payment) throw new NotFoundError("ClaimPayment", validated.paymentId);

    if (payment.paymentStatus !== "COMPLETED") {
      throw new ConflictError("Only completed payments can be refunded");
    }

    const refundAmount = validated.amount ?? Number(payment.amount);

    if (refundAmount > Number(payment.amount)) {
      throw new ValidationError("Refund amount cannot exceed original payment amount");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claimPayment.update({
        where: { id: validated.paymentId },
        data: {
          paymentStatus: "REFUNDED",
          notes: `${payment.notes ? payment.notes + "\n" : ""}Refunded: $${refundAmount} - ${validated.reason}`,
        },
      });

      const claim = payment.claim;
      const newPaidAmount = Math.max(0, (claim.paidAmount ? Number(claim.paidAmount) : 0) - refundAmount);

      await tx.claim.update({
        where: { id: claim.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount),
          ...(newPaidAmount === 0 && claim.status === "PAID"
            ? { status: "PENDING_APPROVAL" }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: validated.processedBy ?? null,
          action: "REFUND_PAYMENT",
          entity: "ClaimPayment",
          entityId: validated.paymentId,
          newValues: {
            refundAmount,
            reason: validated.reason,
            status: "REFUNDED",
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async getPaymentById(id: string): Promise<ClaimPayment> {
    const payment = await prisma.claimPayment.findUnique({
      where: { id },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            status: true,
            policyId: true,
            customerId: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundError("ClaimPayment", id);
    return payment;
  }

  async listPayments(filters: PaymentListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";

    const where: Prisma.ClaimPaymentWhereInput = {};

    if (filters.claimId) where.claimId = filters.claimId;
    if (filters.status) where.paymentStatus = filters.status;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.amountMin || filters.amountMax) {
      where.amount = {};
      if (filters.amountMin) where.amount.gte = new Prisma.Decimal(filters.amountMin);
      if (filters.amountMax) where.amount.lte = new Prisma.Decimal(filters.amountMax);
    }

    const [data, total] = await Promise.all([
      prisma.claimPayment.findMany({
        where,
        include: {
          claim: { select: { id: true, claimNumber: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.claimPayment.count({ where }),
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

  async getClaimPaymentsSummary(claimId: string) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const payments = await prisma.claimPayment.findMany({
      where: { claimId },
      orderBy: { createdAt: "asc" },
    });

    const summary = {
      claimId,
      claimNumber: claim.claimNumber,
      estimatedAmount: claim.estimatedAmount ? Number(claim.estimatedAmount) : 0,
      approvedAmount: claim.approvedAmount ? Number(claim.approvedAmount) : 0,
      deductible: claim.deductible ? Number(claim.deductible) : 0,
      payments: {
        total: payments.length,
        pending: payments.filter((p) => p.paymentStatus === "PENDING").length,
        processing: payments.filter((p) => p.paymentStatus === "PROCESSING").length,
        completed: payments.filter((p) => p.paymentStatus === "COMPLETED").length,
        failed: payments.filter((p) => p.paymentStatus === "FAILED").length,
        refunded: payments.filter((p) => p.paymentStatus === "REFUNDED").length,
      },
      amounts: {
        totalPaid: payments
          .filter((p) => p.paymentStatus === "COMPLETED")
          .reduce((sum, p) => sum + Number(p.amount), 0),
        totalRefunded: payments
          .filter((p) => p.paymentStatus === "REFUNDED")
          .reduce((sum, p) => sum + Number(p.amount), 0),
        netPaid: 0,
        pendingAmount: payments
          .filter((p) => p.paymentStatus === "PENDING" || p.paymentStatus === "PROCESSING")
          .reduce((sum, p) => sum + Number(p.amount), 0),
      },
      remainingApproved: 0,
      paymentTimeline: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.paymentStatus,
        method: p.paymentMethod,
        transactionId: p.transactionId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };

    summary.amounts.netPaid = summary.amounts.totalPaid - summary.amounts.totalRefunded;
    summary.remainingApproved = Math.max(
      0,
      summary.approvedAmount - summary.amounts.netPaid
    );

    return summary;
  }

  async createDisbursement(data: DisbursementRequest, userId?: string): Promise<ClaimPayment> {
    const claim = await prisma.claim.findUnique({ where: { id: data.claimId } });
    if (!claim) throw new NotFoundError("Claim", data.claimId);

    if (data.amount <= 0) {
      throw new ValidationError("Disbursement amount must be positive");
    }

    if (claim.approvedAmount && claim.paidAmount) {
      const remaining = Number(claim.approvedAmount) - Number(claim.paidAmount);
      if (data.amount > remaining) {
        throw new ValidationError(
          `Disbursement amount ${data.amount} exceeds remaining approved amount ${remaining}`
        );
      }
    }

    const notes = [
      `Disbursement to ${data.payeeType}: ${data.payeeId}`,
      data.reference ? `Reference: ${data.reference}` : "",
      data.notes || "",
    ]
      .filter(Boolean)
      .join("\n");

    return this.createPayment(
      {
        claimId: data.claimId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        notes,
      },
      userId
    );
  }

  async batchProcessPayments(
    paymentIds: string[],
    transactionIds: string[],
    processedBy?: string
  ): Promise<ClaimPayment[]> {
    if (paymentIds.length !== transactionIds.length) {
      throw new ValidationError("Payment IDs and transaction IDs must have the same length");
    }

    const results: ClaimPayment[] = [];

    for (let i = 0; i < paymentIds.length; i++) {
      const result = await this.processPayment({
        paymentId: paymentIds[i],
        transactionId: transactionIds[i],
        paymentMethod: "BATCH",
        processedBy,
      });
      results.push(result);
    }

    return results;
  }

  async getPaymentStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalPayments,
      byStatus,
      recentPayments,
      totalPaid,
      totalRefunded,
      pendingPayments,
      failedPayments,
    ] = await Promise.all([
      prisma.claimPayment.count(),
      prisma.claimPayment.groupBy({ by: ["paymentStatus"], _count: true }),
      prisma.claimPayment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.claimPayment.aggregate({
        _sum: { amount: true },
        where: {
          paymentStatus: "COMPLETED",
          paidAt: { gte: ninetyDaysAgo },
        },
      }),
      prisma.claimPayment.aggregate({
        _sum: { amount: true },
        where: {
          paymentStatus: "REFUNDED",
          createdAt: { gte: ninetyDaysAgo },
        },
      }),
      prisma.claimPayment.count({
        where: { paymentStatus: "PENDING" },
      }),
      prisma.claimPayment.count({
        where: { paymentStatus: "FAILED" },
      }),
    ]);

    return {
      total: totalPayments,
      recent: recentPayments,
      byStatus: byStatus.map((s) => ({
        status: s.paymentStatus,
        count: s._count,
      })),
      financials: {
        totalPaid90Days: totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0,
        totalRefunded90Days: totalRefunded._sum.amount ? Number(totalRefunded._sum.amount) : 0,
        netPaid90Days:
          (totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0) -
          (totalRefunded._sum.amount ? Number(totalRefunded._sum.amount) : 0),
      },
      alerts: {
        pendingPayments,
        failedPayments,
      },
    };
  }

  async getOverduePayments() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.claimPayment.findMany({
      where: {
        paymentStatus: "PENDING",
        createdAt: { lt: thirtyDaysAgo },
      },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            status: true,
            customerId: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async cancelPendingPayment(paymentId: string, userId?: string): Promise<ClaimPayment> {
    const payment = await prisma.claimPayment.findUnique({
      where: { id: paymentId },
      include: { claim: true },
    });

    if (!payment) throw new NotFoundError("ClaimPayment", paymentId);

    if (payment.paymentStatus !== "PENDING") {
      throw new ConflictError(`Cannot cancel payment in ${payment.paymentStatus} status`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claimPayment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: "CANCELLED",
          notes: `${payment.notes ? payment.notes + "\n" : ""}Cancelled by ${userId ?? "system"}`,
        },
      });

      const claim = payment.claim;
      const newPaidAmount = Math.max(
        0,
        (claim.paidAmount ? Number(claim.paidAmount) : 0) - Number(payment.amount)
      );
      await tx.claim.update({
        where: { id: claim.id },
        data: { paidAmount: new Prisma.Decimal(newPaidAmount) },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "CANCEL_PAYMENT",
          entity: "ClaimPayment",
          entityId: paymentId,
          newValues: { status: "CANCELLED" } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async getPaymentTimeline(claimId: string) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const [payments, notes] = await Promise.all([
      prisma.claimPayment.findMany({
        where: { claimId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.claimNote.findMany({
        where: {
          claimId,
          content: { contains: "payment" },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const timeline = [
      ...payments.map((p) => ({
        type: "PAYMENT" as const,
        id: p.id,
        amount: Number(p.amount),
        status: p.paymentStatus,
        method: p.paymentMethod,
        transactionId: p.transactionId,
        date: p.paidAt ?? p.createdAt,
        createdAt: p.createdAt,
      })),
      ...notes.map((n) => ({
        type: "NOTE" as const,
        id: n.id,
        content: n.content,
        authorId: n.authorId,
        date: n.createdAt,
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      claimId,
      claimNumber: claim.claimNumber,
      timeline,
      summary: {
        totalEvents: timeline.length,
        payments: payments.length,
        notes: notes.length,
      },
    };
  }
}

export const paymentService = new PaymentService();
