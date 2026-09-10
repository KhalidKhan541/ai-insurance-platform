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

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "UNDERWRITER") {
      where.assignedTo = session.user.id;
    }

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const riskFilter = searchParams.get("riskLevel");
    if (riskFilter) where.riskLevel = riskFilter;

    const [assessments, total] = await Promise.all([
      prisma.underwritingAssessment.findMany({
        where,
        include: {
          policy: { select: { policyNumber: true, type: true, customerId: true } },
          assignee: { select: { name: true } },
          riskFactors: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.underwritingAssessment.count({ where }),
    ]);

    return paginatedResponse(assessments, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "UNDERWRITER", "AGENT"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to create underwriting assessments");
    }

    const body = await request.json();
    const { policyId, notes } = body;

    if (!policyId) throw new Error("policyId is required");

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        customer: { include: { user: true } },
        product: true,
        claims: true,
      },
    });

    if (!policy) throw new Error("Policy not found");

    const claimCount = policy.claims.length;
    const approvedClaims = policy.claims.filter((c) =>
      ["APPROVED", "SETTLED"].includes(c.status)
    ).length;
    const deniedClaims = policy.claims.filter((c) => c.status === "DENIED").length;

    const riskScore = calculateRiskScore({
      coverageAmount: policy.coverageAmount,
      claimCount,
      approvedClaims,
      deniedClaims,
      premium: policy.premium,
    });

    const riskLevel = riskScore < 0.5 ? "LOW" : riskScore < 1.0 ? "MEDIUM" : riskScore < 1.5 ? "HIGH" : "VERY_HIGH";

    const recommendation =
      riskLevel === "LOW" || riskLevel === "MEDIUM" ? "APPROVE" :
      riskLevel === "HIGH" ? "MANUAL_REVIEW" : "DECLINE";

    const assessment = await prisma.underwritingAssessment.create({
      data: {
        policyId,
        riskScore,
        riskLevel,
        recommendation,
        status: "COMPLETED",
        notes,
        assignedTo: session.user.id,
        factors: {
          create: [
            { factor: "CLAIM_HISTORY", score: claimCount > 3 ? 0.8 : claimCount > 0 ? 0.5 : 0.2, weight: 0.3 },
            { factor: "COVERAGE_RATIO", score: Math.min(policy.coverageAmount / 1000000, 1), weight: 0.25 },
            { factor: "PAYMENT_HISTORY", score: 0.7, weight: 0.25 },
            { factor: "RISK_PROFILE", score: riskScore, weight: 0.2 },
          ],
        },
      },
      include: {
        riskFactors: true,
        policy: { select: { policyNumber: true, type: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "POLICY",
        entityId: policyId,
        action: "UNDERWRITTEN",
        details: JSON.stringify({
          assessmentId: assessment.id,
          riskScore,
          riskLevel,
          recommendation,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(assessment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function calculateRiskScore(factors: Record<string, number>): number {
  let score = 0;
  score += Math.min(factors.claimCount / 10, 1) * 0.3;
  score += Math.min(factors.coverageAmount / 2000000, 1) * 0.25;
  score += (1 - Math.min(factors.approvedClaims / Math.max(factors.claimCount, 1), 1)) * 0.25;
  score += Math.min(factors.premium / 50000, 1) * 0.2;
  return Math.round(score * 100) / 100;
}
