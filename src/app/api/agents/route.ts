import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { agentSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      if (session.user.role === "AGENT") {
        const agent = await prisma.agent.findUnique({
          where: { userId: session.user.id },
          include: {
            user: { select: { name: true, email: true } },
            policies: { select: { id: true, status: true } },
            _count: { select: { policies: true, customers: true } },
          },
        });
        return successResponse(agent);
      }
      throw new UnauthorizedError("Insufficient permissions");
    }

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};
    if (params.search) {
      where.OR = [
        { user: { name: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
        { licenseNumber: { contains: params.search, mode: "insensitive" } } as Record<string, unknown>,
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, isActive: true } },
          _count: { select: { policies: true, customers: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.agent.count({ where }),
    ]);

    return paginatedResponse(agents, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (session.user.role !== "ADMIN") {
      throw new UnauthorizedError("Only administrators can create agents");
    }

    const body = await request.json();
    const data = agentSchema.parse(body);

    const existingAgent = await prisma.agent.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (existingAgent) {
      throw new Error("An agent with this license number already exists");
    }

    const agent = await prisma.agent.create({
      data: {
        ...data,
        specialization: data.specialization ? JSON.stringify(data.specialization) : undefined,
        territory: data.territory ? JSON.stringify(data.territory) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return successResponse(agent, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
