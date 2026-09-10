import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClaimService } from "@/services/claim.service";

vi.mock("@/config/prisma", () => ({
  prisma: {
    claim: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    policy: {
      findUnique: vi.fn(),
    },
    claimDocument: {
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/config/prisma";

const mockPrisma = vi.mocked(prisma);

describe("ClaimService", () => {
  let service: ClaimService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClaimService();
  });

  const mockPolicy = {
    id: "policy-1",
    policyNumber: "POL-001",
    status: "active",
    customerId: "cust-1",
    coverageAmount: 100_000,
    premium: 1200,
  };

  const mockClaimData = {
    id: "claim-1",
    claimNumber: "CLM-001",
    policyId: "policy-1",
    customerId: "cust-1",
    status: "pending",
    type: "auto_accident",
    description: "Vehicle collision at intersection",
    amount: 5000,
    approvedAmount: null,
    filedDate: new Date("2026-08-15"),
    resolvedDate: null,
    adjusterId: null,
    incidentDate: new Date("2026-08-14"),
    incidentLocation: "123 Main St",
    createdAt: new Date("2026-08-15"),
    updatedAt: new Date("2026-08-15"),
    documents: [],
  };

  describe("create", () => {
    it("should create a new claim", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(mockPolicy);
      mockPrisma.claim.create.mockResolvedValue(mockClaimData);

      const result = await service.create(
        {
          policyId: "policy-1",
          type: "auto_accident",
          description: "Vehicle collision at intersection during commute",
          amount: 5000,
          incidentDate: "2026-08-14",
        },
        "cust-1"
      );

      expect(result.claimNumber).toBeDefined();
      expect(result.status).toBe("pending");
    });

    it("should throw for non-existent policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            policyId: "nonexistent",
            type: "auto_accident",
            description: "Test claim description for testing",
            amount: 5000,
            incidentDate: "2026-08-14",
          },
          "cust-1"
        )
      ).rejects.toThrow("Policy not found");
    });

    it("should throw for inactive policy", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...mockPolicy,
        status: "cancelled",
      });

      await expect(
        service.create(
          {
            policyId: "policy-1",
            type: "auto_accident",
            description: "Test claim description for testing",
            amount: 5000,
            incidentDate: "2026-08-14",
          },
          "cust-1"
        )
      ).rejects.toThrow("Policy is not active");
    });

    it("should throw for wrong customer", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(mockPolicy);

      await expect(
        service.create(
          {
            policyId: "policy-1",
            type: "auto_accident",
            description: "Test claim description for testing",
            amount: 5000,
            incidentDate: "2026-08-14",
          },
          "wrong-customer"
        )
      ).rejects.toThrow("Policy does not belong to this customer");
    });

    it("should throw when amount exceeds coverage", async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(mockPolicy);

      await expect(
        service.create(
          {
            policyId: "policy-1",
            type: "auto_accident",
            description: "Test claim description for testing",
            amount: 200_000,
            incidentDate: "2026-08-14",
          },
          "cust-1"
        )
      ).rejects.toThrow("Claim amount exceeds policy coverage");
    });
  });

  describe("approve", () => {
    it("should approve a claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaimData);
      mockPrisma.claim.update.mockResolvedValue({
        ...mockClaimData,
        status: "approved",
        approvedAmount: 4500,
      });

      const result = await service.approve("claim-1", 4500, "adjuster-1");

      expect(result.status).toBe("approved");
      expect(result.approvedAmount).toBe(4500);
    });

    it("should throw when approved amount exceeds claim amount", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaimData);

      await expect(
        service.approve("claim-1", 10000, "adjuster-1")
      ).rejects.toThrow("Approved amount cannot exceed claim amount");
    });

    it("should throw for paid claims", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue({
        ...mockClaimData,
        status: "paid",
      });

      await expect(
        service.approve("claim-1", 4500, "adjuster-1")
      ).rejects.toThrow("Cannot update a paid claim");
    });
  });

  describe("deny", () => {
    it("should deny a claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaimData);
      mockPrisma.claim.update.mockResolvedValue({
        ...mockClaimData,
        status: "denied",
      });

      const result = await service.deny(
        "claim-1",
        "adjuster-1",
        "Insufficient documentation provided for claim"
      );

      expect(result.status).toBe("denied");
    });

    it("should throw for short denial reason", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaimData);

      await expect(
        service.deny("claim-1", "adjuster-1", "Short")
      ).rejects.toThrow("Denial reason must be at least 10 characters");
    });
  });

  describe("getClaimStats", () => {
    it("should return claim statistics", async () => {
      mockPrisma.claim.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(10);
      mockPrisma.claim.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 250_000 } })
        .mockResolvedValueOnce({ _sum: { approvedAmount: 200_000 } });

      const stats = await service.getClaimStats();

      expect(stats.total).toBe(50);
      expect(stats.pending).toBe(10);
      expect(stats.totalAmount).toBe(250_000);
    });
  });
});
