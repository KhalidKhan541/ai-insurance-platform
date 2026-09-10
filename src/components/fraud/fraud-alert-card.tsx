import React from "react";
import {
  AlertTriangle,
  Shield,
  Clock,
  User,
  FileText,
  DollarSign,
  Eye,
  ExternalLink,
  ChevronRight,
  Bot,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Flag,
  MoreVertical,
  RefreshCw,
} from "lucide-react";

export interface FraudAlert {
  id: string;
  claimId: string;
  claimNumber: string;
  policyNumber: string;
  alertType:
    | "identity_mismatch"
    | "duplicate_claim"
    | "suspicious_timing"
    | "amount_inflation"
    | "provider_fraud"
    | "staged_accident"
    | "frequency_anomaly"
    | "geographic_anomaly"
    | "network_fraud"
    | "ai_detected";
  severity: "low" | "medium" | "high" | "critical";
  status: "new" | "investigating" | "confirmed" | "false_positive" | "resolved";
  title: string;
  description: string;
  detectedAt: string;
  updatedAt: string;
  claimantName: string;
  claimantId: string;
  estimatedLoss: number;
  confidenceScore: number;
  riskScore: number;
  evidenceCount: number;
  assignedTo?: string;
  tags: string[];
  aiAnalysis?: {
    summary: string;
    factors: string[];
    recommendation: string;
  };
}

interface FraudAlertCardProps {
  alert: FraudAlert;
  onSelect?: (alert: FraudAlert) => void;
  onInvestigate?: (alert: FraudAlert) => void;
  onMarkFalsePositive?: (alert: FraudAlert) => void;
  onResolve?: (alert: FraudAlert) => void;
  variant?: "default" | "compact" | "detailed" | "dashboard";
  showActions?: boolean;
  className?: string;
}

const ALERT_TYPE_CONFIG: Record<
  FraudAlert["alertType"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  identity_mismatch: {
    icon: User,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Identity Mismatch",
  },
  duplicate_claim: {
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    label: "Duplicate Claim",
  },
  suspicious_timing: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Suspicious Timing",
  },
  amount_inflation: {
    icon: DollarSign,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Amount Inflation",
  },
  provider_fraud: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Provider Fraud",
  },
  staged_accident: {
    icon: Flag,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    label: "Staged Accident",
  },
  frequency_anomaly: {
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    label: "Frequency Anomaly",
  },
  geographic_anomaly: {
    icon: MapPin,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    label: "Geographic Anomaly",
  },
  network_fraud: {
    icon: Shield,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    label: "Network Fraud",
  },
  ai_detected: {
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "AI Detected",
  },
};

const SEVERITY_CONFIG: Record<
  FraudAlert["severity"],
  { color: string; bgColor: string; label: string }
> = {
  low: { color: "text-gray-600", bgColor: "bg-gray-100", label: "Low" },
  medium: { color: "text-amber-600", bgColor: "bg-amber-100", label: "Medium" },
  high: { color: "text-orange-600", bgColor: "bg-orange-100", label: "High" },
  critical: { color: "text-red-600", bgColor: "bg-red-100", label: "Critical" },
};

const STATUS_CONFIG: Record<
  FraudAlert["status"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  new: {
    icon: AlertCircle,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    label: "New",
  },
  investigating: {
    icon: Eye,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    label: "Investigating",
  },
  confirmed: {
    icon: CheckCircle,
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Confirmed",
  },
  false_positive: {
    icon: XCircle,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "False Positive",
  },
  resolved: {
    icon: CheckCircle,
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    label: "Resolved",
  },
};

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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return "text-red-600";
  if (score >= 60) return "text-orange-600";
  if (score >= 40) return "text-amber-600";
  return "text-gray-600";
}

const FraudAlertCard: React.FC<FraudAlertCardProps> = ({
  alert,
  onSelect,
  onInvestigate,
  onMarkFalsePositive,
  onResolve,
  variant = "default",
  showActions = true,
  className = "",
}) => {
  const alertConfig = ALERT_TYPE_CONFIG[alert.alertType];
  const severityConfig = SEVERITY_CONFIG[alert.severity];
  const statusConfig = STATUS_CONFIG[alert.status];
  const AlertIcon = alertConfig.icon;
  const StatusIcon = statusConfig.icon;

  if (variant === "compact") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group ${className}`}
        onClick={() => onSelect?.(alert)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${alertConfig.bgColor} shrink-0`}
            >
              <AlertIcon className={`w-4 h-4 ${alertConfig.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {alert.title}
              </p>
              <p className="text-xs text-gray-500">
                {alert.claimNumber} • {timeAgo(alert.detectedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${severityConfig.bgColor} ${severityConfig.color}`}
            >
              {alert.confidenceScore}%
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${className}`}
        onClick={() => onSelect?.(alert)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${alertConfig.bgColor} ${alertConfig.color}`}
            >
              {alertConfig.label}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${severityConfig.bgColor} ${severityConfig.color}`}
            >
              {severityConfig.label}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>

        <h4 className="text-sm font-bold text-gray-900 mb-1">{alert.title}</h4>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {alert.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{alert.claimNumber}</span>
            <span>{alert.claimantName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Confidence:</span>
            <span
              className={`text-xs font-bold ${getConfidenceColor(
                alert.confidenceScore
              )}`}
            >
              {alert.confidenceScore}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all ${className}`}
      >
        <div
          className={`p-6 ${
            alert.severity === "critical"
              ? "bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200"
              : alert.severity === "high"
              ? "bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200"
              : "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${alertConfig.bgColor}`}>
                <AlertIcon className={`w-6 h-6 ${alertConfig.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{alert.claimNumber}</span>
                  <span>•</span>
                  <span>{alert.policyNumber}</span>
                  <span>•</span>
                  <span>{timeAgo(alert.detectedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${alertConfig.bgColor} ${alertConfig.color}`}
              >
                {alertConfig.label}
              </span>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${severityConfig.bgColor} ${severityConfig.color}`}
              >
                {severityConfig.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">{alert.description}</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(alert.confidenceScore)}`}>
                {alert.confidenceScore}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {alert.riskScore}/100
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <p className="text-xs text-red-600 mb-1">Est. Loss</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(alert.estimatedLoss)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Evidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {alert.evidenceCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Claimant</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {alert.claimantName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-gray-400" />
                  ID: {alert.claimantId}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Timeline</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  Detected: {formatDate(alert.detectedAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Updated: {formatDate(alert.updatedAt)}
                </div>
                {alert.assignedTo && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    Assigned: {alert.assignedTo}
                  </div>
                )}
              </div>
            </div>
          </div>

          {alert.aiAnalysis && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-violet-600" />
                <h4 className="text-sm font-bold text-violet-900">
                  AI Analysis
                </h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                {alert.aiAnalysis.summary}
              </p>
              {alert.aiAnalysis.factors.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">
                    Key Factors:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.aiAnalysis.factors.map((factor, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white text-violet-700 rounded text-xs font-medium border border-violet-200"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-2 bg-white rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">
                  Recommendation:
                </p>
                <p className="text-xs text-gray-600">
                  {alert.aiAnalysis.recommendation}
                </p>
              </div>
            </div>
          )}

          {alert.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alert.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onSelect?.(alert)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Full Details
              </button>
              {alert.status === "new" && (
                <button
                  onClick={() => onInvestigate?.(alert)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Investigate
                </button>
              )}
              {alert.status === "investigating" && (
                <>
                  <button
                    onClick={() => onResolve?.(alert)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                  <button
                    onClick={() => onMarkFalsePositive?.(alert)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    False Positive
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
      onClick={() => onSelect?.(alert)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl ${alertConfig.bgColor} shrink-0`}
          >
            <AlertIcon className={`w-5 h-5 ${alertConfig.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {alert.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${alertConfig.bgColor} ${alertConfig.color}`}
              >
                {alertConfig.label}
              </span>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${severityConfig.bgColor} ${severityConfig.color}`}
              >
                {severityConfig.label}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-4 line-clamp-2">
        {alert.description}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Confidence</p>
          <p className={`text-lg font-bold ${getConfidenceColor(alert.confidenceScore)}`}>
            {alert.confidenceScore}%
          </p>
        </div>
        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Risk Score</p>
          <p className="text-lg font-bold text-gray-900">{alert.riskScore}</p>
        </div>
        <div className="text-center p-2.5 bg-red-50 rounded-lg">
          <p className="text-xs text-red-500 mb-0.5">Est. Loss</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(alert.estimatedLoss)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {alert.claimNumber}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {alert.claimantName}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo(alert.detectedAt)}
        </span>
      </div>

      {alert.aiAnalysis && (
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Bot className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">
              AI Insight
            </span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {alert.aiAnalysis.summary}
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInvestigate?.(alert);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Investigate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkFalsePositive?.(alert);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Dismiss
          </button>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      )}
    </div>
  );
};

export default FraudAlertCard;
