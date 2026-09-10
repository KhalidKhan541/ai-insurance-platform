import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { z } from "zod";

const claimPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["BANK_TRANSFER", "CHECK", "CASH", "CREDIT_CARD"]),
  payeeName: z.string().min(1),
  payeeAccount: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!claim) throw new NotFoundError("Claim", params.id);

    const payments = await prisma.claimPayment.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    return successResponse({
      payments,
      summary: {
        totalPaid,
        pendingAmount,
        approvedAmount: claim.approvedAmount || 0,
        remainingBalance: (claim.approvedAmount || 0) - totalPaid,
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "CLAIMS_ADJUSTER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to process claim payments");
    }

    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        payments: { where: { status: "COMPLETED" } },
      },
    });
    if (!claim) throw new NotFoundError("Claim", params.id);

    if (!["APPROVED", "PARTIALLY_APPROVED", "SETTLED"].includes(claim.status)) {
      throw new Error("Claim must be approved before processing payments");
    }

    const body = await request.json();
    const data = claimPaymentSchema.parse(body);

    if (!claim.approvedAmount) {
      throw new Error("Claim has no approved amount");
    }

    const totalPaid = claim.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = claim.approvedAmount - totalPaid;

    if (data.amount > remaining) {
      throw new Error(`Payment amount exceeds remaining balance of ${remaining}`);
    }

    const payment = await prisma.claimPayment.create({
      data: {
        claimId: params.id,
        amount: data.amount,
        method: data.method,
        payeeName: data.payeeName,
        payeeAccount: data.payeeAccount,
        reference: data.reference || `CLM-PAY-${Date.now().toString(36).toUpperCase()}`,
        notes: data.notes,
        status: "PENDING",
        processedBy: session.user.id,
      },
    });

    await prisma.claimTimeline.create({
      data: {
        claimId: params.id,
        action: "PAYMENT_PROCESSED",
        notes: `Payment of ${data.amount} initiated via ${data.method}`,
        userId: session.user.id,
      },
    });

    if (totalPaid + data.amount >= claim.approvedAmount) {
      await prisma.claim.update({
        where: { id: params.id },
        data: { status: "SETTLED" },
      });
    }

    return successResponse(payment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
