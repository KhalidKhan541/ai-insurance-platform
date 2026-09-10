import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "CLAIMS_ADJUSTER", "FRAUD_ANALYST"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to view fraud cases");
    }

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const severityFilter = searchParams.get("severity");
    if (severityFilter) where.severity = severityFilter;

    const [cases, total] = await Promise.all([
      prisma.fraudCase.findMany({
        where,
        include: {
          claim: {
            select: { claimNumber: true, type: true, estimatedAmount: true, status: true },
          },
          assignee: { select: { name: true } },
          indicators: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.fraudCase.count({ where }),
    ]);

    return paginatedResponse(cases, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "CLAIMS_ADJUSTER", "FRAUD_ANALYST"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to create fraud cases");
    }

    const body = await request.json();
    const { claimId, indicators, notes } = body;

    if (!claimId) throw new Error("claimId is required");

    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("Claim not found");

    const existingCase = await prisma.fraudCase.findFirst({
      where: { claimId, status: { notIn: ["CLOSED", "DISMISSED"] } },
    });
    if (existingCase) {
      throw new Error("An active fraud case already exists for this claim");
    }

    const fraudScore = calculateFraudScore(indicators || []);

    const severity = fraudScore > 0.8 ? "CRITICAL" :
      fraudScore > 0.6 ? "HIGH" :
      fraudScore > 0.4 ? "MEDIUM" : "LOW";

    const fraudCase = await prisma.fraudCase.create({
      data: {
        claimId,
        caseNumber: `FRD-${Date.now().toString(36).toUpperCase()}`,
        fraudScore,
        severity,
        status: "OPEN",
        notes,
        assignedTo: session.user.id,
        indicators: {
          create: (indicators || []).map((ind: { type: string; description: string; confidence: number }) => ({
            type: ind.type,
            description: ind.description,
            confidence: ind.confidence,
          })),
        },
      },
      include: { indicators: true, claim: { select: { claimNumber: true } } },
    });

    await prisma.claim.update({
      where: { id: claimId },
      data: { priority: "HIGH" },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "CLAIM",
        entityId: claimId,
        action: "FRAUD_FLAGGED",
        details: JSON.stringify({
          fraudCaseId: fraudCase.id,
          caseNumber: fraudCase.caseNumber,
          fraudScore,
          severity,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(fraudCase, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function calculateFraudScore(indicators: Array<{ confidence?: number }>): number {
  if (indicators.length === 0) return 0.3;
  const avgConfidence = indicators.reduce((sum, ind) => sum + (ind.confidence || 0.5), 0) / indicators.length;
  const volumeBonus = Math.min(indicators.length * 0.05, 0.2);
  return Math.round(Math.min(avgConfidence + volumeBonus, 1) * 100) / 100;
}
