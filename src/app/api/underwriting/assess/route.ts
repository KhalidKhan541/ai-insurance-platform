import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";

const assessSchema = z.object({
  policyId: z.string().cuid(),
  applicantData: z.object({
    age: z.number().int().positive().optional(),
    income: z.number().positive().optional(),
    claimsHistory: z.number().int().min(0).optional(),
    creditScore: z.number().int().min(300).max(850).optional(),
    occupation: z.string().optional(),
    healthConditions: z.array(z.string()).optional(),
    smoker: z.boolean().optional(),
    vehicleInfo: z.object({
      year: z.number().int(),
      make: z.string(),
      model: z.string(),
      value: z.number().positive(),
    }).optional(),
    propertyInfo: z.object({
      yearBuilt: z.number().int(),
      squareFootage: z.number().positive(),
      constructionType: z.string(),
      securitySystem: z.boolean().optional(),
    }).optional(),
  }),
  coverageRequested: z.number().positive(),
  additionalNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "UNDERWRITER", "AGENT"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions");
    }

    const body = await request.json();
    const data = assessSchema.parse(body);

    const policy = await prisma.policy.findUnique({
      where: { id: data.policyId },
      include: { product: true, customer: { include: { user: true } } },
    });

    if (!policy) throw new Error("Policy not found");

    const riskFactors = analyzeRiskFactors(data.applicantData, policy.type);

    const overallRiskScore = riskFactors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    ) / riskFactors.reduce((sum, f) => sum + f.weight, 0);

    const riskLevel = overallRiskScore < 0.3 ? "LOW" :
      overallRiskScore < 0.6 ? "MEDIUM" :
      overallRiskScore < 0.8 ? "HIGH" : "VERY_HIGH";

    const recommendation = riskLevel === "LOW" ? "APPROVE" :
      riskLevel === "MEDIUM" ? "APPROVE_WITH_CONDITIONS" :
      riskLevel === "HIGH" ? "MANUAL_REVIEW" : "DECLINE";

    const suggestedPremium = calculateSuggestedPremium(
      policy.product.basePremium,
      data.coverageRequested,
      overallRiskScore,
      policy.type
    );

    const assessment = await prisma.underwritingAssessment.create({
      data: {
        policyId: data.policyId,
        riskScore: overallRiskScore,
        riskLevel,
        recommendation,
        status: "COMPLETED",
        notes: data.additionalNotes,
        assignedTo: session.user.id,
        factors: {
          create: riskFactors.map((f) => ({
            factor: f.factor,
            score: f.score,
            weight: f.weight,
            details: f.details,
          })),
        },
      },
      include: { riskFactors: true },
    });

    return successResponse({
      assessment,
      analysis: {
        riskFactors,
        overallRiskScore,
        riskLevel,
        recommendation,
        suggestedPremium,
        conditions: recommendation === "APPROVE_WITH_CONDITIONS" ? [
          "Higher deductible may apply",
          "Pre-existing condition exclusions may apply",
          "Coverage limits may be adjusted",
        ] : [],
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function analyzeRiskFactors(
  data: Record<string, unknown>,
  policyType: string
) {
  const factors: Array<{ factor: string; score: number; weight: number; details: string }> = [];

  if (data.age) {
    const age = data.age as number;
    const score = age < 25 ? 0.8 : age < 35 ? 0.4 : age < 55 ? 0.3 : 0.6;
    factors.push({ factor: "AGE", score, weight: 0.15, details: `Age: ${age}` });
  }

  if (data.claimsHistory !== undefined) {
    const claims = data.claimsHistory as number;
    const score = claims === 0 ? 0.1 : claims <= 2 ? 0.4 : claims <= 5 ? 0.7 : 1.0;
    factors.push({ factor: "CLAIMS_HISTORY", score, weight: 0.25, details: `${claims} previous claims` });
  }

  if (data.creditScore) {
    const credit = data.creditScore as number;
    const score = credit >= 750 ? 0.2 : credit >= 700 ? 0.35 : credit >= 650 ? 0.55 : 0.85;
    factors.push({ factor: "CREDIT_SCORE", score, weight: 0.1, details: `Score: ${credit}` });
  }

  if (data.income) {
    const income = data.income as number;
    const score = income > 100000 ? 0.2 : income > 50000 ? 0.4 : 0.7;
    factors.push({ factor: "INCOME", score, weight: 0.1, details: `Income: $${income}` });
  }

  if (policyType === "AUTO" && data.vehicleInfo) {
    const vehicle = data.vehicleInfo as { year: number; value: number };
    const age = new Date().getFullYear() - vehicle.year;
    const score = age <= 3 ? 0.3 : age <= 7 ? 0.5 : 0.8;
    factors.push({ factor: "VEHICLE_AGE", score, weight: 0.15, details: `Vehicle age: ${age} years` });
    if (vehicle.value > 50000) {
      factors.push({ factor: "VEHICLE_VALUE", score: 0.7, weight: 0.1, details: `Value: $${vehicle.value}` });
    }
  }

  if (policyType === "HOME" && data.propertyInfo) {
    const property = data.propertyInfo as { yearBuilt: number; securitySystem?: boolean };
    const age = new Date().getFullYear() - property.yearBuilt;
    const score = age <= 10 ? 0.2 : age <= 30 ? 0.4 : 0.7;
    factors.push({ factor: "PROPERTY_AGE", score, weight: 0.15, details: `Built ${property.yearBuilt}` });
    if (property.securitySystem) {
      factors.push({ factor: "SECURITY", score: 0.2, weight: 0.05, details: "Has security system" });
    }
  }

  if (data.healthConditions && (data.healthConditions as string[]).length > 0) {
    const conditions = data.healthConditions as string[];
    factors.push({
      factor: "HEALTH",
      score: Math.min(conditions.length * 0.2, 1),
      weight: 0.2,
      details: `${conditions.length} conditions: ${conditions.join(", ")}`,
    });
  }

  if (factors.length === 0) {
    factors.push({ factor: "DEFAULT", score: 0.5, weight: 1.0, details: "Insufficient data" });
  }

  return factors;
}

function calculateSuggestedPremium(
  basePremium: number,
  coverage: number,
  riskScore: number,
  type: string
): number {
  const coverageFactor = coverage / 100000;
  const typeMultiplier = type === "CYBER" ? 1.5 : type === "LIFE" ? 1.2 : 1.0;
  return Math.round(basePremium * coverageFactor * (1 + riskScore) * typeMultiplier * 100) / 100;
}
