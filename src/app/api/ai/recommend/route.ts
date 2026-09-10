import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";

const recommendSchema = z.object({
  type: z.enum([
    "PRODUCT_RECOMMENDATION", "COVERAGE_ADJUSTMENT", "UPSELL",
    "RETENTION", "CROSS_SELL", "RENEWAL", "GENERAL",
  ]),
  customerId: z.string().cuid().optional(),
  context: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = recommendSchema.parse(body);

    let recommendations: Array<Record<string, unknown>> = [];

    if (data.type === "PRODUCT_RECOMMENDATION" && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        include: {
          policies: { include: { product: true } },
          claims: { select: { type: true } },
          user: { select: { name: true } },
        },
      });

      if (!customer) throw new Error("Customer not found");

      const existingTypes = customer.policies.map((p) => p.product.type);
      const allProducts = await prisma.product.findMany({ where: { isActive: true } });

      const recommendedProducts = allProducts
        .filter((p) => !existingTypes.includes(p.type))
        .map((p) => ({
          productId: p.id,
          productName: p.name,
          productType: p.type,
          basePremium: p.basePremium,
          relevanceScore: calculateRelevanceScore(customer, p),
          reason: generateRecommendationReason(customer, p),
        }))
        .sort((a, b) => (b.relevanceScore as number) - (a.relevanceScore as number));

      recommendations = recommendedProducts.slice(0, 5);
    }

    if (data.type === "COVERAGE_ADJUSTMENT" && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        include: {
          policies: { include: { product: true, claims: true } },
        },
      });

      if (!customer) throw new Error("Customer not found");

      recommendations = customer.policies.map((policy) => {
        const claimsCount = policy.claims.length;
        const totalClaimAmount = policy.claims.reduce((s, c) => s + (c.approvedAmount || c.estimatedAmount), 0);

        let adjustment = "MAINTAIN";
        let reason = "Current coverage appears appropriate";

        if (claimsCount > 2 && totalClaimAmount > policy.coverageAmount * 0.5) {
          adjustment = "INCREASE";
          reason = "Multiple claims suggest higher coverage may be beneficial";
        } else if (claimsCount === 0 && policy.coverageAmount > policy.product.basePremium * 100) {
          adjustment = "DECREASE";
          reason = "No claims history with high coverage ratio";
        }

        return {
          policyId: policy.id,
          policyNumber: policy.policyNumber,
          currentCoverage: policy.coverageAmount,
          adjustment,
          reason,
          suggestedCoverage: adjustment === "INCREASE"
            ? Math.round(policy.coverageAmount * 1.3 / 1000) * 1000
            : adjustment === "DECREASE"
            ? Math.round(policy.coverageAmount * 0.7 / 1000) * 1000
            : policy.coverageAmount,
        };
      });
    }

    if (data.type === "UPSELL") {
      const policies = await prisma.policy.findMany({
        where: { status: "ACTIVE" },
        include: { product: true, customer: { include: { user: true } } },
        take: 50,
      });

      recommendations = policies
        .filter((p) => p.coverageAmount < p.product.maxCoverage * 0.5)
        .map((p) => ({
          policyId: p.id,
          customerId: p.customerId,
          customerName: p.customer.user.name,
          currentPremium: p.premium,
          currentCoverage: p.coverageAmount,
          suggestedPremium: Math.round(p.premium * 1.3 * 100) / 100,
          suggestedCoverage: Math.round(p.coverageAmount * 1.5 / 1000) * 1000,
          potentialRevenueIncrease: Math.round(p.premium * 0.3 * 12 * 100) / 100,
          reason: "Customer has room for increased coverage",
        }))
        .slice(0, 10);
    }

    if (data.type === "RETENTION") {
      const expiringPolicies = await prisma.policy.findMany({
        where: {
          status: "ACTIVE",
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: { include: { user: true } },
          product: true,
          claims: { select: { id: true } },
        },
      });

      recommendations = expiringPolicies.map((p) => ({
        policyId: p.id,
        customerId: p.customerId,
        customerName: p.customer.user.name,
        endDate: p.endDate,
        daysUntilExpiry: Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        claimCount: p.claims.length,
        retentionPriority: p.claims.length > 0 ? "HIGH" : "MEDIUM",
        suggestedAction: p.claims.length > 0
          ? "Proactive renewal offer with loyalty discount"
          : "Standard renewal reminder",
        suggestedDiscount: p.claims.length > 0 ? 5 : 0,
      }));
    }

    const aiRecommendation = await prisma.aIRecommendation.create({
      data: {
        type: data.type,
        customerId: data.customerId,
        recommendations: JSON.stringify(recommendations),
        context: data.context ? JSON.stringify(data.context) : undefined,
        requestedBy: session.user.id,
      },
    });

    return successResponse({
      id: aiRecommendation.id,
      type: data.type,
      count: recommendations.length,
      recommendations,
      metadata: {
        generatedAt: new Date(),
        generatedBy: session.user.id,
        model: "rule-based-v1",
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function calculateRelevanceScore(customer: Record<string, unknown>, product: Record<string, unknown>): number {
  let score = 0.5;
  const policies = customer.policies as Array<{ type: string; premium: number }> | undefined;
  if (policies && policies.length > 0) {
    score += 0.1;
    const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
    if (totalPremium > 5000) score += 0.15;
  }
  const claims = customer.claims as Array<{ type: string }> | undefined;
  if (claims && claims.length > 2) score += 0.15;
  return Math.min(score, 1);
}

function generateRecommendationReason(customer: Record<string, unknown>, product: Record<string, unknown>): string {
  const policies = customer.policies as Array<{ type: string }> | undefined;
  const type = product.type as string;
  if (!policies || policies.length === 0) return `New ${type} insurance opportunity`;
  if (type === "UMBRELLA") return "Umbrella policy for additional liability protection";
  if (type === "CYBER") return "Cyber insurance for digital risk coverage";
  return `Complementary ${type} insurance product`;
}
