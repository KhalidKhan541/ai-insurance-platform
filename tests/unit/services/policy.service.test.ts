import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolicyService } from "@/services/policy.service";

vi.mock("@/config/prisma", () => ({
  prisma: {
    policy: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@/config/prisma";

const mockPrisma = vi.mocked(prisma);

describe("PolicyService", () => {
  let service: PolicyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PolicyService();
  });

  const mockPolicyData = {
    id: "policy-1",
    policyNumber: "POL-TEST-001",
    policyType: "auto",
    status: "pending",
    customerId: "cust-1",
    premium: 1200,
    coverageAmount: 100_000,
    deductible: 1000,
    effectiveDate: new Date("2026-01-01"),
    expirationDate: new Date("2027-01-01"),
    description: "Test auto insurance policy",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  describe("create", () => {
    it("should create a new policy", async () => {
      mockPrisma.policy.create.mockResolvedValue(mockPolicyData);

      const result = await service.create({
        policyType: "auto",
        customerId: "cust-1",
        premium: 1200,
        coverageAmount: 100_000,
        deductible: 1000,
        effectiveDate: "2026-01-01",
        expirationDate: "2027-01-01",
        description: "Test auto insurance policy",
      });

      expect(result.policyType).toBe("auto");
      expect(result.status).toBe("pending");
      expect(mockPrisma.policy.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("getById", () => {
    it("should return policy when found", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(mockPolicyData);

      const result = await service.getById("policy-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("policy-1");
    });

    it("should return null when not found", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);

      const result = await service.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update policy status", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(mockPolicyData);
      mockPrisma.policy.update.mockResolvedValue({
        ...mockPolicyData,
        status: "active",
      });

      const result = await service.update("policy-1", { status: "active" });

      expect(result.status).toBe("active");
    });

    it("should throw for already cancelled policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...mockPolicyData,
        status: "cancelled",
      });

      await expect(
        service.update("policy-1", { status: "cancelled" })
      ).rejects.toThrow("Policy is already cancelled");
    });

    it("should throw for non-existent policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { status: "active" })
      ).rejects.toThrow("Policy not found");
    });
  });

  describe("cancel", () => {
    it("should cancel an active policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...mockPolicyData,
        status: "active",
      });
      mockPrisma.policy.update.mockResolvedValue({
        ...mockPolicyData,
        status: "cancelled",
      });

      const result = await service.cancel("policy-1");

      expect(result.status).toBe("cancelled");
    });
  });

  describe("getPolicyStats", () => {
    it("should return policy statistics", async () => {
      mockPrisma.policy.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10);
      mockPrisma.policy.aggregate.mockResolvedValue({
        _sum: { premium: 96000 },
      });

      const stats = await service.getPolicyStats();

      expect(stats.total).toBe(100);
      expect(stats.active).toBe(80);
      expect(stats.totalPremium).toBe(96000);
    });
  });

  describe("delete", () => {
    it("should delete a non-active policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...mockPolicyData,
        status: "pending",
      });
      mockPrisma.policy.delete.mockResolvedValue(mockPolicyData);

      await service.delete("policy-1");

      expect(mockPrisma.policy.delete).toHaveBeenCalledWith({
        where: { id: "policy-1" },
      });
    });

    it("should throw when deleting active policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...mockPolicyData,
        status: "active",
      });

      await expect(service.delete("policy-1")).rejects.toThrow(
        "Cannot delete an active policy"
      );
    });

    it("should throw for non-existent policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);

      await expect(service.delete("nonexistent")).rejects.toThrow(
        "Policy not found"
      );
    });
  });
});
