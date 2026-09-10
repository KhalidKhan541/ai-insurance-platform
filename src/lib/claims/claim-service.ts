import { z } from "zod";
import { Prisma, type Claim, type ClaimStatus, type ClaimType } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const CreateClaimSchema = z.object({
  policyId: z.string().min(1),
  customerId: z.string().min(1),
  type: z.nativeEnum({
    AUTO_ACCIDENT: "AUTO_ACCIDENT",
    PROPERTY_DAMAGE: "PROPERTY_DAMAGE",
    HEALTH_MEDICAL: "HEALTH_MEDICAL",
    HEALTH_DENTAL: "HEALTH_DENTAL",
    LIFE_DEATH: "LIFE_DEATH",
    LIFE_DISABILITY: "LIFE_DISABILITY",
    LIABILITY: "LIABILITY",
    MALPRACTICE: "MALPRACTICE",
    CYBER_BREACH: "CYBER_BREACH",
    NATURAL_DISASTER: "NATURAL_DISASTER",
    THEFT: "THEFT",
    FLOOD: "FLOOD",
    FIRE: "FIRE",
    OTHER: "OTHER",
  } as const),
  dateOfIncident: z.coerce.date(),
  description: z.string().min(1).max(5000),
  estimatedAmount: z.coerce.number().positive().optional(),
  deductible: z.coerce.number().min(0).optional(),
  currency: z.string().default("USD"),
  location: z.string().optional(),
  policeReportNumber: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateClaimSchema = z.object({
  type: z.string().optional(),
  dateOfIncident: z.coerce.date().optional(),
  description: z.string().min(1).max(5000).optional(),
  estimatedAmount: z.coerce.number().positive().optional(),
  approvedAmount: z.coerce.number().min(0).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  deductible: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  policeReportNumber: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateClaimStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "INVESTIGATING",
    "ADJUSTING",
    "PENDING_APPROVAL",
    "APPROVED",
    "PARTIALLY_APPROVED",
    "DENIED",
    "PAID",
    "CLOSED",
    "REOPENED",
    "APPEALED",
  ]),
  reason: z.string().optional(),
});

export const AddClaimNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

export const UploadClaimDocumentSchema = z.object({
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;
export type UpdateClaimInput = z.infer<typeof UpdateClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof UpdateClaimStatusSchema>;
export type AddClaimNoteInput = z.infer<typeof AddClaimNoteSchema>;
export type UploadClaimDocumentInput = z.infer<typeof UploadClaimDocumentSchema>;

export interface ClaimListFilters {
  customerId?: string;
  policyId?: string;
  type?: ClaimType;
  status?: ClaimStatus;
  fraudStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function generateClaimNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLM-${timestamp}-${random}`;
}

export class ClaimService {
  async create(data: CreateClaimInput, userId?: string): Promise<Claim> {
    const validated = CreateClaimSchema.parse(data);

    const [policy, customer] = await Promise.all([
      prisma.policy.findUnique({ where: { id: validated.policyId } }),
      prisma.customer.findUnique({ where: { id: validated.customerId } }),
    ]);

    if (!policy) throw new NotFoundError("Policy", validated.policyId);
    if (!customer) throw new NotFoundError("Customer", validated.customerId);

    if (policy.status !== "ACTIVE") {
      throw new ConflictError(
        `Cannot file claim against policy in ${policy.status} status`
      );
    }

    if (validated.dateOfIncident > new Date()) {
      throw new ValidationError("Incident date cannot be in the future");
    }

    if (validated.dateOfIncident < policy.effectiveDate) {
      throw new ValidationError("Incident date cannot be before policy effective date");
    }

    if (validated.estimatedAmount && validated.deductible) {
      if (validated.deductible > validated.estimatedAmount) {
        throw new ValidationError("Deductible cannot exceed estimated amount");
      }
    }

    const claimNumber = generateClaimNumber();

    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.create({
        data: {
          claimNumber,
          policyId: validated.policyId,
          customerId: validated.customerId,
          type: validated.type as ClaimType,
          status: "DRAFT",
          fraudStatus: "NONE",
          dateOfIncident: validated.dateOfIncident,
          dateReported: new Date(),
          description: validated.description,
          estimatedAmount: validated.estimatedAmount
            ? new Prisma.Decimal(validated.estimatedAmount)
            : null,
          deductible: validated.deductible
            ? new Prisma.Decimal(validated.deductible)
            : null,
          currency: validated.currency,
          location: validated.location,
          policeReportNumber: validated.policeReportNumber,
          notes: validated.notes,
          metadata: validated.metadata ?? undefined,
        },
        include: {
          policy: { select: { id: true, policyNumber: true } },
          customer: { select: { id: true, customerNumber: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "CREATE",
          entity: "Claim",
          entityId: claim.id,
          newValues: claim as unknown as Prisma.InputJsonValue,
        },
      });

      return claim;
    });
  }

  async getById(id: string): Promise<Claim> {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            totalPremium: true,
            coverages: { include: { limits: true, deductibles: true } },
          },
        },
        customer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        documents: { orderBy: { createdAt: "desc" } },
        adjusters: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        payments: { orderBy: { createdAt: "desc" } },
        claimNotes: {
          include: { author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        fraudAlerts: { orderBy: { createdAt: "desc" } },
        thirdPartyClaims: { include: { thirdParty: true } },
        legalCases: { include: { documents: true } },
      },
    });

    if (!claim) throw new NotFoundError("Claim", id);
    return claim;
  }

  async list(filters: ClaimListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";

    const where: Prisma.ClaimWhereInput = {};

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.fraudStatus) where.fraudStatus = filters.fraudStatus;

    if (filters.dateFrom || filters.dateTo) {
      where.dateOfIncident = {};
      if (filters.dateFrom) where.dateOfIncident.gte = filters.dateFrom;
      if (filters.dateTo) where.dateOfIncident.lte = filters.dateTo;
    }

    if (filters.amountMin || filters.amountMax) {
      where.estimatedAmount = {};
      if (filters.amountMin) where.estimatedAmount.gte = new Prisma.Decimal(filters.amountMin);
      if (filters.amountMax) where.estimatedAmount.lte = new Prisma.Decimal(filters.amountMax);
    }

    if (filters.search) {
      where.OR = [
        { claimNumber: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { policeReportNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          policy: { select: { id: true, policyNumber: true } },
          customer: {
            select: {
              id: true,
              customerNumber: true,
              user: { select: { name: true } },
            },
          },
          adjusters: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.claim.count({ where }),
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

  async updateStatus(id: string, data: UpdateClaimStatusInput, userId?: string): Promise<Claim> {
    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Claim", id);

    const validated = UpdateClaimStatusSchema.parse(data);

    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      DRAFT: ["SUBMITTED"],
      SUBMITTED: ["UNDER_REVIEW", "DENIED"],
      UNDER_REVIEW: ["INVESTIGATING", "ADJUSTING", "PENDING_APPROVAL", "DENIED"],
      INVESTIGATING: ["ADJUSTING", "PENDING_APPROVAL", "DENIED"],
      ADJUSTING: ["PENDING_APPROVAL", "DENIED"],
      PENDING_APPROVAL: ["APPROVED", "PARTIALLY_APPROVED", "DENIED"],
      APPROVED: ["PAID"],
      PARTIALLY_APPROVED: ["PAID"],
      DENIED: ["APPEALED", "CLOSED"],
      PAID: ["CLOSED"],
      CLOSED: ["REOPENED"],
      REOPENED: ["UNDER_REVIEW", "INVESTIGATING", "ADJUSTING"],
      APPEALED: ["UNDER_REVIEW", "PENDING_APPROVAL"],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed.includes(validated.status)) {
      throw new ConflictError(
        `Cannot transition from ${existing.status} to ${validated.status}`
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claim.update({
        where: { id },
        data: {
          status: validated.status,
          ...(validated.status === "CLOSED" && { closedAt: new Date() }),
          ...(validated.status === "APPROVED" && { approvedAmount: existing.estimatedAmount }),
        },
        include: {
          policy: { select: { id: true, policyNumber: true } },
          customer: { select: { id: true, customerNumber: true } },
        },
      });

      await tx.claimNote.create({
        data: {
          claimId: id,
          authorId: userId ?? "system",
          content: validated.reason
            ? `Status changed to ${validated.status}: ${validated.reason}`
            : `Status changed to ${validated.status}`,
          isInternal: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "STATUS_CHANGE",
          entity: "Claim",
          entityId: id,
          oldValues: { status: existing.status } as unknown as Prisma.InputJsonValue,
          newValues: {
            status: validated.status,
            reason: validated.reason,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async update(id: string, data: UpdateClaimInput, userId?: string): Promise<Claim> {
    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Claim", id);

    const closedStatuses: ClaimStatus[] = ["PAID", "CLOSED", "DENIED"];
    if (closedStatuses.includes(existing.status)) {
      throw new ConflictError(`Cannot update claim in ${existing.status} status`);
    }

    const validated = UpdateClaimSchema.parse(data);

    if (validated.approvedAmount !== undefined) {
      if (validated.approvedAmount > (existing.estimatedAmount ?? 0)) {
        throw new ValidationError("Approved amount cannot exceed estimated amount");
      }
    }

    if (validated.paidAmount !== undefined && validated.approvedAmount !== undefined) {
      if (validated.paidAmount > validated.approvedAmount) {
        throw new ValidationError("Paid amount cannot exceed approved amount");
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claim.update({
        where: { id },
        data: {
          ...(validated.type && { type: validated.type as ClaimType }),
          ...(validated.dateOfIncident && { dateOfIncident: validated.dateOfIncident }),
          ...(validated.description && { description: validated.description }),
          ...(validated.estimatedAmount !== undefined && {
            estimatedAmount: new Prisma.Decimal(validated.estimatedAmount),
          }),
          ...(validated.approvedAmount !== undefined && {
            approvedAmount: new Prisma.Decimal(validated.approvedAmount),
          }),
          ...(validated.paidAmount !== undefined && {
            paidAmount: new Prisma.Decimal(validated.paidAmount),
          }),
          ...(validated.deductible !== undefined && {
            deductible: new Prisma.Decimal(validated.deductible),
          }),
          ...(validated.location !== undefined && { location: validated.location }),
          ...(validated.policeReportNumber !== undefined && {
            policeReportNumber: validated.policeReportNumber,
          }),
          ...(validated.notes !== undefined && { notes: validated.notes }),
          ...(validated.metadata && { metadata: validated.metadata }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "UPDATE",
          entity: "Claim",
          entityId: id,
          oldValues: existing as unknown as Prisma.InputJsonValue,
          newValues: updated as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async addNote(id: string, data: AddClaimNoteInput, userId: string) {
    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundError("Claim", id);

    const validated = AddClaimNoteSchema.parse(data);

    return prisma.claimNote.create({
      data: {
        claimId: id,
        authorId: userId,
        content: validated.content,
        isInternal: validated.isInternal,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async getNotes(claimId: string, includeInternal = false) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    return prisma.claimNote.findMany({
      where: {
        claimId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async uploadDocument(claimId: string, data: UploadClaimDocumentInput, userId: string) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const validated = UploadClaimDocumentSchema.parse(data);

    return prisma.claimDocument.create({
      data: {
        claimId,
        documentType: validated.documentType as Prisma.EnumDocumentTypeFieldUpdateOperationsInput["set"] extends never
          ? string
          : never,
        fileName: validated.fileName,
        fileUrl: validated.fileUrl,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        uploadedById: userId,
        metadata: validated.metadata ?? undefined,
      } as unknown as Prisma.ClaimDocumentUncheckedCreateInput,
    });
  }

  async getDocuments(claimId: string) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    return prisma.claimDocument.findMany({
      where: { claimId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getClaimStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalClaims,
      byStatus,
      byType,
      recentClaims,
      totalEstimated,
      totalApproved,
      totalPaid,
      averageProcessingDays,
    ] = await Promise.all([
      prisma.claim.count(),
      prisma.claim.groupBy({ by: ["status"], _count: true }),
      prisma.claim.groupBy({ by: ["type"], _count: true }),
      prisma.claim.count({ where: { dateReported: { gte: thirtyDaysAgo } } }),
      prisma.claim.aggregate({ _sum: { estimatedAmount: true } }),
      prisma.claim.aggregate({ _sum: { approvedAmount: true } }),
      prisma.claim.aggregate({ _sum: { paidAmount: true } }),
      prisma.claim.aggregate({
        _avg: {
          dateOfIncident: true,
        },
        where: {
          status: { in: ["PAID", "CLOSED"] },
          closedAt: { not: null },
        },
      }),
    ]);

    return {
      total: totalClaims,
      recent: recentClaims,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      financials: {
        totalEstimated: totalEstimated._sum.estimatedAmount
          ? Number(totalEstimated._sum.estimatedAmount)
          : 0,
        totalApproved: totalApproved._sum.approvedAmount
          ? Number(totalApproved._sum.approvedAmount)
          : 0,
        totalPaid: totalPaid._sum.paidAmount
          ? Number(totalPaid._sum.paidAmount)
          : 0,
      },
    };
  }

  async getClaimsByPolicy(policyId: string): Promise<Claim[]> {
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundError("Policy", policyId);

    return prisma.claim.findMany({
      where: { policyId },
      include: {
        customer: { select: { id: true, customerNumber: true, user: { select: { name: true } } } },
        adjusters: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomerClaims(customerId: string): Promise<Claim[]> {
    return prisma.claim.findMany({
      where: { customerId },
      include: {
        policy: { select: { id: true, policyNumber: true } },
        adjusters: { select: { user: { select: { name: true } } } },
      },
      orderBy: { dateReported: "desc" },
    });
  }

  async reopenClaim(id: string, reason: string, userId?: string): Promise<Claim> {
    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Claim", id);

    if (existing.status !== "CLOSED") {
      throw new ConflictError("Only closed claims can be reopened");
    }

    const daysSinceClosed = existing.closedAt
      ? Math.floor((Date.now() - existing.closedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceClosed > 90) {
      throw new ConflictError("Claims cannot be reopened after 90 days from closure");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claim.update({
        where: { id },
        data: {
          status: "REOPENED",
          closedAt: null,
        },
      });

      await tx.claimNote.create({
        data: {
          claimId: id,
          authorId: userId ?? "system",
          content: `Claim reopened: ${reason}`,
          isInternal: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: "REOPEN",
          entity: "Claim",
          entityId: id,
          newValues: {
            status: "REOPENED",
            reason,
            previousClosedAt: existing.closedAt,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async searchByNumber(claimNumber: string): Promise<Claim | null> {
    return prisma.claim.findUnique({
      where: { claimNumber },
      include: {
        policy: { select: { id: true, policyNumber: true, status: true } },
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    });
  }
}

export const claimService = new ClaimService();
