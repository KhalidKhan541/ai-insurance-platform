import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "AGENT", "CUSTOMER", "UNDERWRITER", "CLAIMS_ADJUSTER"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const policySchema = z.object({
  policyNumber: z.string().optional(),
  type: z.enum(["AUTO", "HOME", "HEALTH", "LIFE", "BUSINESS", "CYBER", "UMBRELLA"]),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"]).default("DRAFT"),
  customerId: z.string().cuid(),
  productId: z.string().cuid(),
  agentId: z.string().cuid().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  premium: z.number().positive(),
  coverageAmount: z.number().positive(),
  deductible: z.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  metadata: z.record(z.unknown()).optional(),
});

export const policyUpdateSchema = policySchema.partial();

export const claimSchema = z.object({
  policyId: z.string().cuid(),
  type: z.enum([
    "COLLISION", "COMPREHENSIVE", "LIABILITY", "PROPERTY_DAMAGE",
    "PERSONAL_INJURY", "THEFT", "FIRE", "FLOOD", "MEDICAL", "DISABILITY",
    "DEATH", "CYBER_BREACH", "BUSINESS INTERRUPTION", "OTHER",
  ]),
  description: z.string().min(10).max(5000),
  incidentDate: z.string().datetime().or(z.date()),
  incidentLocation: z.string().optional(),
  estimatedAmount: z.number().positive(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  documents: z.array(z.string()).optional(),
});

export const claimStatusSchema = z.object({
  status: z.enum([
    "SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "ADJUSTER_ASSIGNED",
    "PENDING_DOCUMENTS", "APPROVED", "PARTIALLY_APPROVED", "DENIED",
    "APPEALED", "SETTLED", "CLOSED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  approvedAmount: z.number().positive().optional(),
});

export const quoteSchema = z.object({
  type: z.enum(["AUTO", "HOME", "HEALTH", "LIFE", "BUSINESS", "CYBER", "UMBRELLA"]),
  productId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  coverageAmount: z.number().positive(),
  deductible: z.number().min(0).default(0),
  startDate: z.string().datetime().or(z.date()),
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().datetime().or(z.date()),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default("US"),
    }).optional(),
  }),
  riskFactors: z.record(z.unknown()).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  type: z.enum(["AUTO", "HOME", "HEALTH", "LIFE", "BUSINESS", "CYBER", "UMBRELLA"]),
  basePremium: z.number().positive(),
  minCoverage: z.number().positive(),
  maxCoverage: z.number().positive(),
  deductibleOptions: z.array(z.number().min(0)),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const customerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().or(z.date()).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default("US"),
  }).optional(),
  riskProfile: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).default("MEDIUM"),
  metadata: z.record(z.unknown()).optional(),
});

export const agentSchema = z.object({
  userId: z.string().cuid(),
  licenseNumber: z.string().min(1),
  agencyName: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  commissionRate: z.number().min(0).max(100).default(10),
  territory: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const documentSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "POLICY", "CLAIM", "QUOTE", "IDENTITY", "MEDICAL", "FINANCIAL",
    "LEGAL", "CORRESPONDENCE", "REPORT", "OTHER",
  ]),
  entityId: z.string().cuid().optional(),
  entityType: z.enum(["POLICY", "CLAIM", "QUOTE", "CUSTOMER"]).optional(),
  url: z.string().url().optional(),
  fileContent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const paymentSchema = z.object({
  policyId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.enum(["CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "ACH", "CHECK", "CASH"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const communicationSchema = z.object({
  recipientId: z.string().cuid(),
  recipientType: z.enum(["CUSTOMER", "AGENT", "ADMIN"]),
  type: z.enum(["EMAIL", "SMS", "PUSH", "IN_APP", "LETTER"]),
  subject: z.string().optional(),
  body: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  metadata: z.record(z.unknown()).optional(),
});

export const fraudRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ruleType: z.enum(["AMOUNT_THRESHOLD", "FREQUENCY", "PATTERN", "VELOCITY", "CUSTOM"]),
  condition: z.record(z.unknown()),
  action: z.enum(["FLAG", "BLOCK", "ALERT", "REVIEW"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  isActive: z.boolean().default(true),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export function parseQueryParams(searchParams: URLSearchParams) {
  return paginationSchema.parse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
    sortBy: searchParams.get("sortBy"),
    sortOrder: searchParams.get("sortOrder"),
    search: searchParams.get("search"),
  });
}
