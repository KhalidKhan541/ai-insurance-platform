'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  User,
  FileText,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Flag,
  Brain,
  Zap,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

type FraudStatus = 'flagged' | 'investigating' | 'confirmed' | 'cleared' | 'escalated';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface FraudCase {
  id: string;
  caseId: string;
  claimId: string;
  policyId: string;
  clientName: string;
  clientAvatar: string;
  claimAmount: number;
  fraudProbability: number;
  riskLevel: RiskLevel;
  status: FraudStatus;
  flaggedBy: 'ai' | 'manual' | 'rule';
  flaggedDate: string;
  description: string;
  flags: string[];
  assignedTo?: string;
  policyType: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  medium: { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  low: { label: 'Low', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
};

const STATUS_CONFIG: Record<FraudStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  flagged: { label: 'Flagged', color: 'text-red-700', bgColor: 'bg-red-100', icon: Flag },
  investigating: { label: 'Investigating', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Search },
  confirmed: { label: 'Confirmed Fraud', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertTriangle },
  cleared: { label: 'Cleared', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle },
  escalated: { label: 'Escalated', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: ArrowUpRight },
};

const FLAGGED_CONFIG: Record<string, { label: string; color: string }> = {
  duplicate_claim: { label: 'Duplicate Claim', color: 'text-red-600' },
  suspicious_timing: { label: 'Suspicious Timing', color: 'text-orange-600' },
  inconsistent_amounts: { label: 'Inconsistent Amounts', color: 'text-amber-600' },
  provider_pattern: { label: 'Provider Pattern', color: 'text-purple-600' },
  address_mismatch: { label: 'Address Mismatch', color: 'text-blue-600' },
  frequent_claims: { label: 'Frequent Claims', color: 'text-rose-600' },
  staged_accident: { label: 'Staged Accident', color: 'text-red-700' },
  medical_anomaly: { label: 'Medical Anomaly', color: 'text-purple-700' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

const MOCK_FRAUD_CASES: FraudCase[] = [
  {
    id: '1',
    caseId: 'FRD-2024-0089',
    claimId: 'CL-2024-0234',
    policyId: 'AP-2024-1892',
    clientName: 'Robert Davis',
    clientAvatar: 'RD',
    claimAmount: 4200,
    fraudProbability: 87,
    riskLevel: 'critical',
    status: 'investigating',
    flaggedBy: 'ai',
    flaggedDate: '2024-01-15',
    description: 'AI detected duplicate claim submission with identical vehicle damage photos from a previous claim.',
    flags: ['duplicate_claim', 'suspicious_timing'],
    assignedTo: 'Fraud Unit - Agent Kim',
    policyType: 'Auto',
  },
  {
    id: '2',
    caseId: 'FRD-2024-0088',
    claimId: 'CL-2024-0230',
    policyId: 'HM-2024-0567',
    clientName: 'David Wilson',
    clientAvatar: 'DW',
    claimAmount: 18500,
    fraudProbability: 72,
    riskLevel: 'high',
    status: 'investigating',
    flaggedBy: 'ai',
    flaggedDate: '2024-01-14',
    description: 'Claim amount significantly exceeds typical water damage repairs. Provider billing patterns flagged.',
    flags: ['inconsistent_amounts', 'provider_pattern'],
    assignedTo: 'Fraud Unit - Agent Chen',
    policyType: 'Home',
  },
  {
    id: '3',
    caseId: 'FRD-2024-0087',
    claimId: 'CL-2024-0198',
    policyId: 'HL-2024-1234',
    clientName: 'Emily Garcia',
    clientAvatar: 'EG',
    claimAmount: 8900,
    fraudProbability: 65,
    riskLevel: 'high',
    status: 'flagged',
    flaggedBy: 'rule',
    flaggedDate: '2024-01-12',
    description: 'Multiple claims filed within 30-day period. Unusual medical provider billing pattern detected.',
    flags: ['frequent_claims', 'medical_anomaly'],
    policyType: 'Health',
  },
  {
    id: '4',
    caseId: 'FRD-2024-0086',
    claimId: 'CL-2024-0156',
    policyId: 'AP-2024-0912',
    clientName: 'Michael Brown',
    clientAvatar: 'MB',
    claimAmount: 12800,
    fraudProbability: 45,
    riskLevel: 'medium',
    status: 'cleared',
    flaggedBy: 'ai',
    flaggedDate: '2024-01-08',
    description: 'Accident scene photos showed inconsistencies. Upon investigation, photos matched reported conditions.',
    flags: ['suspicious_timing', 'staged_accident'],
    assignedTo: 'Fraud Unit - Agent Wilson',
    policyType: 'Auto',
  },
  {
    id: '5',
    caseId: 'FRD-2024-0085',
    claimId: 'CL-2024-0134',
    policyId: 'HM-2024-0623',
    clientName: 'James Martinez',
    clientAvatar: 'JM',
    claimAmount: 15200,
    fraudProbability: 91,
    riskLevel: 'critical',
    status: 'escalated',
    flaggedBy: 'ai',
    flaggedDate: '2024-01-05',
    description: 'Strong indicators of arson. Property had recent insurance increase and client financial distress detected.',
    flags: ['suspicious_timing', 'inconsistent_amounts', 'staged_accident'],
    assignedTo: 'Legal Team',
    policyType: 'Home',
  },
  {
    id: '6',
    caseId: 'FRD-2024-0084',
    claimId: 'CL-2024-0112',
    policyId: 'AP-2024-0689',
    clientName: 'Lisa Anderson',
    clientAvatar: 'LA',
    claimAmount: 3400,
    fraudProbability: 28,
    riskLevel: 'low',
    status: 'cleared',
    flaggedBy: 'manual',
    flaggedDate: '2024-01-03',
    description: 'Agent flagged minor inconsistency in damage report. Verified as reporting error.',
    flags: ['address_mismatch'],
    policyType: 'Auto',
  },
];

const MOCK_STATS = [
  { title: 'Total Cases', value: '89', change: 12.3, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Active Investigations', value: '23', change: -5.2, icon: Search, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { title: 'Fraud Confirmed', value: '12', change: 8.1, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  { title: 'Amount Saved', value: '$284K', change: 22.5, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
];

const MOCK_AI_INSIGHTS = [
  { metric: 'AI Detection Rate', value: '94.2%', description: 'Accuracy of AI fraud predictions', change: 2.1 },
  { metric: 'False Positive Rate', value: '3.8%', description: 'Cases incorrectly flagged', change: -1.2 },
  { metric: 'Avg. Investigation Time', value: '4.2 days', description: 'Time from flag to resolution', change: -8.5 },
  { metric: 'Recovery Rate', value: '67.3%', description: 'Fraudulent amounts recovered', change: 5.4 },
];

export default function FraudPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FraudStatus | 'all'>('all');
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);

  const filteredCases = MOCK_FRAUD_CASES.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claimId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRisk === 'all' || c.riskLevel === selectedRisk;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fraud Detection</h1>
            <p className="text-sm text-slate-500 mt-1">AI-powered fraud detection and investigation management</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="btn-primary">
              <Brain className="w-4 h-4" />
              Run AI Scan
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="card">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                  stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="card mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-purple-900">AI Fraud Detection Performance</h3>
              <p className="text-sm text-purple-700 mt-1">Real-time machine learning model performance metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MOCK_AI_INSIGHTS.map((insight, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-2xl font-bold text-slate-900">{insight.value}</p>
                <p className="text-xs font-medium text-slate-700 mt-1">{insight.metric}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{insight.description}</p>
                <div className={`flex items-center gap-0.5 text-xs font-semibold mt-2 ${
                  insight.change <= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {insight.change <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {Math.abs(insight.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases, clients, claim IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value as RiskLevel | 'all')}
                className="input w-36"
              >
                <option value="all">All Risk</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FraudStatus | 'all')}
                className="input w-40"
              >
                <option value="all">All Status</option>
                <option value="flagged">Flagged</option>
                <option value="investigating">Investigating</option>
                <option value="confirmed">Confirmed</option>
                <option value="cleared">Cleared</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map((fraudCase) => {
          const riskConfig = RISK_CONFIG[fraudCase.riskLevel];
          const statusConfig = STATUS_CONFIG[fraudCase.status];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={fraudCase.id}
              className={`card hover:shadow-lg transition-all cursor-pointer ${
                selectedCase?.id === fraudCase.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCase(selectedCase?.id === fraudCase.id ? null : fraudCase)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-600">{fraudCase.clientAvatar}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{fraudCase.clientName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskConfig.bgColor} ${riskConfig.color}`}>
                          {riskConfig.label} Risk
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fraudCase.caseId} · {fraudCase.claimId} · {fraudCase.policyType} Insurance
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{fraudCase.fraudProbability}%</p>
                        <p className="text-[10px] text-slate-500">Fraud Score</p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="transparent"
                            stroke={fraudCase.fraudProbability >= 80 ? '#ef4444' : fraudCase.fraudProbability >= 60 ? '#f59e0b' : '#22c55e'}
                            strokeWidth="4"
                            strokeDasharray={`${fraudCase.fraudProbability * 1.256} 125.6`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3">{fraudCase.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {fraudCase.flags.map((flag) => {
                      const flagConfig = FLAGGED_CONFIG[flag];
                      return (
                        <span key={flag} className={`px-2 py-0.5 rounded text-xs font-medium bg-slate-100 ${flagConfig?.color || 'text-slate-600'}`}>
                          {flagConfig?.label || flag}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Claim: {formatCurrency(fraudCase.claimAmount)}</span>
                    <span>Flagged: {fraudCase.flaggedDate}</span>
                    {fraudCase.assignedTo && <span>→ {fraudCase.assignedTo}</span>}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCase?.id === fraudCase.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Policy ID</p>
                        <p className="text-sm font-semibold text-slate-900">{fraudCase.policyId}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Flagged By</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{fraudCase.flaggedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Claim Amount</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(fraudCase.claimAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Assigned To</p>
                        <p className="text-sm font-semibold text-slate-900">{fraudCase.assignedTo || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {fraudCase.status !== 'cleared' && fraudCase.status !== 'confirmed' && (
                        <>
                          <button className="btn-primary btn-sm">
                            <CheckCircle className="w-4 h-4" />
                            Mark Cleared
                          </button>
                          <button className="btn-danger btn-sm">
                            <XCircle className="w-4 h-4" />
                            Confirm Fraud
                          </button>
                        </>
                      )}
                      {fraudCase.status !== 'escalated' && (
                        <button className="btn-secondary btn-sm">
                          <ArrowUpRight className="w-4 h-4" />
                          Escalate
                        </button>
                      )}
                      <button className="btn-ghost btn-sm">
                        <ExternalLink className="w-4 h-4" />
                        View Full Case
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fraud Trend Summary */}
      <div className="card mt-8">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Fraud Detection Trends</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">By Type</h4>
              <div className="space-y-2">
                {[
                  { type: 'Auto Claims', count: 34, percent: 38 },
                  { type: 'Home Claims', count: 28, percent: 31 },
                  { type: 'Health Claims', count: 18, percent: 20 },
                  { type: 'Other', count: 9, percent: 11 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.type}</span>
                      <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-blue-500" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Detection Source</h4>
              <div className="space-y-2">
                {[
                  { source: 'AI Detection', count: 52, percent: 58 },
                  { source: 'Rule Engine', count: 24, percent: 27 },
                  { source: 'Manual Flag', count: 13, percent: 15 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.source}</span>
                      <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-purple-500" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Resolution</h4>
              <div className="space-y-2">
                {[
                  { status: 'Cleared', count: 45, percent: 51, color: 'bg-emerald-500' },
                  { status: 'Confirmed Fraud', count: 12, percent: 13, color: 'bg-red-500' },
                  { status: 'Investigating', count: 23, percent: 26, color: 'bg-amber-500' },
                  { status: 'Escalated', count: 9, percent: 10, color: 'bg-purple-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.status}</span>
                      <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
