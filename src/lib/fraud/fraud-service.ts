import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export const FraudAlertSeverityServiceSchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
]);

export type FraudAlertSeverityService = z.infer<typeof FraudAlertSeverityServiceSchema>;

export const FraudTypeServiceSchema = z.enum([
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

export type FraudTypeService = z.infer<typeof FraudTypeServiceSchema>;

export const FraudStatusServiceSchema = z.enum([
  'detected',
  'investigating',
  'confirmed',
  'dismissed',
  'escalated',
  'referred_to_authorities',
]);

export type FraudStatusService = z.infer<typeof FraudStatusServiceSchema>;

export const InvestigationStatusSchema = z.enum([
  'open',
  'in_progress',
  'escalated',
  'awaiting_information',
  'closed_confirmed',
  'closed_dismissed',
  'referred',
]);

export type InvestigationStatus = z.infer<typeof InvestigationStatusSchema>;

export const FraudAlertSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  fraudType: FraudTypeServiceSchema,
  severity: FraudAlertSeverityServiceSchema,
  status: FraudStatusServiceSchema.default('detected'),
  confidence: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  indicators: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
      severity: FraudAlertSeverityServiceSchema,
      confidence: z.number().min(0).max(1),
      description: z.string(),
      evidence: z.array(z.string()),
      relatedEntityIds: z.array(z.string()),
      detectedAt: z.string().datetime(),
    })
  ),
  relatedEntityIds: z.array(z.string()),
  description: z.string(),
  assignedTo: z.string().uuid().optional(),
  investigationNotes: z.array(z.string()).default([]),
  estimatedLoss: z.number().min(0).default(0),
  priority: z.number().int().min(1).max(5),
  source: z.string().default('system'),
  metadata: z.record(z.unknown()).default({}),
});

export type FraudAlertService = z.infer<typeof FraudAlertSchema>;

export const InvestigationCaseSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  alertId: z.string().uuid(),
  status: InvestigationStatusSchema.default('open'),
  priority: z.number().int().min(1).max(5),
  assignedTo: z.string().uuid().optional(),
  assignedTeam: z.string().optional(),
  findings: z
    .array(
      z.object({
        id: z.string().uuid(),
        description: z.string(),
        severity: FraudAlertSeverityServiceSchema,
        confidence: z.number().min(0).max(1),
        sources: z.array(z.string()),
        createdAt: z.string().datetime(),
      })
    )
    .default([]),
  evidence: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum([
          'document',
          'statement',
          'financial_record',
          'digital_forensic',
          'surveillance',
          'public_record',
        ]),
        description: z.string(),
        url: z.string().optional(),
        hash: z.string().optional(),
        collectedAt: z.string().datetime(),
        collectedBy: z.string(),
        verified: z.boolean().default(false),
      })
    )
    .default([]),
  timeline: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        description: z.string(),
        timestamp: z.string().datetime(),
        actor: z.string(),
        outcome: z.string().optional(),
      })
    )
    .default([]),
  communications: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum(['email', 'phone', 'letter', 'in_person', 'system']),
        direction: z.enum(['inbound', 'outbound']),
        summary: z.string(),
        participants: z.array(z.string()),
        timestamp: z.string().datetime(),
      })
    )
    .default([]),
  resolution: z
    .object({
      type: z.enum([
        'confirmed_fraud',
        'dismissed',
        'settled',
        'referred_to_authorities',
        'inconclusive',
      ]),
      description: z.string(),
      recoveredAmount: z.number().min(0).optional(),
      legalAction: z.string().optional(),
      resolvedAt: z.string().datetime(),
      resolvedBy: z.string(),
    })
    .optional(),
  estimatedLoss: z.number().min(0).default(0),
  actualRecovery: z.number().min(0).default(0),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type InvestigationCaseService = z.infer<typeof InvestigationCaseSchema>;

export const FraudRuleSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  name: z.string().min(1),
  description: z.string(),
  fraudType: FraudTypeServiceSchema,
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(10),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'contains',
        'regex',
        'in',
        'between',
        'exists',
      ]),
      value: z.unknown(),
      logicalOperator: z.enum(['AND', 'OR']).optional(),
    })
  ),
  actions: z.array(
    z.object({
      type: z.enum([
        'alert',
        'flag',
        'block',
        'escalate',
        'investigate',
        'notify',
        'score_adjust',
        'hold_payment',
      ]),
      params: z.record(z.unknown()),
    })
  ),
  aiEnhanced: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  lastTriggered: z.string().datetime().optional(),
  triggerCount: z.number().int().min(0).default(0),
  falsePositiveRate: z.number().min(0).max(1).default(0),
  effectiveDate: z.string().datetime().default(() => new Date().toISOString()),
  expirationDate: z.string().datetime().optional(),
});

export type FraudRuleService = z.infer<typeof FraudRuleSchema>;

export interface FraudMetricsService {
  totalAlerts: number;
  alertsBySeverity: Record<FraudAlertSeverityService, number>;
  alertsByStatus: Record<FraudStatusService, number>;
  alertsByType: Record<FraudTypeService, number>;
  totalCases: number;
  casesByStatus: Record<InvestigationStatus, number>;
  totalRules: number;
  activeRules: number;
  averageInvestigationDays: number;
  totalEstimatedLoss: number;
  totalRecovery: number;
  recoveryRate: number;
  falsePositiveRate: number;
  monthlyTrend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  alerts: number;
  cases: number;
  confirmed: number;
  dismissed: number;
  recovery: number;
}

export interface FraudSearchParams {
  query?: string;
  severity?: FraudAlertSeverityService;
  status?: FraudStatusService;
  fraudType?: FraudTypeService;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  maxScore?: number;
  assignedTo?: string;
  sortBy?: 'score' | 'severity' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FraudSearchResults {
  alerts: FraudAlertService[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class FraudAlertManager {
  private alerts: Map<string, FraudAlertService> = new Map();

  createAlert(
    alert: Omit<FraudAlertService, 'id' | 'investigationNotes' | 'metadata'>
  ): FraudAlertService {
    const newAlert: FraudAlertService = {
      ...alert,
      id: uuidv4(),
      investigationNotes: [],
      metadata: {},
    };
    this.alerts.set(newAlert.id, newAlert);

    logger.info('Fraud alert created', {
      alertId: newAlert.id,
      fraudType: newAlert.fraudType,
      severity: newAlert.severity,
      score: newAlert.score,
    });

    return newAlert;
  }

  getAlert(id: string): FraudAlertService | undefined {
    return this.alerts.get(id);
  }

  updateAlertStatus(
    id: string,
    status: FraudStatusService,
    note?: string,
    actor?: string
  ): FraudAlertService | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    alert.status = status;
    if (note) {
      alert.investigationNotes.push(
        `[${actor || 'system'}] ${new Date().toISOString()}: ${note}`
      );
    }

    this.alerts.set(id, alert);
    return alert;
  }

  addNote(id: string, note: string, actor: string): FraudAlertService | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    alert.investigationNotes.push(
      `[${actor}] ${new Date().toISOString()}: ${note}`
    );
    this.alerts.set(id, alert);
    return alert;
  }

  searchAlerts(params: FraudSearchParams): FraudSearchResults {
    let results = Array.from(this.alerts.values());

    if (params.severity) {
      results = results.filter((a) => a.severity === params.severity);
    }
    if (params.status) {
      results = results.filter((a) => a.status === params.status);
    }
    if (params.fraudType) {
      results = results.filter((a) => a.fraudType === params.fraudType);
    }
    if (params.dateFrom) {
      results = results.filter(
        (a) => new Date(a.createdAt) >= new Date(params.dateFrom!)
      );
    }
    if (params.dateTo) {
      results = results.filter(
        (a) => new Date(a.createdAt) <= new Date(params.dateTo!)
      );
    }
    if (params.minScore !== undefined) {
      results = results.filter((a) => a.score >= params.minScore!);
    }
    if (params.maxScore !== undefined) {
      results = results.filter((a) => a.score <= params.maxScore!);
    }
    if (params.assignedTo) {
      results = results.filter((a) => a.assignedTo === params.assignedTo);
    }
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(
        (a) =>
          a.description.toLowerCase().includes(query) ||
          a.fraudType.toLowerCase().includes(query)
      );
    }

    const sortBy = params.sortBy || 'score';
    const sortOrder = params.sortOrder || 'desc';
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'severity': {
          const sevOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
          comparison = sevOrder[a.severity] - sevOrder[b.severity];
          break;
        }
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison =
            new Date(a.updatedAt || a.createdAt).getTime() -
            new Date(b.updatedAt || b.createdAt).getTime();
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return {
      alerts: paginated,
      total: results.length,
      page,
      limit,
      hasMore: start + limit < results.length,
    };
  }

  getAlertsByEntity(entityId: string): FraudAlertService[] {
    return Array.from(this.alerts.values()).filter((a) =>
      a.relatedEntityIds.includes(entityId)
    );
  }

  getAllAlerts(): FraudAlertService[] {
    return Array.from(this.alerts.values());
  }

  bulkUpdateStatus(
    ids: string[],
    status: FraudStatusService,
    actor: string
  ): number {
    let updated = 0;
    for (const id of ids) {
      const result = this.updateAlertStatus(id, status, `Bulk status update`, actor);
      if (result) updated++;
    }
    return updated;
  }

  deleteAlert(id: string): boolean {
    return this.alerts.delete(id);
  }

  getMetrics(): {
    total: number;
    bySeverity: Record<FraudAlertSeverityService, number>;
    byStatus: Record<FraudStatusService, number>;
    byType: Record<FraudTypeService, number>;
    totalEstimatedLoss: number;
  } {
    const alerts = Array.from(this.alerts.values());

    const bySeverity: Record<FraudAlertSeverityService, number> = {
      info: 0, low: 0, medium: 0, high: 0, critical: 0,
    };
    const byStatus: Record<FraudStatusService, number> = {
      detected: 0, investigating: 0, confirmed: 0, dismissed: 0,
      escalated: 0, referred_to_authorities: 0,
    };
    const byType: Record<FraudTypeService, number> = {
      identity_theft: 0, staged_accident: 0, exaggerated_claim: 0,
      phantom_claim: 0, premium_fraud: 0, agent_broker_fraud: 0,
      medical_provider_fraud: 0, arson: 0, salary_inflation: 0,
      pre_existing_condition: 0, fictitious_policy: 0, organised_fraud: 0,
    };

    let totalEstimatedLoss = 0;

    for (const alert of alerts) {
      bySeverity[alert.severity]++;
      byStatus[alert.status]++;
      byType[alert.fraudType]++;
      totalEstimatedLoss += alert.estimatedLoss;
    }

    return {
      total: alerts.length,
      bySeverity,
      byStatus,
      byType,
      totalEstimatedLoss,
    };
  }
}

class InvestigationManager {
  private cases: Map<string, InvestigationCaseService> = new Map();

  createCase(
    alert: FraudAlertService,
    assignedTo?: string,
    assignedTeam?: string
  ): InvestigationCaseService {
    const case_: InvestigationCaseService = {
      id: uuidv4(),
      alertId: alert.id,
      status: 'open',
      priority: alert.priority,
      assignedTo,
      assignedTeam,
      findings: [],
      evidence: [],
      timeline: [
        {
          id: uuidv4(),
          type: 'case_created',
          description: `Investigation opened for ${alert.fraudType} alert`,
          timestamp: new Date().toISOString(),
          actor: assignedTo || 'system',
        },
      ],
      communications: [],
      estimatedLoss: alert.estimatedLoss,
      actualRecovery: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.set(case_.id, case_);

    logger.info('Investigation case created', {
      caseId: case_.id,
      alertId: alert.id,
      priority: alert.priority,
    });

    return case_;
  }

  getCase(id: string): InvestigationCaseService | undefined {
    return this.cases.get(id);
  }

  updateCaseStatus(
    id: string,
    status: InvestigationStatus,
    actor: string,
    description?: string
  ): InvestigationCaseService | null {
    const case_ = this.cases.get(id);
    if (!case_) return null;

    const previousStatus = case_.status;
    case_.status = status;
    case_.updatedAt = new Date().toISOString();

    case_.timeline.push({
      id: uuidv4(),
      type: 'status_change',
      description: description || `Status changed from ${previousStatus} to ${status}`,
      timestamp: new Date().toISOString(),
      actor,
    });

    this.cases.set(id, case_);
    return case_;
  }

  addFinding(
    caseId: string,
    finding: Omit<InvestigationCaseService['findings'][0], 'id' | 'createdAt'>,
    actor: string
  ): InvestigationCaseService | null {
    const case_ = this.cases.get(caseId);
    if (!case_) return null;

    const newFinding = {
      ...finding,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    case_.findings.push(newFinding);
    case_.updatedAt = new Date().toISOString();

    case_.timeline.push({
      id: uuidv4(),
      type: 'finding_added',
      description: `New finding: ${finding.description}`,
      timestamp: new Date().toISOString(),
      actor,
    });

    this.cases.set(caseId, case_);
    return case_;
  }

  addEvidence(
    caseId: string,
    evidence: Omit<InvestigationCaseService['evidence'][0], 'id'>,
    actor: string
  ): InvestigationCaseService | null {
    const case_ = this.cases.get(caseId);
    if (!case_) return null;

    const newEvidence = {
      ...evidence,
      id: uuidv4(),
    };

    case_.evidence.push(newEvidence);
    case_.updatedAt = new Date().toISOString();

    case_.timeline.push({
      id: uuidv4(),
      type: 'evidence_added',
      description: `Evidence added: ${evidence.description}`,
      timestamp: new Date().toISOString(),
      actor,
    });

    this.cases.set(caseId, case_);
    return case_;
  }

  addCommunication(
    caseId: string,
    communication: Omit<InvestigationCaseService['communications'][0], 'id'>,
    actor: string
  ): InvestigationCaseService | null {
    const case_ = this.cases.get(caseId);
    if (!case_) return null;

    const newComm = {
      ...communication,
      id: uuidv4(),
    };

    case_.communications.push(newComm);
    case_.updatedAt = new Date().toISOString();

    case_.timeline.push({
      id: uuidv4(),
      type: 'communication_logged',
      description: `${communication.type} communication: ${communication.summary}`,
      timestamp: new Date().toISOString(),
      actor,
    });

    this.cases.set(caseId, case_);
    return case_;
  }

  resolveCase(
    caseId: string,
    resolution: InvestigationCaseService['resolution'],
    actor: string
  ): InvestigationCaseService | null {
    const case_ = this.cases.get(caseId);
    if (!case_) return null;

    case_.resolution = resolution;
    case_.status =
      resolution.type === 'confirmed_fraud'
        ? 'closed_confirmed'
        : resolution.type === 'dismissed'
        ? 'closed_dismissed'
        : 'closed_confirmed';
    case_.updatedAt = new Date().toISOString();

    if (resolution.recoveredAmount) {
      case_.actualRecovery = resolution.recoveredAmount;
    }

    case_.timeline.push({
      id: uuidv4(),
      type: 'case_resolved',
      description: `Case resolved: ${resolution.type} - ${resolution.description}`,
      timestamp: new Date().toISOString(),
      actor,
      outcome: resolution.type,
    });

    this.cases.set(caseId, case_);
    return case_;
  }

  searchCases(params: {
    status?: InvestigationStatus;
    assignedTo?: string;
    assignedTeam?: string;
    minPriority?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'priority' | 'createdAt' | 'updatedAt' | 'estimatedLoss';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): {
    cases: InvestigationCaseService[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  } {
    let results = Array.from(this.cases.values());

    if (params.status) {
      results = results.filter((c) => c.status === params.status);
    }
    if (params.assignedTo) {
      results = results.filter((c) => c.assignedTo === params.assignedTo);
    }
    if (params.assignedTeam) {
      results = results.filter((c) => c.assignedTeam === params.assignedTeam);
    }
    if (params.minPriority) {
      results = results.filter((c) => c.priority <= params.minPriority!);
    }
    if (params.dateFrom) {
      results = results.filter(
        (c) => new Date(c.createdAt) >= new Date(params.dateFrom!)
      );
    }
    if (params.dateTo) {
      results = results.filter(
        (c) => new Date(c.createdAt) <= new Date(params.dateTo!)
      );
    }

    const sortBy = params.sortBy || 'priority';
    const sortOrder = params.sortOrder || 'asc';
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'estimatedLoss':
          comparison = a.estimatedLoss - b.estimatedLoss;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return {
      cases: paginated,
      total: results.length,
      page,
      limit,
      hasMore: start + limit < results.length,
    };
  }

  getCasesByAlert(alertId: string): InvestigationCaseService[] {
    return Array.from(this.cases.values()).filter(
      (c) => c.alertId === alertId
    );
  }

  getAllCases(): InvestigationCaseService[] {
    return Array.from(this.cases.values());
  }

  getMetrics(): {
    total: number;
    byStatus: Record<InvestigationStatus, number>;
    totalEstimatedLoss: number;
    totalRecovery: number;
    averageDaysToResolve: number;
  } {
    const cases = Array.from(this.cases.values());

    const byStatus: Record<InvestigationStatus, number> = {
      open: 0, in_progress: 0, escalated: 0, awaiting_information: 0,
      closed_confirmed: 0, closed_dismissed: 0, referred: 0,
    };

    let totalEstimatedLoss = 0;
    let totalRecovery = 0;
    let totalResolveDays = 0;
    let resolvedCount = 0;

    for (const case_ of cases) {
      byStatus[case_.status]++;
      totalEstimatedLoss += case_.estimatedLoss;
      totalRecovery += case_.actualRecovery;

      if (case_.resolution) {
        const days = Math.floor(
          (new Date(case_.resolution.resolvedAt).getTime() -
            new Date(case_.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalResolveDays += days;
        resolvedCount++;
      }
    }

    return {
      total: cases.length,
      byStatus,
      totalEstimatedLoss,
      totalRecovery,
      averageDaysToResolve:
        resolvedCount > 0 ? totalResolveDays / resolvedCount : 0,
    };
  }
}

class FraudRuleEngineService {
  private rules: Map<string, FraudRuleService> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaults: FraudRuleService[] = [
      {
        id: uuidv4(),
        name: 'Rapid Claim Filing',
        description: 'Detect multiple claims within 30 days',
        fraudType: 'exaggerated_claim',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'entity.claims_30days', operator: 'greater_than', value: 3 },
        ],
        actions: [
          { type: 'alert', params: { severity: 'high' } },
          { type: 'investigate', params: { autoAssign: true } },
        ],
        aiEnhanced: true,
        tags: ['temporal', 'frequency'],
        triggerCount: 0,
        falsePositiveRate: 0.15,
        effectiveDate: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'High Value Claim',
        description: 'Flag claims exceeding $50,000',
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
        tags: ['financial', 'threshold'],
        triggerCount: 0,
        falsePositiveRate: 0.25,
        effectiveDate: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Early Claim After Inception',
        description: 'Claims within 60 days of policy start',
        fraudType: 'premium_fraud',
        enabled: true,
        priority: 2,
        conditions: [
          { field: 'policy.age_days', operator: 'less_than', value: 60 },
          { field: 'claim.amount', operator: 'greater_than', value: 5000, logicalOperator: 'AND' },
        ],
        actions: [
          { type: 'alert', params: { severity: 'medium' } },
          { type: 'score_adjust', params: { adjustment: 20 } },
        ],
        aiEnhanced: true,
        tags: ['temporal', 'policy_age'],
        triggerCount: 0,
        falsePositiveRate: 0.3,
        effectiveDate: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Identity Verification Failure',
        description: 'Low identity verification score',
        fraudType: 'identity_theft',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'identity.verification_score', operator: 'less_than', value: 0.5 },
        ],
        actions: [
          { type: 'alert', params: { severity: 'high' } },
          { type: 'investigate', params: { type: 'identity_verification' } },
        ],
        aiEnhanced: true,
        tags: ['identity', 'verification'],
        triggerCount: 0,
        falsePositiveRate: 0.1,
        effectiveDate: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Known Fraud Network',
        description: 'Entity connected to known fraud ring',
        fraudType: 'organised_fraud',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'entity.network_score', operator: 'greater_than', value: 0.7 },
        ],
        actions: [
          { type: 'alert', params: { severity: 'critical' } },
          { type: 'escalate', params: { to: 'fraud_unit' } },
          { type: 'hold_payment', params: { auto: true } },
        ],
        aiEnhanced: true,
        tags: ['network', 'organised'],
        triggerCount: 0,
        falsePositiveRate: 0.05,
        effectiveDate: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Medical Provider Anomaly',
        description: 'Unusual billing patterns from medical provider',
        fraudType: 'medical_provider_fraud',
        enabled: true,
        priority: 2,
        conditions: [
          { field: 'provider.billing_anomaly_score', operator: 'greater_than', value: 0.6 },
        ],
        actions: [
          { type: 'alert', params: { severity: 'high' } },
          { type: 'investigate', params: { type: 'medical_audit' } },
        ],
        aiEnhanced: true,
        tags: ['medical', 'billing'],
        triggerCount: 0,
        falsePositiveRate: 0.2,
        effectiveDate: new Date().toISOString(),
      },
    ];

    for (const rule of defaults) {
      this.rules.set(rule.id, rule);
    }
  }

  evaluate(data: Record<string, unknown>): FraudRuleService[] {
    const triggered: FraudRuleService[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const allMet = rule.conditions.every((condition, index) => {
        const result = this.evaluateCondition(condition, data);
        if (index > 0 && condition.logicalOperator === 'OR') {
          return result;
        }
        return result;
      });

      if (allMet) {
        rule.lastTriggered = new Date().toISOString();
        rule.triggerCount++;
        triggered.push(rule);
      }
    }

    return triggered.sort((a, b) => a.priority - b.priority);
  }

  private evaluateCondition(
    condition: FraudRuleService['conditions'][0],
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
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value as string);
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(condition.value as string).test(fieldValue);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'between': {
        const [min, max] = condition.value as [number, number];
        return typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max;
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

  addRule(
    rule: Omit<FraudRuleService, 'id' | 'triggerCount' | 'falsePositiveRate' | 'effectiveDate'>
  ): FraudRuleService {
    const newRule: FraudRuleService = {
      ...rule,
      id: uuidv4(),
      triggerCount: 0,
      falsePositiveRate: 0,
      effectiveDate: new Date().toISOString(),
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  updateRule(id: string, updates: Partial<FraudRuleService>): FraudRuleService | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const updated = { ...rule, ...updates };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  toggleRule(id: string, enabled: boolean): FraudRuleService | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    rule.enabled = enabled;
    this.rules.set(id, rule);
    return rule;
  }

  getRule(id: string): FraudRuleService | undefined {
    return this.rules.get(id);
  }

  getRules(): FraudRuleService[] {
    return Array.from(this.rules.values());
  }

  getRulesByType(fraudType: FraudTypeService): FraudRuleService[] {
    return Array.from(this.rules.values()).filter(
      (r) => r.fraudType === fraudType
    );
  }

  getActiveRules(): FraudRuleService[] {
    return Array.from(this.rules.values()).filter((r) => r.enabled);
  }

  getStats(): {
    total: number;
    active: number;
    byType: Record<FraudTypeService, number>;
    totalTriggers: number;
    avgFalsePositiveRate: number;
  } {
    const rules = Array.from(this.rules.values());
    const byType: Record<FraudTypeService, number> = {
      identity_theft: 0, staged_accident: 0, exaggerated_claim: 0,
      phantom_claim: 0, premium_fraud: 0, agent_broker_fraud: 0,
      medical_provider_fraud: 0, arson: 0, salary_inflation: 0,
      pre_existing_condition: 0, fictitious_policy: 0, organised_fraud: 0,
    };

    let totalTriggers = 0;
    let totalFpr = 0;

    for (const rule of rules) {
      byType[rule.fraudType]++;
      totalTriggers += rule.triggerCount;
      totalFpr += rule.falsePositiveRate;
    }

    return {
      total: rules.length,
      active: rules.filter((r) => r.enabled).length,
      byType,
      totalTriggers,
      avgFalsePositiveRate: rules.length > 0 ? totalFpr / rules.length : 0,
    };
  }
}

class FraudServiceOrchestrator {
  private alertManager: FraudAlertManager;
  private investigationManager: InvestigationManager;
  private ruleEngine: FraudRuleEngineService;

  constructor() {
    this.alertManager = new FraudAlertManager();
    this.investigationManager = new InvestigationManager();
    this.ruleEngine = new FraudRuleEngineService();
  }

  async processEvent(event: {
    entityType: string;
    entityId: string;
    eventType: string;
    data: Record<string, unknown>;
  }): Promise<{
    alerts: FraudAlertService[];
    cases: InvestigationCaseService[];
    rulesTriggered: string[];
  }> {
    logger.info('Processing fraud event', {
      entityType: event.entityType,
      entityId: event.entityId,
      eventType: event.eventType,
    });

    const rulesTriggered: string[] = [];
    const triggeredRules = this.ruleEngine.evaluate({
      ...event.data,
      entity: { ...event.data, entityType: event.entityType },
    });

    const alerts: FraudAlertService[] = [];
    const cases: InvestigationCaseService[] = [];

    for (const rule of triggeredRules) {
      rulesTriggered.push(rule.name);

      const severityAction = rule.actions.find((a) => a.type === 'alert');
      const severity =
        (severityAction?.params.severity as FraudAlertSeverityService) || 'medium';

      const alert = this.alertManager.createAlert({
        fraudType: rule.fraudType,
        severity,
        status: 'detected',
        confidence: 0.8,
        score: 60 + rule.priority * 5,
        indicators: [
          {
            id: uuidv4(),
            name: rule.name,
            category: rule.fraudType,
            severity,
            confidence: 0.8,
            description: rule.description,
            evidence: [`Rule triggered: ${rule.name}`],
            relatedEntityIds: [event.entityId],
            detectedAt: new Date().toISOString(),
          },
        ],
        relatedEntityIds: [event.entityId],
        description: `${rule.name}: ${rule.description}`,
        estimatedLoss: (event.data.amount as number) || 0,
        priority: rule.priority,
        source: 'rule_engine',
      });

      alerts.push(alert);

      const investigateAction = rule.actions.find(
        (a) => a.type === 'investigate'
      );
      if (investigateAction || alert.severity === 'critical' || alert.severity === 'high') {
        const case_ = this.investigationManager.createCase(alert);
        cases.push(case_);

        this.alertManager.updateAlertStatus(
          alert.id,
          'investigating',
          `Investigation case ${case_.id} created`,
          'system'
        );
      }
    }

    return { alerts, cases, rulesTriggered };
  }

  getAlertManager(): FraudAlertManager {
    return this.alertManager;
  }

  getInvestigationManager(): InvestigationManager {
    return this.investigationManager;
  }

  getRuleEngine(): FraudRuleEngineService {
    return this.ruleEngine;
  }

  getComprehensiveMetrics(): FraudMetricsService {
    const alertMetrics = this.alertManager.getMetrics();
    const caseMetrics = this.investigationManager.getMetrics();
    const ruleStats = this.ruleEngine.getStats();

    return {
      totalAlerts: alertMetrics.total,
      alertsBySeverity: alertMetrics.bySeverity,
      alertsByStatus: alertMetrics.byStatus,
      alertsByType: alertMetrics.byType,
      totalCases: caseMetrics.total,
      casesByStatus: caseMetrics.byStatus,
      totalRules: ruleStats.total,
      activeRules: ruleStats.active,
      averageInvestigationDays: caseMetrics.averageDaysToResolve,
      totalEstimatedLoss: alertMetrics.totalEstimatedLoss,
      totalRecovery: caseMetrics.totalRecovery,
      recoveryRate:
        caseMetrics.totalEstimatedLoss > 0
          ? caseMetrics.totalRecovery / caseMetrics.totalEstimatedLoss
          : 0,
      falsePositiveRate: ruleStats.avgFalsePositiveRate,
      monthlyTrend: [],
    };
  }
}

let orchestratorInstance: FraudServiceOrchestrator | null = null;

export function getFraudServiceOrchestrator(): FraudServiceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new FraudServiceOrchestrator();
  }
  return orchestratorInstance;
}

export {
  FraudAlertManager,
  InvestigationManager,
  FraudRuleEngineService,
  FraudServiceOrchestrator,
};
