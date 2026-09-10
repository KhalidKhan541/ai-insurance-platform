import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/customers/route";

vi.mock("@/services/customer.service", () => ({
  customerService: {
    query: vi.fn(),
    create: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "admin" },
  }),
}));

import { customerService } from "@/services/customer.service";

const mockCustomerService = vi.mocked(customerService);

describe("Customers API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/customers", () => {
    it("should return paginated customers", async () => {
      mockCustomerService.query.mockResolvedValue({
        data: [
          {
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
            totalPolicies: 2,
            totalClaims: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const request = new NextRequest(
        "http://localhost/api/customers?page=1&limit=10"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it("should handle search queries", async () => {
      mockCustomerService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/customers?search=john"
      );
      await GET(request);

      expect(mockCustomerService.query).toHaveBeenCalledWith(
        expect.objectContaining({ search: "john" })
      );
    });

    it("should filter by customer type", async () => {
      mockCustomerService.query.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const request = new NextRequest(
        "http://localhost/api/customers?type=business"
      );
      await GET(request);

      expect(mockCustomerService.query).toHaveBeenCalledWith(
        expect.objectContaining({ type: "business" })
      );
    });
  });

  describe("POST /api/customers", () => {
    it("should create an individual customer", async () => {
      mockCustomerService.create.mockResolvedValue({
        id: "new-cust",
        customerNumber: "CUST-NEW-001",
        type: "individual",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+15559876543",
        address: {
          street: "456 Oak Ave",
          city: "Portland",
          state: "OR",
          zipCode: "97201",
          country: "US",
        },
        totalPolicies: 0,
        totalClaims: 0,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      });

      const body = {
        type: "individual",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+15559876543",
        address: {
          street: "456 Oak Ave",
          city: "Portland",
          state: "OR",
          zipCode: "97201",
          country: "US",
        },
      };

      const request = new NextRequest("http://localhost/api/customers", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.type).toBe("individual");
    });

    it("should create a business customer", async () => {
      mockCustomerService.create.mockResolvedValue({
        id: "new-business",
        customerNumber: "CUST-BIZ-001",
        type: "business",
        firstName: "Acme Corp",
        lastName: "",
        email: "info@acme.com",
        phone: "+15551112222",
        companyName: "Acme Corp",
        address: {
          street: "789 Business Blvd",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US",
        },
        totalPolicies: 0,
        totalClaims: 0,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      });

      const body = {
        type: "business",
        companyName: "Acme Corp",
        email: "info@acme.com",
        address: {
          street: "789 Business Blvd",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US",
        },
      };

      const request = new NextRequest("http://localhost/api/customers", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("should return 400 for invalid customer data", async () => {
      const body = {
        type: "invalid",
        email: "not-an-email",
      };

      const request = new NextRequest("http://localhost/api/customers", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 409 for duplicate email", async () => {
      mockCustomerService.create.mockRejectedValue(
        new Error("A customer with this email already exists")
      );

      const body = {
        type: "individual",
        firstName: "Duplicate",
        lastName: "User",
        email: "existing@example.com",
        address: {
          street: "123 Test St",
          city: "Testville",
          state: "IL",
          zipCode: "62701",
          country: "US",
        },
      };

      const request = new NextRequest("http://localhost/api/customers", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(409);
    });
  });
});
