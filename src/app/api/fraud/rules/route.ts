import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fraudRuleSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "FRAUD_ANALYST"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to view fraud rules");
    }

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};
    const activeFilter = searchParams.get("isActive");
    if (activeFilter !== null) where.isActive = activeFilter === "true";

    const typeFilter = searchParams.get("ruleType");
    if (typeFilter) where.ruleType = typeFilter;

    const [rules, total] = await Promise.all([
      prisma.fraudRule.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.fraudRule.count({ where }),
    ]);

    return paginatedResponse(rules, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can create fraud rules");
    }

    const body = await request.json();
    const data = fraudRuleSchema.parse(body);

    const rule = await prisma.fraudRule.create({
      data: {
        ...data,
        condition: JSON.stringify(data.condition),
      },
    });

    return successResponse(rule, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can update fraud rules");
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) throw new Error("Rule id is required");

    const rule = await prisma.fraudRule.update({
      where: { id },
      data: {
        ...updates,
        condition: updates.condition ? JSON.stringify(updates.condition) : undefined,
      },
    });

    return successResponse(rule);
  } catch (error) {
    return handleApiError(error);
  }
}
