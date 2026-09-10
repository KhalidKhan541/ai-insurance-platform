import { describe, it, expect, vi } from "vitest";
import {
  generateId,
  generatePolicyNumber,
  generateClaimNumber,
  generateCustomerNumber,
  debounce,
  throttle,
  chunk,
  unique,
  groupBy,
  sortBy,
  deepClone,
  isEmpty,
  pick,
  omit,
  capitalize,
  camelToSnake,
  snakeToCamel,
  isValidEmail,
  isValidUUID,
} from "@/lib/utils/helpers";

describe("Helpers Utils", () => {
  describe("generateId", () => {
    it("should generate a UUID v4", () => {
      const id = generateId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe("generatePolicyNumber", () => {
    it("should start with POL prefix", () => {
      const num = generatePolicyNumber();
      expect(num).toMatch(/^POL-/);
    });

    it("should have consistent format", () => {
      const num = generatePolicyNumber();
      const parts = num.split("-");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("POL");
    });
  });

  describe("generateClaimNumber", () => {
    it("should start with CLM prefix", () => {
      const num = generateClaimNumber();
      expect(num).toMatch(/^CLM-/);
    });
  });

  describe("generateCustomerNumber", () => {
    it("should start with CUST prefix", () => {
      const num = generateCustomerNumber();
      expect(num).toMatch(/^CUST-/);
    });
  });

  describe("debounce", () => {
    it("should debounce function calls", async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("throttle", () => {
    it("should throttle function calls", () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe("chunk", () => {
    it("should chunk array correctly", () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should handle exact division", () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it("should handle single element chunks", () => {
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it("should throw for zero size", () => {
      expect(() => chunk([1, 2], 0)).toThrow("Chunk size must be positive");
    });

    it("should handle empty array", () => {
      expect(chunk([], 3)).toEqual([]);
    });
  });

  describe("unique", () => {
    it("should remove duplicates", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it("should handle empty array", () => {
      expect(unique([])).toEqual([]);
    });

    it("should work with strings", () => {
      expect(unique(["a", "b", "a"])).toEqual(["a", "b"]);
    });
  });

  describe("groupBy", () => {
    it("should group by key", () => {
      const data = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ];
      const result = groupBy(data, "type");
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });
  });

  describe("sortBy", () => {
    it("should sort ascending", () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      expect(sortBy(data, "val", "asc")).toEqual([
        { val: 1 },
        { val: 2 },
        { val: 3 },
      ]);
    });

    it("should sort descending", () => {
      const data = [{ val: 1 }, { val: 3 }, { val: 2 }];
      expect(sortBy(data, "val", "desc")).toEqual([
        { val: 3 },
        { val: 2 },
        { val: 1 },
      ]);
    });
  });

  describe("deepClone", () => {
    it("should deep clone objects", () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);
      cloned.a.b.c = 2;
      expect(original.a.b.c).toBe(1);
    });
  });

  describe("isEmpty", () => {
    it("should return true for null", () => {
      expect(isEmpty(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(isEmpty("")).toBe(true);
    });

    it("should return true for empty array", () => {
      expect(isEmpty([])).toBe(true);
    });

    it("should return true for empty object", () => {
      expect(isEmpty({})).toBe(true);
    });

    it("should return false for non-empty values", () => {
      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
    });
  });

  describe("pick", () => {
    it("should pick specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });

    it("should ignore missing keys", () => {
      const obj = { a: 1 };
      expect(pick(obj, ["a", "b" as keyof typeof obj])).toEqual({ a: 1 });
    });
  });

  describe("omit", () => {
    it("should omit specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("should lowercase rest", () => {
      expect(capitalize("hELLO")).toBe("Hello");
    });
  });

  describe("camelToSnake", () => {
    it("should convert camelCase to snake_case", () => {
      expect(camelToSnake("helloWorld")).toBe("hello_world");
      expect(camelToSnake("policyNumber")).toBe("policy_number");
    });
  });

  describe("snakeToCamel", () => {
    it("should convert snake_case to camelCase", () => {
      expect(snakeToCamel("hello_world")).toBe("helloWorld");
      expect(snakeToCamel("policy_number")).toBe("policyNumber");
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidUUID", () => {
    it("should validate correct UUIDs", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUUID("not-a-uuid")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
    });
  });
});
