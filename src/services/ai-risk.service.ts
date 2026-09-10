import { v4 as uuidv4 } from "uuid";
import {
  RiskAssessment,
  RiskFactor,
  PolicyType,
  Customer,
} from "@/types";
import { calculateRiskScore, getRiskLevel } from "@/lib/utils/calculations";

interface RiskInput {
  customer: Customer;
  policyType: PolicyType;
  coverageAmount: number;
  location?: string;
  claimHistory?: { amount: number; type: string }[];
  additionalInfo?: Record<string, unknown>;
}

const AGE_RISK_FACTORS: { min: number; max: number; score: number }[] = [
  { min: 18, max: 25, score: 70 },
  { min: 26, max: 35, score: 45 },
  { min: 36, max: 50, score: 30 },
  { min: 51, max: 65, score: 50 },
  { min: 66, max: 120, score: 75 },
];

const COVERAGE_RISK_THRESHOLDS: { max: number; score: number }[] = [
  { max: 50_000, score: 20 },
  { max: 250_000, score: 40 },
  { max: 1_000_000, score: 60 },
  { max: 5_000_000, score: 80 },
  { max: Infinity, score: 95 },
];

const STATE_RISK_MODIFIERS: Record<string, number> = {
  FL: 1.3,
  CA: 1.25,
  TX: 1.2,
  NY: 1.15,
  LA: 1.2,
  OK: 1.15,
  KS: 1.1,
  NE: 1.05,
};

export class AIRiskService {
  async assessRisk(input: RiskInput): Promise<RiskAssessment> {
    const factors = this.calculateRiskFactors(input);
    const rawScore = calculateRiskScore(
      factors.map((f) => ({ weight: f.weight, score: f.score }))
    );
    const riskLevel = getRiskLevel(rawScore);
    const premiumAdjustment = this.calculatePremiumAdjustment(rawScore, riskLevel);
    const recommendations = this.generateRecommendations(factors, riskLevel, input);

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + 6);

    return {
      id: uuidv4(),
      customerId: input.customer.id,
      policyType: input.policyType,
      riskScore: rawScore,
      riskLevel,
      factors,
      recommendations,
      premiumAdjustment,
      assessedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
    };
  }

  private calculateRiskFactors(input: RiskInput): RiskFactor[] {
    const factors: RiskFactor[] = [];

    if (input.customer.dateOfBirth) {
      const age = this.calculateAge(new Date(input.customer.dateOfBirth));
      const ageFactor = AGE_RISK_FACTORS.find(
        (f) => age >= f.min && age <= f.max
      );
      if (ageFactor) {
        factors.push({
          name: "Age",
          weight: 0.15,
          score: ageFactor.score,
          impact: ageFactor.score > 50 ? "negative" : ageFactor.score < 40 ? "positive" : "neutral",
          description: `Age ${age} - ${ageFactor.score > 50 ? "higher risk" : "standard risk"} category`,
        });
      }
    }

    const coverageFactor = COVERAGE_RISK_THRESHOLDS.find(
      (t) => input.coverageAmount <= t.max
    );
    if (coverageFactor) {
      factors.push({
        name: "Coverage Amount",
        weight: 0.25,
        score: coverageFactor.score,
        impact: coverageFactor.score > 50 ? "negative" : "positive",
        description: `Coverage of $${input.coverageAmount.toLocaleString()}`,
      });
    }

    if (input.claimHistory && input.claimHistory.length > 0) {
      const totalClaims = input.claimHistory.length;
      const totalClaimAmount = input.claimHistory.reduce((sum, c) => sum + c.amount, 0);
      const claimScore = Math.min(100, totalClaims * 15 + (totalClaimAmount / 10_000) * 5);

      factors.push({
        name: "Claim History",
        weight: 0.30,
        score: claimScore,
        impact: claimScore > 50 ? "negative" : "neutral",
        description: `${totalClaims} prior claims totaling $${totalClaimAmount.toLocaleString()}`,
      });
    } else {
      factors.push({
        name: "Claim History",
        weight: 0.30,
        score: 10,
        impact: "positive",
        description: "No prior claims",
      });
    }

    if (input.location) {
      const stateModifier = STATE_RISK_MODIFIERS[input.location] || 1.0;
      const locationScore = Math.round((stateModifier - 0.8) * 100);
      factors.push({
        name: "Location",
        weight: 0.20,
        score: Math.min(100, Math.max(0, locationScore)),
        impact: stateModifier > 1.1 ? "negative" : stateModifier < 1.0 ? "positive" : "neutral",
        description: `Location modifier: ${stateModifier}x for state ${input.location}`,
      });
    } else {
      factors.push({
        name: "Location",
        weight: 0.20,
        score: 50,
        impact: "neutral",
        description: "Location data not available",
      });
    }

    const policyTypeRisk: Record<PolicyType, number> = {
      auto: 55,
      home: 40,
      life: 60,
      health: 50,
      commercial: 70,
      travel: 25,
    };

    factors.push({
      name: "Policy Type",
      weight: 0.10,
      score: policyTypeRisk[input.policyType],
      impact: policyTypeRisk[input.policyType] > 50 ? "negative" : "positive",
      description: `${input.policyType} insurance base risk`,
    });

    return factors;
  }

  private calculatePremiumAdjustment(score: number, level: string): number {
    const adjustments: Record<string, number> = {
      low: -0.15,
      medium: 0,
      high: 0.25,
      critical: 0.50,
    };

    const baseAdjustment = adjustments[level] || 0;
    const fineTuning = ((score - 50) / 500);
    return Math.round((baseAdjustment + fineTuning) * 100) / 100;
  }

  private generateRecommendations(
    factors: RiskFactor[],
    level: string,
    input: RiskInput
  ): string[] {
    const recommendations: string[] = [];

    if (level === "high" || level === "critical") {
      recommendations.push("Consider requiring additional documentation");
      recommendations.push("Recommend higher deductible to reduce premium");
    }

    const negativeFactors = factors.filter((f) => f.impact === "negative");
    for (const factor of negativeFactors) {
      switch (factor.name) {
        case "Age":
          recommendations.push("Consider age-specific coverage options");
          break;
        case "Claim History":
          recommendations.push("Recommend claims-free discount after 12 months");
          break;
        case "Location":
          recommendations.push("Consider location-specific endorsements");
          break;
        case "Coverage Amount":
          recommendations.push("Review coverage adequacy with customer");
          break;
      }
    }

    if (input.claimHistory && input.claimHistory.length === 0) {
      recommendations.push("Eligible for no-claims discount");
    }

    if (level === "low") {
      recommendations.push("Customer qualifies for preferred rates");
      recommendations.push("Consider bundling additional policies for discounts");
    }

    return [...new Set(recommendations)];
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async batchAssess(inputs: RiskInput[]): Promise<RiskAssessment[]> {
    const results: RiskAssessment[] = [];
    for (const input of inputs) {
      const assessment = await this.assessRisk(input);
      results.push(assessment);
    }
    return results;
  }
}

export const aiRiskService = new AIRiskService();
