import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { policies: true, quotes: true } },
      },
    });

    if (!product) throw new NotFoundError("Product", params.id);

    return successResponse(product);
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

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can update products");
    }

    const body = await request.json();
    const data = productSchema.partial().parse(body);

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Product", params.id);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        deductibleOptions: data.deductibleOptions ? JSON.stringify(data.deductibleOptions) : undefined,
        features: data.features ? JSON.stringify(data.features) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    return successResponse(product);
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
      throw new UnauthorizedError("Only administrators can delete products");
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { _count: { select: { policies: true, quotes: true } } },
    });
    if (!product) throw new NotFoundError("Product", params.id);

    if (product._count.policies > 0) {
      throw new Error("Cannot delete product with active policies. Deactivate instead.");
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return successResponse({ message: "Product deactivated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
