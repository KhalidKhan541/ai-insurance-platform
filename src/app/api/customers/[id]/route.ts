import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { customerSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role === "CUSTOMER" && session.user.id !== params.id) {
      throw new UnauthorizedError("You can only view your own profile");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        policies: {
          include: { product: true },
          orderBy: { createdAt: "desc" },
        },
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
      },
    });

    if (!customer) throw new NotFoundError("Customer", params.id);

    return successResponse(customer);
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

    if (session.user.role === "CUSTOMER" && session.user.id !== params.id) {
      throw new UnauthorizedError("You can only update your own profile");
    }

    const body = await request.json();
    const data = customerSchema.partial().parse(body);

    const existing = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Customer", params.id);

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        riskProfile: data.riskProfile,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return successResponse(customer);
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
      throw new UnauthorizedError("Only administrators can delete customers");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { _count: { select: { policies: true, claims: true } } },
    });
    if (!customer) throw new NotFoundError("Customer", params.id);

    if (customer._count.policies > 0 || customer._count.claims > 0) {
      throw new Error("Cannot delete customer with associated policies or claims");
    }

    await prisma.customer.delete({ where: { id: params.id } });

    return successResponse({ message: "Customer deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
