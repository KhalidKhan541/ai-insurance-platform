import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const fraudCase = await prisma.fraudCase.findUnique({
      where: { id: params.id },
      include: {
        claim: {
          include: {
            policy: {
              include: {
                customer: { include: { user: { select: { name: true, email: true } } } },
                product: true,
              },
            },
            documents: true,
            payments: true,
          },
        },
        assignee: { select: { name: true, email: true } },
        indicators: true,
        timeline: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!fraudCase) throw new NotFoundError("Fraud case", params.id);

    return successResponse(fraudCase);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "FRAUD_ANALYST"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update fraud cases");
    }

    const body = await request.json();
    const { status, assignedTo, resolution, notes } = body;

    const existing = await prisma.fraudCase.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Fraud case", params.id);

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (resolution) updates.resolution = resolution;
    if (notes) updates.notes = notes;

    if (status === "CONFIRMED_FRAUD") {
      const claim = await prisma.claim.findUnique({ where: { id: existing.claimId } });
      if (claim) {
        await prisma.claim.update({
          where: { id: existing.claimId },
          data: { status: "DENIED" },
        });
        await prisma.claimTimeline.create({
          data: {
            claimId: existing.claimId,
            action: "FRAUD_CONFIRMED",
            notes: `Fraud case ${existing.caseNumber} confirmed`,
            userId: session.user.id,
          },
        });
      }
    }

    const fraudCase = await prisma.fraudCase.update({
      where: { id: params.id },
      data: updates,
      include: { indicators: true },
    });

    await prisma.fraudTimeline.create({
      data: {
        fraudCaseId: params.id,
        action: "CASE_UPDATED",
        details: JSON.stringify(updates),
        userId: session.user.id,
      },
    });

    return successResponse(fraudCase);
  } catch (error) {
    return handleApiError(error);
  }
}
