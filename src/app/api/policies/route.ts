import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { policySchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";
import { generatePolicyNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};
    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (session.user.role === "AGENT") {
      where.agentId = session.user.agentId;
    }

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const customerId = searchParams.get("customerId");
    if (customerId) where.customerId = customerId;

    const orderBy: Record<string, string> = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          customer: { include: { user: { select: { name: true, email: true } } } },
          product: true,
          agent: { include: { user: { select: { name: true } } } },
          _count: { select: { claims: true, payments: true } },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.policy.count({ where }),
    ]);

    return paginatedResponse(policies, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = policySchema.parse(body);

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found");

    if (data.coverageAmount < product.minCoverage || data.coverageAmount > product.maxCoverage) {
      throw new Error(
        `Coverage amount must be between ${product.minCoverage} and ${product.maxCoverage}`
      );
    }

    const policyNumber = generatePolicyNumber(data.type);

    const policy = await prisma.policy.create({
      data: {
        ...data,
        policyNumber,
        premium: data.premium,
        coverageAmount: data.coverageAmount,
        deductible: data.deductible,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        product: true,
        agent: { include: { user: { select: { name: true } } } },
      },
    });

    return successResponse(policy, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
