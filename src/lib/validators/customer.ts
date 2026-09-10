import { z } from "zod";

const customerTypes = ["individual", "business"] as const;
const usStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
] as const;

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.enum(usStates, { errorMap: () => ({ message: "Invalid US state" }) }),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  country: z.string().default("US"),
});

export const createIndividualCustomerSchema = z.object({
  type: z.literal("individual"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50)
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50)
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  email: z.string().email("Invalid email address").max(255),
  phone: z
    .string()
    .regex(/^\+?1?\d{10,14}$/, "Invalid phone number")
    .optional(),
  address: addressSchema,
  dateOfBirth: z.string().refine((date) => {
    const d = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - d.getFullYear();
    return age >= 18 && age <= 120;
  }, "Customer must be between 18 and 120 years old").optional(),
  ssnLast4: z
    .string()
    .regex(/^\d{4}$/, "SSN must be exactly 4 digits")
    .optional(),
});

export const createBusinessCustomerSchema = z.object({
  type: z.literal("business"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200)
    .regex(/^[a-zA-Z0-9\s.,'&()-]+$/, "Company name contains invalid characters"),
  email: z.string().email("Invalid email address").max(255),
  phone: z
    .string()
    .regex(/^\+?1?\d{10,14}$/, "Invalid phone number")
    .optional(),
  address: addressSchema,
  taxId: z
    .string()
    .regex(/^\d{2}-\d{7}$/, "Tax ID must be in format XX-XXXXXXX")
    .optional(),
  industry: z.string().min(1).max(100).optional(),
  employeeCount: z.number().int().positive().max(1_000_000).optional(),
  annualRevenue: z.number().min(0).max(100_000_000_000).optional(),
});

export const createCustomerSchema = z.discriminatedUnion("type", [
  createIndividualCustomerSchema,
  createBusinessCustomerSchema,
]);

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/).optional(),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^\+?1?\d{10,14}$/).optional(),
  address: addressSchema.optional(),
  companyName: z.string().min(1).max(200).optional(),
  industry: z.string().min(1).max(100).optional(),
  employeeCount: z.number().int().positive().max(1_000_000).optional(),
  annualRevenue: z.number().min(0).max(100_000_000_000).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(customerTypes).optional(),
  search: z.string().max(100).optional(),
  state: z.enum(usStates).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  sortBy: z.enum(["createdAt", "lastName", "companyName", "riskScore"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateIndividualCustomerInput = z.infer<typeof createIndividualCustomerSchema>;
export type CreateBusinessCustomerInput = z.infer<typeof createBusinessCustomerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
