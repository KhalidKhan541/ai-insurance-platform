import { describe, it, expect } from "vitest";
import {
  createPolicySchema,
  updatePolicySchema,
  policyQuerySchema,
} from "@/lib/validators/policy";

describe("Policy Validators", () => {
  describe("createPolicySchema", () => {
    const validPolicy = {
      policyType: "auto" as const,
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      premium: 1200.5,
      coverageAmount: 100_000,
      deductible: 1000,
      effectiveDate: "2026-12-01",
      expirationDate: "2027-12-01",
      description: "Comprehensive auto insurance policy for sedan vehicle",
    };

    it("should accept valid policy data", () => {
      const result = createPolicySchema.safeParse(validPolicy);
      expect(result.success).toBe(true);
    });

    it("should accept all valid policy types", () => {
      const types = ["auto", "home", "life", "health", "commercial", "travel"];
      for (const type of types) {
        const result = createPolicySchema.safeParse({
          ...validPolicy,
          policyType: type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid policy type", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        policyType: "pet",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid customer ID", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        customerId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero premium", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        premium: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative premium", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        premium: -100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject premium exceeding maximum", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        premium: 1_000_001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject coverage below minimum", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        coverageAmount: 500,
      });
      expect(result.success).toBe(false);
    });

    it("should reject coverage exceeding maximum", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        coverageAmount: 50_000_001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative deductible", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        deductible: -500,
      });
      expect(result.success).toBe(false);
    });

    it("should reject description shorter than 10 characters", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        description: "Short",
      });
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 500 characters", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("should reject past effective date", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        effectiveDate: "2020-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject expiration before effective date", () => {
      const result = createPolicySchema.safeParse({
        ...validPolicy,
        effectiveDate: "2027-01-01",
        expirationDate: "2026-01-01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePolicySchema", () => {
    it("should accept valid status update", () => {
      const result = updatePolicySchema.safeParse({
        status: "active",
      });
      expect(result.success).toBe(true);
    });

    it("should accept premium update", () => {
      const result = updatePolicySchema.safeParse({
        premium: 1500,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all optional fields", () => {
      const result = updatePolicySchema.safeParse({
        status: "active",
        premium: 1500,
        coverageAmount: 200_000,
        deductible: 2000,
        description: "Updated comprehensive policy description",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty update", () => {
      const result = updatePolicySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const result = updatePolicySchema.safeParse({
        status: "invalid_status",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative premium in update", () => {
      const result = updatePolicySchema.safeParse({
        premium: -500,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("policyQuerySchema", () => {
    it("should apply default values", () => {
      const result = policyQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe("createdAt");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should accept valid query parameters", () => {
      const result = policyQuerySchema.safeParse({
        page: 2,
        limit: 20,
        status: "active",
        policyType: "home",
        search: "test",
        sortBy: "premium",
        sortOrder: "asc",
      });
      expect(result.success).toBe(true);
    });

    it("should reject limit exceeding 100", () => {
      const result = policyQuerySchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const result = policyQuerySchema.safeParse({
        page: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
