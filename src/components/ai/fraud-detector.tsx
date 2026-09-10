import React from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Zap,
  Clock,
  User,
  FileText,
  DollarSign,
  MapPin,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ArrowRight,
  Info,
  Activity,
  Globe,
  Network,
  Calendar,
} from "lucide-react";

export interface FraudDetection {
  id: string;
  claimId: string;
  claimNumber: string;
  policyNumber: string;
  claimantName: string;
  claimantId: string;
  analyzedAt: string;
  status: "completed" | "processing" | "error";
  result?: {
    overallRiskScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    fraudProbability: number;
    confidenceScore: number;
    riskFactors: Array<{
      category: string;
      factor: string;
      score: number;
      weight: number;
      impact: "high" | "medium" | "low";
      detail: string;
      evidence?: string[];
    }>;
    patterns: Array<{
      type: string;
      description: string;
      severity: "info" | "warning" | "danger";
      relatedClaims?: string[];
    }>;
    networkAnalysis?: {
      connectedEntities: number;
      suspiciousConnections: number;
      ringRisk: boolean;
      networkScore: number;
      entities: Array<{
        name: string;
        relationship: string;
        riskScore: number;
      }>;
    };
    timelineAnomalies: Array<{
      event: string;
      expectedDate: string;
      actualDate: string;
      deviation: string;
      riskContribution: number;
    }>;
    recommendation: {
      action: "approve" | "investigate" | "deny" | "escalate";
      confidence: number;
      reasoning: string;
      requiredActions: string[];
      investigationPriority: "low" | "medium" | "high" | "urgent";
    };
    similarFraudCases: Array<{
      caseId: string;
      similarity: number;
      outcome: "confirmed_fraud" | "false_positive" | "pending";
      description: string;
    }>;
  };
}

interface FraudDetectorProps {
  detections: FraudDetection[];
  onViewDetails?: (detection: FraudDetection) => void;
  onInvestigate?: (detection: FraudDetection) => void;
  onMarkFalsePositive?: (detection: FraudDetection) => void;
  onRunDetection?: (claimId: string) => void;
  variant?: "default" | "detailed" | "dashboard";
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRiskConfig(level: string) {
  switch (level) {
    case "low":
      return {
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        gradient: "from-emerald-400 to-emerald-600",
      };
    case "medium":
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        gradient: "from-amber-400 to-amber-600",
      };
    case "high":
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        gradient: "from-orange-400 to-orange-600",
      };
    case "critical":
      return {
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        gradient: "from-red-400 to-red-600",
      };
    default:
      return {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        gradient: "from-gray-400 to-gray-600",
      };
  }
}

function getActionConfig(action: string) {
  switch (action) {
    case "approve":
      return {
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        label: "Approve",
      };
    case "investigate":
      return {
        icon: Eye,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        label: "Investigate",
      };
    case "deny":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        label: "Deny",
      };
    case "escalate":
      return {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        label: "Escalate",
      };
    default:
      return {
        icon: Clock,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        label: "Review",
      };
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "info":
      return { icon: Info, color: "text-blue-500" };
    case "warning":
      return { icon: AlertTriangle, color: "text-amber-500" };
    case "danger":
      return { icon: XCircle, color: "text-red-500" };
    default:
      return { icon: Info, color: "text-gray-500" };
  }
}

const FraudDetector: React.FC<FraudDetectorProps> = ({
  detections,
  onViewDetails,
  onInvestigate,
  onMarkFalsePositive,
  onRunDetection,
  variant = "default",
  className = "",
}) => {
  const [selectedDetection, setSelectedDetection] =
    React.useState<FraudDetection | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "factors" | "patterns" | "network" | "similar"
  >("overview");

  const stats = React.useMemo(() => {
    const completed = detections.filter((d) => d.status === "completed");
    const highRisk = completed.filter(
      (d) =>
        d.result?.riskLevel === "high" || d.result?.riskLevel === "critical"
    );
    const avgRisk =
      completed.length > 0
        ? completed.reduce(
            (sum, d) => sum + (d.result?.overallRiskScore || 0),
            0
          ) / completed.length
        : 0;
    const avgFraudProb =
      completed.length > 0
        ? completed.reduce(
            (sum, d) => sum + (d.result?.fraudProbability || 0),
            0
          ) / completed.length
        : 0;
    const totalEstLoss = completed.reduce(
      (sum, d) =>
        sum +
        (d.result?.fraudProbability || 0) *
          (d.result?.riskFactors.find((f) => f.category === "financial")
            ?.score || 0),
      0
    );

    return {
      total: detections.length,
      completed: completed.length,
      highRisk: highRisk.length,
      avgRisk: Math.round(avgRisk),
      avgFraudProb: Math.round(avgFraudProb),
      totalEstLoss,
    };
  }, [detections]);

  if (variant === "dashboard") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Fraud Detection System
            </h3>
            <p className="text-sm text-gray-500">
              AI-powered fraud analysis and monitoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 rounded-lg">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500">Total Scans</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">
                  {stats.highRisk}
                </p>
                <p className="text-xs text-gray-500">High Risk</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgFraudProb}%
                </p>
                <p className="text-xs text-gray-500">Avg Fraud Prob</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              Recent Detections
            </h4>
            <span className="text-xs text-gray-500">
              Showing last {Math.min(detections.length, 10)} results
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {detections.slice(0, 10).map((detection) => {
              const riskConfig = detection.result
                ? getRiskConfig(detection.result.riskLevel)
                : null;
              return (
                <div
                  key={detection.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedDetection(detection);
                    onViewDetails?.(detection);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          detection.result?.riskLevel === "critical"
                            ? "bg-red-500"
                            : detection.result?.riskLevel === "high"
                            ? "bg-orange-500"
                            : detection.result?.riskLevel === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {detection.claimNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {detection.claimantName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {detection.result && (
                        <>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${riskConfig?.bgColor} ${riskConfig?.color}`}
                          >
                            Risk: {detection.result.overallRiskScore}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {detection.result.fraudProbability}% fraud
                          </span>
                        </>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (selectedDetection?.result) {
    const result = selectedDetection.result;
    const riskConfig = getRiskConfig(result.riskLevel);
    const actionConfig = getActionConfig(result.recommendation.action);

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDetection(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Fraud Detection Report — {selectedDetection.claimNumber}
            </h3>
            <p className="text-sm text-gray-500">
              Analyzed {formatDate(selectedDetection.analyzedAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            className={`p-4 rounded-xl border ${riskConfig.borderColor} ${riskConfig.bgColor}`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">
              Risk Score
            </p>
            <p className={`text-2xl font-bold ${riskConfig.color}`}>
              {result.overallRiskScore}/100
            </p>
            <p
              className={`text-xs font-medium ${riskConfig.color} capitalize`}
            >
              {result.riskLevel}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Fraud Probability
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {result.fraudProbability}%
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-1">
              AI Confidence
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {result.confidenceScore}%
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${actionConfig.bgColor}`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">
              Recommendation
            </p>
            <p className={`text-xl font-bold ${actionConfig.color}`}>
              {actionConfig.label}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-1">Priority</p>
            <p
              className={`text-xl font-bold ${
                result.recommendation.investigationPriority === "urgent"
                  ? "text-red-600"
                  : result.recommendation.investigationPriority === "high"
                  ? "text-orange-600"
                  : result.recommendation.investigationPriority === "medium"
                  ? "text-amber-600"
                  : "text-gray-600"
              }`}
            >
              {result.recommendation.investigationPriority
                .charAt(0)
                .toUpperCase() +
                result.recommendation.investigationPriority.slice(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-200">
          {(
            ["overview", "factors", "patterns", "network", "similar"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                AI Analysis Summary
              </h4>
              <p className="text-sm text-gray-700">
                {result.recommendation.reasoning}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Risk Factor Overview
              </h4>
              <div className="space-y-3">
                {result.riskFactors.slice(0, 5).map((factor, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            factor.impact === "high"
                              ? "bg-red-500"
                              : factor.impact === "medium"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                          />
                        <span className="text-xs font-semibold text-gray-700">
                          {factor.category}: {factor.factor}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {factor.score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden ml-4">
                      <div
                        className={`h-full rounded-full ${
                          factor.impact === "high"
                            ? "bg-red-500"
                            : factor.impact === "medium"
                            ? "bg-amber-500"
                            : "bg-gray-400"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.timelineAnomalies.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="text-sm font-bold text-amber-900 mb-2">
                  Timeline Anomalies Detected
                </h4>
                <div className="space-y-2">
                  {result.timelineAnomalies.map((anomaly, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-amber-800">
                          {anomaly.event}:
                        </span>{" "}
                        <span className="text-amber-700">
                          {anomaly.deviation}
                        </span>
                        <span className="text-amber-500 ml-2">
                          (+{anomaly.riskContribution}% risk)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "factors" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.riskFactors.map((factor, i) => (
                <div
                  key={i}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">
                        {factor.category}
                      </span>
                      <h5 className="text-sm font-bold text-gray-900">
                        {factor.factor}
                      </h5>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          factor.impact === "high"
                            ? "text-red-600"
                            : factor.impact === "medium"
                            ? "text-amber-600"
                            : "text-gray-600"
                        }`}
                      >
                        {factor.score}
                      </p>
                      <p className="text-xs text-gray-400">
                        weight: {factor.weight}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{factor.detail}</p>
                  {factor.evidence && factor.evidence.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700">
                        Evidence:
                      </p>
                      {factor.evidence.map((ev, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1.5 text-xs text-gray-500"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          {ev}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Impact:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        factor.impact === "high"
                          ? "bg-red-100 text-red-700"
                          : factor.impact === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {factor.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {result.patterns.map((pattern, i) => {
                const sevConfig = getSeverityIcon(pattern.severity);
                const SevIcon = sevConfig.icon;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      pattern.severity === "danger"
                        ? "bg-red-50 border-red-200"
                        : pattern.severity === "warning"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <SevIcon
                        className={`w-5 h-5 ${sevConfig.color} mt-0.5 shrink-0`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {pattern.type}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              pattern.severity === "danger"
                                ? "bg-red-100 text-red-700"
                                : pattern.severity === "warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {pattern.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {pattern.description}
                        </p>
                        {pattern.relatedClaims &&
                          pattern.relatedClaims.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Related:
                              </span>
                              {pattern.relatedClaims.map((claim, j) => (
                                <span
                                  key={j}
                                  className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded"
                                >
                                  {claim}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "network" && result.networkAnalysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Connected Entities
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.networkAnalysis.connectedEntities}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-xs text-red-600 mb-1">
                  Suspicious Connections
                </p>
                <p className="text-2xl font-bold text-red-700">
                  {result.networkAnalysis.suspiciousConnections}
                </p>
              </div>
              <div
                className={`p-4 rounded-xl text-center ${
                  result.networkAnalysis.ringRisk
                    ? "bg-red-100 border border-red-300"
                    : "bg-emerald-50 border border-emerald-200"
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">Ring Risk</p>
                <p
                  className={`text-2xl font-bold ${
                    result.networkAnalysis.ringRisk
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  {result.networkAnalysis.ringRisk ? "YES" : "NO"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Network Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.networkAnalysis.networkScore}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-900">
                  Connected Entities
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {result.networkAnalysis.entities.map((entity, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Network className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {entity.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entity.relationship}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        entity.riskScore >= 70
                          ? "bg-red-100 text-red-700"
                          : entity.riskScore >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      Risk: {entity.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "similar" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {result.similarFraudCases.map((fraudCase, i) => (
                <div
                  key={i}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-900">
                        {fraudCase.caseId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          fraudCase.outcome === "confirmed_fraud"
                            ? "bg-red-100 text-red-700"
                            : fraudCase.outcome === "false_positive"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {fraudCase.outcome.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {fraudCase.similarity}% match
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{fraudCase.description}</p>
                </div>
              ))}
              {result.similarFraudCases.length === 0 && (
                <div className="p-8 text-center bg-gray-50 rounded-xl">
                  <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No similar fraud cases found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onInvestigate?.(selectedDetection)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Start Investigation
          </button>
          <button
            onClick={() => onMarkFalsePositive?.(selectedDetection)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Mark False Positive
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              AI Fraud Detector
            </h3>
            <p className="text-sm text-gray-500">
              Advanced fraud pattern detection and analysis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Detections</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">High Risk</p>
          <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Avg Risk Score</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgRisk}</p>
        </div>
      </div>

      <div className="space-y-3">
        {detections.map((detection) => {
          const riskConfig = detection.result
            ? getRiskConfig(detection.result.riskLevel)
            : null;

          return (
            <div
              key={detection.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setSelectedDetection(detection);
                onViewDetails?.(detection);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      detection.result?.riskLevel === "critical"
                        ? "bg-red-100"
                        : detection.result?.riskLevel === "high"
                        ? "bg-orange-50"
                        : detection.result?.riskLevel === "medium"
                        ? "bg-amber-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {detection.status === "completed" ? (
                      <Shield
                        className={`w-5 h-5 ${
                          detection.result?.riskLevel === "critical"
                            ? "text-red-600"
                            : detection.result?.riskLevel === "high"
                            ? "text-orange-600"
                            : detection.result?.riskLevel === "medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      />
                    ) : (
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {detection.claimNumber}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{detection.claimantName}</span>
                      <span>•</span>
                      <span>{detection.policyNumber}</span>
                      <span>•</span>
                      <span>{formatDate(detection.analyzedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {detection.result && (
                    <>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Risk</p>
                        <p
                          className={`text-lg font-bold ${riskConfig?.color}`}
                        >
                          {detection.result.overallRiskScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Fraud %</p>
                        <p className="text-lg font-bold text-gray-900">
                          {detection.result.fraudProbability}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className="text-lg font-bold text-gray-900">
                          {detection.result.confidenceScore}%
                        </p>
                      </div>
                    </>
                  )}
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FraudDetector;
