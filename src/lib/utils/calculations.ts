import { PolicyType, RiskAssessment, PremiumCalculation, PremiumBreakdownItem } from "@/types";

const BASE_RATES: Record<PolicyType, number> = {
  auto: 1200,
  home: 1500,
  life: 800,
  health: 3600,
  commercial: 5000,
  travel: 150,
};

const RISK_MULTIPLIERS = {
  low: 0.85,
  medium: 1.0,
  high: 1.35,
  critical: 1.75,
};

const DISCOUNT_RATES = {
  multi_policy: 0.15,
  loyalty_3yr: 0.05,
  loyalty_5yr: 0.10,
  loyalty_10yr: 0.15,
  good_claims: 0.08,
  safe_driver: 0.10,
  security_system: 0.05,
  smoke_detector: 0.03,
};

const TAX_RATE = 0.065;

export function calculatePremium(
  policyType: PolicyType,
  coverageAmount: number,
  riskAssessment: RiskAssessment,
  discounts: string[] = []
): PremiumCalculation {
  const baseRate = BASE_RATES[policyType];
  if (!baseRate) {
    throw new Error(`Unknown policy type: ${policyType}`);
  }

  const coverageRatio = coverageAmount / 100_000;
  const basePremium = baseRate * coverageRatio;

  const riskLevel = riskAssessment.riskLevel;
  const riskMultiplier = RISK_MULTIPLIERS[riskLevel];
  const riskAdjustment = basePremium * (riskMultiplier - 1);

  const discountAmount = calculateDiscounts(basePremium + riskAdjustment, discounts);
  const subtotal = basePremium + riskAdjustment - discountAmount;
  const taxAmount = subtotal * TAX_RATE;
  const totalPremium = subtotal + taxAmount;

  const breakdown: PremiumBreakdownItem[] = [
    {
      name: "Base Premium",
      amount: basePremium,
      percentage: 100,
      description: `Base rate for ${policyType} insurance`,
    },
    {
      name: "Risk Adjustment",
      amount: riskAdjustment,
      percentage: riskAdjustment > 0 ? (riskAdjustment / basePremium) * 100 : 0,
      description: `${riskLevel} risk level adjustment`,
    },
  ];

  if (discountAmount > 0) {
    breakdown.push({
      name: "Discounts",
      amount: -discountAmount,
      percentage: (discountAmount / (basePremium + riskAdjustment)) * 100,
      description: `Applied discounts: ${discounts.join(", ")}`,
    });
  }

  breakdown.push({
    name: "Tax",
    amount: taxAmount,
    percentage: TAX_RATE * 100,
    description: `State tax at ${TAX_RATE * 100}%`,
  });

  return {
    basePremium: roundToTwo(basePremium),
    riskAdjustment: roundToTwo(riskAdjustment),
    discountAmount: roundToTwo(discountAmount),
    taxAmount: roundToTwo(taxAmount),
    totalPremium: roundToTwo(totalPremium),
    breakdown,
  };
}

export function calculateDiscounts(subtotal: number, discounts: string[]): number {
  let totalDiscount = 0;

  for (const discount of discounts) {
    const rate = DISCOUNT_RATES[discount as keyof typeof DISCOUNT_RATES];
    if (rate) {
      totalDiscount += subtotal * rate;
    }
  }

  const maxDiscount = subtotal * 0.40;
  return Math.min(totalDiscount, maxDiscount);
}

export function calculateRiskScore(factors: { weight: number; score: number }[]): number {
  if (factors.length === 0) return 0;

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedScore = factors.reduce((sum, f) => sum + f.weight * f.score, 0);
  return Math.round((weightedScore / totalWeight) * 100) / 100;
}

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

export function calculateDeductibleDiscount(
  basePremium: number,
  deductible: number
): number {
  if (deductible <= 0) return 0;

  const tiers: [number, number][] = [
    [500, 0.05],
    [1000, 0.10],
    [2500, 0.15],
    [5000, 0.20],
    [10000, 0.25],
  ];

  let discount = 0;
  for (const [threshold, rate] of tiers) {
    if (deductible >= threshold) {
      discount = basePremium * rate;
    }
  }

  return roundToTwo(discount);
}

export function calculateClaimsRatio(totalClaims: number, totalPremiums: number): number {
  if (totalPremiums === 0) return 0;
  return roundToTwo((totalClaims / totalPremiums) * 100);
}

export function calculateLapseRate(
  lapsedPolicies: number,
  totalPolicies: number
): number {
  if (totalPolicies === 0) return 0;
  return roundToTwo((lapsedPolicies / totalPolicies) * 100);
}

export function projectAnnualRevenue(
  monthlyPremiums: number,
  growthRate: number = 0
): number[] {
  const projections: number[] = [];
  let current = monthlyPremiums * 12;

  for (let year = 1; year <= 5; year++) {
    projections.push(roundToTwo(current));
    current *= 1 + growthRate;
  }

  return projections;
}

export function calculateROI(
  investment: number,
  returns: number
): number {
  if (investment === 0) return 0;
  return roundToTwo(((returns - investment) / investment) * 100);
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
