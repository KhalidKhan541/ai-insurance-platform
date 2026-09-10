import {
  UserRole,
  PolicyStatus,
  ClaimStatus,
  ClaimType,
  FraudStatus,
  UnderwritingStatus,
  PaymentStatus,
  CommunicationType,
  DocumentType,
  RiskLevel,
} from "@prisma/client";

// ─── User Types ───────────────────────────────────────────────

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type UserProfile = SafeUser & {
  lastLoginAt: Date | null;
  customer?: CustomerProfile | null;
  agent?: AgentProfile | null;
};

export type UserSession = {
  user: SafeUser;
  expires: string;
};

// ─── Auth Types ───────────────────────────────────────────────

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "CUSTOMER" | "AGENT";
};

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// ─── Customer Types ───────────────────────────────────────────

export type CustomerProfile = {
  id: string;
  userId: string;
  customerNumber: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  occupation: string | null;
  annualIncome: number | null;
  riskProfile: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerWithUser = CustomerProfile & {
  user: SafeUser;
  policies: PolicySummary[];
  claims: ClaimSummary[];
  documents: CustomerDocument[];
  communications: CustomerCommunication[];
};

export type CustomerDocument = {
  id: string;
  customerId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isVerified: boolean;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type CustomerCommunication = {
  id: string;
  customerId: string;
  type: CommunicationType;
  subject: string;
  content: string;
  direction: string;
  channel: string | null;
  status: string;
  sentAt: Date;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
};

// ─── Policy Types ─────────────────────────────────────────────

export type PolicySummary = {
  id: string;
  policyNumber: string;
  status: PolicyStatus;
  totalPremium: number;
  effectiveDate: Date;
  expirationDate: Date;
  createdAt: Date;
};

export type PolicyDetail = PolicySummary & {
  policyTypeId: string;
  customerId: string;
  agentId: string | null;
  insurerId: string;
  currency: string;
  isAutoRenew: boolean;
  description: string | null;
  terms: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
  policyType: PolicyType;
  customer: CustomerProfile;
  agent: AgentProfile | null;
  insurer: InsurerProfile;
  documents: PolicyDocument[];
  renewals: PolicyRenewal[];
  endorsements: PolicyEndorsement[];
  cancellations: PolicyCancellation[];
  coverages: PolicyCoverage[];
  premiums: Premium[];
  premiumSchedules: PremiumSchedule[];
};

export type PolicyType = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PolicyDocument = {
  id: string;
  policyId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedById: string;
  isVerified: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type PolicyRenewal = {
  id: string;
  policyId: string;
  renewalDate: Date;
  newExpiration: Date;
  newPremium: number;
  status: string;
  notes: string | null;
  processedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PolicyEndorsement = {
  id: string;
  policyId: string;
  endorsementNumber: string;
  type: string;
  description: string | null;
  effectiveDate: Date;
  status: string;
  changes: Record<string, unknown>;
  premiumImpact: number | null;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PolicyCancellation = {
  id: string;
  policyId: string;
  reason: string;
  effectiveDate: Date;
  refundAmount: number | null;
  status: string;
  processedById: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

// ─── Claim Types ──────────────────────────────────────────────

export type ClaimSummary = {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  type: ClaimType;
  fraudStatus: FraudStatus;
  estimatedAmount: number | null;
  dateOfIncident: Date;
  dateReported: Date;
  createdAt: Date;
};

export type ClaimDetail = ClaimSummary & {
  policyId: string;
  customerId: string;
  approvedAmount: number | null;
  paidAmount: number | null;
  deductible: number | null;
  currency: string;
  location: string | null;
  policeReportNumber: string | null;
  description: string;
  notes: string | null;
  closedAt: Date | null;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
  policy: PolicySummary;
  customer: CustomerProfile;
  documents: ClaimDocument[];
  adjusters: ClaimAdjuster[];
  payments: ClaimPayment[];
  claimNotes: ClaimNote[];
  fraudAlerts: FraudAlert[];
  thirdPartyClaims: ThirdPartyClaim[];
  legalCases: LegalCase[];
};

export type ClaimDocument = {
  id: string;
  claimId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedById: string;
  isVerified: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type ClaimAdjuster = {
  id: string;
  claimId: string;
  userId: string;
  role: string;
  assignedAt: Date;
  notes: string | null;
  user: SafeUser;
};

export type ClaimPayment = {
  id: string;
  claimId: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  transactionId: string | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClaimNote = {
  id: string;
  claimId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: SafeUser;
};

// ─── Agent Types ──────────────────────────────────────────────

export type AgentProfile = {
  id: string;
  userId: string;
  agentCode: string;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: Date | null;
  agencyName: string | null;
  commissionRate: number | null;
  tier: string | null;
  specialization: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AgentWithUser = AgentProfile & {
  user: SafeUser;
  performances: AgentPerformance[];
  commissions: AgentCommission[];
  policies: PolicySummary[];
};

export type AgentPerformance = {
  id: string;
  agentId: string;
  period: Date;
  policiesSold: number;
  claimsHandled: number;
  totalPremium: number;
  totalCommission: number;
  conversionRate: number | null;
  customerRating: number | null;
  notes: string | null;
  createdAt: Date;
};

export type AgentCommission = {
  id: string;
  agentId: string;
  policyId: string;
  amount: number;
  rate: number;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  policy: PolicySummary;
};

// ─── Insurer Types ────────────────────────────────────────────

export type InsurerProfile = {
  id: string;
  name: string;
  code: string;
  type: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  licenseNumber: string | null;
  rating: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsurerWithRelations = InsurerProfile & {
  policies: PolicySummary[];
  documents: InsurerDocument[];
};

export type InsurerDocument = {
  id: string;
  insurerId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

// ─── Insurance Product Types ──────────────────────────────────

export type InsuranceProduct = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsurancePlan = {
  id: string;
  productId: string;
  name: string;
  code: string;
  description: string | null;
  basePremium: number;
  currency: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  product: InsuranceProduct;
  coverages: Coverage[];
};

export type InsuranceQuote = {
  id: string;
  quoteNumber: string;
  planId: string;
  customerId: string | null;
  agentId: string | null;
  status: string;
  validUntil: Date;
  totalPremium: number;
  currency: string;
  discountPercent: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  finalAmount: number | null;
  metadata: Record<string, unknown> | null;
  convertedPolicyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  plan: InsurancePlan;
  items: InsuranceQuoteItem[];
};

export type InsuranceQuoteItem = {
  id: string;
  quoteId: string;
  coverageId: string;
  amount: number;
  rate: number | null;
  premium: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

// ─── Coverage Types ───────────────────────────────────────────

export type Coverage = {
  id: string;
  planId: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  isOptional: boolean;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  limits: CoverageLimit[];
  deductibles: Deductible[];
};

export type CoverageLimit = {
  id: string;
  coverageId: string;
  name: string;
  amount: number;
  period: string | null;
  description: string | null;
  createdAt: Date;
};

export type Deductible = {
  id: string;
  coverageId: string;
  name: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: Date;
};

export type PolicyCoverage = Coverage & {
  policyId?: string;
};

// ─── Premium Types ────────────────────────────────────────────

export type Premium = {
  id: string;
  policyId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paidDate: Date | null;
  status: PaymentStatus;
  paymentMethod: string | null;
  transactionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PremiumPayment = {
  id: string;
  premiumId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string | null;
  status: PaymentStatus;
  paidAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type PremiumSchedule = {
  id: string;
  policyId: string;
  userId: string | null;
  frequency: string;
  amount: number;
  nextDueDate: Date;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Underwriting Types ───────────────────────────────────────

export type UnderwritingProfile = {
  id: string;
  policyId: string;
  underwriterId: string | null;
  status: UnderwritingStatus;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  assessmentData: Record<string, unknown>;
  notes: string | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RiskAssessment = {
  id: string;
  underwritingProfileId: string;
  modelVersion: string;
  score: number;
  confidence: number | null;
  factors: Record<string, unknown>;
  explanation: string | null;
  recommendedAction: string | null;
  createdAt: Date;
};

export type RiskFactor = {
  id: string;
  underwritingProfileId: string;
  category: string;
  name: string;
  value: Record<string, unknown>;
  weight: number | null;
  impact: number | null;
  description: string | null;
  createdAt: Date;
};

// ─── Fraud Types ──────────────────────────────────────────────

export type FraudAlert = {
  id: string;
  claimId: string;
  ruleId: string | null;
  status: FraudStatus;
  severity: RiskLevel;
  description: string;
  evidence: Record<string, unknown> | null;
  aiScore: number | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  rule: FraudRule | null;
  investigation: FraudInvestigation | null;
};

export type FraudRule = {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  conditions: Record<string, unknown>;
  isActive: boolean;
  priority: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FraudInvestigation = {
  id: string;
  fraudAlertId: string;
  investigatorId: string | null;
  status: string;
  findings: string | null;
  evidence: Record<string, unknown> | null;
  resolution: string | null;
  startedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Third Party Types ────────────────────────────────────────

export type ThirdParty = {
  id: string;
  insurerId: string | null;
  name: string;
  type: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ThirdPartyClaim = {
  id: string;
  claimId: string;
  thirdPartyId: string;
  type: string;
  amount: number | null;
  status: string;
  description: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  thirdParty: ThirdParty;
};

// ─── Legal Types ──────────────────────────────────────────────

export type LegalCase = {
  id: string;
  claimId: string;
  caseNumber: string;
  court: string | null;
  judge: string | null;
  attorney: string | null;
  status: string;
  filedDate: Date;
  nextHearing: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  documents: LegalDocument[];
};

export type LegalDocument = {
  id: string;
  legalCaseId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  filedDate: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

// ─── Communication Types ──────────────────────────────────────

export type Communication = {
  id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  direction: string;
  senderId: string | null;
  recipientId: string | null;
  recipientEmail: string | null;
  templateId: string | null;
  status: string;
  sentAt: Date;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  sender: SafeUser | null;
  template: CommunicationTemplate | null;
};

export type CommunicationTemplate = {
  id: string;
  name: string;
  type: CommunicationType;
  subject: string;
  body: string;
  variables: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Notification Types ───────────────────────────────────────

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

// ─── Audit Log Types ──────────────────────────────────────────

export type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: SafeUser | null;
};

// ─── Report Types ─────────────────────────────────────────────

export type Report = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config: Record<string, unknown>;
  result: Record<string, unknown> | null;
  format: string;
  generatedById: string | null;
  status: string;
  scheduledId: string | null;
  generatedAt: Date | null;
  expiresAt: Date | null;
  fileUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  schedule: ReportSchedule | null;
};

export type ReportSchedule = {
  id: string;
  reportId: string;
  frequency: string;
  nextRun: Date;
  lastRun: Date | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Dashboard Types ──────────────────────────────────────────

export type Dashboard = {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  layout: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  widgets: DashboardWidget[];
};

export type DashboardWidget = {
  id: string;
  dashboardId: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ─── API Response Types ───────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

// ─── Filter Types ─────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type SearchParams = PaginationParams & {
  query: string;
  filters?: Record<string, unknown>;
};

export type PolicyFilterParams = PaginationParams & {
  status?: PolicyStatus;
  policyTypeId?: string;
  customerId?: string;
  insurerId?: string;
  agentId?: string;
  effectiveDate?: DateRangeParams;
  expirationDate?: DateRangeParams;
};

export type ClaimFilterParams = PaginationParams & {
  status?: ClaimStatus;
  type?: ClaimType;
  fraudStatus?: FraudStatus;
  customerId?: string;
  policyId?: string;
  dateOfIncident?: DateRangeParams;
};

export type DateRangeParams = {
  startDate: Date;
  endDate: Date;
};

export type PremiumFilterParams = PaginationParams & {
  status?: PaymentStatus;
  policyId?: string;
  dueDate?: DateRangeParams;
};

export type AuditLogFilterParams = PaginationParams & {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  createdAt?: DateRangeParams;
};

export type NotificationFilterParams = PaginationParams & {
  isRead?: boolean;
  type?: string;
  createdAt?: DateRangeParams;
};

// ─── Input Types ──────────────────────────────────────────────

export type CreatePolicyInput = {
  policyTypeId: string;
  customerId: string;
  agentId?: string;
  insurerId: string;
  effectiveDate: Date;
  expirationDate: Date;
  totalPremium: number;
  currency?: string;
  isAutoRenew?: boolean;
  description?: string;
  terms?: string;
  coverageIds: string[];
};

export type UpdatePolicyInput = Partial<{
  status: PolicyStatus;
  effectiveDate: Date;
  expirationDate: Date;
  totalPremium: number;
  isAutoRenew: boolean;
  description: string;
  terms: string;
  cancellationReason: string;
}>;

export type CreateClaimInput = {
  policyId: string;
  type: ClaimType;
  dateOfIncident: Date;
  description: string;
  estimatedAmount?: number;
  location?: string;
  policeReportNumber?: string;
  notes?: string;
};

export type UpdateClaimInput = Partial<{
  status: ClaimStatus;
  estimatedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  notes: string;
}>;

export type CreateCustomerInput = {
  userId: string;
  customerNumber: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  occupation?: string;
  annualIncome?: number;
};

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, "userId">>;

export type CreateAgentInput = {
  userId: string;
  agentCode: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiry?: Date;
  agencyName?: string;
  commissionRate?: number;
  tier?: string;
  specialization?: string;
};

export type UpdateAgentInput = Partial<Omit<CreateAgentInput, "userId">>;

export type CreateInsurerInput = {
  name: string;
  code: string;
  type?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  rating?: string;
};

export type CreateInsuranceProductInput = {
  name: string;
  code: string;
  description?: string;
  category: string;
  config?: Record<string, unknown>;
};

export type CreateInsurancePlanInput = {
  productId: string;
  name: string;
  code: string;
  description?: string;
  basePremium: number;
  currency?: string;
  config?: Record<string, unknown>;
};

export type CreateCoverageInput = {
  planId: string;
  name: string;
  code: string;
  description?: string;
  type: string;
  isOptional?: boolean;
  limits?: Array<{ name: string; amount: number; period?: string }>;
  deductibles?: Array<{
    name: string;
    amount: number;
    type?: string;
  }>;
};

export type CreateUnderwritingInput = {
  policyId: string;
  assessmentData: Record<string, unknown>;
  notes?: string;
};

export type CreateFraudAlertInput = {
  claimId: string;
  ruleId?: string;
  severity: RiskLevel;
  description: string;
  evidence?: Record<string, unknown>;
  aiScore?: number;
};

export type CreateFraudRuleInput = {
  name: string;
  description?: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  priority?: number;
};

export type CreateCommunicationInput = {
  type: CommunicationType;
  subject: string;
  content: string;
  recipientId?: string;
  recipientEmail?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
};

export type CreateReportInput = {
  name: string;
  type: string;
  description?: string;
  config: Record<string, unknown>;
  format?: string;
};

export type CreateDashboardInput = {
  name: string;
  isDefault?: boolean;
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
};

export type CreateWidgetInput = {
  dashboardId: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number;
};

// ─── Dashboard Stats Types ────────────────────────────────────

export type DashboardStats = {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  openClaims: number;
  totalCustomers: number;
  totalAgents: number;
  totalPremium: number;
  totalPaidClaims: number;
  pendingPayments: number;
  fraudAlerts: number;
  recentActivity: AuditLog[];
};

export type PolicyStats = {
  total: number;
  byStatus: Record<PolicyStatus, number>;
  byType: Record<string, number>;
  monthlyTrend: Array<{ month: string; count: number; premium: number }>;
};

export type ClaimStats = {
  total: number;
  byStatus: Record<ClaimStatus, number>;
  byType: Record<ClaimType, number>;
  averageProcessingTime: number;
  approvalRate: number;
  monthlyTrend: Array<{ month: string; count: number; amount: number }>;
};

export type AgentStats = {
  totalAgents: number;
  topPerformers: Array<{
    agentId: string;
    name: string;
    policiesSold: number;
    totalPremium: number;
    rating: number | null;
  }>;
  commissionTotal: number;
};

export type RevenueStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  byProduct: Array<{ product: string; revenue: number }>;
  trend: Array<{ month: string; revenue: number }>;
};

// ─── Utility Types ────────────────────────────────────────────

export type SelectOption = {
  label: string;
  value: string;
};

export type ColumnDef<T> = {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

export type FormData = {
  [key: string]: string | number | boolean | File | null;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
  isCurrent?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  isActive?: boolean;
};

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

export type ToastType = "success" | "error" | "info" | "warning";

export type Theme = "light" | "dark" | "system";
