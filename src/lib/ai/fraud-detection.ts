import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getAIProviderClient, type AIRequest } from './provider';
import { logger } from '@/lib/logger';

export const FraudAlertSeveritySchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
]);

export type FraudAlertSeverity = z.infer<typeof FraudAlertSeveritySchema>;

export const FraudTypeSchema = z.enum([
  'identity_theft',
  'staged_accident',
  'exaggerated_claim',
  'phantom_claim',
  'premium_fraud',
  'agent_broker_fraud',
  'medical_provider_fraud',
  'arson',
  'salary_inflation',
  'pre_existing_condition',
  'fictitious_policy',
  'organised_fraud',
]);

export type FraudType = z.infer<typeof FraudTypeSchema>;

export const FraudStatusSchema = z.enum([
  'detected',
  'investigating',
  'confirmed',
  'dismissed',
  'escalated',
]);

export type FraudStatus = z.infer<typeof FraudStatusSchema>;

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'policy_application',
    'claim_filing',
    'payment',
    'policy_change',
    'communication',
    'document_submission',
  ]),
  entityId: z.string(),
  entityType: z.enum(['policy', 'claim', 'applicant', 'agent', 'provider']),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
  source: z.string(),
  ipAddress: z.string().optional(),
  deviceId: z.string().optional(),
  geolocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const ClaimSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  claimantId: z.string().uuid(),
  type: z.string(),
  filedDate: z.string().datetime(),
  incidentDate: z.string().datetime(),
  description: z.string(),
  amount: z.number().min(0),
  status: z.enum([
    'filed',
    'under_review',
    'investigating',
    'approved',
    'denied',
    'settled',
  ]),
  adjusterId: z.string().uuid().optional(),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        url: z.string(),
        uploadedAt: z.string().datetime(),
      })
    )
    .default([]),
  witnesses: z
    .array(
      z.object({
        name: z.string(),
        contact: z.string(),
        statement: z.string().optional(),
      })
    )
    .default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Claim = z.infer<typeof ClaimSchema>;

export interface FraudIndicator {
  id: string;
  name: string;
  category: string;
  severity: FraudAlertSeverity;
  confidence: number;
  description: string;
  evidence: string[];
  relatedEntityIds: string[];
  detectedAt: Date;
}

export interface FraudAlert {
  id: string;
  fraudType: FraudType;
  severity: FraudAlertSeverity;
  status: FraudStatus;
  confidence: number;
  score: number;
  indicators: FraudIndicator[];
  relatedEntityIds: string[];
  description: string;
  assignedTo?: string;
  investigationNotes: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  priority: number;
  estimatedLoss: number;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  fraudType: FraudType;
  enabled: boolean;
  priority: number;
  conditions: FraudRuleCondition[];
  actions: FraudRuleAction[];
  aiEnhanced: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  falsePositiveRate: number;
}

export interface FraudRuleCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'regex'
    | 'in'
    | 'between'
    | 'exists';
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export interface FraudRuleAction {
  type:
    | 'alert'
    | 'flag'
    | 'block'
    | 'escalate'
    | 'investigate'
    | 'notify'
    | 'score_adjust';
  params: Record<string, unknown>;
}

export interface FraudScore {
  entityId: string;
  entityType: string;
  overallScore: number;
  categoryScores: Record<FraudType, number>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: FraudIndicator[];
  modelVersion: string;
  calculatedAt: Date;
  factors: FraudScoreFactor[];
}

export interface FraudScoreFactor {
  name: string;
  weight: number;
  score: number;
  contribution: number;
  description: string;
}

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  patternType: 'temporal' | 'geographic' | 'behavioral' | 'financial' | 'network';
  detectionLogic: string;
  examples: string[];
  riskScore: number;
  occurrences: number;
  lastDetected: Date;
}

export interface InvestigationCase {
  id: string;
  alertId: string;
  status: 'open' | 'in_progress' | 'escalated' | 'closed';
  priority: number;
  assignedTo?: string;
  findings: InvestigationFinding[];
  evidence: InvestigationEvidence[];
  timeline: InvestigationEvent[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  resolution?: string;
}

export interface InvestigationFinding {
  id: string;
  description: string;
  severity: FraudAlertSeverity;
  confidence: number;
  sources: string[];
  createdAt: Date;
}

export interface InvestigationEvidence {
  id: string;
  type: 'document' | 'statement' | 'financial_record' | 'digital_forensic' | 'surveillance';
  description: string;
  url?: string;
  hash?: string;
  collectedAt: Date;
  collectedBy: string;
}

export interface InvestigationEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  actor: string;
}

interface NetworkNode {
  id: string;
  type: string;
  connections: string[];
  riskScore: number;
}

class AnomalyDetectionEngine {
  private patterns: Map<string, AnomalyPattern> = new Map();
  private transactionHistory: Map<string, Transaction[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    const defaultPatterns: AnomalyPattern[] = [
      {
        id: uuidv4(),
        name: 'Rapid Claim Filing',
        description: 'Multiple claims filed within short time window',
        patternType: 'temporal',
        detectionLogic: 'count(claims, 30days) > 3',
        examples: [
          'Filing 4 claims in 2 weeks',
          'Back-to-back claims every few days',
        ],
        riskScore: 80,
        occurrences: 0,
        lastDetected: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Geographic Anomaly',
        description: 'Transactions from unusual geographic locations',
        patternType: 'geographic',
        detectionLogic: 'distance(current, usual) > 500km',
        examples: [
          'Claim filed from different state than residence',
          'Multiple IPs from different countries',
        ],
        riskScore: 60,
        occurrences: 0,
        lastDetected: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Claim Amount Inflation',
        description: 'Claim amount significantly higher than similar claims',
        patternType: 'financial',
        detectionLogic: 'amount > percentile(95, similar_claims)',
        examples: [
          'Auto claim 3x average for similar damage',
          'Medical claim far above usual charges',
        ],
        riskScore: 70,
        occurrences: 0,
        lastDetected: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Network Collusion',
        description: 'Suspicious connections between parties in claims',
        patternType: 'network',
        detectionLogic: 'shared_entities(claim, provider, claimant) > 2',
        examples: [
          'Same doctor appears in multiple fraud cases',
          'Claimant and witness share address',
        ],
        riskScore: 85,
        occurrences: 0,
        lastDetected: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Behavioral Deviation',
        description: 'Unusual behavior patterns compared to history',
        patternType: 'behavioral',
        detectionLogic: 'deviation(score, historical) > 2std',
        examples: [
          'Sudden increase in claim frequency',
          'Change in communication patterns',
        ],
        riskScore: 55,
        occurrences: 0,
        lastDetected: new Date(),
      },
    ];

    for (const pattern of defaultPatterns) {
      this.patterns.set(pattern.id, pattern);
    }
  }

  analyzeTransaction(transaction: Transaction): FraudIndicator[] {
    const indicators: FraudIndicator[] = [];
    const history = this.transactionHistory.get(transaction.entityId) || [];

    // Temporal analysis
    const recentTransactions = history.filter(
      (t) =>
        new Date(t.timestamp).getTime() >
        Date.now() - 30 * 24 * 60 * 60 * 1000
    );
    if (transaction.type === 'claim_filing') {
      const recentClaims = recentTransactions.filter(
        (t) => t.type === 'claim_filing'
      );
      if (recentClaims.length >= 3) {
        indicators.push({
          id: uuidv4(),
          name: 'Rapid Claim Filing',
          category: 'temporal',
          severity: 'high',
          confidence: 0.85,
          description: `${recentClaims.length + 1} claims filed in the last 30 days`,
          evidence: [
            `Filing dates: ${recentClaims.map((t) => t.timestamp).join(', ')}`,
          ],
          relatedEntityIds: [transaction.entityId],
          detectedAt: new Date(),
        });
      }
    }

    // Financial anomaly detection
    if (
      transaction.type === 'claim_filing' &&
      typeof transaction.data.amount === 'number'
    ) {
      const claimAmounts = recentTransactions
        .filter((t) => typeof t.data.amount === 'number')
        .map((t) => t.data.amount as number);

      if (claimAmounts.length > 5) {
        const avg =
          claimAmounts.reduce((a, b) => a + b, 0) / claimAmounts.length;
        const stdDev = Math.sqrt(
          claimAmounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
            claimAmounts.length
        );
        const zScore =
          (transaction.data.amount as number - avg) / (stdDev || 1);

        if (zScore > 2.5) {
          indicators.push({
            id: uuidv4(),
            name: 'Claim Amount Outlier',
            category: 'financial',
            severity: 'medium',
            confidence: Math.min(0.95, 0.5 + zScore * 0.15),
            description: `Claim amount $${(transaction.data.amount as number).toLocaleString()} is ${zScore.toFixed(1)} standard deviations above average`,
            evidence: [
              `Average: $${avg.toLocaleString()}`,
              `This claim: $${(transaction.data.amount as number).toLocaleString()}`,
              `Z-score: ${zScore.toFixed(2)}`,
            ],
            relatedEntityIds: [transaction.entityId],
            detectedAt: new Date(),
          });
        }
      }
    }

    // Geographic analysis
    if (transaction.geolocation) {
      const previousLocations = history
        .filter((t) => t.geolocation)
        .map((t) => t.geolocation!);

      if (previousLocations.length > 0) {
        const avgLat =
          previousLocations.reduce((s, l) => s + l.lat, 0) /
          previousLocations.length;
        const avgLng =
          previousLocations.reduce((s, l) => s + l.lng, 0) /
          previousLocations.length;

        const distance = this.haversineDistance(
          transaction.geolocation.lat,
          transaction.geolocation.lng,
          avgLat,
          avgLng
        );

        if (distance > 500) {
          indicators.push({
            id: uuidv4(),
            name: 'Geographic Anomaly',
            category: 'geographic',
            severity: 'medium',
            confidence: Math.min(0.9, distance / 1000),
            description: `Transaction from ${distance.toFixed(0)}km away from usual location`,
            evidence: [
              `Current: (${transaction.geolocation.lat}, ${transaction.geolocation.lng})`,
              `Average: (${avgLat.toFixed(2)}, ${avgLng.toFixed(2)})`,
            ],
            relatedEntityIds: [transaction.entityId],
            detectedAt: new Date(),
          });
        }
      }
    }

    // Device/IP analysis
    if (transaction.ipAddress) {
      const recentIPs = recentTransactions
        .map((t) => t.ipAddress)
        .filter(Boolean);
      if (recentIPs.length > 0) {
        const uniqueIPs = new Set(recentIPs);
        if (uniqueIPs.size > 5) {
          indicators.push({
            id: uuidv4(),
            name: 'Multiple IP Addresses',
            category: 'behavioral',
            severity: 'low',
            confidence: 0.6,
            description: `${uniqueIPs.size} different IP addresses used recently`,
            evidence: [`IPs: ${Array.from(uniqueIPs).join(', ')}`],
            relatedEntityIds: [transaction.entityId],
            detectedAt: new Date(),
          });
        }
      }
    }

    // Store transaction
    const entityHistory = this.transactionHistory.get(transaction.entityId) || [];
    entityHistory.push(transaction);
    this.transactionHistory.set(transaction.entityId, entityHistory);

    return indicators;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getPatterns(): AnomalyPattern[] {
    return Array.from(this.patterns.values());
  }

  getTransactionHistory(entityId: string): Transaction[] {
    return this.transactionHistory.get(entityId) || [];
  }
}

class FraudRuleEngine {
  private rules: Map<string, FraudRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaults: FraudRule[] = [
      {
        id: uuidv4(),
        name: 'Multiple Claims Same Entity',
        description: 'Alert when entity files more than 3 claims in 30 days',
        fraudType: 'exaggerated_claim',
        enabled: true,
        priority: 1,
        conditions: [
          {
            field: 'entity.claims_30days',
            operator: 'greater_than',
            value: 3,
          },
        ],
        actions: [
          { type: 'alert', params: { severity: 'high' } },
          { type: 'investigate', params: { autoAssign: true } },
        ],
        aiEnhanced: true,
        lastTriggered: undefined,
        triggerCount: 0,
        falsePositiveRate: 0.15,
      },
      {
        id: uuidv4(),
        name: 'High Claim Amount',
        description: 'Flag claims exceeding $50,000 for review',
        fraudType: 'exaggerated_claim',
        enabled: true,
        priority: 2,
        conditions: [
          { field: 'claim.amount', operator: 'greater_than', value: 50000 },
        ],
        actions: [
          { type: 'flag', params: { reason: 'High value claim' } },
          { type: 'notify', params: { channel: 'senior_adjuster' } },
        ],
        aiEnhanced: false,
        lastTriggered: undefined,
        triggerCount: 0,
        falsePositiveRate: 0.25,
      },
      {
        id: uuidv4(),
        name: 'Claim Shortly After Policy',
        description: 'Alert for claims filed within 60 days of policy inception',
        fraudType: 'premium_fraud',
        enabled: true,
        priority: 2,
        conditions: [
          {
            field: 'policy.age_days',
            operator: 'less_than',
            value: 60,
          },
          {
            field: 'claim.amount',
            operator: 'greater_than',
            value: 5000,
            logicalOperator: 'AND',
          },
        ],
        actions: [
          { type: 'alert', params: { severity: 'medium' } },
          { type: 'score_adjust', params: { adjustment: 20 } },
        ],
        aiEnhanced: true,
        lastTriggered: undefined,
        triggerCount: 0,
        falsePositiveRate: 0.3,
      },
      {
        id: uuidv4(),
        name: 'Known Fraud Network',
        description: 'Detect connections to known fraud networks',
        fraudType: 'organised_fraud',
        enabled: true,
        priority: 1,
        conditions: [
          {
            field: 'entity.network_score',
            operator: 'greater_than',
            value: 0.7,
          },
        ],
        actions: [
          { type: 'alert', params: { severity: 'critical' } },
          { type: 'escalate', params: { to: 'fraud_unit' } },
          { type: 'block', params: { auto: true } },
        ],
        aiEnhanced: true,
        lastTriggered: undefined,
        triggerCount: 0,
        falsePositiveRate: 0.05,
      },
      {
        id: uuidv4(),
        name: 'Identity Mismatch',
        description: 'Flag discrepancies in identity information',
        fraudType: 'identity_theft',
        enabled: true,
        priority: 1,
        conditions: [
          {
            field: 'identity.verification_score',
            operator: 'less_than',
            value: 0.5,
          },
        ],
        actions: [
          { type: 'alert', params: { severity: 'high' } },
          { type: 'investigate', params: { type: 'identity_verification' } },
        ],
        aiEnhanced: true,
        lastTriggered: undefined,
        triggerCount: 0,
        falsePositiveRate: 0.1,
      },
    ];

    for (const rule of defaults) {
      this.rules.set(rule.id, rule);
    }
  }

  evaluate(data: Record<string, unknown>): FraudRule[] {
    const triggeredRules: FraudRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const allConditionsMet = rule.conditions.every((condition, index) => {
        const result = this.evaluateCondition(condition, data);
        if (index > 0 && condition.logicalOperator === 'OR') {
          return result;
        }
        return result;
      });

      if (allConditionsMet) {
        rule.lastTriggered = new Date();
        rule.triggerCount++;
        triggeredRules.push(rule);
      }
    }

    return triggeredRules.sort((a, b) => a.priority - b.priority);
  }

  private evaluateCondition(
    condition: FraudRuleCondition,
    data: Record<string, unknown>
  ): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          fieldValue.includes(condition.value as string)
        );
      case 'regex':
        return (
          typeof fieldValue === 'string' &&
          new RegExp(condition.value as string).test(fieldValue)
        );
      case 'in':
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      case 'between': {
        const [min, max] = condition.value as [number, number];
        return (
          typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max
        );
      }
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  addRule(rule: Omit<FraudRule, 'id' | 'triggerCount' | 'falsePositiveRate'>): FraudRule {
    const newRule: FraudRule = {
      ...rule,
      id: uuidv4(),
      triggerCount: 0,
      falsePositiveRate: 0,
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  updateRule(id: string, updates: Partial<FraudRule>): FraudRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const updated = { ...rule, ...updates };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRules(): FraudRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByType(fraudType: FraudType): FraudRule[] {
    return Array.from(this.rules.values()).filter(
      (r) => r.fraudType === fraudType
    );
  }
}

class FraudScoringModel {
  private weights: Record<string, number> = {
    claim_frequency: 0.2,
    claim_amount_deviation: 0.15,
    policy_age: 0.1,
    entity_history: 0.15,
    network_connections: 0.1,
    temporal_patterns: 0.1,
    geographic_risk: 0.1,
    document_anomalies: 0.1,
  };

  calculateScore(
    entityId: string,
    indicators: FraudIndicator[],
    transactionData: Record<string, unknown>
  ): FraudScore {
    const factors: FraudScoreFactor[] = [];
    let overallScore = 0;

    for (const [factorName, weight] of Object.entries(this.weights)) {
      const score = this.calculateFactorScore(
        factorName,
        indicators,
        transactionData
      );
      const contribution = score * weight;
      overallScore += contribution;

      factors.push({
        name: factorName,
        weight,
        score,
        contribution,
        description: this.getFactorDescription(factorName, score),
      });
    }

    const categoryScores = this.calculateCategoryScores(indicators);
    const riskLevel = this.scoreToRiskLevel(overallScore);

    return {
      entityId,
      entityType: (transactionData.entityType as string) || 'unknown',
      overallScore: Math.min(100, Math.round(overallScore)),
      categoryScores,
      riskLevel,
      indicators,
      modelVersion: '2.1.0',
      calculatedAt: new Date(),
      factors,
    };
  }

  private calculateFactorScore(
    factorName: string,
    indicators: FraudIndicator[],
    data: Record<string, unknown>
  ): number {
    const relatedIndicators = indicators.filter(
      (i) => i.category === factorName || i.name.toLowerCase().includes(factorName)
    );

    if (relatedIndicators.length > 0) {
      const maxScore = Math.max(
        ...relatedIndicators.map((i) => i.confidence * 100)
      );
      return Math.min(100, maxScore + relatedIndicators.length * 5);
    }

    // Fallback scoring based on data
    switch (factorName) {
      case 'claim_frequency':
        return Math.min(
          100,
          ((data.claims_count as number) || 0) * 15
        );
      case 'policy_age': {
        const ageDays = (data.policy_age_days as number) || 365;
        return ageDays < 30 ? 80 : ageDays < 90 ? 50 : 20;
      }
      case 'claim_amount_deviation':
        return Math.min(
          100,
          ((data.amount_deviation_zscore as number) || 0) * 20
        );
      default:
        return 30;
    }
  }

  private calculateCategoryScores(
    indicators: FraudIndicator[]
  ): Record<FraudType, number> {
    const scores: Record<FraudType, number> = {
      identity_theft: 0,
      staged_accident: 0,
      exaggerated_claim: 0,
      phantom_claim: 0,
      premium_fraud: 0,
      agent_broker_fraud: 0,
      medical_provider_fraud: 0,
      arson: 0,
      salary_inflation: 0,
      pre_existing_condition: 0,
      fictitious_policy: 0,
      organised_fraud: 0,
    };

    for (const indicator of indicators) {
      const matchingType = this.mapIndicatorToFraudType(indicator.name);
      if (matchingType) {
        scores[matchingType] = Math.min(
          100,
          scores[matchingType] + indicator.confidence * 30
        );
      }
    }

    return scores;
  }

  private mapIndicatorToFraudType(indicatorName: string): FraudType | null {
    const mapping: Record<string, FraudType> = {
      'rapid claim filing': 'exaggerated_claim',
      'claim amount outlier': 'exaggerated_claim',
      'geographic anomaly': 'staged_accident',
      'multiple ip addresses': 'identity_theft',
      'network collusion': 'organised_fraud',
      'identity mismatch': 'identity_theft',
      'document anomaly': 'phantom_claim',
      'premium deviation': 'premium_fraud',
    };

    const lowerName = indicatorName.toLowerCase();
    for (const [key, type] of Object.entries(mapping)) {
      if (lowerName.includes(key)) return type;
    }
    return null;
  }

  private scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private getFactorDescription(factorName: string, score: number): string {
    const descriptions: Record<string, string> = {
      claim_frequency: `Claim frequency score: ${score.toFixed(1)}/100`,
      claim_amount_deviation: `Amount deviation from norm: ${score.toFixed(1)}/100`,
      policy_age: `Policy maturity risk: ${score.toFixed(1)}/100`,
      entity_history: `Entity history risk: ${score.toFixed(1)}/100`,
      network_connections: `Network risk: ${score.toFixed(1)}/100`,
      temporal_patterns: `Temporal anomaly score: ${score.toFixed(1)}/100`,
      geographic_risk: `Geographic risk: ${score.toFixed(1)}/100`,
      document_anomalies: `Document anomaly score: ${score.toFixed(1)}/100`,
    };
    return descriptions[factorName] || `${factorName}: ${score.toFixed(1)}`;
  }
}

class FraudDetectionAI {
  private provider = getAIProviderClient();

  async analyzeForFraud(
    claim: Claim,
    indicators: FraudIndicator[],
    score: FraudScore
  ): Promise<{
    analysis: string;
    fraudProbability: number;
    recommendedActions: string[];
    suspiciousFactors: string[];
  }> {
    const request: AIRequest = {
      id: uuidv4(),
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert fraud detection analyst for an insurance company. Analyze the provided claim data, fraud indicators, and scoring to determine fraud probability and recommend actions. Respond in JSON:
          {
            "analysis": "<detailed analysis>",
            "fraudProbability": <number 0-1>,
            "recommendedActions": ["action1", "action2"],
            "suspiciousFactors": ["factor1", "factor2"]
          }`,
        },
        {
          role: 'user',
          content: `CLAIM ANALYSIS REQUEST:

Claim ID: ${claim.id}
Policy ID: ${claim.policyId}
Type: ${claim.type}
Amount: $${claim.amount.toLocaleString()}
Filed: ${claim.filedDate}
Incident: ${claim.incidentDate}
Description: ${claim.description}
Status: ${claim.status}
Witnesses: ${claim.witnesses.length}
Documents: ${claim.documents.length}

FRAUD SCORE: ${score.overallScore}/100 (${score.riskLevel} risk)

FRAUD INDICATORS:
${indicators.map((i) => `- ${i.name} (${i.severity}, ${(i.confidence * 100).toFixed(0)}% confidence): ${i.description}`).join('\n')}

SCORE FACTORS:
${score.factors.map((f) => `- ${f.name}: ${f.score.toFixed(1)} (weight: ${(f.weight * 100).toFixed(0)}%, contribution: ${f.contribution.toFixed(1)})`).join('\n')}

Please provide your fraud analysis with probability and recommended actions.`,
        },
      ],
      temperature: 0.2,
      maxTokens: 1500,
      responseFormat: 'json',
    };

    const response = await this.provider.complete(request);

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        analysis: 'AI analysis unavailable. Manual review recommended.',
        fraudProbability: score.overallScore / 100,
        recommendedActions: ['Manual review required'],
        suspiciousFactors: indicators.map((i) => i.name),
      };
    }
  }
}

class FraudService {
  private anomalyEngine: AnomalyDetectionEngine;
  private ruleEngine: FraudRuleEngine;
  private scoringModel: FraudScoringModel;
  private aiEngine: FraudDetectionAI;
  private alerts: Map<string, FraudAlert> = new Map();
  private cases: Map<string, InvestigationCase> = new Map();

  constructor() {
    this.anomalyEngine = new AnomalyDetectionEngine();
    this.ruleEngine = new FraudRuleEngine();
    this.scoringModel = new FraudScoringModel();
    this.aiEngine = new FraudDetectionAI();
  }

  async processTransaction(
    transaction: Transaction
  ): Promise<FraudAlert[]> {
    logger.info('Processing transaction for fraud detection', {
      transactionId: transaction.id,
      type: transaction.type,
      entityId: transaction.entityId,
    });

    // Run anomaly detection
    const anomalyIndicators =
      this.anomalyEngine.analyzeTransaction(transaction);

    // Run rule engine
    const triggeredRules = this.ruleEngine.evaluate({
      ...transaction.data,
      entity: { ...transaction.data, entityType: transaction.entityType },
      claim: transaction.data,
      policy: transaction.data,
    });

    // Convert triggered rules to indicators
    const ruleIndicators: FraudIndicator[] = triggeredRules.map((rule) => ({
      id: uuidv4(),
      name: rule.name,
      category: rule.fraudType,
      severity: this.mapRuleSeverity(rule),
      confidence: 0.8,
      description: rule.description,
      evidence: [`Rule triggered: ${rule.name}`],
      relatedEntityIds: [transaction.entityId],
      detectedAt: new Date(),
    }));

    const allIndicators = [...anomalyIndicators, ...ruleIndicators];

    if (allIndicators.length === 0) return [];

    // Calculate fraud score
    const score = this.scoringModel.calculateScore(
      transaction.entityId,
      allIndicators,
      transaction.data
    );

    // Get AI analysis
    let aiAnalysis: string | undefined;
    let recommendedActions: string[] = [];

    if (score.overallScore > 40) {
      try {
        const claim: Claim = {
          id: uuidv4(),
          policyId: transaction.entityId,
          claimantId: transaction.entityId,
          type: transaction.type,
          filedDate: transaction.timestamp,
          incidentDate: transaction.timestamp,
          description: JSON.stringify(transaction.data),
          amount: (transaction.data.amount as number) || 0,
          status: 'under_review',
          documents: [],
          witnesses: [],
          metadata: transaction.data,
        };

        const aiResult = await this.aiEngine.analyzeForFraud(
          claim,
          allIndicators,
          score
        );
        aiAnalysis = aiResult.analysis;
        recommendedActions = aiResult.recommendedActions;
      } catch (error) {
        logger.warn('AI fraud analysis failed', {
          error: (error as Error).message,
        });
      }
    }

    // Create alerts
    const alerts: FraudAlert[] = [];

    const primarySeverity = this.determineSeverity(score.overallScore);
    const fraudType = this.determinePrimaryFraudType(allIndicators);

    const alert: FraudAlert = {
      id: uuidv4(),
      fraudType,
      severity: primarySeverity,
      status: 'detected',
      confidence: Math.min(0.95, score.overallScore / 100 + 0.2),
      score: score.overallScore,
      indicators: allIndicators,
      relatedEntityIds: [transaction.entityId],
      description:
        aiAnalysis ||
        `Fraud indicators detected. Score: ${score.overallScore}/100. ${allIndicators.length} indicators found.`,
      investigationNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: this.calculatePriority(score.overallScore),
      estimatedLoss: this.estimatePotentialLoss(
        transaction,
        score.overallScore
      ),
    };

    this.alerts.set(alert.id, alert);
    alerts.push(alert);

    // Auto-create investigation case for high-risk alerts
    if (score.overallScore > 60) {
      const investigation = this.createInvestigationCase(alert);
      logger.info('Auto-created investigation case', {
        caseId: investigation.id,
        alertId: alert.id,
      });
    }

    logger.info('Fraud detection completed', {
      transactionId: transaction.id,
      alertCount: alerts.length,
      score: score.overallScore,
      severity: primarySeverity,
    });

    return alerts;
  }

  async processClaim(
    claim: Claim,
    policyData: Record<string, unknown>
  ): Promise<{
    score: FraudScore;
    alerts: FraudAlert[];
    recommendation: string;
  }> {
    // Build transaction from claim
    const transaction: Transaction = {
      id: uuidv4(),
      type: 'claim_filing',
      entityId: claim.policyId,
      entityType: 'claim',
      timestamp: claim.filedDate,
      data: {
        ...claim,
        ...policyData,
        amount: claim.amount,
        claims_count: 1,
      },
      source: 'claim_system',
    };

    const alerts = await this.processTransaction(transaction);

    // Calculate standalone score
    const indicators = alerts.flatMap((a) => a.indicators);
    const score = this.scoringModel.calculateScore(
      claim.claimantId,
      indicators,
      transaction.data
    );

    let recommendation: string;
    if (score.overallScore < 25) {
      recommendation = 'Standard processing. Low fraud risk.';
    } else if (score.overallScore < 50) {
      recommendation = 'Enhanced review recommended. Moderate risk indicators.';
    } else if (score.overallScore < 75) {
      recommendation = 'Investigation recommended. High risk indicators detected.';
    } else {
      recommendation = 'Immediate investigation required. Critical fraud risk.';
    }

    return { score, alerts, recommendation };
  }

  private createInvestigationCase(alert: FraudAlert): InvestigationCase {
    const case_: InvestigationCase = {
      id: uuidv4(),
      alertId: alert.id,
      status: 'open',
      priority: alert.priority,
      findings: [],
      evidence: [],
      timeline: [
        {
          id: uuidv4(),
          type: 'case_created',
          description: `Investigation case created for fraud alert: ${alert.fraudType}`,
          timestamp: new Date(),
          actor: 'system',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cases.set(case_.id, case_);
    return case_;
  }

  private mapRuleSeverity(rule: FraudRule): FraudAlertSeverity {
    if (rule.priority <= 1) return 'high';
    if (rule.priority <= 2) return 'medium';
    return 'low';
  }

  private determineSeverity(score: number): FraudAlertSeverity {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'info';
  }

  private determinePrimaryFraudType(
    indicators: FraudIndicator[]
  ): FraudType {
    const severityOrder: Record<FraudAlertSeverity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    let maxSeverity = 0;
    let primaryType: FraudType = 'exaggerated_claim';

    for (const indicator of indicators) {
      const sevVal = severityOrder[indicator.severity];
      if (sevVal > maxSeverity) {
        maxSeverity = sevVal;
        primaryType = indicator.category as FraudType;
      }
    }

    return primaryType;
  }

  private calculatePriority(score: number): number {
    if (score >= 80) return 1;
    if (score >= 60) return 2;
    if (score >= 40) return 3;
    return 4;
  }

  private estimatePotentialLoss(
    transaction: Transaction,
    score: number
  ): number {
    const amount = (transaction.data.amount as number) || 0;
    const multiplier = score / 100;
    return Math.round(amount * multiplier);
  }

  getAlert(id: string): FraudAlert | undefined {
    return this.alerts.get(id);
  }

  getAlerts(filters?: {
    severity?: FraudAlertSeverity;
    status?: FraudStatus;
    fraudType?: FraudType;
    limit?: number;
  }): FraudAlert[] {
    let results = Array.from(this.alerts.values());

    if (filters?.severity) {
      results = results.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status) {
      results = results.filter((a) => a.status === filters.status);
    }
    if (filters?.fraudType) {
      results = results.filter((a) => a.fraudType === filters.fraudType);
    }

    results.sort((a, b) => b.priority - a.priority);

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  updateAlertStatus(
    id: string,
    status: FraudStatus,
    note?: string
  ): FraudAlert | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    alert.status = status;
    alert.updatedAt = new Date();
    if (note) alert.investigationNotes.push(note);
    if (status === 'confirmed' || status === 'dismissed') {
      alert.resolvedAt = new Date();
    }

    return alert;
  }

  getCase(id: string): InvestigationCase | undefined {
    return this.cases.get(id);
  }

  getCases(filters?: {
    status?: InvestigationCase['status'];
    limit?: number;
  }): InvestigationCase[] {
    let results = Array.from(this.cases.values());

    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    results.sort((a, b) => b.priority - a.priority);

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  addFinding(
    caseId: string,
    finding: Omit<InvestigationFinding, 'id' | 'createdAt'>
  ): InvestigationFinding | null {
    const case_ = this.cases.get(caseId);
    if (!case_) return null;

    const newFinding: InvestigationFinding = {
      ...finding,
      id: uuidv4(),
      createdAt: new Date(),
    };

    case_.findings.push(newFinding);
    case_.timeline.push({
      id: uuidv4(),
      type: 'finding_added',
      description: `New finding: ${finding.description}`,
      timestamp: new Date(),
      actor: finding.sources[0] || 'investigator',
    });
    case_.updatedAt = new Date();

    return newFinding;
  }

  getAnomalyEngine(): AnomalyDetectionEngine {
    return this.anomalyEngine;
  }

  getRuleEngine(): FraudRuleEngine {
    return this.ruleEngine;
  }

  getScoringModel(): FraudScoringModel {
    return this.scoringModel;
  }

  getStats(): {
    totalAlerts: number;
    alertsBySeverity: Record<FraudAlertSeverity, number>;
    alertsByStatus: Record<FraudStatus, number>;
    totalCases: number;
    openCases: number;
    totalRules: number;
  } {
    const alerts = Array.from(this.alerts.values());
    const cases = Array.from(this.cases.values());

    const alertsBySeverity: Record<FraudAlertSeverity, number> = {
      info: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const alertsByStatus: Record<FraudStatus, number> = {
      detected: 0,
      investigating: 0,
      confirmed: 0,
      dismissed: 0,
      escalated: 0,
    };

    for (const alert of alerts) {
      alertsBySeverity[alert.severity]++;
      alertsByStatus[alert.status]++;
    }

    return {
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByStatus,
      totalCases: cases.length,
      openCases: cases.filter(
        (c) => c.status === 'open' || c.status === 'in_progress'
      ).length,
      totalRules: this.ruleEngine.getRules().length,
    };
  }
}

let serviceInstance: FraudService | null = null;

export function getFraudService(): FraudService {
  if (!serviceInstance) {
    serviceInstance = new FraudService();
  }
  return serviceInstance;
}

export {
  AnomalyDetectionEngine,
  FraudRuleEngine,
  FraudScoringModel,
  FraudDetectionAI,
  FraudService,
};
