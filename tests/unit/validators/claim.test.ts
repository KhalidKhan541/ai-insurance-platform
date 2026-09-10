import { describe, it, expect } from "vitest";
import {
  createClaimSchema,
  updateClaimStatusSchema,
  claimQuerySchema,
} from "@/lib/validators/claim";

describe("Claim Validators", () => {
  describe("createClaimSchema", () => {
    const validClaim = {
      policyId: "550e8400-e29b-41d4-a716-446655440000",
      type: "auto_accident" as const,
      description: "Vehicle collision occurred at intersection during morning commute hours",
      amount: 5000,
      incidentDate: "2026-08-15",
      incidentLocation: "123 Main St, Springfield, IL",
    };

    it("should accept valid claim data", () => {
      const result = createClaimSchema.safeParse(validClaim);
      expect(result.success).toBe(true);
    });

    it("should accept all valid claim types", () => {
      const types = [
        "property_damage", "auto_accident", "theft", "natural_disaster",
        "medical", "liability", "water_damage", "fire_damage",
        "personal_injury", "other",
      ];
      for (const type of types) {
        const result = createClaimSchema.safeParse({
          ...validClaim,
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid claim type", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        type: "alien_invasion",
      });
      expect(result.success).toBe(false);
    });

    it("should reject description shorter than 20 characters", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        description: "Too short",
      });
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 2000 characters", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        description: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero claim amount", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject claim amount exceeding maximum", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        amount: 10_000_001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject future incident date", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        incidentDate: "2099-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("should accept claim with witnesses", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        witnesses: [
          {
            name: "John Smith",
            phone: "5551234567",
            statement: "Saw the accident happen",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject more than 10 witnesses", () => {
      const witnesses = Array.from({ length: 11 }, (_, i) => ({
        name: `Witness ${i}`,
        phone: "5551234567",
      }));
      const result = createClaimSchema.safeParse({
        ...validClaim,
        witnesses,
      });
      expect(result.success).toBe(false);
    });

    it("should accept claim with documents", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        documents: [
          {
            fileName: "police_report.pdf",
            fileType: "pdf" as const,
            fileSize: 1024 * 1024,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject document file size exceeding 10MB", () => {
      const result = createClaimSchema.safeParse({
        ...validClaim,
        documents: [
          {
            fileName: "huge_file.pdf",
            fileType: "pdf" as const,
            fileSize: 10 * 1024 * 1024 + 1,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject more than 20 documents", () => {
      const documents = Array.from({ length: 21 }, (_, i) => ({
        fileName: `doc_${i}.pdf`,
        fileType: "pdf" as const,
        fileSize: 1024,
      }));
      const result = createClaimSchema.safeParse({
        ...validClaim,
        documents,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateClaimStatusSchema", () => {
    it("should accept approval with amount", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "approved",
        approvedAmount: 4500,
        notes: "Claim approved after adjuster review and documentation verification",
      });
      expect(result.success).toBe(true);
    });

    it("should reject approval without amount", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "approved",
      });
      expect(result.success).toBe(false);
    });

    it("should accept denial", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "denied",
        notes: "Insufficient documentation provided for claim approval",
      });
      expect(result.success).toBe(true);
    });

    it("should accept pending status", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "pending",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "maybe",
      });
      expect(result.success).toBe(false);
    });

    it("should reject approval with zero amount", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "approved",
        approvedAmount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject notes shorter than 10 characters", () => {
      const result = updateClaimStatusSchema.safeParse({
        status: "denied",
        notes: "Short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("claimQuerySchema", () => {
    it("should apply defaults correctly", () => {
      const result = claimQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe("filedDate");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should accept date range filters", () => {
      const result = claimQuerySchema.safeParse({
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("should accept amount range filters", () => {
      const result = claimQuerySchema.safeParse({
        minAmount: 1000,
        maxAmount: 50000,
      });
      expect(result.success).toBe(true);
    });
  });
});
