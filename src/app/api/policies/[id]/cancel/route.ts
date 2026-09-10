import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { z } from "zod";

const cancellationSchema = z.object({
  reason: z.string().min(5),
  effectiveDate: z.string().datetime().or(z.date()).optional(),
  cancelType: z.enum(["IMMEDIATE", "END_OF_PERIOD", "PRO_RATA"]).default("END_OF_PERIOD"),
  refundCalculation: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "AGENT", "CUSTOMER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to cancel policies");
    }

    const body = await request.json();
    const data = cancellationSchema.parse(body);

    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        payments: { where: { status: "COMPLETED" } },
        _count: { select: { claims: true } },
      },
    });

    if (!policy) throw new NotFoundError("Policy", params.id);

    if (policy.status === "CANCELLED") {
      throw new Error("Policy is already cancelled");
    }

    if (policy.status === "EXPIRED") {
      throw new Error("Cannot cancel an expired policy");
    }

    if (session.user.role === "CUSTOMER" && policy.customerId !== session.user.id) {
      throw new UnauthorizedError("You can only cancel your own policies");
    }

    const effectiveDate = data.effectiveDate
      ? new Date(data.effectiveDate)
      : data.cancelType === "IMMEDIATE"
      ? new Date()
      : new Date(policy.endDate);

    let refundAmount = 0;
    if (data.refundCalculation) {
      const totalPaid = policy.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalDays = Math.ceil(
        (new Date(policy.endDate).getTime() - new Date(policy.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUsed = Math.ceil(
        (effectiveDate.getTime() - new Date(policy.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, totalDays - daysUsed);

      if (data.cancelType === "PRO_RATA") {
        refundAmount = (totalPaid * daysRemaining) / totalDays;
      } else if (daysRemaining > totalDays * 0.5) {
        refundAmount = totalPaid * 0.5;
      }
      refundAmount = Math.round(refundAmount * 100) / 100;
    }

    const cancellation = await prisma.$transaction(async (tx) => {
      const cancellationRecord = await tx.policyCancellation.create({
        data: {
          policyId: params.id,
          reason: data.reason,
          effectiveDate,
          cancelType: data.cancelType,
          refundAmount,
          requestedBy: session.user.id,
          status: "APPROVED",
          notes: data.notes,
        },
      });

      await tx.policy.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          metadata: JSON.stringify({
            ...JSON.parse(policy.metadata || "{}"),
            cancellation: {
              id: cancellationRecord.id,
              reason: data.reason,
              effectiveDate: effectiveDate.toISOString(),
              refundAmount,
              cancelType: data.cancelType,
            },
          }),
        },
      });

      if (refundAmount > 0) {
        await tx.refund.create({
          data: {
            policyId: params.id,
            amount: refundAmount,
            reason: `Policy cancellation - ${data.cancelType}`,
            status: "PENDING",
            requestedBy: session.user.id,
          },
        });
      }

      return cancellationRecord;
    });

    await prisma.activityLog.create({
      data: {
        entityType: "POLICY",
        entityId: params.id,
        action: "CANCELLED",
        details: JSON.stringify({
          cancellationId: cancellation.id,
          reason: data.reason,
          cancelType: data.cancelType,
          refundAmount,
          effectiveDate: effectiveDate.toISOString(),
        }),
        userId: session.user.id,
      },
    });

    return successResponse({
      cancellation,
      policy: {
        id: policy.id,
        policyNumber: policy.policyNumber,
        previousStatus: policy.status,
        newStatus: "CANCELLED",
      },
      refund: {
        amount: refundAmount,
        currency: policy.currency,
        status: "PENDING",
        estimatedProcessingDays: 10,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
