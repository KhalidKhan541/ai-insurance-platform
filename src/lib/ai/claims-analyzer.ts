import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getAIProviderClient, type AIRequest } from './provider';
import { logger } from '@/lib/logger';

export const ClaimTypeSchema = z.enum([
  'auto_collision',
  'auto_comprehensive',
  'auto_liability',
  'property_damage',
  'property_theft',
  'property_weather',
  'property_liability',
  'bodily_injury',
  'personal_injury',
  'workers_compensation',
  'professional_liability',
  'cyber_incident',
  'product_liability',
  'business_interrupt',
]);

export type ClaimType = z.infer<typeof ClaimTypeSchema>;

export const ClaimPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export type ClaimPriority = z.infer<typeof ClaimPrioritySchema>;

export const ClaimDataSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  claimantId: z.string().uuid(),
  type: ClaimTypeSchema,
  priority: ClaimPrioritySchema.default('normal'),
  filedDate: z.string().datetime(),
  incidentDate: z.string().datetime(),
  reportedDate: z.string().datetime(),
  description: z.string().min(10),
  estimatedAmount: z.number().min(0),
  adjusterId: z.string().uuid().optional(),
  status: z.enum([
    'new',
    'acknowledged',
    'investigating',
    'pending_review',
    'approved',
    'denied',
    'settled',
    'closed',
  ]),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        name: z.string(),
        url: z.string(),
        size: z.number(),
        uploadedAt: z.string().datetime(),
        metadata: z.record(z.unknown()).default({}),
      })
    )
    .default([]),
  photos: z
    .array(
      z.object({
        id: z.string().uuid(),
        url: z.string(),
        caption: z.string().optional(),
        takenAt: z.string().datetime().optional(),
        gpsData: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
    )
    .default([]),
  witnesses: z
    .array(
      z.object({
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
        statement: z.string().optional(),
        relationship: z.string().optional(),
      })
    )
    .default([]),
  policeReport: z
    .object({
      reportNumber: z.string(),
      department: z.string(),
      filedDate: z.string().datetime(),
      officerName: z.string().optional(),
    })
    .optional(),
  weatherData: z
    .object({
      condition: z.string(),
      temperature: z.number(),
      windSpeed: z.number().optional(),
      visibility: z.string().optional(),
      precipitation: z.string().optional(),
    })
    .optional(),
  damageDetails: z
    .object({
      severity: z.enum(['minor', 'moderate', 'severe', 'total_loss']),
      affectedAreas: z.array(z.string()),
      repairEstimate: z.number().optional(),
      salvageValue: z.number().optional(),
      diminishedValue: z.number().optional(),
    })
    .optional(),
  medicalDetails: z
    .object({
      injuryType: z.string(),
      treatmentStatus: z.enum(['ongoing', 'completed', 'not_required']),
      providerName: z.string().optional(),
      totalMedicalCosts: z.number().optional(),
      prognosis: z.string().optional(),
      disabilityDays: z.number().int().min(0).optional(),
    })
    .optional(),
  vehicleInfo: z
    .object({
      year: z.number().int(),
      make: z.string(),
      model: z.string(),
      vin: z.string().optional(),
      mileage: z.number().int().optional(),
      preAccidentValue: z.number().optional(),
      damageDescription: z.string(),
    })
    .optional(),
  propertyInfo: z
    .object({
      address: z.string(),
      propertyType: z.string(),
      yearBuilt: z.number().int().optional(),
      damageDescription: z.string(),
      habitabilityStatus: z.enum(['habitable', 'partially_habitable', 'uninhabitable']),
    })
    .optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type ClaimData = z.infer<typeof ClaimDataSchema>;

export interface DamageAssessment {
  id: string;
  claimId: string;
  assessedBy: 'ai' | 'adjuster' | 'contractor';
  totalEstimate: number;
  lineItems: DamageLineItem[];
  methodology: string;
  confidence: number;
  assumptions: string[];
  exclusions: string[];
  notes: string;
  createdAt: Date;
}

export interface DamageLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  laborHours?: number;
  laborRate?: number;
  partsCost?: number;
  materialCost?: number;
  depreciationPercent?: number;
  replacementCost?: number;
  actualCashValue?: number;
}

export interface ClaimAnalysis {
  id: string;
  claimId: string;
  overallAssessment: string;
  fraudRiskScore: number;
  liabilityAssessment: LiabilityAssessment;
  damageAssessment: DamageAssessment;
  coverageAnalysis: CoverageAnalysis;
  recommendedActions: ClaimAction[];
  timeline: ClaimTimelineEvent[];
  estimatedSettlementRange: {
    low: number;
    mid: number;
    high: number;
  };
  processingRecommendation: string;
  aiConfidence: number;
  processingTimeMs: number;
  createdAt: Date;
}

export interface LiabilityAssessment {
  primaryLiability: 'claimant' | 'third_party' | 'shared' | 'undetermined';
  liabilitySplit?: number; // percentage attributed to third party
  negligenceFactors: string[];
  comparativeFault: boolean;
  legalConsiderations: string[];
  evidenceStrength: number; // 0-100
}

export interface CoverageAnalysis {
  covered: boolean;
  applicableCoverages: string[];
  coverageLimits: Record<string, number>;
  deductibles: Record<string, number>;
  exclusions: string[];
  endorsements: string[];
  coverageGaps: string[];
  policyStatus: 'active' | 'lapsed' | 'expired' | 'pending';
  subrogationPotential: boolean;
}

export interface ClaimAction {
  id: string;
  type:
    | 'request_documents'
    | 'schedule_inspection'
    | 'contact_claimant'
    | 'contact_witness'
    | 'obtain_police_report'
    | 'review_medical'
    | 'obtain_estimates'
    | 'escalate'
    | 'settle'
    | 'deny'
    | 'investigate';
  priority: ClaimPriority;
  description: string;
  dueDate?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ClaimTimelineEvent {
  id: string;
  date: Date;
  type: string;
  description: string;
  actor: string;
  outcome?: string;
}

export interface ClaimSettlement {
  id: string;
  claimId: string;
  offerAmount: number;
  negotiationHistory: NegotiationEntry[];
  finalAmount?: number;
  settlementType: 'full' | 'partial' | 'denied';
  releaseType: 'full_release' | 'partial_release' | 'no_release';
  conditions: string[];
  timeline: {
    offerDate: Date;
    responseDeadline: Date;
    settlementDate?: Date;
  };
  status: 'pending_offer' | 'offered' | 'negotiating' | 'accepted' | 'rejected' | 'settled';
}

export interface NegotiationEntry {
  id: string;
  date: Date;
  from: 'insurer' | 'claimant';
  amount: number;
  message: string;
  proposal?: string;
}

class ClaimDataExtractor {
  extractKeyInformation(claim: ClaimData): Record<string, unknown> {
    return {
      claimType: claim.type,
      priority: claim.priority,
      incidentDate: claim.incidentDate,
      filedDate: claim.filedDate,
      estimatedAmount: claim.estimatedAmount,
      documentCount: claim.documents.length,
      photoCount: claim.photos.length,
      witnessCount: claim.witnesses.length,
      hasPoliceReport: !!claim.policeReport,
      damageSeverity: claim.damageDetails?.severity || 'unknown',
      hasMedicalDetails: !!claim.medicalDetails,
      claimAge: this.calculateClaimAge(claim.filedDate),
      daysSinceIncident: this.daysBetween(claim.incidentDate, new Date().toISOString()),
    };
  }

  calculateClaimAge(filedDate: string): number {
    return this.daysBetween(filedDate, new Date().toISOString());
  }

  daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor(
      Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  extractDamageDescription(claim: ClaimData): string {
    const parts: string[] = [];

    if (claim.damageDetails) {
      parts.push(
        `Damage severity: ${claim.damageDetails.severity}`
      );
      parts.push(
        `Affected areas: ${claim.damageDetails.affectedAreas.join(', ')}`
      );
      if (claim.damageDetails.repairEstimate) {
        parts.push(`Repair estimate: $${claim.damageDetails.repairEstimate.toLocaleString()}`);
      }
    }

    if (claim.vehicleInfo) {
      parts.push(
        `Vehicle: ${claim.vehicleInfo.year} ${claim.vehicleInfo.make} ${claim.vehicleInfo.model}`
      );
      parts.push(`Damage: ${claim.vehicleInfo.damageDescription}`);
      if (claim.vehicleInfo.preAccidentValue) {
        parts.push(`Pre-accident value: $${claim.vehicleInfo.preAccidentValue.toLocaleString()}`);
      }
    }

    if (claim.propertyInfo) {
      parts.push(`Property: ${claim.propertyInfo.address}`);
      parts.push(`Type: ${claim.propertyInfo.propertyType}`);
      parts.push(`Damage: ${claim.propertyInfo.damageDescription}`);
      parts.push(`Habitability: ${claim.propertyInfo.habitabilityStatus}`);
    }

    return parts.join('\n');
  }

  extractMedicalSummary(claim: ClaimData): string {
    if (!claim.medicalDetails) return 'No medical details provided.';

    const md = claim.medicalDetails;
    return [
      `Injury type: ${md.injuryType}`,
      `Treatment status: ${md.treatmentStatus}`,
      `Provider: ${md.providerName || 'Not specified'}`,
      `Total costs: ${md.totalMedicalCosts ? `$${md.totalMedicalCosts.toLocaleString()}` : 'Pending'}`,
      `Prognosis: ${md.prognosis || 'Not determined'}`,
      `Disability days: ${md.disabilityDays || 0}`,
    ].join('\n');
  }
}

class DamageEstimator {
  private provider = getAIProviderClient();
  private extractor = new ClaimDataExtractor();

  async estimateDamage(claim: ClaimData): Promise<DamageAssessment> {
    const startTime = Date.now();
    logger.info('Estimating damage for claim', { claimId: claim.id });

    const damageDescription = this.extractor.extractDamageDescription(claim);
    const medicalSummary = this.extractor.extractMedicalSummary(claim);

    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance damage estimator. Analyze the claim details 
          and provide a detailed damage assessment with line-item cost estimates.
          
          Respond in JSON format:
          {
            "totalEstimate": <number>,
            "lineItems": [{
              "category": "...",
              "description": "...",
              "quantity": <number>,
              "unitCost": <number>,
              "totalCost": <number>,
              "laborHours": <number>,
              "laborRate": <number>,
              "partsCost": <number>,
              "depreciationPercent": <number>,
              "replacementCost": <number>,
              "actualCashValue": <number>
            }],
            "methodology": "...",
            "confidence": <number 0-1>,
            "assumptions": ["..."],
            "exclusions": ["..."],
            "notes": "..."
          }`,
        },
        {
          role: 'user',
          content: `DAMAGE ESTIMATION REQUEST:

Claim ID: ${claim.id}
Claim Type: ${claim.type}
Filed: ${claim.filedDate}
Incident: ${claim.incidentDate}

DAMAGE DESCRIPTION:
${damageDescription}

ESTIMATED AMOUNT (Claimant): $${claim.estimatedAmount.toLocaleString()}

${claim.photos.length > 0 ? `PHOTOS: ${claim.photos.length} photos submitted` : 'No photos submitted'}

${claim.medicalDetails ? `MEDICAL INFORMATION:\n${medicalSummary}` : ''}

Please provide a detailed damage assessment with line-item estimates.`,
        },
      ],
      temperature: 0.2,
      maxTokens: 2500,
      responseFormat: 'json',
    };

    const response = await this.provider.complete(request);

    try {
      const result = JSON.parse(response.content);
      return {
        id: uuidv4(),
        claimId: claim.id,
        assessedBy: 'ai',
        totalEstimate: result.totalEstimate || 0,
        lineItems: (result.lineItems || []).map(
          (item: Record<string, unknown>, index: number) => ({
            id: uuidv4(),
            category: (item.category as string) || `Item ${index + 1}`,
            description: (item.description as string) || '',
            quantity: (item.quantity as number) || 1,
            unitCost: (item.unitCost as number) || 0,
            totalCost: (item.totalCost as number) || 0,
            laborHours: item.laborHours as number | undefined,
            laborRate: item.laborRate as number | undefined,
            partsCost: item.partsCost as number | undefined,
            materialCost: item.materialCost as number | undefined,
            depreciationPercent: item.depreciationPercent as number | undefined,
            replacementCost: item.replacementCost as number | undefined,
            actualCashValue: item.actualCashValue as number | undefined,
          })
        ),
        methodology: result.methodology || 'AI-assisted estimation',
        confidence: result.confidence || 0.7,
        assumptions: result.assumptions || [],
        exclusions: result.exclusions || [],
        notes: result.notes || '',
        createdAt: new Date(),
      };
    } catch (error) {
      logger.warn('AI damage estimation failed, using basic estimate', {
        error: (error as Error).message,
      });
      return this.createBasicEstimate(claim);
    }
  }

  private createBasicEstimate(claim: ClaimData): DamageAssessment {
    const baseEstimate = claim.estimatedAmount || 5000;

    return {
      id: uuidv4(),
      claimId: claim.id,
      assessedBy: 'ai',
      totalEstimate: baseEstimate,
      lineItems: [
        {
          id: uuidv4(),
          category: 'General Damage',
          description: 'Estimated damage based on claim description',
          quantity: 1,
          unitCost: baseEstimate,
          totalCost: baseEstimate,
        },
      ],
      methodology: 'Basic estimation (AI unavailable)',
      confidence: 0.4,
      assumptions: [
        'Estimate based on claimant-reported amount',
        'No physical inspection conducted',
      ],
      exclusions: [],
      notes: 'Basic estimate provided. Physical inspection recommended.',
      createdAt: new Date(),
    };
  }

  compareEstimates(
    aiEstimate: DamageAssessment,
    claimantAmount: number
  ): {
    variance: number;
    variancePercent: number;
    assessment: string;
    recommendation: string;
  } {
    const variance = aiEstimate.totalEstimate - claimantAmount;
    const variancePercent =
      claimantAmount > 0
        ? ((variance / claimantAmount) * 100)
        : 0;

    let assessment: string;
    let recommendation: string;

    if (Math.abs(variancePercent) < 10) {
      assessment = 'Estimates are closely aligned.';
      recommendation = 'Proceed with standard review.';
    } else if (variancePercent > 30) {
      assessment = 'Claimant amount significantly exceeds AI estimate.';
      recommendation = 'Investigate potential inflation. Request additional documentation.';
    } else if (variancePercent < -30) {
      assessment = 'AI estimate significantly exceeds claimant amount.';
      recommendation = 'Verify completeness of claimant\'s damage report.';
    } else {
      assessment = 'Moderate variance between estimates.';
      recommendation = 'Review line items for discrepancies.';
    }

    return { variance, variancePercent, assessment, recommendation };
  }
}

class ClaimAnalyzer {
  private provider = getAIProviderClient();
  private extractor = new ClaimDataExtractor();

  async analyzeClaim(claim: ClaimData): Promise<ClaimAnalysis> {
    const startTime = Date.now();
    logger.info('Analyzing claim', {
      claimId: claim.id,
      type: claim.type,
      estimatedAmount: claim.estimatedAmount,
    });

    const keyInfo = this.extractor.extractKeyInformation(claim);
    const damageDescription = this.extractor.extractDamageDescription(claim);

    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance claim analyst. Analyze the claim comprehensively 
          covering liability, coverage, damage assessment, and recommended actions.
          
          Respond in JSON format:
          {
            "overallAssessment": "...",
            "fraudRiskScore": <number 0-100>,
            "liabilityAssessment": {
              "primaryLiability": "claimant|third_party|shared|undetermined",
              "liabilitySplit": <number>,
              "negligenceFactors": ["..."],
              "comparativeFault": <boolean>,
              "legalConsiderations": ["..."],
              "evidenceStrength": <number 0-100>
            },
            "coverageAnalysis": {
              "covered": <boolean>,
              "applicableCoverages": ["..."],
              "coverageLimits": {"type": <number>},
              "deductibles": {"type": <number>},
              "exclusions": ["..."],
              "endorsements": ["..."],
              "coverageGaps": ["..."],
              "policyStatus": "active|lapsed|expired|pending",
              "subrogationPotential": <boolean>
            },
            "recommendedActions": [{
              "type": "request_documents|schedule_inspection|contact_claimant|contact_witness|obtain_police_report|review_medical|obtain_estimates|escalate|settle|deny|investigate",
              "priority": "low|normal|high|urgent",
              "description": "...",
              "dueDate": "ISO date",
              "status": "pending"
            }],
            "estimatedSettlementRange": {"low": <number>, "mid": <number>, "high": <number>},
            "processingRecommendation": "...",
            "aiConfidence": <number 0-1>
          }`,
        },
        {
          role: 'user',
          content: `CLAIM ANALYSIS REQUEST:

CLAIM INFORMATION:
${JSON.stringify(keyInfo, null, 2)}

Claim Description: ${claim.description}

DAMAGE DETAILS:
${damageDescription}

${claim.witnesses.length > 0 ? `WITNESSES (${claim.witnesses.length}):\n${claim.witnesses.map((w) => `- ${w.name}: ${w.statement || 'No statement'}`).join('\n')}` : 'No witnesses'}

${claim.policeReport ? `POLICE REPORT:\n- Report #: ${claim.policeReport.reportNumber}\n- Department: ${claim.policeReport.department}\n- Filed: ${claim.policeReport.filedDate}` : 'No police report'}

${claim.weatherData ? `WEATHER:\n- Condition: ${claim.weatherData.condition}\n- Temp: ${claim.weatherData.temperature}°F\n- Wind: ${claim.weatherData.windSpeed || 'N/A'} mph` : ''}

Please provide your comprehensive claim analysis.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: 'json',
    };

    const response = await this.provider.complete(request);

    try {
      const result = JSON.parse(response.content);

      const timeline: ClaimTimelineEvent[] = [
        {
          id: uuidv4(),
          date: new Date(claim.filedDate),
          type: 'claim_filed',
          description: 'Claim filed by policyholder',
          actor: 'claimant',
        },
        {
          id: uuidv4(),
          date: new Date(),
          type: 'ai_analysis',
          description: 'AI analysis completed',
          actor: 'system',
          outcome: result.overallAssessment,
        },
      ];

      const actions: ClaimAction[] = (result.recommendedActions || []).map(
        (action: Record<string, unknown>) => ({
          id: uuidv4(),
          type: action.type,
          priority: action.priority || 'normal',
          description: action.description,
          dueDate: action.dueDate,
          status: 'pending' as const,
        })
      );

      return {
        id: uuidv4(),
        claimId: claim.id,
        overallAssessment: result.overallAssessment || 'Analysis completed',
        fraudRiskScore: result.fraudRiskScore || 0,
        liabilityAssessment: {
          primaryLiability:
            result.liabilityAssessment?.primaryLiability || 'undetermined',
          liabilitySplit: result.liabilityAssessment?.liabilitySplit,
          negligenceFactors:
            result.liabilityAssessment?.negligenceFactors || [],
          comparativeFault:
            result.liabilityAssessment?.comparativeFault || false,
          legalConsiderations:
            result.liabilityAssessment?.legalConsiderations || [],
          evidenceStrength:
            result.liabilityAssessment?.evidenceStrength || 50,
        },
        damageAssessment: {
          id: uuidv4(),
          claimId: claim.id,
          assessedBy: 'ai',
          totalEstimate: claim.estimatedAmount,
          lineItems: [],
          methodology: 'AI analysis',
          confidence: result.aiConfidence || 0.7,
          assumptions: [],
          exclusions: [],
          notes: '',
          createdAt: new Date(),
        },
        coverageAnalysis: {
          covered: result.coverageAnalysis?.covered ?? true,
          applicableCoverages:
            result.coverageAnalysis?.applicableCoverages || [],
          coverageLimits: result.coverageAnalysis?.coverageLimits || {},
          deductibles: result.coverageAnalysis?.deductibles || {},
          exclusions: result.coverageAnalysis?.exclusions || [],
          endorsements: result.coverageAnalysis?.endorsements || [],
          coverageGaps: result.coverageAnalysis?.coverageGaps || [],
          policyStatus: result.coverageAnalysis?.policyStatus || 'active',
          subrogationPotential:
            result.coverageAnalysis?.subrogationPotential || false,
        },
        recommendedActions: actions,
        timeline,
        estimatedSettlementRange: result.estimatedSettlementRange || {
          low: claim.estimatedAmount * 0.7,
          mid: claim.estimatedAmount * 0.9,
          high: claim.estimatedAmount * 1.1,
        },
        processingRecommendation:
          result.processingRecommendation || 'Standard processing',
        aiConfidence: result.aiConfidence || 0.7,
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.warn('AI claim analysis failed, using fallback', {
        error: (error as Error).message,
      });
      return this.createFallbackAnalysis(claim, Date.now() - startTime);
    }
  }

  private createFallbackAnalysis(
    claim: ClaimData,
    processingTimeMs: number
  ): ClaimAnalysis {
    return {
      id: uuidv4(),
      claimId: claim.id,
      overallAssessment:
        'Automated analysis unavailable. Manual review required.',
      fraudRiskScore: 0,
      liabilityAssessment: {
        primaryLiability: 'undetermined',
        negligenceFactors: [],
        comparativeFault: false,
        legalConsiderations: [],
        evidenceStrength: 0,
      },
      damageAssessment: {
        id: uuidv4(),
        claimId: claim.id,
        assessedBy: 'ai',
        totalEstimate: claim.estimatedAmount,
        lineItems: [],
        methodology: 'Fallback analysis',
        confidence: 0.3,
        assumptions: [],
        exclusions: [],
        notes: 'AI analysis unavailable',
        createdAt: new Date(),
      },
      coverageAnalysis: {
        covered: true,
        applicableCoverages: [],
        coverageLimits: {},
        deductibles: {},
        exclusions: [],
        endorsements: [],
        coverageGaps: [],
        policyStatus: 'active',
        subrogationPotential: false,
      },
      recommendedActions: [
        {
          id: uuidv4(),
          type: 'escalate',
          priority: 'high',
          description: 'Manual review required due to AI analysis failure',
          status: 'pending',
        },
      ],
      timeline: [
        {
          id: uuidv4(),
          date: new Date(),
          type: 'claim_filed',
          description: 'Claim filed',
          actor: 'claimant',
        },
      ],
      estimatedSettlementRange: {
        low: claim.estimatedAmount * 0.5,
        mid: claim.estimatedAmount,
        high: claim.estimatedAmount * 1.5,
      },
      processingRecommendation: 'Manual review required',
      aiConfidence: 0.3,
      processingTimeMs,
      createdAt: new Date(),
    };
  }

  async generateSettlementOffer(
    claim: ClaimData,
    analysis: ClaimAnalysis,
    estimate: DamageAssessment
  ): Promise<ClaimSettlement> {
    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an insurance settlement specialist. Based on the claim analysis 
          and damage estimate, recommend a settlement offer amount and strategy.
          
          Respond in JSON:
          {
            "recommendedOffer": <number>,
            "justification": "...",
            "negotiationStrategy": "...",
            "conditions": ["..."],
            "releaseType": "full_release|partial_release|no_release"
          }`,
        },
        {
          role: 'user',
          content: `SETTLEMENT RECOMMENDATION REQUEST:

Claim Amount: $${claim.estimatedAmount.toLocaleString()}
Damage Estimate: $${estimate.totalEstimate.toLocaleString()}
Fraud Risk: ${analysis.fraudRiskScore}/100
Settlement Range: $${analysis.estimatedSettlementRange.low.toLocaleString()} - $${analysis.estimatedSettlementRange.high.toLocaleString()}
Liability: ${analysis.liabilityAssessment.primaryLiability}
Coverage: ${analysis.coverageAnalysis.covered ? 'Covered' : 'Not covered'}

Please recommend a settlement offer.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 1000,
      responseFormat: 'json',
    };

    const response = await this.provider.complete(request);

    try {
      const result = JSON.parse(response.content);
      return {
        id: uuidv4(),
        claimId: claim.id,
        offerAmount: result.recommendedOffer || estimate.totalEstimate,
        negotiationHistory: [],
        settlementType: 'partial',
        releaseType: result.releaseType || 'full_release',
        conditions: result.conditions || [],
        timeline: {
          offerDate: new Date(),
          responseDeadline: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
        },
        status: 'pending_offer',
      };
    } catch {
      const offerAmount = Math.min(
        estimate.totalEstimate,
        analysis.estimatedSettlementRange.mid
      );
      return {
        id: uuidv4(),
        claimId: claim.id,
        offerAmount,
        negotiationHistory: [],
        settlementType: 'partial',
        releaseType: 'full_release',
        conditions: [],
        timeline: {
          offerDate: new Date(),
          responseDeadline: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
        },
        status: 'pending_offer',
      };
    }
  }
}

class ClaimProcessingPipeline {
  private analyzer: ClaimAnalyzer;
  private estimator: DamageEstimator;

  constructor() {
    this.analyzer = new ClaimAnalyzer();
    this.estimator = new DamageEstimator();
  }

  async processClaim(claim: ClaimData): Promise<{
    analysis: ClaimAnalysis;
    estimate: DamageAssessment;
    settlement?: ClaimSettlement;
    processingSummary: string;
  }> {
    const startTime = Date.now();
    logger.info('Starting claim processing pipeline', { claimId: claim.id });

    // Run analysis and estimation in parallel
    const [analysis, estimate] = await Promise.all([
      this.analyzer.analyzeClaim(claim),
      this.estimator.estimateDamage(claim),
    ]);

    // Compare estimates
    const comparison = this.estimator.compareEstimates(
      estimate,
      claim.estimatedAmount
    );

    // Generate settlement offer if claim is straightforward
    let settlement: ClaimSettlement | undefined;
    if (
      analysis.fraudRiskScore < 40 &&
      analysis.liabilityAssessment.primaryLiability !== 'undetermined' &&
      analysis.coverageAnalysis.covered
    ) {
      settlement = await this.analyzer.generateSettlementOffer(
        claim,
        analysis,
        estimate
      );
    }

    const totalProcessingTime = Date.now() - startTime;

    const processingSummary = [
      `Claim ${claim.id} processed in ${totalProcessingTime}ms.`,
      `AI Confidence: ${(analysis.aiConfidence * 100).toFixed(1)}%`,
      `Fraud Risk: ${analysis.fraudRiskScore}/100`,
      `Damage Estimate: $${estimate.totalEstimate.toLocaleString()} (vs claimant $${claim.estimatedAmount.toLocaleString()}, ${comparison.variancePercent.toFixed(1)}% variance)`,
      `Liability: ${analysis.liabilityAssessment.primaryLiability}`,
      `Coverage: ${analysis.coverageAnalysis.covered ? 'Covered' : 'Not covered'}`,
      `Recommended: ${analysis.processingRecommendation}`,
      settlement
        ? `Settlement Offer: $${settlement.offerAmount.toLocaleString()}`
        : 'Settlement: Pending manual determination',
    ].join('\n');

    logger.info('Claim processing pipeline completed', {
      claimId: claim.id,
      totalProcessingTime,
    });

    return {
      analysis,
      estimate,
      settlement,
      processingSummary,
    };
  }
}

let pipelineInstance: ClaimProcessingPipeline | null = null;

export function getClaimProcessingPipeline(): ClaimProcessingPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new ClaimProcessingPipeline();
  }
  return pipelineInstance;
}

export { ClaimDataExtractor, DamageEstimator, ClaimAnalyzer, ClaimProcessingPipeline };
