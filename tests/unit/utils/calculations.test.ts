import { describe, it, expect } from "vitest";
import {
  calculatePremium,
  calculateDiscounts,
  calculateRiskScore,
  getRiskLevel,
  calculateDeductibleDiscount,
  calculateClaimsRatio,
  calculateLapseRate,
  projectAnnualRevenue,
  calculateROI,
} from "@/lib/utils/calculations";
import { RiskAssessment } from "@/types";

function makeRiskAssessment(
  level: "low" | "medium" | "high" | "critical"
): RiskAssessment {
  const scores = { low: 15, medium: 40, high: 65, critical: 90 };
  return {
    id: "test-id",
    customerId: "cust-id",
    policyType: "auto",
    riskScore: scores[level],
    riskLevel: level,
    factors: [],
    recommendations: [],
    premiumAdjustment: 0,
    assessedAt: new Date().toISOString(),
    validUntil: new Date().toISOString(),
  };
}

describe("Calculations Utils", () => {
  describe("calculatePremium", () => {
    it("should calculate base premium correctly for auto", () => {
      const result = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(result.basePremium).toBe(1200);
      expect(result.totalPremium).toBeGreaterThan(0);
    });

    it("should calculate premium for home insurance", () => {
      const result = calculatePremium("home", 100_000, makeRiskAssessment("medium"));
      expect(result.basePremium).toBe(1500);
    });

    it("should calculate premium for life insurance", () => {
      const result = calculatePremium("life", 100_000, makeRiskAssessment("medium"));
      expect(result.basePremium).toBe(800);
    });

    it("should calculate premium for health insurance", () => {
      const result = calculatePremium("health", 100_000, makeRiskAssessment("medium"));
      expect(result.basePremium).toBe(3600);
    });

    it("should apply low risk discount", () => {
      const low = calculatePremium("auto", 100_000, makeRiskAssessment("low"));
      const medium = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(low.totalPremium).toBeLessThan(medium.totalPremium);
    });

    it("should apply high risk surcharge", () => {
      const high = calculatePremium("auto", 100_000, makeRiskAssessment("high"));
      const medium = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(high.totalPremium).toBeGreaterThan(medium.totalPremium);
    });

    it("should apply critical risk surcharge", () => {
      const critical = calculatePremium("auto", 100_000, makeRiskAssessment("critical"));
      const medium = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(critical.totalPremium).toBeGreaterThan(medium.totalPremium);
    });

    it("should include tax in total premium", () => {
      const result = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.totalPremium).toBeGreaterThan(
        result.basePremium + result.riskAdjustment - result.discountAmount
      );
    });

    it("should include breakdown items", () => {
      const result = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(result.breakdown.length).toBeGreaterThan(0);
      expect(result.breakdown[0].name).toBe("Base Premium");
    });

    it("should handle coverage scaling", () => {
      const small = calculatePremium("auto", 50_000, makeRiskAssessment("medium"));
      const large = calculatePremium("auto", 200_000, makeRiskAssessment("medium"));
      expect(large.basePremium).toBeGreaterThan(small.basePremium);
    });

    it("should apply multi-policy discount", () => {
      const withDiscount = calculatePremium(
        "auto",
        100_000,
        makeRiskAssessment("medium"),
        ["multi_policy"]
      );
      const without = calculatePremium("auto", 100_000, makeRiskAssessment("medium"));
      expect(withDiscount.discountAmount).toBeGreaterThan(0);
      expect(withDiscount.totalPremium).toBeLessThan(without.totalPremium);
    });

    it("should cap discount at 40%", () => {
      const result = calculatePremium(
        "auto",
        100_000,
        makeRiskAssessment("medium"),
        ["multi_policy", "loyalty_10yr", "good_claims", "safe_driver"]
      );
      expect(result.discountAmount).toBeLessThanOrEqual(
        (result.basePremium + result.riskAdjustment) * 0.4
      );
    });

    it("should throw for unknown policy type", () => {
      expect(() =>
        calculatePremium("unknown" as never, 100_000, makeRiskAssessment("medium"))
      ).toThrow("Unknown policy type");
    });
  });

  describe("calculateDiscounts", () => {
    it("should calculate single discount", () => {
      const result = calculateDiscounts(1000, ["multi_policy"]);
      expect(result).toBe(150);
    });

    it("should calculate multiple discounts", () => {
      const result = calculateDiscounts(1000, ["multi_policy", "loyalty_3yr"]);
      expect(result).toBe(200);
    });

    it("should return 0 for no discounts", () => {
      const result = calculateDiscounts(1000, []);
      expect(result).toBe(0);
    });

    it("should return 0 for unknown discount", () => {
      const result = calculateDiscounts(1000, ["nonexistent"]);
      expect(result).toBe(0);
    });

    it("should cap at 40% of subtotal", () => {
      const result = calculateDiscounts(1000, [
        "multi_policy",
        "loyalty_10yr",
        "good_claims",
        "safe_driver",
      ]);
      expect(result).toBeLessThanOrEqual(400);
    });
  });

  describe("calculateRiskScore", () => {
    it("should calculate weighted average", () => {
      const factors = [
        { weight: 0.5, score: 80 },
        { weight: 0.5, score: 40 },
      ];
      const result = calculateRiskScore(factors);
      expect(result).toBe(60);
    });

    it("should return 0 for empty factors", () => {
      expect(calculateRiskScore([])).toBe(0);
    });

    it("should return 0 for zero weights", () => {
      expect(calculateRiskScore([{ weight: 0, score: 50 }])).toBe(0);
    });

    it("should handle single factor", () => {
      const result = calculateRiskScore([{ weight: 1, score: 75 }]);
      expect(result).toBe(75);
    });
  });

  describe("getRiskLevel", () => {
    it("should return low for score < 25", () => {
      expect(getRiskLevel(0)).toBe("low");
      expect(getRiskLevel(24)).toBe("low");
    });

    it("should return medium for score 25-49", () => {
      expect(getRiskLevel(25)).toBe("medium");
      expect(getRiskLevel(49)).toBe("medium");
    });

    it("should return high for score 50-74", () => {
      expect(getRiskLevel(50)).toBe("high");
      expect(getRiskLevel(74)).toBe("high");
    });

    it("should return critical for score >= 75", () => {
      expect(getRiskLevel(75)).toBe("critical");
      expect(getRiskLevel(100)).toBe("critical");
    });
  });

  describe("calculateDeductibleDiscount", () => {
    it("should return 0 for zero deductible", () => {
      expect(calculateDeductibleDiscount(1000, 0)).toBe(0);
    });

    it("should return 0 for negative deductible", () => {
      expect(calculateDeductibleDiscount(1000, -500)).toBe(0);
    });

    it("should apply 5% for $500 deductible", () => {
      expect(calculateDeductibleDiscount(1000, 500)).toBe(50);
    });

    it("should apply 10% for $1000 deductible", () => {
      expect(calculateDeductibleDiscount(1000, 1000)).toBe(100);
    });

    it("should apply 20% for $5000 deductible", () => {
      expect(calculateDeductibleDiscount(1000, 5000)).toBe(200);
    });

    it("should apply 25% for $10000 deductible", () => {
      expect(calculateDeductibleDiscount(1000, 10000)).toBe(250);
    });
  });

  describe("calculateClaimsRatio", () => {
    it("should calculate ratio correctly", () => {
      expect(calculateClaimsRatio(50000, 200000)).toBe(25);
    });

    it("should return 0 for zero premiums", () => {
      expect(calculateClaimsRatio(50000, 0)).toBe(0);
    });

    it("should handle zero claims", () => {
      expect(calculateClaimsRatio(0, 100000)).toBe(0);
    });
  });

  describe("calculateLapseRate", () => {
    it("should calculate rate correctly", () => {
      expect(calculateLapseRate(5, 100)).toBe(5);
    });

    it("should return 0 for zero policies", () => {
      expect(calculateLapseRate(5, 0)).toBe(0);
    });
  });

  describe("projectAnnualRevenue", () => {
    it("should project 5 years with no growth", () => {
      const projections = projectAnnualRevenue(10000);
      expect(projections).toHaveLength(5);
      expect(projections[0]).toBe(120000);
      projections.forEach((p) => expect(p).toBe(120000));
    });

    it("should project with growth rate", () => {
      const projections = projectAnnualRevenue(10000, 0.1);
      expect(projections[0]).toBe(120000);
      expect(projections[1]).toBe(132000);
      expect(projections[4]).toBeGreaterThan(120000);
    });
  });

  describe("calculateROI", () => {
    it("should calculate positive ROI", () => {
      expect(calculateROI(100, 150)).toBe(50);
    });

    it("should calculate negative ROI", () => {
      expect(calculateROI(100, 50)).toBe(-50);
    });

    it("should return 0 for zero investment", () => {
      expect(calculateROI(0, 100)).toBe(0);
    });
  });
});
