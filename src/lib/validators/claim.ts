import { z } from "zod";

const claimTypes = [
  "property_damage",
  "auto_accident",
  "theft",
  "natural_disaster",
  "medical",
  "liability",
  "water_damage",
  "fire_damage",
  "personal_injury",
  "other",
] as const;

const claimStatuses = ["pending", "under_review", "approved", "denied", "paid"] as const;

export const createClaimSchema = z.object({
  policyId: z.string().uuid("Invalid policy ID"),
  type: z.enum(claimTypes, {
    errorMap: () => ({ message: "Invalid claim type" }),
  }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  amount: z
    .number()
    .positive("Claim amount must be positive")
    .min(1, "Minimum claim amount is $1")
    .max(10_000_000, "Maximum claim amount is $10,000,000"),
  incidentDate: z.string().refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d <= today;
  }, "Incident date cannot be in the future"),
  incidentLocation: z.string().min(5, "Incident location must be at least 5 characters").optional(),
  witnesses: z
    .array(
      z.object({
        name: z.string().min(1, "Witness name is required"),
        phone: z.string().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number"),
        statement: z.string().max(1000).optional(),
      })
    )
    .max(10, "Maximum 10 witnesses allowed")
    .optional(),
  documents: z
    .array(
      z.object({
        fileName: z.string().min(1, "File name is required"),
        fileType: z.enum(["pdf", "jpg", "jpeg", "png", "doc", "docx"]),
        fileSize: z.number().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
      })
    )
    .max(20, "Maximum 20 documents allowed")
    .optional(),
}).refine(
  (data) => {
    const incident = new Date(data.incidentDate);
    const today = new Date();
    const diffDays = (today.getTime() - incident.getTime()) / (24 * 60 * 60 * 1000);
    return diffDays <= 365;
  },
  {
    message: "Claims must be filed within 365 days of the incident",
    path: ["incidentDate"],
  }
);

export const updateClaimStatusSchema = z.object({
  status: z.enum(claimStatuses, {
    errorMap: () => ({ message: "Invalid claim status" }),
  }),
  approvedAmount: z
    .number()
    .min(0, "Approved amount cannot be negative")
    .optional(),
  notes: z
    .string()
    .min(10, "Notes must be at least 10 characters")
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional(),
}).refine(
  (data) => {
    if (data.status === "approved" && (data.approvedAmount === undefined || data.approvedAmount === null)) {
      return false;
    }
    return true;
  },
  {
    message: "Approved amount is required when approving a claim",
    path: ["approvedAmount"],
  }
).refine(
  (data) => {
    if (data.status === "approved" && data.approvedAmount !== undefined) {
      return data.approvedAmount > 0;
    }
    return true;
  },
  {
    message: "Approved amount must be greater than zero",
    path: ["approvedAmount"],
  }
);

export const claimQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(claimStatuses).optional(),
  type: z.enum(claimTypes).optional(),
  policyId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["filedDate", "amount", "status"]).default("filedDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;
export type ClaimQueryInput = z.infer<typeof claimQuerySchema>;
