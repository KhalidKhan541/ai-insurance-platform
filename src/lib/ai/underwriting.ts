import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getAIProviderClient, type AIRequest, type AIResponse } from './provider';
import { logger } from '@/lib/logger';

export const RiskLevelSchema = z.enum([
  'minimal',
  'low',
  'moderate',
  'elevated',
  'high',
  'very_high',
  'prohibitive',
]);

export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const CoverageTypeSchema = z.enum([
  'auto',
  'home',
  'life',
  'health',
  'commercial',
  'umbrella',
  'cyber',
  'professional_liability',
]);

export type CoverageType = z.infer<typeof CoverageTypeSchema>;

export const ApplicantSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  ssn: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  occupation: z.string(),
  annualIncome: z.number().positive(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  dependents: z.number().int().min(0),
  creditScore: z.number().int().min(300).max(850).optional(),
  drivingRecord: z
    .object({
      violations: z.number().int().min(0),
      accidents: z.number().int().min(0),
      dui: z.boolean().default(false),
      licenseSuspended: z.boolean().default(false),
    })
    .optional(),
  healthHistory: z
    .object({
      smoker: z.boolean().default(false),
      chronicConditions: z.array(z.string()).default([]),
      medications: z.array(z.string()).default([]),
      recentHospitalizations: z.number().int().min(0).default(0),
      bmi: z.number().positive().optional(),
    })
    .optional(),
});

export type Applicant = z.infer<typeof ApplicantSchema>;

export const InsuranceApplicationSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  applicant: ApplicantSchema,
  coverageType: CoverageTypeSchema,
  requestedCoverageAmount: z.number().positive(),
  requestedDeductible: z.number().min(0),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  additionalInsureds: z.array(ApplicantSchema).default([]),
  vehicleInfo: z
    .object({
      year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
      make: z.string(),
      model: z.string(),
      vin: z.string().length(17),
      annualMileage: z.number().int().positive(),
      usage: z.enum(['personal', 'business', 'commercial']),
      parkedLocation: z.enum(['garage', 'driveway', 'street', 'lot']),
      antiTheft: z.boolean().default(false),
      safetyFeatures: z.array(z.string()).default([]),
    })
    .optional(),
  propertyInfo: z
    .object({
      yearBuilt: z.number().int().min(1800),
      squareFootage: z.number().int().positive(),
      constructionType: z.enum([
        'wood_frame',
        'masonry',
        'steel_frame',
        'concrete',
        'manufactured',
      ]),
      roofType: z.string(),
      roofAge: z.number().int().min(0),
      hasAlarm: z.boolean().default(false),
      hasSprinklers: z.boolean().default(false),
      floodZone: z.enum(['high', 'moderate', 'low', 'minimal']).optional(),
      claimsHistory: z
        .array(
          z.object({
            date: z.string().datetime(),
            type: z.string(),
            amount: z.number().min(0),
            description: z.string(),
          })
        )
        .default([]),
    })
    .optional(),
  businessInfo: z
    .object({
      industry: z.string(),
      annualRevenue: z.number().min(0),
      employeeCount: z.number().int().min(1),
      yearsInBusiness: z.number().int().min(0),
      hasSafetyProgram: z.boolean().default(false),
      previousLiabilityClaims: z.number().int().min(0).default(0),
    })
    .optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type InsuranceApplication = z.infer<typeof InsuranceApplicationSchema>;

export interface RiskFactor {
  id: string;
  category: string;
  name: string;
  description: string;
  weight: number;
  score: number; // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
  dataPoints: string[];
}

export interface RiskAssessment {
  id: string;
  applicationId: string;
  overallRiskLevel: RiskLevel;
  overallScore: number; // 0-1000
  riskFactors: RiskFactor[];
  riskScore: number; // 0-100
  recommendations: UnderwritingRecommendation[];
  pricingAdjustments: PricingAdjustment[];
  conditions: UnderwritingCondition[];
  aiAnalysis: string;
  confidence: number;
  processingTimeMs: number;
  createdAt: Date;
  expiresAt: Date;
  version: number;
}

export interface UnderwritingRecommendation {
  type: 'approve' | 'decline' | 'refer' | 'modify';
  reason: string;
  confidence: number;
  conditions?: string[];
}

export interface PricingAdjustment {
  factor: string;
  adjustmentPercent: number;
  reason: string;
  reversible: boolean;
}

export interface UnderwritingCondition {
  type: 'exclusion' | 'limitation' | 'requirement' | 'endorsement';
  description: string;
  mandatory: boolean;
  impactOnPremium: number;
}

export interface UnderwritingRule {
  id: string;
  name: string;
  description: string;
  coverageType: CoverageType;
  condition: string;
  action: 'approve' | 'decline' | 'refer' | 'modify';
  priority: number;
  enabled: boolean;
  aiEnhanced: boolean;
  lastUpdated: Date;
}

export interface UnderwritingProfile {
  id: string;
  name: string;
  coverageType: CoverageType;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxCoverageAmount: number;
  minCreditScore: number;
  maxRiskScore: number;
  requiredFactors: string[];
  excludedFactors: string[];
  customRules: UnderwritingRule[];
}

interface RiskFactorConfig {
  category: string;
  name: string;
  weight: number;
  extractor: (app: InsuranceApplication) => { score: number; dataPoints: string[] };
}

class RiskScoringEngine {
  private factorConfigs: Map<CoverageType, RiskFactorConfig[]> = new Map();

  constructor() {
    this.initializeFactorConfigs();
  }

  private initializeFactorConfigs(): void {
    this.factorConfigs.set('auto', [
      {
        category: 'demographic',
        name: 'Age Risk',
        weight: 0.15,
        extractor: (app) => {
          const age = this.calculateAge(app.applicant.dateOfBirth);
          let score: number;
          if (age < 25) score = 75;
          else if (age < 35) score = 30;
          else if (age < 55) score = 15;
          else if (age < 65) score = 25;
          else score = 55;
          return { score, dataPoints: [`Age: ${age}`] };
        },
      },
      {
        category: 'driving',
        name: 'Driving Record',
        weight: 0.25,
        extractor: (app) => {
          const record = app.applicant.drivingRecord;
          if (!record) return { score: 50, dataPoints: ['No driving record available'] };
          let score = 0;
          score += record.violations * 15;
          score += record.accidents * 25;
          score += record.dui ? 40 : 0;
          score += record.licenseSuspended ? 50 : 0;
          return {
            score: Math.min(100, score),
            dataPoints: [
              `Violations: ${record.violations}`,
              `Accidents: ${record.accidents}`,
              `DUI: ${record.dui}`,
            ],
          };
        },
      },
      {
        category: 'vehicle',
        name: 'Vehicle Risk',
        weight: 0.2,
        extractor: (app) => {
          const vehicle = app.vehicleInfo;
          if (!vehicle) return { score: 50, dataPoints: ['No vehicle info'] };
          let score = 20;
          const currentYear = new Date().getFullYear();
          const vehicleAge = currentYear - vehicle.year;
          score += Math.min(30, vehicleAge * 2);
          if (vehicle.annualMileage > 20000) score += 20;
          else if (vehicle.annualMileage > 12000) score += 10;
          if (vehicle.usage === 'commercial') score += 15;
          if (vehicle.antiTheft) score -= 10;
          if (vehicle.safetyFeatures.length > 2) score -= 10;
          return {
            score: Math.max(0, Math.min(100, score)),
            dataPoints: [
              `Vehicle age: ${vehicleAge} years`,
              `Annual mileage: ${vehicle.annualMileage}`,
              `Usage: ${vehicle.usage}`,
              `Anti-theft: ${vehicle.antiTheft}`,
            ],
          };
        },
      },
      {
        category: 'financial',
        name: 'Credit Score Impact',
        weight: 0.15,
        extractor: (app) => {
          const score = app.applicant.creditScore;
          if (!score) return { score: 50, dataPoints: ['No credit score'] };
          let riskScore: number;
          if (score >= 800) riskScore = 5;
          else if (score >= 740) riskScore = 15;
          else if (score >= 670) riskScore = 35;
          else if (score >= 580) riskScore = 60;
          else riskScore = 85;
          return { score: riskScore, dataPoints: [`Credit score: ${score}`] };
        },
      },
      {
        category: 'geographic',
        name: 'Location Risk',
        weight: 0.15,
        extractor: (app) => {
          const state = app.applicant.address.state;
          const highRiskStates = ['FL', 'CA', 'TX', 'MI', 'LA'];
          const score = highRiskStates.includes(state) ? 65 : 30;
          return {
            score,
            dataPoints: [`State: ${state}`],
          };
        },
      },
      {
        category: 'coverage',
        name: 'Coverage Level',
        weight: 0.1,
        extractor: (app) => {
          const ratio = app.requestedCoverageAmount / (app.applicant.annualIncome || 1);
          let score: number;
          if (ratio < 2) score = 20;
          else if (ratio < 5) score = 40;
          else if (ratio < 10) score = 60;
          else score = 80;
          return {
            score,
            dataPoints: [
              `Coverage ratio: ${ratio.toFixed(2)}x income`,
              `Requested: $${app.requestedCoverageAmount.toLocaleString()}`,
            ],
          };
        },
      },
    ]);

    this.factorConfigs.set('home', [
      {
        category: 'property',
        name: 'Property Age',
        weight: 0.2,
        extractor: (app) => {
          const property = app.propertyInfo;
          if (!property) return { score: 50, dataPoints: ['No property info'] };
          const age = new Date().getFullYear() - property.yearBuilt;
          let score: number;
          if (age < 10) score = 15;
          else if (age < 25) score = 25;
          else if (age < 50) score = 45;
          else score = 70;
          return { score, dataPoints: [`Property age: ${age} years`] };
        },
      },
      {
        category: 'property',
        name: 'Construction Risk',
        weight: 0.2,
        extractor: (app) => {
          const property = app.propertyInfo;
          if (!property) return { score: 50, dataPoints: ['No property info'] };
          const scores: Record<string, number> = {
            wood_frame: 60,
            masonry: 35,
            steel_frame: 25,
            concrete: 20,
            manufactured: 75,
          };
          return {
            score: scores[property.constructionType] || 50,
            dataPoints: [
              `Construction: ${property.constructionType}`,
              `Roof type: ${property.roofType}`,
              `Roof age: ${property.roofAge} years`,
            ],
          };
        },
      },
      {
        category: 'property',
        name: 'Safety Features',
        weight: 0.15,
        extractor: (app) => {
          const property = app.propertyInfo;
          if (!property) return { score: 50, dataPoints: ['No property info'] };
          let score = 60;
          if (property.hasAlarm) score -= 15;
          if (property.hasSprinklers) score -= 20;
          return {
            score: Math.max(0, score),
            dataPoints: [
              `Alarm: ${property.hasAlarm}`,
              `Sprinklers: ${property.hasSprinklers}`,
            ],
          };
        },
      },
      {
        category: 'claims',
        name: 'Claims History',
        weight: 0.25,
        extractor: (app) => {
          const property = app.propertyInfo;
          if (!property) return { score: 50, dataPoints: ['No property info'] };
          const claims = property.claimsHistory.length;
          let score = claims * 20;
          const totalClaimAmount = property.claimsHistory.reduce(
            (sum, c) => sum + c.amount,
            0
          );
          if (totalClaimAmount > 100_000) score += 30;
          return {
            score: Math.min(100, score),
            dataPoints: [
              `Claims count: ${claims}`,
              `Total claim amount: $${totalClaimAmount.toLocaleString()}`,
            ],
          };
        },
      },
      {
        category: 'geographic',
        name: 'Flood Risk',
        weight: 0.2,
        extractor: (app) => {
          const property = app.propertyInfo;
          if (!property?.floodZone) return { score: 30, dataPoints: ['No flood data'] };
          const scores: Record<string, number> = {
            high: 90,
            moderate: 60,
            low: 25,
            minimal: 10,
          };
          return {
            score: scores[property.floodZone] || 50,
            dataPoints: [`Flood zone: ${property.floodZone}`],
          };
        },
      },
    ]);

    this.factorConfigs.set('life', [
      {
        category: 'health',
        name: 'Age Risk',
        weight: 0.25,
        extractor: (app) => {
          const age = this.calculateAge(app.applicant.dateOfBirth);
          let score: number;
          if (age < 30) score = 10;
          else if (age < 40) score = 25;
          else if (age < 50) score = 45;
          else if (age < 60) score = 65;
          else score = 85;
          return { score, dataPoints: [`Age: ${age}`] };
        },
      },
      {
        category: 'health',
        name: 'Health Status',
        weight: 0.3,
        extractor: (app) => {
          const health = app.applicant.healthHistory;
          if (!health) return { score: 50, dataPoints: ['No health info'] };
          let score = 20;
          if (health.smoker) score += 35;
          score += health.chronicConditions.length * 12;
          score += health.recentHospitalizations * 15;
          if (health.bmi) {
            if (health.bmi > 35) score += 20;
            else if (health.bmi > 30) score += 10;
            else if (health.bmi < 18.5) score += 10;
          }
          return {
            score: Math.min(100, score),
            dataPoints: [
              `Smoker: ${health.smoker}`,
              `Chronic conditions: ${health.chronicConditions.length}`,
              `BMI: ${health.bmi || 'N/A'}`,
            ],
          };
        },
      },
      {
        category: 'financial',
        name: 'Income Coverage Ratio',
        weight: 0.2,
        extractor: (app) => {
          const ratio = app.requestedCoverageAmount / (app.applicant.annualIncome || 1);
          let score: number;
          if (ratio < 5) score = 20;
          else if (ratio < 10) score = 40;
          else if (ratio < 15) score = 60;
          else score = 80;
          return { score, dataPoints: [`Coverage ratio: ${ratio.toFixed(1)}x income`] };
        },
      },
      {
        category: 'demographic',
        name: 'Occupation Risk',
        weight: 0.15,
        extractor: (app) => {
          const highRiskOccupations = [
            'construction',
            'mining',
            'fishing',
            'pilot',
            'firefighter',
            'police',
          ];
          const occupation = app.applicant.occupation.toLowerCase();
          const isHighRisk = highRiskOccupations.some((o) =>
            occupation.includes(o)
          );
          return {
            score: isHighRisk ? 70 : 30,
            dataPoints: [`Occupation: ${app.applicant.occupation}`],
          };
        },
      },
      {
        category: 'lifestyle',
        name: 'Lifestyle Factors',
        weight: 0.1,
        extractor: (app) => {
          let score = 30;
          if (app.applicant.maritalStatus === 'married') score -= 10;
          score += app.applicant.dependents * 3;
          return {
            score: Math.max(0, Math.min(100, score)),
            dataPoints: [
              `Marital status: ${app.applicant.maritalStatus}`,
              `Dependents: ${app.applicant.dependents}`,
            ],
          };
        },
      },
    ]);

    for (const type of ['health', 'commercial', 'umbrella', 'cyber', 'professional_liability'] as CoverageType[]) {
      if (!this.factorConfigs.has(type)) {
        this.factorConfigs.set(type, this.getDefaultFactors(type));
      }
    }
  }

  private getDefaultFactors(type: CoverageType): RiskFactorConfig[] {
    return [
      {
        category: 'general',
        name: 'Applicant Profile',
        weight: 0.3,
        extractor: (app) => ({
          score: 40,
          dataPoints: [
            `Income: $${app.applicant.annualIncome.toLocaleString()}`,
            `Occupation: ${app.applicant.occupation}`,
          ],
        }),
      },
      {
        category: 'financial',
        name: 'Financial Stability',
        weight: 0.3,
        extractor: (app) => {
          const creditScore = app.applicant.creditScore || 650;
          let score: number;
          if (creditScore >= 740) score = 20;
          else if (creditScore >= 670) score = 40;
          else score = 70;
          return { score, dataPoints: [`Credit score: ${creditScore}`] };
        },
      },
      {
        category: 'coverage',
        name: 'Coverage Demand',
        weight: 0.2,
        extractor: (app) => ({
          score: 50,
          dataPoints: [`Requested: $${app.requestedCoverageAmount.toLocaleString()}`],
        }),
      },
      {
        category: 'demographic',
        name: 'Demographic Risk',
        weight: 0.2,
        extractor: (app) => ({
          score: 35,
          dataPoints: [`State: ${app.applicant.address.state}`],
        }),
      },
    ];
  }

  calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  assessRisk(app: InsuranceApplication): RiskFactor[] {
    const configs = this.factorConfigs.get(app.coverageType) || [];
    return configs.map((config, index) => {
      const { score, dataPoints } = config.extractor(app);
      const impact = score > 50 ? 'negative' : score < 30 ? 'positive' : 'neutral';
      return {
        id: uuidv4(),
        category: config.category,
        name: config.name,
        description: `${config.name} assessment for ${app.coverageType} coverage`,
        weight: config.weight,
        score,
        impact,
        explanation: this.generateFactorExplanation(config.name, score, dataPoints),
        dataPoints,
      };
    });
  }

  private generateFactorExplanation(
    name: string,
    score: number,
    dataPoints: string[]
  ): string {
    let riskDesc: string;
    if (score < 25) riskDesc = 'very low risk';
    else if (score < 40) riskDesc = 'low risk';
    else if (score < 60) riskDesc = 'moderate risk';
    else if (score < 80) riskDesc = 'elevated risk';
    else riskDesc = 'high risk';

    return `${name} indicates ${riskDesc}. Key factors: ${dataPoints.join('; ')}.`;
  }
}

class UnderwritingAIEngine {
  private provider = getAIProviderClient();

  async analyzeApplication(
    app: InsuranceApplication,
    riskFactors: RiskFactor[]
  ): Promise<AIResponse> {
    const prompt = this.buildAnalysisPrompt(app, riskFactors);

    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance underwriter AI. Analyze insurance applications 
          and provide detailed risk assessments. Consider all risk factors, industry trends, 
          and regulatory requirements. Be thorough but concise in your analysis.
          
          Respond in JSON format with the following structure:
          {
            "riskLevel": "minimal|low|moderate|elevated|high|very_high|prohibitive",
            "riskScore": <number 0-100>,
            "confidence": <number 0-1>,
            "analysis": "<detailed analysis>",
            "recommendations": [{"type": "approve|decline|refer|modify", "reason": "...", "confidence": <number>}],
            "pricingAdjustments": [{"factor": "...", "adjustmentPercent": <number>, "reason": "..."}],
            "conditions": [{"type": "exclusion|limitation|requirement|endorsement", "description": "...", "mandatory": <boolean>}]
          }`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 2048,
      responseFormat: 'json',
    };

    return this.provider.complete(request);
  }

  private buildAnalysisPrompt(
    app: InsuranceApplication,
    riskFactors: RiskFactor[]
  ): string {
    const factorSummary = riskFactors
      .map(
        (f) =>
          `- ${f.name} (Score: ${f.score}/100, Weight: ${(f.weight * 100).toFixed(0)}%): ${f.explanation}`
      )
      .join('\n');

    return `Insurance Application Analysis Request:

APPLICANT INFORMATION:
- Name: ${app.applicant.firstName} ${app.applicant.lastName}
- Date of Birth: ${app.applicant.dateOfBirth}
- Occupation: ${app.applicant.occupation}
- Annual Income: $${app.applicant.annualIncome.toLocaleString()}
- Credit Score: ${app.applicant.creditScore || 'Not provided'}
- Marital Status: ${app.applicant.maritalStatus}
- Dependents: ${app.applicant.dependents}

COVERAGE DETAILS:
- Type: ${app.coverageType}
- Requested Amount: $${app.requestedCoverageAmount.toLocaleString()}
- Deductible: $${app.requestedDeductible.toLocaleString()}
- Effective: ${app.effectiveDate}
- Expiration: ${app.expirationDate}

${app.vehicleInfo ? `VEHICLE INFORMATION:
- Year/Make/Model: ${app.vehicleInfo.year} ${app.vehicleInfo.make} ${app.vehicleInfo.model}
- VIN: ${app.vehicleInfo.vin}
- Annual Mileage: ${app.vehicleInfo.annualMileage}
- Usage: ${app.vehicleInfo.usage}
- Anti-Theft: ${app.vehicleInfo.antiTheft}
` : ''}
${app.propertyInfo ? `PROPERTY INFORMATION:
- Year Built: ${app.propertyInfo.yearBuilt}
- Square Footage: ${app.propertyInfo.squareFootage}
- Construction: ${app.propertyInfo.constructionType}
- Roof: ${app.propertyInfo.roofType} (${app.propertyInfo.roofAge} years old)
- Claims History: ${app.propertyInfo.claimsHistory.length} claims
- Safety: Alarm=${app.propertyInfo.hasAlarm}, Sprinklers=${app.propertyInfo.hasSprinklers}
` : ''}
${app.businessInfo ? `BUSINESS INFORMATION:
- Industry: ${app.businessInfo.industry}
- Annual Revenue: $${app.businessInfo.annualRevenue.toLocaleString()}
- Employees: ${app.businessInfo.employeeCount}
- Years in Business: ${app.businessInfo.yearsInBusiness}
- Previous Claims: ${app.businessInfo.previousLiabilityClaims}
` : ''}
RISK FACTOR ASSESSMENT:
${factorSummary}

Please provide your comprehensive underwriting analysis with risk level, score, recommendations, pricing adjustments, and any conditions for coverage.`;
  }

  async generatePricingRecommendation(
    app: InsuranceApplication,
    riskScore: number,
    basePremium: number
  ): Promise<{
    recommendedPremium: number;
    adjustments: PricingAdjustment[];
    justification: string;
  }> {
    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an actuarial AI assistant. Based on the risk profile and base premium, 
          recommend pricing adjustments. Consider market conditions, competitive landscape, and 
          regulatory constraints. Respond in JSON format:
          {
            "recommendedPremium": <number>,
            "adjustments": [{"factor": "...", "adjustmentPercent": <number>, "reason": "...", "reversible": <boolean>}],
            "justification": "<explanation>"
          }`,
        },
        {
          role: 'user',
          content: `Base Premium: $${basePremium.toLocaleString()}
Risk Score: ${riskScore}/100
Coverage Type: ${app.coverageType}
Coverage Amount: $${app.requestedCoverageAmount.toLocaleString()}
Deductible: $${app.requestedDeductible.toLocaleString()}

Calculate recommended premium with detailed adjustments.`,
        },
      ],
      temperature: 0.2,
      maxTokens: 1024,
      responseFormat: 'json',
    };

    const response = await this.provider.complete(request);

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        recommendedPremium: basePremium * (1 + (riskScore - 50) / 200),
        adjustments: [],
        justification: 'Default adjustment based on risk score.',
      };
    }
  }
}

class UnderwritingService {
  private riskEngine: RiskScoringEngine;
  private aiEngine: UnderwritingAIEngine;
  private profiles: Map<string, UnderwritingProfile> = new Map();
  private rules: Map<string, UnderwritingRule> = new Map();

  constructor() {
    this.riskEngine = new RiskScoringEngine();
    this.aiEngine = new UnderwritingAIEngine();
    this.initializeDefaultProfiles();
    this.initializeDefaultRules();
  }

  private initializeDefaultProfiles(): void {
    const defaultProfiles: UnderwritingProfile[] = [
      {
        id: uuidv4(),
        name: 'Standard Auto',
        coverageType: 'auto',
        riskTolerance: 'moderate',
        maxCoverageAmount: 500_000,
        minCreditScore: 600,
        maxRiskScore: 70,
        requiredFactors: ['driving_record', 'credit_score'],
        excludedFactors: [],
        customRules: [],
      },
      {
        id: uuidv4(),
        name: 'Premium Home',
        coverageType: 'home',
        riskTolerance: 'conservative',
        maxCoverageAmount: 2_000_000,
        minCreditScore: 680,
        maxRiskScore: 55,
        requiredFactors: ['property_age', 'claims_history', 'flood_risk'],
        excludedFactors: [],
        customRules: [],
      },
      {
        id: uuidv4(),
        name: 'Term Life Standard',
        coverageType: 'life',
        riskTolerance: 'moderate',
        maxCoverageAmount: 1_000_000,
        minCreditScore: 580,
        maxRiskScore: 65,
        requiredFactors: ['health_status', 'age_risk', 'occupation'],
        excludedFactors: [],
        customRules: [],
      },
    ];

    for (const profile of defaultProfiles) {
      this.profiles.set(profile.id, profile);
    }
  }

  private initializeDefaultRules(): void {
    const defaultRules: UnderwritingRule[] = [
      {
        id: uuidv4(),
        name: 'Auto DUI Decline',
        description: 'Decline auto coverage for applicants with DUI in last 5 years',
        coverageType: 'auto',
        condition: 'applicant.drivingRecord.dui === true',
        action: 'decline',
        priority: 1,
        enabled: true,
        aiEnhanced: false,
        lastUpdated: new Date(),
      },
      {
        id: uuidv4(),
        name: 'High Value Home Referral',
        description: 'Refer homes over $1M to specialized underwriter',
        coverageType: 'home',
        condition: 'requestedCoverageAmount > 1000000',
        action: 'refer',
        priority: 2,
        enabled: true,
        aiEnhanced: false,
        lastUpdated: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Life Smoker Loading',
        description: 'Apply 50% loading for smokers on life insurance',
        coverageType: 'life',
        condition: 'applicant.healthHistory.smoker === true',
        action: 'modify',
        priority: 3,
        enabled: true,
        aiEnhanced: true,
        lastUpdated: new Date(),
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  async processApplication(
    application: InsuranceApplication
  ): Promise<RiskAssessment> {
    const startTime = Date.now();
    logger.info('Processing underwriting application', {
      applicationId: application.id,
      coverageType: application.coverageType,
    });

    const validatedApp = InsuranceApplicationSchema.parse(application);

    // Check pre-screening rules
    const ruleResult = this.evaluateRules(validatedApp);
    if (ruleResult.action === 'decline') {
      return {
        id: uuidv4(),
        applicationId: validatedApp.id,
        overallRiskLevel: 'prohibitive',
        overallScore: 1000,
        riskFactors: [],
        riskScore: 100,
        recommendations: [
          {
            type: 'decline',
            reason: ruleResult.reason,
            confidence: 0.95,
          },
        ],
        pricingAdjustments: [],
        conditions: [],
        aiAnalysis: `Application declined by automated rule: ${ruleResult.ruleName}`,
        confidence: 0.95,
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        version: 1,
      };
    }

    // Perform risk factor analysis
    const riskFactors = this.riskEngine.assessRisk(validatedApp);

    // Get AI analysis
    let aiAnalysis: string;
    let aiRecommendations: UnderwritingRecommendation[] = [];
    let pricingAdjustments: PricingAdjustment[] = [];
    let conditions: UnderwritingCondition[] = [];
    let confidence = 0.7;

    try {
      const aiResponse = await this.aiEngine.analyzeApplication(
        validatedApp,
        riskFactors
      );
      const analysis = JSON.parse(aiResponse.content);
      aiAnalysis = analysis.analysis || 'AI analysis completed.';
      confidence = analysis.confidence || 0.7;

      if (analysis.recommendations) {
        aiRecommendations = analysis.recommendations.map(
          (r: Record<string, unknown>) => ({
            type: r.type as UnderwritingRecommendation['type'],
            reason: r.reason as string,
            confidence: r.confidence as number,
          })
        );
      }
      if (analysis.pricingAdjustments) {
        pricingAdjustments = analysis.pricingAdjustments.map(
          (p: Record<string, unknown>) => ({
            factor: p.factor as string,
            adjustmentPercent: p.adjustmentPercent as number,
            reason: p.reason as string,
            reversible: p.reversible ?? true,
          })
        );
      }
      if (analysis.conditions) {
        conditions = analysis.conditions.map((c: Record<string, unknown>) => ({
          type: c.type as UnderwritingCondition['type'],
          description: c.description as string,
          mandatory: c.mandatory as boolean,
          impactOnPremium: (c.impactOnPremium as number) || 0,
        }));
      }
    } catch (error) {
      logger.warn('AI analysis failed, using rule-based assessment', {
        error: (error as Error).message,
      });
      aiAnalysis =
        'AI analysis unavailable. Assessment based on automated rules and risk scoring.';
    }

    // Calculate overall scores
    const weightedScore = riskFactors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    );
    const overallScore = Math.round(weightedScore * 10);
    const riskLevel = this.scoreToRiskLevel(weightedScore);

    // Combine rule and AI recommendations
    const allRecommendations: UnderwritingRecommendation[] = [
      ...aiRecommendations,
    ];
    if (ruleResult.action === 'refer') {
      allRecommendations.unshift({
        type: 'refer',
        reason: ruleResult.reason,
        confidence: 0.9,
      });
    }
    if (allRecommendations.length === 0) {
      allRecommendations.push({
        type: weightedScore < 50 ? 'approve' : 'refer',
        reason:
          weightedScore < 50
            ? 'Risk profile within acceptable parameters.'
            : 'Elevated risk profile requires manual review.',
        confidence: confidence,
      });
    }

    const assessment: RiskAssessment = {
      id: uuidv4(),
      applicationId: validatedApp.id,
      overallRiskLevel: riskLevel,
      overallScore,
      riskFactors,
      riskScore: Math.round(weightedScore),
      recommendations: allRecommendations,
      pricingAdjustments,
      conditions,
      aiAnalysis,
      confidence,
      processingTimeMs: Date.now() - startTime,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      version: 1,
    };

    logger.info('Underwriting assessment completed', {
      applicationId: validatedApp.id,
      riskLevel,
      overallScore,
      processingTimeMs: assessment.processingTimeMs,
    });

    return assessment;
  }

  private evaluateRules(
    app: InsuranceApplication
  ): { action: 'approve' | 'decline' | 'refer' | 'modify'; reason: string; ruleName: string } {
    const applicableRules = Array.from(this.rules.values())
      .filter((r) => r.enabled && r.coverageType === app.coverageType)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      if (this.evaluateCondition(rule.condition, app)) {
        return {
          action: rule.action,
          reason: rule.description,
          ruleName: rule.name,
        };
      }
    }

    return { action: 'approve', reason: 'No rules triggered', ruleName: 'default' };
  }

  private evaluateCondition(condition: string, app: InsuranceApplication): boolean {
    try {
      const evaluator = new Function('app', `return ${condition}`);
      return Boolean(evaluator(app));
    } catch {
      return false;
    }
  }

  private scoreToRiskLevel(score: number): RiskLevel {
    if (score < 15) return 'minimal';
    if (score < 30) return 'low';
    if (score < 45) return 'moderate';
    if (score < 60) return 'elevated';
    if (score < 75) return 'high';
    if (score < 90) return 'very_high';
    return 'prohibitive';
  }

  addProfile(profile: Omit<UnderwritingProfile, 'id'>): UnderwritingProfile {
    const newProfile: UnderwritingProfile = {
      ...profile,
      id: uuidv4(),
    };
    this.profiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  getProfile(id: string): UnderwritingProfile | undefined {
    return this.profiles.get(id);
  }

  getProfilesByType(type: CoverageType): UnderwritingProfile[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.coverageType === type
    );
  }

  addRule(rule: Omit<UnderwritingRule, 'id' | 'lastUpdated'>): UnderwritingRule {
    const newRule: UnderwritingRule = {
      ...rule,
      id: uuidv4(),
      lastUpdated: new Date(),
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  getRules(): UnderwritingRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(id: string, updates: Partial<UnderwritingRule>): UnderwritingRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const updated = { ...rule, ...updates, lastUpdated: new Date() };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRiskEngine(): RiskScoringEngine {
    return this.riskEngine;
  }

  getAIEngine(): UnderwritingAIEngine {
    return this.aiEngine;
  }
}

let serviceInstance: UnderwritingService | null = null;

export function getUnderwritingService(): UnderwritingService {
  if (!serviceInstance) {
    serviceInstance = new UnderwritingService();
  }
  return serviceInstance;
}

export { RiskScoringEngine, UnderwritingAIEngine, UnderwritingService };
