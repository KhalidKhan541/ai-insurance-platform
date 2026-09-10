import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { claimSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";
import { generateClaimNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "CUSTOMER") {
      const policies = await prisma.policy.findMany({
        where: { customerId: session.user.id },
        select: { id: true },
      });
      where.policyId = { in: policies.map((p) => p.id) };
    } else if (session.user.role === "AGENT") {
      const policies = await prisma.policy.findMany({
        where: { agentId: session.user.agentId },
        select: { id: true },
      });
      where.policyId = { in: policies.map((p) => p.id) };
    }

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const priorityFilter = searchParams.get("priority");
    if (priorityFilter) where.priority = priorityFilter;

    const adjusterId = searchParams.get("adjusterId");
    if (adjusterId) where.adjusterId = adjusterId;

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      where.incidentDate = {};
      if (dateFrom) (where.incidentDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.incidentDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    const orderBy: Record<string, string> = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          policy: {
            select: { policyNumber: true, type: true, coverageAmount: true },
          },
          adjuster: { include: { user: { select: { name: true } } } },
          _count: { select: { documents: true, payments: true, updates: true } },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.claim.count({ where }),
    ]);

    return paginatedResponse(claims, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = claimSchema.parse(body);

    const policy = await prisma.policy.findUnique({
      where: { id: data.policyId },
      include: { product: true },
    });

    if (!policy) throw new Error("Policy not found");

    if (policy.status !== "ACTIVE") {
      throw new Error("Can only file claims against active policies");
    }

    const incidentDate = new Date(data.incidentDate);
    if (incidentDate < new Date(policy.startDate) || incidentDate > new Date()) {
      throw new Error("Incident date must be within the policy period");
    }

    if (data.estimatedAmount > policy.coverageAmount) {
      throw new Error(`Claim amount exceeds coverage limit of ${policy.coverageAmount}`);
    }

    const claimCount = await prisma.claim.count({
      where: {
        policyId: data.policyId,
        status: { notIn: ["DENIED", "CLOSED"] },
      },
    });

    const priority = claimCount > 3 ? "HIGH" : data.priority;

    const claimNumber = generateClaimNumber();

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        policyId: data.policyId,
        type: data.type,
        description: data.description,
        incidentDate,
        incidentLocation: data.incidentLocation,
        estimatedAmount: data.estimatedAmount,
        status: "SUBMITTED",
        priority,
        metadata: JSON.stringify({
          filedBy: session.user.id,
          claimHistory: claimCount,
        }),
      },
      include: {
        policy: {
          select: { policyNumber: true, type: true, coverageAmount: true },
        },
      },
    });

    if (data.documents && data.documents.length > 0) {
      await prisma.claimDocument.createMany({
        data: data.documents.map((docUrl) => ({
          claimId: claim.id,
          name: docUrl.split("/").pop() || "document",
          url: docUrl,
          type: "OTHER",
          uploadedBy: session.user.id,
        })),
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: "CLAIM",
        entityId: claim.id,
        action: "FILED",
        details: JSON.stringify({
          claimNumber,
          policyId: data.policyId,
          type: data.type,
          estimatedAmount: data.estimatedAmount,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(claim, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
