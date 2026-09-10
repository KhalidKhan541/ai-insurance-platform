import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/claims/route";

vi.mock("@/services/claim.service", () => ({
  claimService: {
    query: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "admin" },
  }),
}));

import { claimService } from "@/services/claim.service";

const mockClaimService = vi.mocked(claimService);

describe("Claims API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/claims", () => {
    it("should return paginated claims", async () => {
      mockClaimService.query.mockResolvedValue({
        data: [
          {
            id: "claim-1",
            claimNumber: "CLM-001",
            policyId: "policy-1",
            customerId: "cust-1",
            status: "pending",
            type: "auto_accident",
            description: "Vehicle collision at intersection during morning commute",
            amount: 5000,
            filedDate: "2026-08-15T00:00:00.000Z",
            documents: [],
            createdAt: "2026-08-15T00:00:00.000Z",
            updatedAt: "2026-08-15T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const request = new NextRequest("http://localhost/api/claims?page=1&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it("should filter by status", async () => {
      mockClaimService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/claims?status=pending"
      );
      await GET(request);

      expect(mockClaimService.query).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" })
      );
    });

    it("should filter by type", async () => {
      mockClaimService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/claims?type=auto_accident"
      );
      await GET(request);

      expect(mockClaimService.query).toHaveBeenCalledWith(
        expect.objectContaining({ type: "auto_accident" })
      );
    });

    it("should handle amount range filters", async () => {
      mockClaimService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/claims?minAmount=1000&maxAmount=50000"
      );
      await GET(request);

      expect(mockClaimService.query).toHaveBeenCalledWith(
        expect.objectContaining({ minAmount: 1000, maxAmount: 50000 })
      );
    });
  });

  describe("POST /api/claims", () => {
    it("should create a claim", async () => {
      mockClaimService.create.mockResolvedValue({
        id: "new-claim",
        claimNumber: "CLM-NEW-001",
        policyId: "policy-1",
        customerId: "cust-1",
        status: "pending",
        type: "auto_accident",
        description: "Vehicle collision at intersection during morning commute",
        amount: 5000,
        filedDate: "2026-08-15T00:00:00.000Z",
        documents: [],
        createdAt: "2026-08-15T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
      });

      const body = {
        policyId: "policy-1",
        type: "auto_accident",
        description: "Vehicle collision at intersection during morning commute",
        amount: 5000,
        incidentDate: "2026-08-14",
      };

      const request = new NextRequest("http://localhost/api/claims", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.claimNumber).toBeDefined();
    });

    it("should return 400 for invalid claim data", async () => {
      const body = {
        policyId: "invalid",
        type: "alien_invasion",
        description: "short",
        amount: -100,
      };

      const request = new NextRequest("http://localhost/api/claims", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount exceeds coverage", async () => {
      mockClaimService.create.mockRejectedValue(
        new Error("Claim amount exceeds policy coverage")
      );

      const body = {
        policyId: "policy-1",
        type: "auto_accident",
        description: "Vehicle collision at intersection during morning commute",
        amount: 200_000,
        incidentDate: "2026-08-14",
      };

      const request = new NextRequest("http://localhost/api/claims", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
