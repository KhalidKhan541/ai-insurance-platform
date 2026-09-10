import { z } from "zod";
import { Prisma, type ClaimAdjuster, type UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

export const AssignAdjusterSchema = z.object({
  claimId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().default("ADJUSTER"),
  notes: z.string().optional(),
});

export const UpdateAdjusterAssignmentSchema = z.object({
  role: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateInspectionSchema = z.object({
  claimId: z.string().min(1),
  adjusterId: z.string().min(1),
  scheduledDate: z.coerce.date(),
  location: z.string().optional(),
  inspectionType: z.string().min(1),
  notes: z.string().optional(),
});

export const CompleteInspectionSchema = z.object({
  inspectionId: z.string().min(1),
  findings: z.string().min(1),
  recommendations: z.string().optional(),
  estimatedDamage: z.coerce.number().min(0).optional(),
  photos: z.array(z.string().url()).optional(),
  isTotalLoss: z.boolean().default(false),
});

export const CreateAdjusterReportSchema = z.object({
  claimId: z.string().min(1),
  adjusterId: z.string().min(1),
  reportType: z.enum([
    "INITIAL",
    "PROGRESS",
    "FOLLOW_UP",
    "FINAL",
    "SIU_REFERRAL",
  ]),
  summary: z.string().min(1).max(10000),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  recommendedAmount: z.coerce.number().min(0).optional(),
  evidence: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      url: z.string().url().optional(),
    })
  ).optional(),
});

export type AssignAdjusterInput = z.infer<typeof AssignAdjusterSchema>;
export type UpdateAdjusterAssignmentInput = z.infer<typeof UpdateAdjusterAssignmentSchema>;
export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;
export type CompleteInspectionInput = z.infer<typeof CompleteInspectionSchema>;
export type CreateAdjusterReportInput = z.infer<typeof CreateAdjusterReportSchema>;

export interface AdjusterWorkloadFilters {
  adjusterId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface AdjusterPerformanceFilters {
  adjusterId: string;
  startDate: Date;
  endDate: Date;
}

export class AdjusterService {
  async assignAdjuster(data: AssignAdjusterInput, assignedBy?: string): Promise<ClaimAdjuster> {
    const validated = AssignAdjusterSchema.parse(data);

    const [claim, user] = await Promise.all([
      prisma.claim.findUnique({ where: { id: validated.claimId } }),
      prisma.user.findUnique({ where: { id: validated.userId } }),
    ]);

    if (!claim) throw new NotFoundError("Claim", validated.claimId);
    if (!user) throw new NotFoundError("User", validated.userId);

    if (user.role !== "CLAIMS_ADJUSTER" && user.role !== "ADMIN") {
      throw new ValidationError("Assigned user must be a claims adjuster or admin");
    }

    const existingAssignment = await prisma.claimAdjuster.findUnique({
      where: {
        claimId_userId: {
          claimId: validated.claimId,
          userId: validated.userId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError("Adjuster is already assigned to this claim");
    }

    const closedStatuses = ["PAID", "CLOSED", "DENIED"];
    if (closedStatuses.includes(claim.status)) {
      throw new ConflictError(`Cannot assign adjuster to claim in ${claim.status} status`);
    }

    return prisma.$transaction(async (tx) => {
      const assignment = await tx.claimAdjuster.create({
        data: {
          claimId: validated.claimId,
          userId: validated.userId,
          role: validated.role,
          notes: validated.notes,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          claim: { select: { id: true, claimNumber: true, status: true } },
        },
      });

      if (claim.status === "SUBMITTED") {
        await tx.claim.update({
          where: { id: validated.claimId },
          data: { status: "UNDER_REVIEW" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: assignedBy ?? null,
          action: "ASSIGN_ADJUSTER",
          entity: "ClaimAdjuster",
          entityId: assignment.id,
          newValues: {
            claimId: validated.claimId,
            adjusterId: validated.userId,
            role: validated.role,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return assignment;
    });
  }

  async removeAdjuster(claimId: string, userId: string, removedBy?: string): Promise<void> {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const assignment = await prisma.claimAdjuster.findUnique({
      where: { claimId_userId: { claimId, userId } },
    });

    if (!assignment) throw new NotFoundError("AdjusterAssignment", `${claimId}/${userId}`);

    const closedStatuses = ["PAID", "CLOSED", "DENIED"];
    if (closedStatuses.includes(claim.status)) {
      throw new ConflictError(`Cannot remove adjuster from claim in ${claim.status} status`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.claimAdjuster.delete({
        where: { claimId_userId: { claimId, userId } },
      });

      await tx.auditLog.create({
        data: {
          userId: removedBy ?? null,
          action: "REMOVE_ADJUSTER",
          entity: "ClaimAdjuster",
          entityId: assignment.id,
          oldValues: {
            claimId,
            adjusterId: userId,
            role: assignment.role,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  async updateAssignment(
    claimId: string,
    userId: string,
    data: UpdateAdjusterAssignmentInput
  ): Promise<ClaimAdjuster> {
    const existing = await prisma.claimAdjuster.findUnique({
      where: { claimId_userId: { claimId, userId } },
    });

    if (!existing) throw new NotFoundError("AdjusterAssignment", `${claimId}/${userId}`);

    const validated = UpdateAdjusterAssignmentSchema.parse(data);

    return prisma.claimAdjuster.update({
      where: { claimId_userId: { claimId, userId } },
      data: {
        ...(validated.role && { role: validated.role }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        claim: { select: { id: true, claimNumber: true } },
      },
    });
  }

  async getClaimAdjusters(claimId: string): Promise<ClaimAdjuster[]> {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    return prisma.claimAdjuster.findMany({
      where: { claimId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { assignedAt: "asc" },
    });
  }

  async getAdjusterClaims(userId: string, status?: string) {
    const where: Prisma.ClaimAdjusterWhereInput = { userId };

    return prisma.claimAdjuster.findMany({
      where,
      include: {
        claim: {
          include: {
            policy: { select: { id: true, policyNumber: true } },
            customer: {
              select: { id: true, customerNumber: true, user: { select: { name: true } } },
            },
            _count: { select: { documents: true, payments: true, claimNotes: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  }

  async getAdjusterWorkload(filters: AdjusterWorkloadFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const adjusters = await prisma.user.findMany({
      where: { role: "CLAIMS_ADJUSTER" },
      include: {
        claimsAdjusted: {
          include: {
            claim: {
              select: {
                id: true,
                claimNumber: true,
                status: true,
                type: true,
                dateOfIncident: true,
                estimatedAmount: true,
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    const workloadData = adjusters.map((adjuster) => {
      const claims = adjuster.claimsAdjusted.map((ca) => ca.claim);
      const openClaims = claims.filter(
        (c) => !["PAID", "CLOSED", "DENIED"].includes(c.status)
      );

      return {
        adjuster: {
          id: adjuster.id,
          name: adjuster.name,
          email: adjuster.email,
        },
        totalAssigned: claims.length,
        openClaims: openClaims.length,
        closedClaims: claims.length - openClaims.length,
        claimsByStatus: Object.entries(
          claims.reduce(
            (acc, c) => {
              acc[c.status] = (acc[c.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([status, count]) => ({ status, count })),
        totalEstimatedValue: claims.reduce(
          (sum, c) => sum + (c.estimatedAmount ? Number(c.estimatedAmount) : 0),
          0
        ),
        oldestOpenClaim: openClaims.length > 0
          ? openClaims.reduce((oldest, c) =>
              c.dateOfIncident < oldest.dateOfIncident ? c : oldest
            )
          : null,
      };
    });

    const sortedWorkload = workloadData.sort((a, b) => a.openClaims - b.openClaims);

    return {
      data: sortedWorkload,
      total: sortedWorkload.length,
      page,
      limit,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
  }

  async autoAssignAdjuster(claimId: string): Promise<ClaimAdjuster> {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const availableAdjusters = await prisma.user.findMany({
      where: {
        role: "CLAIMS_ADJUSTER",
        isActive: true,
      },
      include: {
        claimsAdjusted: {
          select: {
            claim: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (availableAdjusters.length === 0) {
      throw new ConflictError("No available adjusters for assignment");
    }

    const adjusterWorkloads = availableAdjusters.map((adjuster) => {
      const openClaims = adjuster.claimsAdjusted.filter(
        (ca) => !["PAID", "CLOSED", "DENIED"].includes(ca.claim.status)
      ).length;

      return {
        adjuster,
        openClaims,
      };
    });

    adjusterWorkloads.sort((a, b) => a.openClaims - b.openClaims);

    const bestAdjuster = adjusterWorkloads[0];

    return this.assignAdjuster({
      claimId,
      userId: bestAdjuster.adjuster.id,
      role: "ADJUSTER",
      notes: "Auto-assigned based on workload balance",
    });
  }

  async getAdjusterPerformance(filters: AdjusterPerformanceFilters) {
    const { adjusterId, startDate, endDate } = filters;

    const assignments = await prisma.claimAdjuster.findMany({
      where: {
        userId: adjusterId,
        assignedAt: { gte: startDate, lte: endDate },
      },
      include: {
        claim: {
          select: {
            id: true,
            status: true,
            dateOfIncident: true,
            closedAt: true,
            estimatedAmount: true,
            approvedAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    const claims = assignments.map((a) => a.claim);

    const totalAssigned = claims.length;
    const closedClaims = claims.filter(
      (c) => c.status === "PAID" || c.status === "CLOSED"
    );
    const avgProcessingDays =
      closedClaims.length > 0
        ? closedClaims.reduce((sum, c) => {
            if (c.closedAt) {
              return sum + (c.closedAt.getTime() - c.dateOfIncident.getTime()) / (1000 * 60 * 60 * 24);
            }
            return sum;
          }, 0) / closedClaims.length
        : 0;

    const totalEstimated = claims.reduce(
      (sum, c) => sum + (c.estimatedAmount ? Number(c.estimatedAmount) : 0),
      0
    );

    const totalApproved = claims.reduce(
      (sum, c) => sum + (c.approvedAmount ? Number(c.approvedAmount) : 0),
      0
    );

    const totalPaid = claims.reduce(
      (sum, c) => sum + (c.paidAmount ? Number(c.paidAmount) : 0),
      0
    );

    const accuracyRate =
      totalEstimated > 0 ? (totalApproved / totalEstimated) * 100 : 0;

    return {
      adjusterId,
      period: { startDate, endDate },
      metrics: {
        totalAssigned,
        closedClaims: closedClaims.length,
        openClaims: totalAssigned - closedClaims.length,
        closureRate: totalAssigned > 0 ? (closedClaims.length / totalAssigned) * 100 : 0,
        averageProcessingDays: Math.round(avgProcessingDays * 10) / 10,
        financials: {
          totalEstimated,
          totalApproved,
          totalPaid,
          approvalRate: totalEstimated > 0 ? (totalApproved / totalEstimated) * 100 : 0,
          paymentRate: totalApproved > 0 ? (totalPaid / totalApproved) * 100 : 0,
        },
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      claimsByType: Object.entries(
        claims.reduce(
          (acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([status, count]) => ({ status, count })),
    };
  }

  async createInspection(data: CreateInspectionInput) {
    const validated = CreateInspectionSchema.parse(data);

    const [claim, adjuster] = await Promise.all([
      prisma.claim.findUnique({ where: { id: validated.claimId } }),
      prisma.claimAdjuster.findUnique({
        where: {
          claimId_userId: {
            claimId: validated.claimId,
            userId: validated.adjusterId,
          },
        },
      }),
    ]);

    if (!claim) throw new NotFoundError("Claim", validated.claimId);
    if (!adjuster) throw new NotFoundError("AdjusterAssignment", validated.adjusterId);

    if (validated.scheduledDate < new Date()) {
      throw new ValidationError("Scheduled date cannot be in the past");
    }

    const closedStatuses = ["PAID", "CLOSED", "DENIED"];
    if (closedStatuses.includes(claim.status)) {
      throw new ConflictError(`Cannot create inspection for claim in ${claim.status} status`);
    }

    return prisma.claimNote.create({
      data: {
        claimId: validated.claimId,
        authorId: validated.adjusterId,
        content: `[INSPECTION SCHEDULED] Type: ${validated.inspectionType}\nDate: ${validated.scheduledDate.toISOString()}\nLocation: ${validated.location || "Not specified"}\n\n${validated.notes || ""}`,
        isInternal: true,
      },
    });
  }

  async completeInspection(data: CompleteInspectionInput) {
    const validated = CompleteInspectionSchema.parse(data);

    const note = await prisma.claimNote.findUnique({
      where: { id: validated.inspectionId },
    });

    if (!note) throw new NotFoundError("Inspection", validated.inspectionId);

    const updatedContent = `${note.content}\n\n[INSPECTION COMPLETED]\nFindings: ${validated.findings}\n${validated.recommendations ? `Recommendations: ${validated.recommendations}\n` : ""}${validated.estimatedDamage !== undefined ? `Estimated Damage: $${validated.estimatedDamage}\n` : ""}${validated.isTotalLoss ? "Total Loss: Yes\n" : ""}${validated.photos && validated.photos.length > 0 ? `Photos: ${validated.photos.length} uploaded\n` : ""}`;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.claimNote.update({
        where: { id: validated.inspectionId },
        data: { content: updatedContent },
      });

      if (validated.estimatedDamage !== undefined) {
        await tx.claim.update({
          where: { id: note.claimId },
          data: {
            estimatedAmount: new Prisma.Decimal(validated.estimatedDamage),
            ...(validated.isTotalLoss && { status: "PENDING_APPROVAL" }),
          },
        });
      }

      return updated;
    });
  }

  async createReport(data: CreateAdjusterReportInput) {
    const validated = CreateAdjusterReportSchema.parse(data);

    const [claim, adjuster] = await Promise.all([
      prisma.claim.findUnique({ where: { id: validated.claimId } }),
      prisma.claimAdjuster.findUnique({
        where: {
          claimId_userId: {
            claimId: validated.claimId,
            userId: validated.adjusterId,
          },
        },
      }),
    ]);

    if (!claim) throw new NotFoundError("Claim", validated.claimId);
    if (!adjuster) throw new NotFoundError("AdjusterAssignment", validated.claimId);

    const reportContent = [
      `[${validated.reportType} REPORT]`,
      `Claim: ${claim.claimNumber}`,
      `Adjuster: ${validated.adjusterId}`,
      `Date: ${new Date().toISOString()}`,
      "",
      "Summary:",
      validated.summary,
      "",
      validated.findings ? `Findings:\n${validated.findings}` : "",
      validated.recommendations ? `Recommendations:\n${validated.recommendations}` : "",
      validated.recommendedAmount !== undefined
        ? `Recommended Settlement: $${validated.recommendedAmount}`
        : "",
      validated.evidence && validated.evidence.length > 0
        ? `Evidence:\n${validated.evidence.map((e) => `- [${e.type}] ${e.description}${e.url ? ` (${e.url})` : ""}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return prisma.$transaction(async (tx) => {
      const note = await tx.claimNote.create({
        data: {
          claimId: validated.claimId,
          authorId: validated.adjusterId,
          content: reportContent,
          isInternal: validated.reportType === "SIU_REFERRAL",
        },
      });

      if (validated.reportType === "FINAL" && validated.recommendedAmount !== undefined) {
        await tx.claim.update({
          where: { id: validated.claimId },
          data: {
            approvedAmount: new Prisma.Decimal(validated.recommendedAmount),
            status: "PENDING_APPROVAL",
          },
        });
      }

      if (validated.reportType === "SIU_REFERRAL") {
        await tx.fraudAlert.create({
          data: {
            claimId: validated.claimId,
            status: "SUSPECTED",
            severity: "HIGH",
            description: `SIU Referral: ${validated.summary}`,
            evidence: validated.evidence
              ? (validated.evidence as unknown as Prisma.InputJsonValue)
              : undefined,
          },
        });

        await tx.claim.update({
          where: { id: validated.claimId },
          data: { fraudStatus: "UNDER_INVESTIGATION" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: validated.adjusterId,
          action: "CREATE_REPORT",
          entity: "Claim",
          entityId: validated.claimId,
          newValues: {
            reportType: validated.reportType,
            noteId: note.id,
            recommendedAmount: validated.recommendedAmount,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return note;
    });
  }

  async getReports(claimId: string) {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundError("Claim", claimId);

    const notes = await prisma.claimNote.findMany({
      where: {
        claimId,
        content: { contains: "REPORT" },
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return notes.map((note) => {
      const reportMatch = note.content.match(/\[(\w+) REPORT\]/);
      return {
        id: note.id,
        reportType: reportMatch ? reportMatch[1] : "UNKNOWN",
        summary: note.content,
        author: note.author,
        createdAt: note.createdAt,
        isInternal: note.isInternal,
      };
    });
  }

  async getAvailableAdjusters() {
    return prisma.user.findMany({
      where: {
        role: "CLAIMS_ADJUSTER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            claimsAdjusted: {
              where: {
                claim: {
                  status: { notIn: ["PAID", "CLOSED", "DENIED"] },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }
}

export const adjusterService = new AdjusterService();
