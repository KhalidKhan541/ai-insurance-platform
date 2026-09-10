import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export const CoverageTypeServiceSchema = z.enum([
  'auto',
  'home',
  'life',
  'health',
  'commercial',
  'umbrella',
  'cyber',
  'professional_liability',
]);

export type CoverageTypeService = z.infer<typeof CoverageTypeServiceSchema>;

export const RiskLevelServiceSchema = z.enum([
  'minimal',
  'low',
  'moderate',
  'elevated',
  'high',
  'very_high',
  'prohibitive',
]);

export type RiskLevelService = z.infer<typeof RiskLevelServiceSchema>;

export const UnderwritingDecisionSchema = z.enum([
  'approve',
  'approve_with_conditions',
  'refer_to_underwriter',
  'decline',
  'pending_information',
]);

export type UnderwritingDecision = z.infer<typeof UnderwritingDecisionSchema>;

export const ApplicantProfileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  ssn: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  occupation: z.string(),
  employerName: z.string().optional(),
  annualIncome: z.number().positive(),
  netWorth: z.number().min(0).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  dependents: z.number().int().min(0),
  creditScore: z.number().int().min(300).max(850).optional(),
  drivingRecord: z
    .object({
      violations: z.number().int().min(0),
      accidents: z.number().int().min(0),
      dui: z.boolean().default(false),
      licenseSuspended: z.boolean().default(false),
      licenseState: z.string().optional(),
      licensedYears: z.number().int().min(0).optional(),
    })
    .optional(),
  healthHistory: z
    .object({
      smoker: z.boolean().default(false),
      tobaccoUse: z.enum(['none', 'former', 'current']).default('none'),
      alcoholUse: z.enum(['none', 'social', 'moderate', 'heavy']).default('none'),
      chronicConditions: z.array(z.string()).default([]),
      medications: z
        .array(
          z.object({
            name: z.string(),
            dosage: z.string(),
            condition: z.string(),
            duration: z.string().optional(),
          })
        )
        .default([]),
      recentHospitalizations: z.number().int().min(0).default(0),
      bmi: z.number().positive().optional(),
      familyHistory: z
        .array(
          z.object({
            condition: z.string(),
            age: z.number().int().optional(),
            relationship: z.string(),
          })
        )
        .default([]),
    })
    .optional(),
  financialHistory: z
    .object({
      bankruptcy: z.boolean().default(false),
      bankruptcyDate: z.string().datetime().optional(),
      liens: z.number().int().min(0).default(0),
      judgments: z.number().int().min(0).default(0),
      collections: z.number().int().min(0).default(0),
      creditInquiries: z.number().int().min(0).default(0),
      debtToIncomeRatio: z.number().min(0).max(1).optional(),
    })
    .optional(),
  insuranceHistory: z
    .object({
      previousPolicies: z
        .array(
          z.object({
            carrier: z.string(),
            type: z.string(),
            policyNumber: z.string().optional(),
            startDate: z.string().datetime(),
            endDate: z.string().datetime().optional(),
            claimsCount: z.number().int().min(0),
            cancelReason: z.string().optional(),
          })
        )
        .default([]),
      claimsHistory: z
        .array(
          z.object({
            date: z.string().datetime(),
            type: z.string(),
            amount: z.number().min(0),
            description: z.string(),
            outcome: z.enum(['paid', 'denied', 'withdrawn', 'pending']).optional(),
          })
        )
        .default([]),
      lossRatio: z.number().min(0).optional(),
      yearsInsured: z.number().int().min(0).default(0),
    })
    .optional(),
});

export type ApplicantProfile = z.infer<typeof ApplicantProfileSchema>;

export const PolicyRequestSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  applicant: ApplicantProfileSchema,
  coverageType: CoverageTypeServiceSchema,
  requestedCoverageAmount: z.number().positive(),
  requestedDeductible: z.number().min(0),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  additionalInsureds: z.array(ApplicantProfileSchema).default([]),
  specialRequirements: z.array(z.string()).default([]),
  agentId: z.string().uuid().optional(),
  brokerId: z.string().uuid().optional(),
  referralSource: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type PolicyRequest = z.infer<typeof PolicyRequestSchema>;

export interface UnderwritingProfileService {
  id: string;
  name: string;
  description: string;
  coverageType: CoverageTypeService;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxCoverageAmount: number;
  minCreditScore: number;
  maxRiskScore: number;
  minAge: number;
  maxAge: number;
  requiredFactors: string[];
  excludedFactors: string[];
  premiumMultiplier: number;
  autoApproveThreshold: number;
  autoDeclineThreshold: number;
  eligibilityCriteria: EligibilityCriterion[];
  loadingRules: LoadingRule[];
  exclusionRules: ExclusionRule[];
  endorsements: Endorsement[];
  effectiveDate: Date;
  lastUpdated: Date;
  version: number;
  enabled: boolean;
}

export interface EligibilityCriterion {
  id: string;
  name: string;
  description: string;
  field: string;
  operator: string;
  value: unknown;
  mandatory: boolean;
  errorMessage: string;
}

export interface LoadingRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  loadingPercent: number;
  maxLoading: number;
  stackable: boolean;
  priority: number;
}

export interface ExclusionRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  exclusionType: 'coverage' | 'condition' | 'limitation';
  severity: 'standard' | 'elevated' | 'critical';
}

export interface Endorsement {
  id: string;
  name: string;
  description: string;
  premiumImpact: number;
  conditions: string[];
  mandatory: boolean;
}

export interface RiskScoreBreakdown {
  factor: string;
  category: string;
  rawScore: number;
  weightedScore: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
  dataPoints: string[];
  confidence: number;
}

export interface UnderwritingResultService {
  id: string;
  requestId: string;
  decision: UnderwritingDecision;
  riskLevel: RiskLevelService;
  overallScore: number;
  riskScoreBreakdown: RiskScoreBreakdown[];
  premiumCalculation: PremiumCalculation;
  conditions: UnderwritingCondition[];
  exclusions: string[];
  endorsements: string[];
  requiredDocuments: string[];
  referralReason?: string;
  declinationReason?: string;
  aiConfidence: number;
  processingTimeMs: string;
  createdAt: Date;
  expiresAt: Date;
  version: number;
  underwriterNotes: string;
  auditTrail: AuditEntry[];
}

export interface PremiumCalculation {
  basePremium: number;
  riskLoadings: PremiumLoading[];
  discountings: PremiumDiscount[];
  totalLoadings: number;
  totalDiscounts: number;
  netAdjustment: number;
  finalPremium: number;
  annualPremium: number;
  monthlyPremium: number;
  paymentPlans: PaymentPlan[];
  taxes: PremiumTax[];
  fees: PremiumFee[];
}

export interface PremiumLoading {
  name: string;
  description: string;
  percent: number;
  amount: number;
  reason: string;
}

export interface PremiumDiscount {
  name: string;
  description: string;
  percent: number;
  amount: number;
  reason: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  amount: number;
  installments: number;
  downPayment?: number;
  convenienceFee: number;
}

export interface PremiumTax {
  name: string;
  rate: number;
  amount: number;
}

export interface PremiumFee {
  name: string;
  amount: number;
  description: string;
}

export interface UnderwritingCondition {
  id: string;
  type: 'exclusion' | 'limitation' | 'requirement' | 'endorsement' | 'warranty';
  description: string;
  mandatory: boolean;
  impactOnPremium: number;
  deadline?: string;
  responsibleParty: 'insurer' | 'insured';
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
}

class ProfileManager {
  private profiles: Map<string, UnderwritingProfileService> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    const defaults: UnderwritingProfileService[] = [
      {
        id: uuidv4(),
        name: 'Standard Auto',
        description: 'Standard automobile insurance underwriting profile',
        coverageType: 'auto',
        riskTolerance: 'moderate',
        maxCoverageAmount: 500_000,
        minCreditScore: 580,
        maxRiskScore: 70,
        minAge: 18,
        maxAge: 85,
        requiredFactors: ['driving_record', 'credit_score', 'vehicle_info'],
        excludedFactors: [],
        premiumMultiplier: 1.0,
        autoApproveThreshold: 30,
        autoDeclineThreshold: 85,
        eligibilityCriteria: [
          {
            id: uuidv4(),
            name: 'Minimum Age',
            description: 'Applicant must be at least 18 years old',
            field: 'age',
            operator: 'gte',
            value: 18,
            mandatory: true,
            errorMessage: 'Applicant must be at least 18 years old',
          },
          {
            id: uuidv4(),
            name: 'Valid License',
            description: 'Applicant must have a valid driver license',
            field: 'drivingRecord.licenseSuspended',
            operator: 'equals',
            value: false,
            mandatory: true,
            errorMessage: 'License suspended applicants not eligible',
          },
        ],
        loadingRules: [
          {
            id: uuidv4(),
            name: 'Young Driver Loading',
            description: 'Loading for drivers under 25',
            condition: 'age < 25',
            loadingPercent: 25,
            maxLoading: 50,
            stackable: false,
            priority: 1,
          },
          {
            id: uuidv4(),
            name: 'Violation Loading',
            description: 'Loading for moving violations',
            condition: 'drivingRecord.violations > 0',
            loadingPercent: 15,
            maxLoading: 45,
            stackable: true,
            priority: 2,
          },
          {
            id: uuidv4(),
            name: 'DUI Loading',
            description: 'Loading for DUI convictions',
            condition: 'drivingRecord.dui === true',
            loadingPercent: 50,
            maxLoading: 100,
            stackable: false,
            priority: 1,
          },
        ],
        exclusionRules: [
          {
            id: uuidv4(),
            name: 'Racing Exclusion',
            description: 'No coverage for racing activities',
            condition: 'usage === racing',
            exclusionType: 'coverage',
            severity: 'standard',
          },
        ],
        endorsements: [
          {
            id: uuidv4(),
            name: 'Roadside Assistance',
            description: '24/7 roadside assistance coverage',
            premiumImpact: 35,
            conditions: [],
            mandatory: false,
          },
          {
            id: uuidv4(),
            name: 'Rental Car Coverage',
            description: 'Rental car reimbursement during repairs',
            premiumImpact: 50,
            conditions: [],
            mandatory: false,
          },
        ],
        effectiveDate: new Date(),
        lastUpdated: new Date(),
        version: 1,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: 'Premium Home',
        description: 'High-value home insurance underwriting profile',
        coverageType: 'home',
        riskTolerance: 'conservative',
        maxCoverageAmount: 5_000_000,
        minCreditScore: 680,
        maxRiskScore: 55,
        minAge: 25,
        maxAge: 90,
        requiredFactors: ['property_age', 'claims_history', 'flood_risk', 'construction'],
        excludedFactors: [],
        premiumMultiplier: 1.2,
        autoApproveThreshold: 25,
        autoDeclineThreshold: 70,
        eligibilityCriteria: [
          {
            id: uuidv4(),
            name: 'Property Ownership',
            description: 'Property must be owner-occupied or well-maintained rental',
            field: 'propertyType',
            operator: 'in',
            value: ['primary', 'secondary', 'rental'],
            mandatory: true,
            errorMessage: 'Property type not eligible',
          },
        ],
        loadingRules: [
          {
            id: uuidv4(),
            name: 'Old Roof Loading',
            description: 'Loading for roofs older than 20 years',
            condition: 'propertyInfo.roofAge > 20',
            loadingPercent: 20,
            maxLoading: 40,
            stackable: false,
            priority: 1,
          },
          {
            id: uuidv4(),
            name: 'Claims History Loading',
            description: 'Loading for claims in last 5 years',
            condition: 'propertyInfo.claimsHistory.length > 0',
            loadingPercent: 10,
            maxLoading: 30,
            stackable: true,
            priority: 2,
          },
        ],
        exclusionRules: [],
        endorsements: [
          {
            id: uuidv4(),
            name: 'Flood Endorsement',
            description: 'Additional flood coverage beyond standard policy',
            premiumImpact: 250,
            conditions: ['floodZone !== high'],
            mandatory: false,
          },
          {
            id: uuidv4(),
            name: 'Scheduled Personal Property',
            description: 'Coverage for high-value personal items',
            premiumImpact: 150,
            conditions: [],
            mandatory: false,
          },
        ],
        effectiveDate: new Date(),
        lastUpdated: new Date(),
        version: 1,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: 'Term Life Standard',
        description: 'Standard term life insurance underwriting profile',
        coverageType: 'life',
        riskTolerance: 'moderate',
        maxCoverageAmount: 2_000_000,
        minCreditScore: 550,
        maxRiskScore: 65,
        minAge: 18,
        maxAge: 75,
        requiredFactors: ['health_status', 'age_risk', 'occupation', 'lifestyle'],
        excludedFactors: [],
        premiumMultiplier: 1.0,
        autoApproveThreshold: 35,
        autoDeclineThreshold: 80,
        eligibilityCriteria: [
          {
            id: uuidv4(),
            name: 'Minimum Age',
            description: 'Applicant must be at least 18',
            field: 'age',
            operator: 'gte',
            value: 18,
            mandatory: true,
            errorMessage: 'Minimum age is 18',
          },
          {
            id: uuidv4(),
            name: 'Maximum Age',
            description: 'Applicant must be under 76',
            field: 'age',
            operator: 'lte',
            value: 75,
            mandatory: true,
            errorMessage: 'Maximum age is 75',
          },
        ],
        loadingRules: [
          {
            id: uuidv4(),
            name: 'Smoker Loading',
            description: 'Loading for tobacco users',
            condition: 'healthHistory.smoker === true',
            loadingPercent: 50,
            maxLoading: 100,
            stackable: false,
            priority: 1,
          },
          {
            id: uuidv4(),
            name: 'BMI Loading',
            description: 'Loading for elevated BMI',
            condition: 'healthHistory.bmi > 30',
            loadingPercent: 20,
            maxLoading: 50,
            stackable: true,
            priority: 2,
          },
        ],
        exclusionRules: [],
        endorsements: [],
        effectiveDate: new Date(),
        lastUpdated: new Date(),
        version: 1,
        enabled: true,
      },
    ];

    for (const profile of defaults) {
      this.profiles.set(profile.id, profile);
    }
  }

  getProfile(id: string): UnderwritingProfileService | undefined {
    return this.profiles.get(id);
  }

  getProfilesByType(type: CoverageTypeService): UnderwritingProfileService[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.coverageType === type && p.enabled
    );
  }

  getBestProfile(
    type: CoverageTypeService,
    riskScore: number
  ): UnderwritingProfileService | null {
    const profiles = this.getProfilesByType(type);
    let best: UnderwritingProfileService | null = null;

    for (const profile of profiles) {
      if (riskScore <= profile.maxRiskScore) {
        if (!best || profile.maxRiskScore > best.maxRiskScore) {
          best = profile;
        }
      }
    }

    return best;
  }

  createProfile(
    profile: Omit<UnderwritingProfileService, 'id' | 'version' | 'effectiveDate' | 'lastUpdated'>
  ): UnderwritingProfileService {
    const newProfile: UnderwritingProfileService = {
      ...profile,
      id: uuidv4(),
      version: 1,
      effectiveDate: new Date(),
      lastUpdated: new Date(),
    };
    this.profiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  updateProfile(
    id: string,
    updates: Partial<UnderwritingProfileService>
  ): UnderwritingProfileService | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    const updated: UnderwritingProfileService = {
      ...profile,
      ...updates,
      version: profile.version + 1,
      lastUpdated: new Date(),
    };

    this.profiles.set(id, updated);
    return updated;
  }

  deleteProfile(id: string): boolean {
    return this.profiles.delete(id);
  }

  getAllProfiles(): UnderwritingProfileService[] {
    return Array.from(this.profiles.values());
  }
}

class EligibilityChecker {
  checkEligibility(
    applicant: ApplicantProfile,
    profile: UnderwritingProfileService
  ): {
    eligible: boolean;
    passed: string[];
    failed: string[];
    warnings: string[];
  } {
    const passed: string[] = [];
    const failed: string[] = [];
    const warnings: string[] = [];

    for (const criterion of profile.eligibilityCriteria) {
      const fieldPath = criterion.field.split('.');
      let value: unknown = applicant as Record<string, unknown>;

      for (const key of fieldPath) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[key];
        } else {
          value = undefined;
          break;
        }
      }

      const meetsCriterion = this.evaluateCriterion(
        value,
        criterion.operator,
        criterion.value
      );

      if (meetsCriterion) {
        passed.push(criterion.name);
      } else if (criterion.mandatory) {
        failed.push(`${criterion.name}: ${criterion.errorMessage}`);
      } else {
        warnings.push(`${criterion.name}: ${criterion.errorMessage}`);
      }
    }

    // Additional profile-based checks
    const age = this.calculateAge(applicant.dateOfBirth);
    if (age < profile.minAge || age > profile.maxAge) {
      failed.push(
        `Age ${age} is outside allowed range ${profile.minAge}-${profile.maxAge}`
      );
    }

    if (profile.minCreditScore && applicant.creditScore) {
      if (applicant.creditScore < profile.minCreditScore) {
        failed.push(
          `Credit score ${applicant.creditScore} below minimum ${profile.minCreditScore}`
        );
      }
    }

    return {
      eligible: failed.length === 0,
      passed,
      failed,
      warnings,
    };
  }

  private evaluateCriterion(
    value: unknown,
    operator: string,
    criterionValue: unknown
  ): boolean {
    switch (operator) {
      case 'equals':
        return value === criterionValue;
      case 'not_equals':
        return value !== criterionValue;
      case 'gt':
        return typeof value === 'number' && typeof criterionValue === 'number' && value > criterionValue;
      case 'gte':
        return typeof value === 'number' && typeof criterionValue === 'number' && value >= criterionValue;
      case 'lt':
        return typeof value === 'number' && typeof criterionValue === 'number' && value < criterionValue;
      case 'lte':
        return typeof value === 'number' && typeof criterionValue === 'number' && value <= criterionValue;
      case 'contains':
        return typeof value === 'string' && typeof criterionValue === 'string' && value.includes(criterionValue);
      case 'in':
        return Array.isArray(criterionValue) && criterionValue.includes(value);
      case 'between': {
        const [min, max] = criterionValue as [number, number];
        return typeof value === 'number' && value >= min && value <= max;
      }
      default:
        return true;
    }
  }

  private calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

class PremiumCalculator {
  calculate(
    applicant: ApplicantProfile,
    coverageType: CoverageTypeService,
    coverageAmount: number,
    riskScore: number,
    profile: UnderwritingProfileService
  ): PremiumCalculation {
    const basePremium = this.getBasePremium(coverageType, coverageAmount, applicant);
    const loadings: PremiumLoading[] = [];
    const discounts: PremiumDiscount[] = [];

    // Apply loading rules
    for (const rule of profile.loadingRules) {
      if (this.evaluateLoadingCondition(rule.condition, applicant, riskScore)) {
        const loadingAmount = basePremium * (rule.loadingPercent / 100);
        loadings.push({
          name: rule.name,
          description: rule.description,
          percent: Math.min(rule.loadingPercent, rule.maxLoading),
          amount: Math.min(loadingAmount, basePremium * (rule.maxLoading / 100)),
          reason: rule.description,
        });
      }
    }

    // Risk-based loading
    if (riskScore > 50) {
      const riskLoading = Math.min(50, (riskScore - 50) * 0.8);
      loadings.push({
        name: 'Risk Loading',
        description: `Loading for risk score ${riskScore}`,
        percent: riskLoading,
        amount: basePremium * (riskLoading / 100),
        reason: `Elevated risk profile: ${riskScore}/100`,
      });
    }

    // Apply standard discounts
    if (applicant.creditScore && applicant.creditScore >= 740) {
      const discountAmount = basePremium * 0.05;
      discounts.push({
        name: 'Good Credit Discount',
        description: 'Discount for excellent credit score',
        percent: 5,
        amount: discountAmount,
        reason: `Credit score: ${applicant.creditScore}`,
      });
    }

    if (applicant.maritalStatus === 'married') {
      const discountAmount = basePremium * 0.03;
      discounts.push({
        name: 'Married Discount',
        description: 'Discount for married policyholders',
        percent: 3,
        amount: discountAmount,
        reason: 'Married status',
      });
    }

    if (applicant.insuranceHistory && applicant.insuranceHistory.yearsInsured > 3) {
      const loyaltyPercent = Math.min(10, applicant.insuranceHistory.yearsInsured * 0.5);
      discounts.push({
        name: 'Loyalty Discount',
        description: 'Discount for continuous coverage',
        percent: loyaltyPercent,
        amount: basePremium * (loyaltyPercent / 100),
        reason: `${applicant.insuranceHistory.yearsInsured} years of continuous coverage`,
      });
    }

    if (applicant.drivingRecord) {
      const record = applicant.drivingRecord;
      if (record.violations === 0 && record.accidents === 0) {
        discounts.push({
          name: 'Clean Record Discount',
          description: 'Discount for clean driving record',
          percent: 10,
          amount: basePremium * 0.1,
          reason: 'No violations or accidents',
        });
      }
    }

    const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
    const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
    const netAdjustment = totalLoadings - totalDiscounts;
    const adjustedPremium = basePremium + netAdjustment;
    const finalPremium = Math.max(basePremium * 0.5, adjustedPremium);

    const taxes = this.calculateTaxes(finalPremium, applicant.address.state);
    const fees = this.calculateFees(coverageType);

    const totalTaxes = taxes.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);

    const annualPremium = finalPremium + totalTaxes + totalFees;

    const paymentPlans = this.generatePaymentPlans(annualPremium);

    return {
      basePremium,
      riskLoadings: loadings,
      discountings: discounts,
      totalLoadings,
      totalDiscounts,
      netAdjustment,
      finalPremium,
      annualPremium,
      monthlyPremium: annualPremium / 12,
      paymentPlans,
      taxes,
      fees,
    };
  }

  private getBasePremium(
    coverageType: CoverageTypeService,
    coverageAmount: number,
    applicant: ApplicantProfile
  ): number {
    const baseRates: Record<CoverageTypeService, number> = {
      auto: 0.025,
      home: 0.005,
      life: 0.001,
      health: 0.08,
      commercial: 0.015,
      umbrella: 0.002,
      cyber: 0.01,
      professional_liability: 0.012,
    };

    const rate = baseRates[coverageType] || 0.01;
    return coverageAmount * rate;
  }

  private evaluateLoadingCondition(
    condition: string,
    applicant: ApplicantProfile,
    riskScore: number
  ): boolean {
    try {
      const context = { applicant, riskScore, age: this.calculateAge(applicant.dateOfBirth) };
      const evaluator = new Function(...Object.keys(context), `return ${condition}`);
      return Boolean(evaluator(...Object.values(context)));
    } catch {
      return false;
    }
  }

  private calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  private calculateTaxes(premium: number, state: string): PremiumTax[] {
    const stateTaxRates: Record<string, number> = {
      CA: 0.045,
      NY: 0.042,
      TX: 0.036,
      FL: 0.038,
      IL: 0.033,
    };
    const rate = stateTaxRates[state] || 0.03;
    return [
      {
        name: `State Tax (${state})`,
        rate,
        amount: premium * rate,
      },
    ];
  }

  private calculateFees(coverageType: CoverageTypeService): PremiumFee[] {
    const fees: PremiumFee[] = [
      { name: 'Policy Administration Fee', amount: 25, description: 'Administrative processing' },
    ];

    if (coverageType === 'auto') {
      fees.push({ name: 'MVI Fee', amount: 5, description: 'Motor Vehicle Inspection' });
    }

    return fees;
  }

  private generatePaymentPlans(annualPremium: number): PaymentPlan[] {
    return [
      {
        id: uuidv4(),
        name: 'Annual',
        frequency: 'annual',
        amount: annualPremium,
        installments: 1,
        convenienceFee: 0,
      },
      {
        id: uuidv4(),
        name: 'Semi-Annual',
        frequency: 'semi_annual',
        amount: annualPremium / 2,
        installments: 2,
        convenienceFee: 0,
      },
      {
        id: uuidv4(),
        name: 'Quarterly',
        frequency: 'quarterly',
        amount: annualPremium / 4,
        installments: 4,
        convenienceFee: 5,
      },
      {
        id: uuidv4(),
        name: 'Monthly',
        frequency: 'monthly',
        amount: annualPremium / 12,
        installments: 12,
        downPayment: annualPremium * 0.2,
        convenienceFee: 3,
      },
    ];
  }
}

class UnderwritingAuditLog {
  private entries: AuditEntry[] = [];

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const newEntry: AuditEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date(),
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  getEntries(requestId: string): AuditEntry[] {
    return this.entries.filter(
      (e) => (e.details.requestId as string) === requestId
    );
  }

  getAllEntries(limit?: number): AuditEntry[] {
    const sorted = [...this.entries].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }
}

class UnderwritingEngine {
  private profileManager: ProfileManager;
  private eligibilityChecker: EligibilityChecker;
  private premiumCalculator: PremiumCalculator;
  private auditLog: UnderwritingAuditLog;

  constructor() {
    this.profileManager = new ProfileManager();
    this.eligibilityChecker = new EligibilityChecker();
    this.premiumCalculator = new PremiumCalculator();
    this.auditLog = new UnderwritingAuditLog();
  }

  async processApplication(
    request: PolicyRequest
  ): Promise<UnderwritingResultService> {
    const startTime = Date.now();
    const validatedRequest = PolicyRequestSchema.parse(request);

    logger.info('Processing underwriting application', {
      requestId: validatedRequest.id,
      coverageType: validatedRequest.coverageType,
      applicantId: validatedRequest.applicant.id,
    });

    // Find appropriate profile
    const profile = this.profileManager.getBestProfile(
      validatedRequest.coverageType,
      50
    );

    if (!profile) {
      throw new Error(
        `No underwriting profile found for ${validatedRequest.coverageType}`
      );
    }

    // Check eligibility
    const eligibility = this.eligibilityChecker.checkEligibility(
      validatedRequest.applicant,
      profile
    );

    if (!eligibility.eligible) {
      this.auditLog.log({
        action: 'application_declined',
        actor: 'system',
        details: {
          requestId: validatedRequest.id,
          reason: eligibility.failed.join('; '),
        },
      });

      return this.createDeclinedResult(validatedRequest, eligibility.failed, Date.now() - startTime);
    }

    // Calculate risk score
    const riskBreakdown = this.calculateRiskScore(validatedRequest, profile);
    const overallScore = riskBreakdown.reduce((sum, r) => sum + r.weightedScore, 0);
    const riskLevel = this.scoreToRiskLevel(overallScore);

    // Determine decision
    let decision: UnderwritingDecision;
    let referralReason: string | undefined;
    let declinationReason: string | undefined;

    if (overallScore <= profile.autoApproveThreshold) {
      decision = 'approve';
    } else if (overallScore >= profile.autoDeclineThreshold) {
      decision = 'decline';
      declinationReason = `Risk score ${overallScore} exceeds maximum threshold ${profile.autoDeclineThreshold}`;
    } else if (overallScore > profile.maxRiskScore) {
      decision = 'refer_to_underwriter';
      referralReason = `Risk score ${overallScore} exceeds profile threshold ${profile.maxRiskScore}. Manual underwriting required.`;
    } else {
      decision = 'approve_with_conditions';
    }

    // Calculate premium
    const premiumCalculation = this.premiumCalculator.calculate(
      validatedRequest.applicant,
      validatedRequest.coverageType,
      validatedRequest.requestedCoverageAmount,
      overallScore,
      profile
    );

    // Build conditions
    const conditions = this.buildConditions(profile, overallScore, validatedRequest);

    // Build required documents
    const requiredDocuments = this.determineRequiredDocuments(
      validatedRequest,
      overallScore,
      decision
    );

    // Create audit entries
    this.auditLog.log({
      action: 'application_received',
      actor: 'agent',
      details: { requestId: validatedRequest.id },
    });

    this.auditLog.log({
      action: 'eligibility_checked',
      actor: 'system',
      details: {
        requestId: validatedRequest.id,
        eligible: eligibility.eligible,
        passed: eligibility.passed.length,
        failed: eligibility.failed.length,
      },
    });

    this.auditLog.log({
      action: 'risk_score_calculated',
      actor: 'system',
      details: {
        requestId: validatedRequest.id,
        score: overallScore,
        riskLevel,
      },
    });

    this.auditLog.log({
      action: `decision_${decision}`,
      actor: 'system',
      details: {
        requestId: validatedRequest.id,
        decision,
        premium: premiumCalculation.finalPremium,
      },
    });

    const processingTimeMs = Date.now() - startTime;

    const result: UnderwritingResultService = {
      id: uuidv4(),
      requestId: validatedRequest.id,
      decision,
      riskLevel,
      overallScore,
      riskScoreBreakdown: riskBreakdown,
      premiumCalculation,
      conditions,
      exclusions: profile.exclusionRules.map((r) => r.description),
      endorsements: profile.endorsements
        .filter((e) => !e.mandatory)
        .map((e) => e.name),
      requiredDocuments,
      referralReason,
      declinationReason,
      aiConfidence: this.calculateConfidence(overallScore, eligibility),
      processingTimeMs: `${processingTimeMs}ms`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      version: 1,
      underwriterNotes: '',
      auditTrail: this.auditLog.getEntries(validatedRequest.id),
    };

    logger.info('Underwriting completed', {
      requestId: validatedRequest.id,
      decision,
      riskLevel,
      score: overallScore,
      premium: premiumCalculation.finalPremium,
      processingTimeMs,
    });

    return result;
  }

  private calculateRiskScore(
    request: PolicyRequest,
    profile: UnderwritingProfileService
  ): RiskScoreBreakdown[] {
    const breakdowns: RiskScoreBreakdown[] = [];

    const factors: Array<{
      factor: string;
      category: string;
      weight: number;
      calculator: () => { score: number; explanation: string; dataPoints: string[]; confidence: number };
    }> = [
      {
        factor: 'Credit Score',
        category: 'financial',
        weight: 0.15,
        calculator: () => {
          const score = request.applicant.creditScore || 650;
          let riskScore: number;
          if (score >= 800) riskScore = 5;
          else if (score >= 740) riskScore = 15;
          else if (score >= 670) riskScore = 35;
          else if (score >= 580) riskScore = 60;
          else riskScore = 85;
          return {
            score: riskScore,
            explanation: `Credit score of ${score} indicates ${riskScore < 30 ? 'low' : riskScore < 60 ? 'moderate' : 'high'} financial risk`,
            dataPoints: [`Credit score: ${score}`],
            confidence: 0.9,
          };
        },
      },
      {
        factor: 'Claims History',
        category: 'history',
        weight: 0.25,
        calculator: () => {
          const claims = request.applicant.insuranceHistory?.claimsHistory || [];
          const totalAmount = claims.reduce((sum, c) => sum + c.amount, 0);
          let score = claims.length * 15;
          if (totalAmount > 50_000) score += 20;
          score = Math.min(100, score);
          return {
            score,
            explanation: `${claims.length} previous claims totalling $${totalAmount.toLocaleString()}`,
            dataPoints: [
              `Claims count: ${claims.length}`,
              `Total amount: $${totalAmount.toLocaleString()}`,
            ],
            confidence: 0.85,
          };
        },
      },
      {
        factor: 'Age Risk',
        category: 'demographic',
        weight: 0.1,
        calculator: () => {
          const age = this.calculateAge(request.applicant.dateOfBirth);
          let score: number;
          if (age < 25) score = 70;
          else if (age < 35) score = 30;
          else if (age < 55) score = 15;
          else if (age < 65) score = 25;
          else score = 50;
          return {
            score,
            explanation: `Age ${age} carries ${score < 30 ? 'low' : score < 60 ? 'moderate' : 'high'} risk`,
            dataPoints: [`Age: ${age}`],
            confidence: 0.95,
          };
        },
      },
      {
        factor: 'Occupation Risk',
        category: 'demographic',
        weight: 0.1,
        calculator: () => {
          const highRisk = ['construction', 'mining', 'fishing', 'pilot', 'firefighter'];
          const occupation = request.applicant.occupation.toLowerCase();
          const isHighRisk = highRisk.some((o) => occupation.includes(o));
          return {
            score: isHighRisk ? 70 : 25,
            explanation: `Occupation "${request.applicant.occupation}" is ${isHighRisk ? 'high' : 'standard'} risk`,
            dataPoints: [`Occupation: ${request.applicant.occupation}`],
            confidence: 0.7,
          };
        },
      },
      {
        factor: 'Financial Stability',
        category: 'financial',
        weight: 0.15,
        calculator: () => {
          const history = request.applicant.financialHistory;
          if (!history) return { score: 30, explanation: 'No financial history', dataPoints: [], confidence: 0.5 };
          let score = 0;
          if (history.bankruptcy) score += 40;
          score += history.liens * 10;
          score += history.judgments * 15;
          score += history.collections * 5;
          return {
            score: Math.min(100, score),
            explanation: `Financial history shows ${score < 20 ? 'stable' : score < 50 ? 'moderate concerns' : 'significant concerns'}`,
            dataPoints: [
              `Bankruptcy: ${history.bankruptcy}`,
              `Liens: ${history.liens}`,
              `Judgments: ${history.judgments}`,
            ],
            confidence: 0.8,
          };
        },
      },
      {
        factor: 'Coverage Amount',
        category: 'coverage',
        weight: 0.1,
        calculator: () => {
          const ratio = request.requestedCoverageAmount / request.applicant.annualIncome;
          let score: number;
          if (ratio < 5) score = 15;
          else if (ratio < 10) score = 35;
          else if (ratio < 15) score = 55;
          else score = 80;
          return {
            score,
            explanation: `Coverage ratio of ${ratio.toFixed(1)}x annual income`,
            dataPoints: [`Ratio: ${ratio.toFixed(1)}x`, `Amount: $${request.requestedCoverageAmount.toLocaleString()}`],
            confidence: 0.9,
          };
        },
      },
      {
        factor: 'Deductible Level',
        category: 'coverage',
        weight: 0.05,
        calculator: () => {
          const ratio = request.requestedDeductible / request.requestedCoverageAmount;
          let score: number;
          if (ratio > 0.05) score = 10;
          else if (ratio > 0.02) score = 25;
          else score = 50;
          return {
            score,
            explanation: `Deductible ratio of ${(ratio * 100).toFixed(1)}%`,
            dataPoints: [`Deductible: $${request.requestedDeductible.toLocaleString()}`],
            confidence: 0.9,
          };
        },
      },
      {
        factor: 'Additional Insureds',
        category: 'coverage',
        weight: 0.05,
        calculator: () => {
          const count = request.additionalInsureds.length;
          return {
            score: Math.min(60, count * 20),
            explanation: `${count} additional insured(s) on policy`,
            dataPoints: [`Additional insureds: ${count}`],
            confidence: 0.8,
          };
        },
      },
    ];

    for (const { factor, category, weight, calculator } of factors) {
      const result = calculator();
      breakdowns.push({
        factor,
        category,
        rawScore: result.score,
        weightedScore: result.score * weight,
        weight,
        impact: result.score > 50 ? 'negative' : result.score < 30 ? 'positive' : 'neutral',
        explanation: result.explanation,
        dataPoints: result.dataPoints,
        confidence: result.confidence,
      });
    }

    return breakdowns;
  }

  private buildConditions(
    profile: UnderwritingProfileService,
    riskScore: number,
    request: PolicyRequest
  ): UnderwritingCondition[] {
    const conditions: UnderwritingCondition[] = [];

    if (riskScore > 40) {
      conditions.push({
        id: uuidv4(),
        type: 'requirement',
        description: 'Submit updated driving record within 30 days',
        mandatory: true,
        impactOnPremium: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        responsibleParty: 'insured',
      });
    }

    if (riskScore > 55) {
      conditions.push({
        id: uuidv4(),
        type: 'limitation',
        description: 'No claims for first 12 months without review',
        mandatory: true,
        impactOnPremium: 0,
        responsibleParty: 'insured',
      });
    }

    const mandatoryEndorsements = profile.endorsements.filter((e) => e.mandatory);
    for (const endorsement of mandatoryEndorsements) {
      conditions.push({
        id: uuidv4(),
        type: 'endorsement',
        description: `${endorsement.name}: ${endorsement.description}`,
        mandatory: true,
        impactOnPremium: endorsement.premiumImpact,
        responsibleParty: 'insured',
      });
    }

    return conditions;
  }

  private determineRequiredDocuments(
    request: PolicyRequest,
    riskScore: number,
    decision: UnderwritingDecision
  ): string[] {
    const documents: string[] = ['application_form'];

    if (decision === 'refer_to_underwriter') {
      documents.push('financial_statement', 'medical_records');
    }

    if (riskScore > 50) {
      documents.push('proof_of_income', 'driving_record');
    }

    if (request.coverageType === 'home') {
      documents.push('property_appraisal', 'home_inspection');
    }

    if (request.coverageType === 'life' && request.requestedCoverageAmount > 500_000) {
      documents.push('medical_exam', 'financial_statement');
    }

    return [...new Set(documents)];
  }

  private calculateConfidence(
    riskScore: number,
    eligibility: { passed: string[]; failed: string[]; warnings: string[] }
  ): number {
    let confidence = 0.7;
    if (eligibility.passed.length > 3) confidence += 0.1;
    if (eligibility.warnings.length > 2) confidence -= 0.1;
    if (riskScore > 70 || riskScore < 20) confidence += 0.05;
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private scoreToRiskLevel(score: number): RiskLevelService {
    if (score < 15) return 'minimal';
    if (score < 30) return 'low';
    if (score < 45) return 'moderate';
    if (score < 60) return 'elevated';
    if (score < 75) return 'high';
    if (score < 90) return 'very_high';
    return 'prohibitive';
  }

  private createDeclinedResult(
    request: PolicyRequest,
    reasons: string[],
    processingTimeMs: number
  ): UnderwritingResultService {
    return {
      id: uuidv4(),
      requestId: request.id,
      decision: 'decline',
      riskLevel: 'prohibitive',
      overallScore: 100,
      riskScoreBreakdown: [],
      premiumCalculation: {
        basePremium: 0,
        riskLoadings: [],
        discountings: [],
        totalLoadings: 0,
        totalDiscounts: 0,
        netAdjustment: 0,
        finalPremium: 0,
        annualPremium: 0,
        monthlyPremium: 0,
        paymentPlans: [],
        taxes: [],
        fees: [],
      },
      conditions: [],
      exclusions: [],
      endorsements: [],
      requiredDocuments: [],
      declinationReason: reasons.join('; '),
      aiConfidence: 0.9,
      processingTimeMs: `${processingTimeMs}ms`,
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
      underwriterNotes: '',
      auditTrail: [],
    };
  }

  private calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getProfileManager(): ProfileManager {
    return this.profileManager;
  }

  getAuditLog(): UnderwritingAuditLog {
    return this.auditLog;
  }
}

let engineInstance: UnderwritingEngine | null = null;

export function getUnderwritingEngine(): UnderwritingEngine {
  if (!engineInstance) {
    engineInstance = new UnderwritingEngine();
  }
  return engineInstance;
}

export {
  ProfileManager,
  EligibilityChecker,
  PremiumCalculator,
  UnderwritingAuditLog,
  UnderwritingEngine,
};
