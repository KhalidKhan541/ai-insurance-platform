import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { claimStatusSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "DENIED"],
  UNDER_REVIEW: ["INVESTIGATING", "PENDING_DOCUMENTS", "APPROVED", "DENIED"],
  INVESTIGATING: ["PENDING_DOCUMENTS", "APPROVED", "PARTIALLY_APPROVED", "DENIED"],
  PENDING_DOCUMENTS: ["UNDER_REVIEW", "INVESTIGATING", "APPROVED", "DENIED"],
  APPROVED: ["SETTLED", "CLOSED"],
  PARTIALLY_APPROVED: ["SETTLED", "APPEALED", "CLOSED"],
  DENIED: ["APPEALED", "CLOSED"],
  APPEALED: ["UNDER_REVIEW", "APPROVED", "PARTIALLY_APPROVED", "DENIED", "CLOSED"],
  SETTLED: ["CLOSED"],
  CLOSED: [],
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "CLAIMS_ADJUSTER", "UNDERWRITER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update claim status");
    }

    const body = await request.json();
    const data = claimStatusSchema.parse(body);

    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!claim) throw new NotFoundError("Claim", params.id);

    const allowedTransitions = VALID_TRANSITIONS[claim.status] || [];
    if (!allowedTransitions.includes(data.status)) {
      throw new Error(
        `Cannot transition from ${claim.status} to ${data.status}. Allowed: ${allowedTransitions.join(", ")}`
      );
    }

    if (["APPROVED", "PARTIALLY_APPROVED"].includes(data.status) && !data.approvedAmount) {
      throw new Error("Approved amount is required for approval statuses");
    }

    if (data.approvedAmount && data.approvedAmount > claim.estimatedAmount) {
      throw new Error("Approved amount cannot exceed estimated amount");
    }

    const [updatedClaim, timelineEntry] = await prisma.$transaction([
      prisma.claim.update({
        where: { id: params.id },
        data: {
          status: data.status,
          approvedAmount: data.approvedAmount,
          resolvedAt: ["SETTLED", "CLOSED"].includes(data.status) ? new Date() : undefined,
        },
        include: {
          policy: { select: { policyNumber: true, customerId: true } },
        },
      }),
      prisma.claimTimeline.create({
        data: {
          claimId: params.id,
          action: "STATUS_CHANGED",
          fromStatus: claim.status,
          toStatus: data.status,
          notes: data.notes || data.reason,
          userId: session.user.id,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        entityType: "CLAIM",
        entityId: params.id,
        action: `STATUS_${data.status}`,
        details: JSON.stringify({
          claimNumber: claim.claimNumber,
          previousStatus: claim.status,
          newStatus: data.status,
          approvedAmount: data.approvedAmount,
          reason: data.reason,
        }),
        userId: session.user.id,
      },
    });

    if (["SETTLED", "CLOSED"].includes(data.status) && data.approvedAmount) {
      await prisma.claimPayment.create({
        data: {
          claimId: params.id,
          amount: data.approvedAmount,
          method: "BANK_TRANSFER",
          status: "PENDING",
          reference: `SETTLE-${claim.claimNumber}`,
        },
      });
    }

    return successResponse({
      claim: updatedClaim,
      timeline: timelineEntry,
      transition: {
        from: claim.status,
        to: data.status,
        timestamp: timelineEntry.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
