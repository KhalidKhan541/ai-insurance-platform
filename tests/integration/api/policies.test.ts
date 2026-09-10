import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/policies/route";

vi.mock("@/services/policy.service", () => ({
  policyService: {
    query: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "admin" },
  }),
}));

import { policyService } from "@/services/policy.service";

const mockPolicyService = vi.mocked(policyService);

describe("Policies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/policies", () => {
    it("should return paginated policies", async () => {
      mockPolicyService.query.mockResolvedValue({
        data: [
          {
            id: "policy-1",
            policyNumber: "POL-001",
            policyType: "auto",
            status: "active",
            customerId: "cust-1",
            premium: 1200,
            coverageAmount: 100_000,
            deductible: 1000,
            effectiveDate: "2026-01-01T00:00:00.000Z",
            expirationDate: "2027-01-01T00:00:00.000Z",
            description: "Test policy",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const request = new NextRequest("http://localhost/api/policies?page=1&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    it("should handle query errors", async () => {
      mockPolicyService.query.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/policies");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it("should filter by status", async () => {
      mockPolicyService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/policies?status=active"
      );
      await GET(request);

      expect(mockPolicyService.query).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" })
      );
    });
  });

  describe("POST /api/policies", () => {
    it("should create a policy", async () => {
      mockPolicyService.create.mockResolvedValue({
        id: "new-policy",
        policyNumber: "POL-NEW-001",
        policyType: "auto",
        status: "pending",
        customerId: "cust-1",
        premium: 1200,
        coverageAmount: 100_000,
        deductible: 1000,
        effectiveDate: "2026-06-01T00:00:00.000Z",
        expirationDate: "2027-06-01T00:00:00.000Z",
        description: "New comprehensive auto policy",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      });

      const body = {
        policyType: "auto",
        customerId: "cust-1",
        premium: 1200,
        coverageAmount: 100_000,
        deductible: 1000,
        effectiveDate: "2026-06-01",
        expirationDate: "2027-06-01",
        description: "New comprehensive auto policy",
      };

      const request = new NextRequest("http://localhost/api/policies", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.policyType).toBe("auto");
    });

    it("should return 400 for invalid data", async () => {
      const body = {
        policyType: "invalid",
        premium: -100,
      };

      const request = new NextRequest("http://localhost/api/policies", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 401 for unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost/api/policies", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });
});
