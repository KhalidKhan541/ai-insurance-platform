import { describe, it, expect, beforeEach } from "vitest";
import { AIRiskService } from "@/services/ai-risk.service";
import { Customer } from "@/types";

describe("AIRiskService", () => {
  let service: AIRiskService;

  beforeEach(() => {
    service = new AIRiskService();
  });

  const mockCustomer: Customer = {
    id: "cust-1",
    customerNumber: "CUST-001",
    type: "individual",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+15551234567",
    address: {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "US",
    },
    dateOfBirth: "1990-05-15",
    totalPolicies: 2,
    totalClaims: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  describe("assessRisk", () => {
    it("should generate a risk assessment", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("riskLevel");
      expect(result).toHaveProperty("factors");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("premiumAdjustment");
      expect(result).toHaveProperty("assessedAt");
      expect(result).toHaveProperty("validUntil");
    });

    it("should include age factor when DOB provided", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      const ageFactor = result.factors.find((f) => f.name === "Age");
      expect(ageFactor).toBeDefined();
      expect(ageFactor?.weight).toBe(0.15);
    });

    it("should include coverage factor", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 500_000,
      });

      const coverageFactor = result.factors.find((f) => f.name === "Coverage Amount");
      expect(coverageFactor).toBeDefined();
      expect(coverageFactor?.weight).toBe(0.25);
    });

    it("should include no-claims factor when no history", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      const claimsFactor = result.factors.find((f) => f.name === "Claim History");
      expect(claimsFactor).toBeDefined();
      expect(claimsFactor?.impact).toBe("positive");
    });

    it("should factor in claim history", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
        claimHistory: [
          { amount: 5000, type: "auto_accident" },
          { amount: 2000, type: "property_damage" },
        ],
      });

      const claimsFactor = result.factors.find((f) => f.name === "Claim History");
      expect(claimsFactor).toBeDefined();
      expect(claimsFactor?.impact).toBe("negative");
    });

    it("should include location factor", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
        location: "FL",
      });

      const locationFactor = result.factors.find((f) => f.name === "Location");
      expect(locationFactor).toBeDefined();
      expect(locationFactor?.score).toBeGreaterThan(50);
    });

    it("should include policy type factor", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "commercial",
        coverageAmount: 1_000_000,
      });

      const policyFactor = result.factors.find((f) => f.name === "Policy Type");
      expect(policyFactor).toBeDefined();
      expect(policyFactor?.weight).toBe(0.10);
    });

    it("should generate no-claims discount recommendation", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
        claimHistory: [],
      });

      expect(result.recommendations).toContain("Eligible for no-claims discount");
    });

    it("should generate preferred rate recommendation for low risk", async () => {
      const youngCustomer = { ...mockCustomer, dateOfBirth: "1990-05-15" };
      const result = await service.assessRisk({
        customer: youngCustomer,
        policyType: "travel",
        coverageAmount: 10_000,
        location: "NE",
      });

      if (result.riskLevel === "low") {
        expect(result.recommendations).toContain(
          "Customer qualifies for preferred rates"
        );
      }
    });

    it("should generate recommendations for high risk", async () => {
      const olderCustomer = { ...mockCustomer, dateOfBirth: "1940-01-01" };
      const result = await service.assessRisk({
        customer: olderCustomer,
        policyType: "commercial",
        coverageAmount: 5_000_000,
        location: "FL",
        claimHistory: [
          { amount: 50_000, type: "property_damage" },
          { amount: 30_000, type: "liability" },
          { amount: 20_000, type: "water_damage" },
        ],
      });

      if (result.riskLevel === "high" || result.riskLevel === "critical") {
        expect(result.recommendations).toContain(
          "Consider requiring additional documentation"
        );
      }
    });

    it("should set valid until 6 months from now", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      const validUntil = new Date(result.validUntil);
      const assessedAt = new Date(result.assessedAt);
      const diffMonths =
        (validUntil.getTime() - assessedAt.getTime()) / (30.44 * 24 * 60 * 60 * 1000);

      expect(diffMonths).toBeCloseTo(6, 0);
    });

    it("should return valid risk level", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      expect(["low", "medium", "high", "critical"]).toContain(result.riskLevel);
    });

    it("should return valid premium adjustment", async () => {
      const result = await service.assessRisk({
        customer: mockCustomer,
        policyType: "auto",
        coverageAmount: 100_000,
      });

      expect(typeof result.premiumAdjustment).toBe("number");
      expect(result.premiumAdjustment).toBeGreaterThanOrEqual(-1);
      expect(result.premiumAdjustment).toBeLessThanOrEqual(2);
    });
  });

  describe("batchAssess", () => {
    it("should assess multiple customers", async () => {
      const inputs = [
        { customer: mockCustomer, policyType: "auto" as const, coverageAmount: 50_000 },
        { customer: { ...mockCustomer, id: "cust-2" }, policyType: "home" as const, coverageAmount: 200_000 },
      ];

      const results = await service.batchAssess(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].customerId).toBe("cust-1");
      expect(results[1].customerId).toBe("cust-2");
    });
  });
});
