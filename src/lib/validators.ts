import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  confirmPassword: z.string(),
  role: z.enum(["CUSTOMER", "AGENT"]).default("CUSTOMER"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  image: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const createPolicySchema = z.object({
  policyTypeId: z.string().min(1, "Policy type is required"),
  customerId: z.string().min(1, "Customer is required"),
  agentId: z.string().optional(),
  insurerId: z.string().min(1, "Insurer is required"),
  effectiveDate: z.string().datetime().or(z.date()),
  expirationDate: z.string().datetime().or(z.date()),
  totalPremium: z.number().positive("Premium must be positive"),
  currency: z.string().default("USD"),
  isAutoRenew: z.boolean().default(false),
  description: z.string().optional(),
  terms: z.string().optional(),
  coverageIds: z.array(z.string()).min(1, "At least one coverage is required"),
});

export const updatePolicySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING_APPROVAL",
      "ACTIVE",
      "SUSPENDED",
      "EXPIRED",
      "CANCELLED",
      "RENEWED",
      "UNDER_REVIEW",
    ])
    .optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional(),
  expirationDate: z.string().datetime().or(z.date()).optional(),
  totalPremium: z.number().positive().optional(),
  isAutoRenew: z.boolean().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const createClaimSchema = z.object({
  policyId: z.string().min(1, "Policy is required"),
  type: z.enum([
    "AUTO_ACCIDENT",
    "PROPERTY_DAMAGE",
    "HEALTH_MEDICAL",
    "HEALTH_DENTAL",
    "LIFE_DEATH",
    "LIFE_DISABILITY",
    "LIABILITY",
    "MALPRACTICE",
    "CYBER_BREACH",
    "NATURAL_DISASTER",
    "THEFT",
    "FLOOD",
    "FIRE",
    "OTHER",
  ]),
  dateOfIncident: z.string().datetime().or(z.date()),
  description: z.string().min(10, "Description must be at least 10 characters"),
  estimatedAmount: z.number().positive().optional(),
  location: z.string().optional(),
  policeReportNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClaimSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "INVESTIGATING",
      "ADJUSTING",
      "PENDING_APPROVAL",
      "APPROVED",
      "PARTIALLY_APPROVED",
      "DENIED",
      "PAID",
      "CLOSED",
      "REOPENED",
      "APPEALED",
    ])
    .optional(),
  estimatedAmount: z.number().positive().optional(),
  approvedAmount: z.number().positive().optional(),
  paidAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({
  userId: z.string().min(1, "User is required"),
  customerNumber: z.string().min(1, "Customer number is required"),
  dateOfBirth: z.string().datetime().or(z.date()).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("US"),
  occupation: z.string().optional(),
  annualIncome: z.number().positive().optional(),
});

export const updateCustomerSchema = z.object({
  dateOfBirth: z.string().datetime().or(z.date()).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.number().positive().optional(),
});

export const createAgentSchema = z.object({
  userId: z.string().min(1, "User is required"),
  agentCode: z.string().min(1, "Agent code is required"),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().datetime().or(z.date()).optional(),
  agencyName: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  tier: z.string().optional(),
  specialization: z.string().optional(),
});

export const updateAgentSchema = z.object({
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().datetime().or(z.date()).optional(),
  agencyName: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  tier: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createInsurerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
  rating: z.string().optional(),
});

export const createInsuranceProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  config: z.record(z.unknown()).optional(),
});

export const createInsurancePlanSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  basePremium: z.number().positive("Premium must be positive"),
  currency: z.string().default("USD"),
  config: z.record(z.unknown()).optional(),
});

export const createCoverageSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  isOptional: z.boolean().default(false),
  limits: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        period: z.string().optional(),
      })
    )
    .optional(),
  deductibles: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        type: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
      })
    )
    .optional(),
});

export const createUnderwritingSchema = z.object({
  policyId: z.string().min(1, "Policy is required"),
  assessmentData: z.record(z.unknown()),
  notes: z.string().optional(),
});

export const createFraudAlertSchema = z.object({
  claimId: z.string().min(1, "Claim is required"),
  ruleId: z.string().optional(),
  severity: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH", "CRITICAL"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evidence: z.record(z.unknown()).optional(),
  aiScore: z.number().min(0).max(1).optional(),
});

export const createFraudRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ruleType: z.string().min(1, "Rule type is required"),
  conditions: z.record(z.unknown()),
  priority: z.number().default(0),
});

export const createCommunicationSchema = z.object({
  type: z.enum(["EMAIL", "SMS", "PHONE", "IN_APP", "MAIL", "FAX"]),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  templateId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["EMAIL", "SMS", "PHONE", "IN_APP", "MAIL", "FAX"]),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  variables: z.array(z.string()).optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  config: z.record(z.unknown()),
  format: z.enum(["JSON", "CSV", "PDF"]).default("JSON"),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean().default(false),
  layout: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
});

export const createWidgetSchema = z.object({
  dashboardId: z.string().min(1, "Dashboard is required"),
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  config: z.record(z.unknown()),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  refreshInterval: z.number().positive().optional(),
});

export const createPolicyTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  config: z.record(z.unknown()).optional(),
});

export const createThirdPartySchema = z.object({
  insurerId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const createLegalCaseSchema = z.object({
  claimId: z.string().min(1, "Claim is required"),
  caseNumber: z.string().min(1, "Case number is required"),
  court: z.string().optional(),
  judge: z.string().optional(),
  attorney: z.string().optional(),
  filedDate: z.string().datetime().or(z.date()),
  nextHearing: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  filters: z.record(z.unknown()).optional(),
  ...paginationSchema.shape,
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

export const policyFilterSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING_APPROVAL",
      "ACTIVE",
      "SUSPENDED",
      "EXPIRED",
      "CANCELLED",
      "RENEWED",
      "UNDER_REVIEW",
    ])
    .optional(),
  policyTypeId: z.string().optional(),
  customerId: z.string().optional(),
  insurerId: z.string().optional(),
  agentId: z.string().optional(),
  effectiveDate: dateRangeSchema.optional(),
  expirationDate: dateRangeSchema.optional(),
  ...paginationSchema.shape,
});

export const claimFilterSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "INVESTIGATING",
      "ADJUSTING",
      "PENDING_APPROVAL",
      "APPROVED",
      "PARTIALLY_APPROVED",
      "DENIED",
      "PAID",
      "CLOSED",
      "REOPENED",
      "APPEALED",
    ])
    .optional(),
  type: z
    .enum([
      "AUTO_ACCIDENT",
      "PROPERTY_DAMAGE",
      "HEALTH_MEDICAL",
      "HEALTH_DENTAL",
      "LIFE_DEATH",
      "LIFE_DISABILITY",
      "LIABILITY",
      "MALPRACTICE",
      "CYBER_BREACH",
      "NATURAL_DISASTER",
      "THEFT",
      "FLOOD",
      "FIRE",
      "OTHER",
    ])
    .optional(),
  fraudStatus: z
    .enum(["NONE", "SUSPECTED", "UNDER_INVESTIGATION", "CONFIRMED", "CLEARED", "DISMISSED"])
    .optional(),
  customerId: z.string().optional(),
  policyId: z.string().optional(),
  dateOfIncident: dateRangeSchema.optional(),
  ...paginationSchema.shape,
});

export const premiumFilterSchema = z.object({
  status: z
    .enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "OVERDUE", "CANCELLED"])
    .optional(),
  policyId: z.string().optional(),
  dueDate: dateRangeSchema.optional(),
  ...paginationSchema.shape,
});

export const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  createdAt: dateRangeSchema.optional(),
  ...paginationSchema.shape,
});

export const notificationFilterSchema = z.object({
  isRead: z.boolean().optional(),
  type: z.string().optional(),
  createdAt: dateRangeSchema.optional(),
  ...paginationSchema.shape,
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one item is required"),
  action: z.string().min(1, "Action is required"),
  data: z.record(z.unknown()).optional(),
});

export const uploadDocumentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  documentType: z.enum([
    "POLICY_DOCUMENT",
    "CLAIM_FORM",
    "MEDICAL_RECORD",
    "POLICE_REPORT",
    "PHOTOGRAPH",
    "INVOICE",
    "RECEIPT",
    "CONTRACT",
    "CORRESPONDENCE",
    "IDENTIFICATION",
    "OTHER",
  ]),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const aiAssessmentSchema = z.object({
  entityType: z.enum(["POLICY", "CLAIM", "CUSTOMER"]),
  entityId: z.string().min(1, "Entity ID is required"),
  assessmentType: z.string().min(1, "Assessment type is required"),
  parameters: z.record(z.unknown()).optional(),
});
