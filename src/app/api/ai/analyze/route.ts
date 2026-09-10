import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";

const analyzeSchema = z.object({
  entityType: z.enum(["POLICY", "CLAIM", "CUSTOMER", "QUOTE", "PORTFOLIO"]),
  entityId: z.string().cuid().optional(),
  analysisType: z.enum([
    "RISK_ASSESSMENT", "CLAIM_PREDICTION", "PRICING_OPTIMIZATION",
    "CUSTOMER_CHURN", "FRAUD_DETECTION", "PORTFOLIO_ANALYSIS",
    "REVENUE_FORECAST", "TREND_ANALYSIS",
  ]),
  parameters: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = analyzeSchema.parse(body);

    let analysisResult: Record<string, unknown> = {};

    switch (data.analysisType) {
      case "RISK_ASSESSMENT": {
        if (!data.entityId) throw new Error("entityId required for risk assessment");

        const entity = data.entityType === "POLICY"
          ? await prisma.policy.findUnique({
              where: { id: data.entityId },
              include: { claims: true, product: true },
            })
          : data.entityType === "CUSTOMER"
          ? await prisma.customer.findUnique({
              where: { id: data.entityId },
              include: { policies: { include: { claims: true } } },
            })
          : null;

        if (!entity) throw new Error("Entity not found");

        const riskFactors = analyzeEntityRisk(entity, data.entityType);

        analysisResult = {
          entityType: data.entityType,
          entityId: data.entityId,
          overallRisk: riskFactors.overallRisk,
          riskLevel: riskFactors.overallRisk < 0.3 ? "LOW" : riskFactors.overallRisk < 0.6 ? "MEDIUM" : "HIGH",
          factors: riskFactors.factors,
          recommendations: riskFactors.recommendations,
          confidence: 0.85,
        };
        break;
      }

      case "CLAIM_PREDICTION": {
        const policyStats = await prisma.policy.aggregate({
          _count: true,
          _avg: { premium: true, coverageAmount: true },
        });

        const claimStats = await prisma.claim.aggregate({
          _count: true,
          _avg: { estimatedAmount: true },
        });

        const recentClaims = await prisma.claim.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          select: { type: true, status: true, estimatedAmount: true },
        });

        analysisResult = {
          prediction: {
            likelihood: Math.min(claimStats._count / Math.max(policyStats._count, 1), 0.95),
            estimatedFrequency: claimStats._count / 12,
            estimatedSeverity: claimStats._avg.estimatedAmount || 0,
          },
          recentTrends: {
            claimsLast90Days: recentClaims.length,
            averageSeverity: recentClaims.length > 0
              ? recentClaims.reduce((s, c) => s + c.estimatedAmount, 0) / recentClaims.length
              : 0,
            topTypes: getTopTypes(recentClaims),
          },
          confidence: 0.78,
        };
        break;
      }

      case "PRICING_OPTIMIZATION": {
        const products = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            policies: {
              select: { premium: true, coverageAmount: true, status: true },
            },
            quotes: {
              select: { premium: true, status: true },
              where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
            },
          },
        });

        analysisResult = {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            currentPremium: p.basePremium,
            activePolicies: p.policies.length,
            conversionRate: p.quotes.length > 0
              ? (p.quotes.filter((q) => q.status === "CONVERTED").length / p.quotes.length * 100).toFixed(1)
              : 0,
            suggestedAdjustment: calculatePricingAdjustment(p),
          })),
          confidence: 0.72,
        };
        break;
      }

      case "CUSTOMER_CHURN": {
        const customers = await prisma.customer.findMany({
          include: {
            policies: { select: { status: true, endDate: true } },
            user: { select: { lastLoginAt: true } },
          },
          take: 100,
        });

        analysisResult = {
          customers: customers.map((c) => ({
            id: c.id,
            riskScore: calculateChurnRisk(c),
            factors: getChurnFactors(c),
          })),
          summary: {
            totalAnalyzed: customers.length,
            highRisk: customers.filter((c) => calculateChurnRisk(c) > 0.7).length,
            mediumRisk: customers.filter((c) => {
              const r = calculateChurnRisk(c);
              return r > 0.4 && r <= 0.7;
            }).length,
          },
          confidence: 0.68,
        };
        break;
      }

      case "FRAUD_DETECTION": {
        const recentClaims = await prisma.claim.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          include: { policy: true },
        });

        analysisResult = {
          flaggedClaims: recentClaims.filter((c) => c.estimatedAmount > 50000).length,
          averageClaimAmount: recentClaims.length > 0
            ? recentClaims.reduce((s, c) => s + c.estimatedAmount, 0) / recentClaims.length
            : 0,
          anomalies: detectAnomalies(recentClaims),
          confidence: 0.75,
        };
        break;
      }

      default:
        analysisResult = {
          message: `Analysis type ${data.analysisType} completed with limited data`,
          confidence: 0.5,
        };
    }

    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        analysisType: data.analysisType,
        result: JSON.stringify(analysisResult),
        confidence: (analysisResult.confidence as number) || 0.5,
        requestedBy: session.user.id,
      },
    });

    return successResponse({
      id: aiAnalysis.id,
      ...analysisResult,
      metadata: {
        analyzedAt: new Date(),
        analyzedBy: session.user.id,
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function analyzeEntityRisk(entity: Record<string, unknown>, type: string) {
  const factors: Array<{ factor: string; score: number; weight: number }> = [];
  const recommendations: string[] = [];

  if (type === "POLICY") {
    const claims = entity.claims as Array<{ status: string; estimatedAmount: number }> | undefined;
    if (claims && claims.length > 3) {
      factors.push({ factor: "CLAIM_FREQUENCY", score: 0.8, weight: 0.3 });
      recommendations.push("Review policy for potential rate adjustment");
    }
    const coverage = (entity.coverageAmount as number) || 0;
    const premium = (entity.premium as number) || 0;
    if (coverage > 0 && premium / coverage < 0.01) {
      factors.push({ factor: "PRICING_RATIO", score: 0.6, weight: 0.2 });
      recommendations.push("Premium may be underpriced for coverage level");
    }
  }

  if (factors.length === 0) {
    factors.push({ factor: "DEFAULT", score: 0.3, weight: 1.0 });
  }

  const overallRisk = factors.reduce((sum, f) => sum + f.score * f.weight, 0) /
    factors.reduce((sum, f) => sum + f.weight, 0);

  return { overallRisk, factors, recommendations };
}

function getTopTypes(claims: Array<{ type: string }>) {
  const counts: Record<string, number> = {};
  claims.forEach((c) => { counts[c.type] = (counts[c.type] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => ({ type, count }));
}

function calculatePricingAdjustment(product: { policies: Array<{ premium: number; status: string }>; basePremium: number }) {
  const activeCount = product.policies.filter((p) => p.status === "ACTIVE").length;
  const totalPremium = product.policies.reduce((s, p) => s + p.premium, 0);
  if (activeCount > 100) return "CONSIDER_DECREASE";
  if (activeCount < 10) return "CONSIDER_INCREASE";
  return "MAINTAIN";
}

function calculateChurnRisk(customer: { policies: Array<{ status: string; endDate: string | Date }>; user: { lastLoginAt: Date | null } }) {
  let risk = 0.3;
  const activePolicies = customer.policies.filter((p) => p.status === "ACTIVE").length;
  if (activePolicies === 0) risk += 0.4;
  if (customer.user.lastLoginAt) {
    const daysSinceLogin = (Date.now() - new Date(customer.user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin > 90) risk += 0.2;
    if (daysSinceLogin > 180) risk += 0.1;
  }
  return Math.min(risk, 1);
}

function getChurnFactors(customer: { policies: Array<{ status: string }>; user: { lastLoginAt: Date | null } }) {
  const factors: string[] = [];
  if (customer.policies.filter((p) => p.status === "ACTIVE").length === 0) factors.push("No active policies");
  if (customer.user.lastLoginAt) {
    const days = (Date.now() - new Date(customer.user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 90) factors.push("Low engagement");
  }
  return factors;
}

function detectAnomalies(claims: Array<{ estimatedAmount: number }>) {
  if (claims.length === 0) return [];
  const avg = claims.reduce((s, c) => s + c.estimatedAmount, 0) / claims.length;
  const stdDev = Math.sqrt(claims.reduce((s, c) => s + Math.pow(c.estimatedAmount - avg, 2), 0) / claims.length);
  return claims
    .filter((c) => c.estimatedAmount > avg + 2 * stdDev)
    .map((c) => ({ amount: c.estimatedAmount, deviation: ((c.estimatedAmount - avg) / stdDev).toFixed(1) }));
}
