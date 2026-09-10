import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { customerSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          policies: { select: { id: true, status: true, type: true } },
          claims: { select: { id: true, status: true } },
        },
      });
      return successResponse(customer);
    }

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "AGENT") {
      const policies = await prisma.policy.findMany({
        where: { agentId: session.user.agentId },
        select: { customerId: true },
      });
      where.id = { in: [...new Set(policies.map((p) => p.customerId))] };
    }

    const riskFilter = searchParams.get("riskProfile");
    if (riskFilter) where.riskProfile = riskFilter;

    if (params.search) {
      where.OR = [
        { user: { name: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, createdAt: true } },
          _count: { select: { policies: true, claims: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return paginatedResponse(customers, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "AGENT"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to create customers");
    }

    const body = await request.json();
    const data = customerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        userId: session.user.id,
        riskProfile: data.riskProfile,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return successResponse(customer, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
