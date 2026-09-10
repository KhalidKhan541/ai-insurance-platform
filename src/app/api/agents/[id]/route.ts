import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { agentSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, isActive: true, createdAt: true } },
        policies: {
          select: { id: true, status: true, type: true, premium: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        customers: {
          select: {
            id: true,
            riskProfile: true,
            user: { select: { name: true, email: true } },
          },
        },
        _count: { select: { policies: true, customers: true } },
      },
    });

    if (!agent) throw new NotFoundError("Agent", params.id);

    const totalPremium = agent.policies
      .filter((p) => p.status === "ACTIVE")
      .reduce((sum, p) => sum + p.premium, 0);

    return successResponse({
      ...agent,
      performance: {
        totalPremium,
        activePolicies: agent.policies.filter((p) => p.status === "ACTIVE").length,
        totalCustomers: agent._count.customers,
        totalPolicies: agent._count.policies,
      },
    });
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

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update agents");
    }

    const body = await request.json();
    const data = agentSchema.partial().parse(body);

    const existing = await prisma.agent.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Agent", params.id);

    if (data.licenseNumber && data.licenseNumber !== existing.licenseNumber) {
      const conflict = await prisma.agent.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (conflict) throw new Error("License number already in use");
    }

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        licenseNumber: data.licenseNumber,
        agencyName: data.agencyName,
        commissionRate: data.commissionRate,
        specialization: data.specialization ? JSON.stringify(data.specialization) : undefined,
        territory: data.territory ? JSON.stringify(data.territory) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return successResponse(agent);
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
      throw new UnauthorizedError("Only administrators can delete agents");
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: { _count: { select: { policies: true, customers: true } } },
    });
    if (!agent) throw new NotFoundError("Agent", params.id);

    if (agent._count.policies > 0) {
      throw new Error("Cannot delete agent with active policies. Reassign first.");
    }

    await prisma.agent.delete({ where: { id: params.id } });

    return successResponse({ message: "Agent deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
