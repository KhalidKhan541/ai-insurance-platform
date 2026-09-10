import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomerService } from "@/services/customer.service";

vi.mock("@/config/prisma", () => ({
  prisma: {
    customer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/config/prisma";

const mockPrisma = vi.mocked(prisma);

describe("CustomerService", () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerService();
  });

  const mockCustomerData = {
    id: "cust-1",
    customerNumber: "CUST-001",
    type: "individual",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+15551234567",
    street: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    country: "US",
    dateOfBirth: new Date("1990-05-15"),
    ssnLast4: "1234",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  describe("create", () => {
    it("should create an individual customer", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue(mockCustomerData);

      const result = await service.create({
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
        ssnLast4: "1234",
      });

      expect(result.email).toBe("john@example.com");
      expect(result.customerNumber).toBeDefined();
    });

    it("should create a business customer", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({
        ...mockCustomerData,
        type: "business",
        firstName: "Acme Corp",
        companyName: "Acme Corp",
      });

      const result = await service.create({
        type: "business",
        companyName: "Acme Corp",
        email: "info@acme.com",
        address: {
          street: "456 Business Ave",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US",
        },
      });

      expect(result.type).toBe("business");
    });

    it("should throw for duplicate email", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomerData);

      await expect(
        service.create({
          type: "individual",
          firstName: "Jane",
          lastName: "Smith",
          email: "john@example.com",
          address: {
            street: "789 Oak St",
            city: "Portland",
            state: "OR",
            zipCode: "97201",
            country: "US",
          },
        })
      ).rejects.toThrow("A customer with this email already exists");
    });
  });

  describe("getById", () => {
    it("should return customer when found", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockCustomerData,
        policies: [],
        claims: [],
      });

      const result = await service.getById("cust-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("cust-1");
    });

    it("should return null when not found", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const result = await service.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update customer info", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomerData);
      mockPrisma.customer.update.mockResolvedValue({
        ...mockCustomerData,
        firstName: "Jane",
      });

      const result = await service.update("cust-1", { firstName: "Jane" });

      expect(result.firstName).toBe("Jane");
    });

    it("should throw for non-existent customer", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { firstName: "Jane" })
      ).rejects.toThrow("Customer not found");
    });

    it("should throw for duplicate email", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomerData);
      mockPrisma.customer.findFirst.mockResolvedValue({
        ...mockCustomerData,
        id: "other-cust",
      });

      await expect(
        service.update("cust-1", { email: "taken@example.com" })
      ).rejects.toThrow("Email is already taken by another customer");
    });
  });

  describe("delete", () => {
    it("should delete customer without active policies", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockCustomerData,
        policies: [{ status: "cancelled" }],
      });
      mockPrisma.customer.delete.mockResolvedValue(mockCustomerData);

      await service.delete("cust-1");

      expect(mockPrisma.customer.delete).toHaveBeenCalled();
    });

    it("should throw for customer with active policies", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockCustomerData,
        policies: [{ status: "active" }],
      });

      await expect(service.delete("cust-1")).rejects.toThrow(
        "Cannot delete customer with active policies"
      );
    });

    it("should throw for non-existent customer", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.delete("nonexistent")).rejects.toThrow(
        "Customer not found"
      );
    });
  });

  describe("getCustomerStats", () => {
    it("should return customer statistics", async () => {
      mockPrisma.customer.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(25);

      const stats = await service.getCustomerStats();

      expect(stats.total).toBe(200);
      expect(stats.individual).toBe(150);
      expect(stats.business).toBe(50);
      expect(stats.newThisMonth).toBe(25);
    });
  });

  describe("search", () => {
    it("should search customers by name", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomerData]);

      const results = await service.search("John");

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe("John");
    });

    it("should return empty array for no matches", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const results = await service.search("nonexistent");

      expect(results).toHaveLength(0);
    });
  });
});
