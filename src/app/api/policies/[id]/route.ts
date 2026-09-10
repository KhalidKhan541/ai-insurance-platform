import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { policyUpdateSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        product: true,
        agent: { include: { user: { select: { name: true, email: true } } } },
        claims: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            claimNumber: true,
            type: true,
            status: true,
            estimatedAmount: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
        endorsements: {
          orderBy: { createdAt: "desc" },
        },
        documents: {
          select: { id: true, name: true, type: true, createdAt: true },
        },
      },
    });

    if (!policy) throw new NotFoundError("Policy", params.id);

    if (session.user.role === "CUSTOMER" && policy.customerId !== session.user.id) {
      throw new UnauthorizedError("You do not have access to this policy");
    }

    return successResponse(policy);
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

    if (!["ADMIN", "AGENT", "UNDERWRITER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update policies");
    }

    const body = await request.json();
    const data = policyUpdateSchema.parse(body);

    const existing = await prisma.policy.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Policy", params.id);

    if (existing.status === "CANCELLED") {
      throw new Error("Cannot update a cancelled policy");
    }

    const policy = await prisma.policy.update({
      where: { id: params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        product: true,
      },
    });

    return successResponse(policy);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can delete policies");
    }

    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: { _count: { select: { claims: true, payments: true } } },
    });
    if (!policy) throw new NotFoundError("Policy", params.id);

    if (policy._count.claims > 0 || policy._count.payments > 0) {
      throw new Error("Cannot delete policy with associated claims or payments");
    }

    await prisma.policy.delete({ where: { id: params.id } });

    return successResponse({ message: "Policy deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
