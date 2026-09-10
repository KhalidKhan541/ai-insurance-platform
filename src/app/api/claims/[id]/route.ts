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

    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        policy: {
          include: {
            customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
            product: true,
          },
        },
        adjuster: { include: { user: { select: { name: true, email: true } } } },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true } },
          },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!claim) throw new NotFoundError("Claim", params.id);

    if (session.user.role === "CUSTOMER") {
      const policy = await prisma.policy.findUnique({
        where: { id: claim.policyId },
        select: { customerId: true },
      });
      if (policy?.customerId !== session.user.id) {
        throw new UnauthorizedError("You do not have access to this claim");
      }
    }

    return successResponse(claim);
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

    if (!["ADMIN", "CLAIMS_ADJUSTER", "UNDERWRITER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update claims");
    }

    const body = await request.json();

    const existing = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Claim", params.id);

    const allowedFields = ["priority", "estimatedAmount", "adjusterId", "incidentLocation"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update");
    }

    const claim = await prisma.claim.update({
      where: { id: params.id },
      data: updates,
      include: {
        policy: { select: { policyNumber: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "CLAIM",
        entityId: params.id,
        action: "UPDATED",
        details: JSON.stringify(updates),
        userId: session.user.id,
      },
    });

    return successResponse(claim);
  } catch (error) {
    return handleApiError(error);
  }
}
