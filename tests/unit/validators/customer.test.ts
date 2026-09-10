import { describe, it, expect } from "vitest";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from "@/lib/validators/customer";

describe("Customer Validators", () => {
  describe("createCustomerSchema - individual", () => {
    const validIndividual = {
      type: "individual" as const,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+15551234567",
      address: {
        street: "123 Main Street",
        city: "Springfield",
        state: "IL" as const,
        zipCode: "62704",
        country: "US",
      },
      dateOfBirth: "1990-05-15",
      ssnLast4: "1234",
    };

    it("should accept valid individual customer", () => {
      const result = createCustomerSchema.safeParse(validIndividual);
      expect(result.success).toBe(true);
    });

    it("should accept individual without optional fields", () => {
      const result = createCustomerSchema.safeParse({
        type: "individual",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        address: validIndividual.address,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid phone format", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        phone: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject first name with numbers", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        firstName: "John123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid US state", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        address: {
          ...validIndividual.address,
          state: "XX",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid ZIP code", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        address: {
          ...validIndividual.address,
          zipCode: "123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept 9-digit ZIP code", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        address: {
          ...validIndividual.address,
          zipCode: "62704-1234",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject customer under 18", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        dateOfBirth: "2015-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid SSN format", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        ssnLast4: "12",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric SSN", () => {
      const result = createCustomerSchema.safeParse({
        ...validIndividual,
        ssnLast4: "abcd",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createCustomerSchema - business", () => {
    const validBusiness = {
      type: "business" as const,
      companyName: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+15559876543",
      address: {
        street: "456 Business Ave",
        city: "Chicago",
        state: "IL" as const,
        zipCode: "60601",
        country: "US",
      },
      taxId: "12-3456789",
      industry: "Manufacturing",
      employeeCount: 250,
      annualRevenue: 50_000_000,
    };

    it("should accept valid business customer", () => {
      const result = createCustomerSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });

    it("should accept business without optional fields", () => {
      const result = createCustomerSchema.safeParse({
        type: "business",
        companyName: "Tech Startup Inc",
        email: "info@techstartup.com",
        address: validBusiness.address,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty company name", () => {
      const result = createCustomerSchema.safeParse({
        ...validBusiness,
        companyName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid tax ID format", () => {
      const result = createCustomerSchema.safeParse({
        ...validBusiness,
        taxId: "123456789",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative employee count", () => {
      const result = createCustomerSchema.safeParse({
        ...validBusiness,
        employeeCount: -5,
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid tax ID format", () => {
      const result = createCustomerSchema.safeParse({
        ...validBusiness,
        taxId: "98-7654321",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateCustomerSchema", () => {
    it("should accept valid name update", () => {
      const result = updateCustomerSchema.safeParse({
        firstName: "Jane",
        lastName: "Smith",
      });
      expect(result.success).toBe(true);
    });

    it("should accept email update", () => {
      const result = updateCustomerSchema.safeParse({
        email: "new.email@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should accept address update", () => {
      const result = updateCustomerSchema.safeParse({
        address: {
          street: "789 New Street",
          city: "Portland",
          state: "OR",
          zipCode: "97201",
          country: "US",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty update", () => {
      const result = updateCustomerSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid email in update", () => {
      const result = updateCustomerSchema.safeParse({
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("customerQuerySchema", () => {
    it("should apply defaults", () => {
      const result = customerQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe("createdAt");
      }
    });

    it("should accept search query", () => {
      const result = customerQuerySchema.safeParse({
        search: "john",
        type: "individual",
        state: "IL",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid type filter", () => {
      const result = customerQuerySchema.safeParse({
        type: "corporate",
      });
      expect(result.success).toBe(false);
    });

    it("should accept risk level filter", () => {
      const result = customerQuerySchema.safeParse({
        riskLevel: "high",
      });
      expect(result.success).toBe(true);
    });
  });
});
