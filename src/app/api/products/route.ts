import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { productSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = { isActive: true };

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const minPremium = searchParams.get("minPremium");
    const maxPremium = searchParams.get("maxPremium");
    if (minPremium || maxPremium) {
      where.basePremium = {};
      if (minPremium) (where.basePremium as Record<string, unknown>).gte = parseFloat(minPremium);
      if (maxPremium) (where.basePremium as Record<string, unknown>).lte = parseFloat(maxPremium);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResponse(products, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can create products");
    }

    const body = await request.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...data,
        deductibleOptions: JSON.stringify(data.deductibleOptions),
        features: JSON.stringify(data.features),
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    return successResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
