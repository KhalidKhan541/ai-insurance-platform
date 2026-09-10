import { z } from "zod";
import { Prisma, type Policy, type PolicyStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const CreatePolicySchema = z.object({
  policyTypeId: z.string().min(1),
  customerId: z.string().min(1),
  agentId: z.string().optional(),
  insurerId: z.string().min(1),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  description: z.string().optional(),
  terms: z.string().optional(),
  totalPremium: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  isAutoRenew: z.boolean().default(false),
  coverageIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdatePolicySchema = z.object({
  effectiveDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  totalPremium: z.coerce.number().positive().optional(),
  isAutoRenew: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RenewPolicySchema = z.object({
  newExpirationDate: z.coerce.date(),
  newPremium: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export const EndorsePolicySchema = z.object({
  type: z.string().min(1),
  description: z.string().optional(),
  effectiveDate: z.coerce.date(),
  changes: z.record(z.unknown()),
  premiumImpact: z.coerce.number().optional(),
});

export const CancelPolicySchema = z.object({
  reason: z.string().min(1),
  effectiveDate: z.coerce.date(),
  refundAmount: z.coerce.number().min(0).optional(),
});

export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;
export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;
export type RenewPolicyInput = z.infer<typeof RenewPolicySchema>;
export type EndorsePolicyInput = z.infer<typeof EndorsePolicySchema>;
export type CancelPolicyInput = z.infer<typeof CancelPolicySchema>;

export interface PolicyListFilters {
  customerId?: string;
  agentId?: string;
  insurerId?: string;
  policyTypeId?: string;
  status?: PolicyStatus;
  search?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  expiringBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function generatePolicyNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `POL-${timestamp}-${random}`;
}

function generateEndorsementNumber(policyNumber: string, count: number): string {
  const seq = String(count + 1).padStart(3, "0");
  return `${policyNumber}-END-${seq}`;
}

export class PolicyService {
  async create(data: CreatePolicyInput, userId?: string): Promise<Policy> {
    const validated = CreatePolicySchema.parse(data);

    const [policyType, customer, insurer] = await Promise.all([
      prisma.policyType.findUnique({ where: { id: validated.policyTypeId } }),
      prisma.customer.findUnique({ where: { id: validated.customerId } }),
      prisma.insurer.findUnique({ where: { id: validated.insurerId } }),
    ]);

    if (!policyType) throw new NotFoundError("PolicyType", validated.policyTypeId);
    if (!customer) throw new NotFoundError("Customer", validated.customerId);
    if (!insurer) throw new NotFoundError("Insurer", validated.insurerId);

    if (validated.agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: validated.agentId } });
      if (!agent) throw new NotFoundError("Agent", validated.agentId);
    }

    if (validated.expirationDate <= validated.effectiveDate) {
      throw new ValidationError("Expiration date must be after effective date");
    }

    const policyNumber = generatePolicyNumber();

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
          policyNumber,
          policyTypeId: validated.policyTypeId,
          customerId: validated.customerId,
          agentId: validated.agentId,
          insurerId: validated.insurerId,
          status: "DRAFT",
          effectiveDate: validated.effectiveDate,
          expirationDate: validated.expirationDate,
          description: validated.description,
          terms: validated.terms,
          totalPremium: new Prisma.Decimal(validated.totalPremium),
          currency: validated.currency,
          isAutoRenew: validated.isAutoRenew,
          metadata: validated.metadata ?? undefined,
        },
        include: {
          policyType: true,
          customer: true,
          insurer: true,
        },
      });

      if (validated.coverageIds && validated.coverageIds.length > 0) {
        await tx.policy.update({
          where: { id: created.id },
          data: {
            coverages: {
              connect: validated.coverageIds.map((id) => ({ id })),
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "CREATE",
          entity: "Policy",
          entityId: created.id,
          newValues: created as unknown as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return policy;
  }

  async getById(id: string): Promise<Policy> {
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        policyType: true,
        customer: { include: { user: { select: { id: true, name: true, email: true } } } },
        insurer: true,
        agent: { include: { user: { select: { id: true, name: true, email: true } } } },
        coverages: { include: { limits: true, deductibles: true } },
        renewals: { orderBy: { createdAt: "desc" } },
        endorsements: { orderBy: { createdAt: "desc" } },
        cancellations: { orderBy: { createdAt: "desc" } },
        documents: true,
        premiums: { orderBy: { dueDate: "asc" } },
        premiumSchedules: { where: { isActive: true } },
      },
    });

    if (!policy) throw new NotFoundError("Policy", id);
    return policy;
  }

  async list(filters: PolicyListFilters = {}): Promise<PaginatedResult<Policy>> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";

    const where: Prisma.PolicyWhereInput = {};

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.insurerId) where.insurerId = filters.insurerId;
    if (filters.policyTypeId) where.policyTypeId = filters.policyTypeId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { policyNumber: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.effectiveFrom || filters.effectiveTo) {
      where.effectiveDate = {};
      if (filters.effectiveFrom) where.effectiveDate.gte = filters.effectiveFrom;
      if (filters.effectiveTo) where.effectiveDate.lte = filters.effectiveTo;
    }

    if (filters.expiringBefore) {
      where.expirationDate = { lte: filters.expiringBefore };
      where.status = "ACTIVE";
    }

    const [data, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          policyType: { select: { id: true, name: true, code: true } },
          customer: { select: { id: true, customerNumber: true, user: { select: { name: true } } } },
          insurer: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policy.count({ where }),
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

  async update(id: string, data: UpdatePolicyInput, userId?: string): Promise<Policy> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Policy", id);

    if (existing.status === "CANCELLED" || existing.status === "EXPIRED") {
      throw new ConflictError(`Cannot update policy in ${existing.status} status`);
    }

    const validated = UpdatePolicySchema.parse(data);

    if (validated.effectiveDate && validated.expirationDate) {
      if (validated.expirationDate <= validated.effectiveDate) {
        throw new ValidationError("Expiration date must be after effective date");
      }
    }

    const policy = await prisma.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id },
        data: {
          ...(validated.effectiveDate && { effectiveDate: validated.effectiveDate }),
          ...(validated.expirationDate && { expirationDate: validated.expirationDate }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.terms !== undefined && { terms: validated.terms }),
          ...(validated.totalPremium && { totalPremium: new Prisma.Decimal(validated.totalPremium) }),
          ...(validated.isAutoRenew !== undefined && { isAutoRenew: validated.isAutoRenew }),
          ...(validated.metadata && { metadata: validated.metadata }),
        },
        include: {
          policyType: true,
          customer: true,
          insurer: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "UPDATE",
          entity: "Policy",
          entityId: id,
          oldValues: existing as unknown as Prisma.InputJsonValue,
          newValues: updated as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });

    return policy;
  }

  async updateStatus(id: string, status: PolicyStatus, userId?: string): Promise<Policy> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Policy", id);

    const validTransitions: Record<PolicyStatus, PolicyStatus[]> = {
      DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
      PENDING_APPROVAL: ["ACTIVE", "CANCELLED", "UNDER_REVIEW"],
      ACTIVE: ["SUSPENDED", "EXPIRED", "CANCELLED", "RENEWED", "UNDER_REVIEW"],
      SUSPENDED: ["ACTIVE", "CANCELLED"],
      EXPIRED: ["RENEWED"],
      CANCELLED: [],
      RENEWED: ["ACTIVE"],
      UNDER_REVIEW: ["ACTIVE", "SUSPENDED", "CANCELLED"],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed.includes(status)) {
      throw new ConflictError(
        `Cannot transition from ${existing.status} to ${status}`
      );
    }

    const policy = await prisma.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id },
        data: {
          status,
          ...(status === "CANCELLED" && { cancelledAt: new Date() }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "STATUS_CHANGE",
          entity: "Policy",
          entityId: id,
          oldValues: { status: existing.status } as unknown as Prisma.InputJsonValue,
          newValues: { status } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });

    return policy;
  }

  async renew(id: string, data: RenewPolicyInput, userId?: string): Promise<Policy> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Policy", id);

    if (existing.status !== "ACTIVE" && existing.status !== "EXPIRED") {
      throw new ConflictError(`Cannot renew policy in ${existing.status} status`);
    }

    const validated = RenewPolicySchema.parse(data);

    if (validated.newExpirationDate <= existing.expirationDate) {
      throw new ValidationError("New expiration date must be after current expiration");
    }

    const renewal = await prisma.$transaction(async (tx) => {
      const created = await tx.policyRenewal.create({
        data: {
          policyId: id,
          renewalDate: new Date(),
          newExpiration: validated.newExpirationDate,
          newPremium: new Prisma.Decimal(validated.newPremium),
          status: "PENDING",
          notes: validated.notes,
          processedById: userId ?? null,
        },
      });

      await tx.policy.update({
        where: { id },
        data: {
          status: "RENEWED",
          expirationDate: validated.newExpirationDate,
          totalPremium: new Prisma.Decimal(validated.newPremium),
        },
      });

      const newPolicyNumber = generatePolicyNumber();
      const newPolicy = await tx.policy.create({
        data: {
          policyNumber: newPolicyNumber,
          policyTypeId: existing.policyTypeId,
          customerId: existing.customerId,
          agentId: existing.agentId,
          insurerId: existing.insurerId,
          status: "ACTIVE",
          effectiveDate: existing.expirationDate,
          expirationDate: validated.newExpirationDate,
          description: existing.description,
          terms: existing.terms,
          totalPremium: new Prisma.Decimal(validated.newPremium),
          currency: existing.currency,
          isAutoRenew: existing.isAutoRenew,
          metadata: existing.metadata as unknown as Prisma.InputJsonValue ?? undefined,
        },
        include: { policyType: true, customer: true, insurer: true },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "RENEW",
          entity: "Policy",
          entityId: id,
          oldValues: {
            expirationDate: existing.expirationDate,
            totalPremium: existing.totalPremium,
          } as unknown as Prisma.InputJsonValue,
          newValues: {
            renewalId: created.id,
            newPolicyId: newPolicy.id,
            newExpiration: validated.newExpirationDate,
            newPremium: validated.newPremium,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return newPolicy;
    });

    return renewal;
  }

  async endorse(id: string, data: EndorsePolicyInput, userId?: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Policy", id);

    if (existing.status !== "ACTIVE") {
      throw new ConflictError(`Cannot endorse policy in ${existing.status} status`);
    }

    const validated = EndorsePolicySchema.parse(data);

    if (validated.effectiveDate < existing.effectiveDate) {
      throw new ValidationError("Endorsement effective date cannot be before policy effective date");
    }

    const endorsementCount = await prisma.policyEndorsement.count({
      where: { policyId: id },
    });

    const endorsementNumber = generateEndorsementNumber(
      existing.policyNumber,
      endorsementCount
    );

    return prisma.$transaction(async (tx) => {
      const endorsement = await tx.policyEndorsement.create({
        data: {
          policyId: id,
          endorsementNumber,
          type: validated.type,
          description: validated.description,
          effectiveDate: validated.effectiveDate,
          status: "DRAFT",
          changes: validated.changes as unknown as Prisma.InputJsonValue,
          premiumImpact: validated.premiumImpact
            ? new Prisma.Decimal(validated.premiumImpact)
            : null,
        },
      });

      if (validated.premiumImpact) {
        const newPremium = Number(existing.totalPremium) + validated.premiumImpact;
        if (newPremium < 0) {
          throw new ValidationError("Premium impact results in negative premium");
        }
        await tx.policy.update({
          where: { id },
          data: { totalPremium: new Prisma.Decimal(newPremium) },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "ENDORSE",
          entity: "Policy",
          entityId: id,
          newValues: {
            endorsementId: endorsement.id,
            endorsementNumber,
            type: validated.type,
            premiumImpact: validated.premiumImpact,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return endorsement;
    });
  }

  async approveEndorsement(
    endorsementId: string,
    userId?: string
  ) {
    const endorsement = await prisma.policyEndorsement.findUnique({
      where: { id: endorsementId },
      include: { policy: true },
    });

    if (!endorsement) throw new NotFoundError("Endorsement", endorsementId);

    if (endorsement.status !== "DRAFT" && endorsement.status !== "PENDING") {
      throw new ConflictError(`Cannot approve endorsement in ${endorsement.status} status`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.policyEndorsement.update({
        where: { id: endorsementId },
        data: {
          status: "APPROVED",
          approvedById: userId ?? null,
          approvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "APPROVE_ENDORSEMENT",
          entity: "PolicyEndorsement",
          entityId: endorsementId,
          newValues: { status: "APPROVED" } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async cancel(id: string, data: CancelPolicyInput, userId?: string): Promise<void> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Policy", id);

    if (existing.status === "CANCELLED") {
      throw new ConflictError("Policy is already cancelled");
    }

    if (existing.status === "EXPIRED") {
      throw new ConflictError("Cannot cancel an expired policy");
    }

    const validated = CancelPolicySchema.parse(data);

    if (validated.effectiveDate < existing.effectiveDate) {
      throw new ValidationError("Cancellation date cannot be before policy effective date");
    }

    const activeClaims = await prisma.claim.count({
      where: {
        policyId: id,
        status: { notIn: ["CLOSED", "DENIED"] },
      },
    });

    if (activeClaims > 0) {
      throw new ConflictError(
        "Cannot cancel policy with active claims. Close or deny all claims first."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.policyCancellation.create({
        data: {
          policyId: id,
          reason: validated.reason,
          effectiveDate: validated.effectiveDate,
          refundAmount: validated.refundAmount
            ? new Prisma.Decimal(validated.refundAmount)
            : null,
          status: "PENDING",
          processedById: userId ?? null,
        },
      });

      await tx.policy.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: validated.effectiveDate,
          cancellationReason: validated.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "CANCEL",
          entity: "Policy",
          entityId: id,
          newValues: {
            reason: validated.reason,
            effectiveDate: validated.effectiveDate,
            refundAmount: validated.refundAmount,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  async getExpiringPolicies(daysAhead = 30): Promise<Policy[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.policy.findMany({
      where: {
        status: "ACTIVE",
        expirationDate: { lte: futureDate },
        isAutoRenew: false,
      },
      include: {
        policyType: { select: { name: true } },
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { expirationDate: "asc" },
    });
  }

  async getPolicyStats() {
    const [
      totalPolicies,
      activePolicies,
      byStatus,
      byType,
      recentRenewals,
      pendingEndorsements,
    ] = await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: "ACTIVE" } }),
      prisma.policy.groupBy({ by: ["status"], _count: true }),
      prisma.policy.groupBy({ by: ["policyTypeId"], _count: true }),
      prisma.policyRenewal.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.policyEndorsement.count({ where: { status: "DRAFT" } }),
    ]);

    return {
      total: totalPolicies,
      active: activePolicies,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ policyTypeId: t.policyTypeId, count: t._count })),
      recentRenewals,
      pendingEndorsements,
    };
  }

  async getCustomerPolicies(customerId: string): Promise<Policy[]> {
    return prisma.policy.findMany({
      where: { customerId },
      include: {
        policyType: { select: { id: true, name: true, code: true } },
        insurer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async searchByNumber(policyNumber: string): Promise<Policy | null> {
    return prisma.policy.findUnique({
      where: { policyNumber },
      include: {
        policyType: true,
        customer: { include: { user: { select: { id: true, name: true, email: true } } } },
        insurer: true,
        coverages: { include: { limits: true, deductibles: true } },
      },
    });
  }
}

export const policyService = new PolicyService();
