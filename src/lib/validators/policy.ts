import { z } from "zod";

const policyTypes = ["auto", "home", "life", "health", "commercial", "travel"] as const;
const policyStatuses = ["active", "pending", "inactive", "cancelled", "expired"] as const;

export const createPolicySchema = z.object({
  policyType: z.enum(policyTypes, {
    errorMap: () => ({ message: "Invalid policy type" }),
  }),
  customerId: z.string().uuid("Invalid customer ID"),
  premium: z
    .number()
    .positive("Premium must be positive")
    .min(0.01, "Premium must be at least $0.01")
    .max(1_000_000, "Premium cannot exceed $1,000,000"),
  coverageAmount: z
    .number()
    .positive("Coverage amount must be positive")
    .min(1000, "Minimum coverage is $1,000")
    .max(50_000_000, "Maximum coverage is $50,000,000"),
  deductible: z
    .number()
    .min(0, "Deductible cannot be negative")
    .max(100_000, "Maximum deductible is $100,000"),
  effectiveDate: z.string().refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }, "Effective date must be today or in the future"),
  expirationDate: z.string(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
}).refine(
  (data) => {
    const effective = new Date(data.effectiveDate);
    const expiration = new Date(data.expirationDate);
    return expiration > effective;
  },
  {
    message: "Expiration date must be after effective date",
    path: ["expirationDate"],
  }
).refine(
  (data) => {
    const effective = new Date(data.effectiveDate);
    const expiration = new Date(data.expirationDate);
    const diffYears =
      (expiration.getTime() - effective.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return diffYears <= 5;
  },
  {
    message: "Policy term cannot exceed 5 years",
    path: ["expirationDate"],
  }
);

export const updatePolicySchema = z.object({
  status: z.enum(policyStatuses).optional(),
  premium: z
    .number()
    .positive("Premium must be positive")
    .min(0.01, "Premium must be at least $0.01")
    .max(1_000_000, "Premium cannot exceed $1,000,000")
    .optional(),
  coverageAmount: z
    .number()
    .positive("Coverage amount must be positive")
    .min(1000, "Minimum coverage is $1,000")
    .max(50_000_000, "Maximum coverage is $50,000,000")
    .optional(),
  deductible: z
    .number()
    .min(0, "Deductible cannot be negative")
    .max(100_000, "Maximum deductible is $100,000")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const policyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(policyStatuses).optional(),
  policyType: z.enum(policyTypes).optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["createdAt", "premium", "coverageAmount", "effectiveDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type PolicyQueryInput = z.infer<typeof policyQuerySchema>;
