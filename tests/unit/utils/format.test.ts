import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPolicyNumber,
  formatClaimNumber,
  formatSSN,
  formatPhone,
  formatAddress,
  formatFileSize,
  truncate,
  capitalizeFirst,
  formatStatus,
  formatCurrencyAbbreviated,
  getInitials,
  generateAvatarColor,
} from "@/lib/utils/format";

describe("Format Utils", () => {
  describe("formatCurrency", () => {
    it("should format USD correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("should format zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should format negative amounts", () => {
      expect(formatCurrency(-500.5)).toBe("$-500.50");
    });

    it("should format large numbers", () => {
      expect(formatCurrency(1_000_000)).toBe("$1,000,000.00");
    });

    it("should format with cents", () => {
      expect(formatCurrency(100.99)).toBe("$100.99");
    });

    it("should round to two decimals", () => {
      expect(formatCurrency(100.999)).toBe("$101.00");
    });
  });

  describe("formatNumber", () => {
    it("should add commas", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should format small numbers", () => {
      expect(formatNumber(42)).toBe("42");
    });
  });

  describe("formatPercentage", () => {
    it("should format with default decimals", () => {
      expect(formatPercentage(25.456)).toBe("25.5%");
    });

    it("should format with custom decimals", () => {
      expect(formatPercentage(25.456, 2)).toBe("25.46%");
    });

    it("should format zero", () => {
      expect(formatPercentage(0)).toBe("0.0%");
    });
  });

  describe("formatDate", () => {
    it("should format valid date string", () => {
      const result = formatDate("2026-06-15");
      expect(result).toBe("Jun 15, 2026");
    });

    it("should format with custom pattern", () => {
      const result = formatDate("2026-06-15", "yyyy-MM-dd");
      expect(result).toBe("2026-06-15");
    });

    it("should return Invalid date for bad input", () => {
      expect(formatDate("not-a-date")).toBe("Invalid date");
    });
  });

  describe("formatDateTime", () => {
    it("should format with time", () => {
      const result = formatDateTime("2026-06-15T14:30:00Z");
      expect(result).toContain("Jun 15, 2026");
    });
  });

  describe("formatRelativeTime", () => {
    it("should return relative time string", () => {
      const result = formatRelativeTime(new Date().toISOString());
      expect(result).toContain("ago");
    });
  });

  describe("formatPolicyNumber", () => {
    it("should format policy number with dashes", () => {
      expect(formatPolicyNumber("POL20260001")).toBe("POL-2026-0001");
    });

    it("should handle short numbers", () => {
      expect(formatPolicyNumber("POL1")).toBe("POL1");
    });

    it("should uppercase input", () => {
      expect(formatPolicyNumber("pol20260001")).toBe("POL-2026-0001");
    });
  });

  describe("formatClaimNumber", () => {
    it("should format claim number", () => {
      expect(formatClaimNumber("CLM20260001")).toBe("CLM-2026-0001");
    });

    it("should handle short numbers", () => {
      expect(formatClaimNumber("1234")).toBe("1234");
    });
  });

  describe("formatSSN", () => {
    it("should mask SSN with last 4 visible", () => {
      expect(formatSSN("1234")).toBe("***-**-1234");
    });

    it("should mask invalid SSN", () => {
      expect(formatSSN("12")).toBe("****");
    });
  });

  describe("formatPhone", () => {
    it("should format 10-digit phone", () => {
      expect(formatPhone("5551234567")).toBe("(555) 123-4567");
    });

    it("should format 11-digit phone with country code", () => {
      expect(formatPhone("15551234567")).toBe("+1 (555) 123-4567");
    });

    it("should return original for unknown format", () => {
      expect(formatPhone("123")).toBe("123");
    });
  });

  describe("formatAddress", () => {
    it("should format full address", () => {
      const address = {
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zipCode: "62704",
      };
      expect(formatAddress(address)).toBe("123 Main St, Springfield, IL 62704");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format partial sizes", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });
  });

  describe("truncate", () => {
    it("should not truncate short strings", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("should truncate long strings", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("should handle exact length", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });
  });

  describe("capitalizeFirst", () => {
    it("should capitalize first letter", () => {
      expect(capitalizeFirst("hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalizeFirst("")).toBe("");
    });

    it("should lowercase rest", () => {
      expect(capitalizeFirst("hELLO")).toBe("Hello");
    });
  });

  describe("formatStatus", () => {
    it("should format snake_case status", () => {
      expect(formatStatus("under_review")).toBe("Under Review");
    });

    it("should format single word", () => {
      expect(formatStatus("active")).toBe("Active");
    });

    it("should handle all caps", () => {
      expect(formatStatus("PENDING")).toBe("Pending");
    });
  });

  describe("formatCurrencyAbbreviated", () => {
    it("should format millions", () => {
      expect(formatCurrencyAbbreviated(1_500_000)).toBe("$1.5M");
    });

    it("should format thousands", () => {
      expect(formatCurrencyAbbreviated(2500)).toBe("$2.5K");
    });

    it("should format small amounts normally", () => {
      expect(formatCurrencyAbbreviated(500)).toBe("$500.00");
    });
  });

  describe("getInitials", () => {
    it("should return initials", () => {
      expect(getInitials("John", "Doe")).toBe("JD");
    });

    it("should handle single character names", () => {
      expect(getInitials("J", "D")).toBe("JD");
    });
  });

  describe("generateAvatarColor", () => {
    it("should return a hex color", () => {
      const color = generateAvatarColor("John Doe");
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should return consistent color for same name", () => {
      const color1 = generateAvatarColor("Test User");
      const color2 = generateAvatarColor("Test User");
      expect(color1).toBe(color2);
    });

    it("should return different colors for different names", () => {
      const color1 = generateAvatarColor("Alice");
      const color2 = generateAvatarColor("Bob");
      expect(color1).not.toBe(color2);
    });
  });
});
