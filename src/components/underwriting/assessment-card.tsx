import React from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Bot,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart3,
  Target,
  Zap,
  Eye,
  Edit,
  MessageSquare,
  MoreVertical,
} from "lucide-react";

export interface UnderwritingAssessment {
  id: string;
  applicationId: string;
  applicantName: string;
  applicantId: string;
  type: "auto" | "home" | "health" | "life" | "business";
  status:
    | "pending"
    | "in_review"
    | "additional_info"
    | "approved"
    | "conditionally_approved"
    | "declined"
    | "appealed";
  submittedAt: string;
  lastUpdated: string;
  decisionDate?: string;
  underwriter?: string;
  riskScore: number;
  creditScore?: number;
  annualPremium: number;
  coverageAmount: number;
  recommendedAction: "accept" | "review" | "decline" | "counter";
  aiRecommendation?: {
    action: "accept" | "review" | "decline" | "counter";
    confidence: number;
    reasoning: string;
    factors: Array<{
      name: string;
      impact: "positive" | "negative" | "neutral";
      score: number;
      detail: string;
    }>;
  };
  documents: Array<{
    name: string;
    type: string;
    status: "uploaded" | "verified" | "rejected";
  }>;
  notes: Array<{
    author: string;
    content: string;
    timestamp: string;
  }>;
  conditions?: string[];
}

interface AssessmentCardProps {
  assessment: UnderwritingAssessment;
  onSelect?: (assessment: UnderwritingAssessment) => void;
  onApprove?: (assessment: UnderwritingAssessment) => void;
  onDecline?: (assessment: UnderwritingAssessment) => void;
  onRequestInfo?: (assessment: UnderwritingAssessment) => void;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  UnderwritingAssessment["type"],
  { color: string; bgColor: string; label: string }
> = {
  auto: { color: "text-blue-600", bgColor: "bg-blue-50", label: "Auto" },
  home: { color: "text-emerald-600", bgColor: "bg-emerald-50", label: "Home" },
  health: { color: "text-rose-600", bgColor: "bg-rose-50", label: "Health" },
  life: { color: "text-purple-600", bgColor: "bg-purple-50", label: "Life" },
  business: {
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Business",
  },
};

const STATUS_CONFIG: Record<
  UnderwritingAssessment["status"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Pending",
  },
  in_review: {
    icon: Eye,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "In Review",
  },
  additional_info: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Info Needed",
  },
  approved: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Approved",
  },
  conditionally_approved: {
    icon: CheckCircle,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    label: "Conditional",
  },
  declined: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Declined",
  },
  appealed: {
    icon: AlertTriangle,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Appealed",
  },
};

const ACTION_CONFIG: Record<
  UnderwritingAssessment["recommendedAction"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  accept: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    label: "Accept",
  },
  review: {
    icon: Eye,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Review",
  },
  decline: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Decline",
  },
  counter: {
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Counter",
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
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onSelect,
  onApprove,
  onDecline,
  onRequestInfo,
  variant = "default",
  showActions = true,
  className = "",
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const typeConfig = TYPE_CONFIG[assessment.type];
  const statusConfig = STATUS_CONFIG[assessment.status];
  const actionConfig = ACTION_CONFIG[assessment.recommendedAction];
  const StatusIcon = statusConfig.icon;
  const ActionIcon = actionConfig.icon;

  if (variant === "compact") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group ${className}`}
        onClick={() => onSelect?.(assessment)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.bgColor}`}
            >
              <span className={`text-sm font-bold ${typeConfig.color}`}>
                {assessment.type.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {assessment.applicantName}
              </p>
              <p className="text-xs text-gray-500">
                {assessment.applicationId} • {typeConfig.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${actionConfig.bgColor} ${actionConfig.color}`}
            >
              {assessment.riskScore}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
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
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${typeConfig.bgColor}`}>
                <span className={`text-lg font-bold ${typeConfig.color}`}>
                  {assessment.type.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {assessment.applicantName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{assessment.applicationId}</span>
                  <span>•</span>
                  <span>{typeConfig.label} Insurance</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Risk Score</p>
              <p className={`text-2xl font-bold ${
                assessment.riskScore <= 30
                  ? "text-emerald-600"
                  : assessment.riskScore <= 60
                  ? "text-amber-600"
                  : "text-red-600"
              }`}>
                {assessment.riskScore}/100
              </p>
            </div>
            {assessment.creditScore && (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessment.creditScore}
                </p>
              </div>
            )}
            <div className="p-4 bg-indigo-50 rounded-xl text-center">
              <p className="text-xs text-indigo-600 mb-1">Annual Premium</p>
              <p className="text-2xl font-bold text-indigo-700">
                {formatCurrency(assessment.annualPremium)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Coverage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(assessment.coverageAmount)}
              </p>
            </div>
          </div>

          {assessment.aiRecommendation && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-violet-600" />
                <h4 className="text-sm font-bold text-violet-900">
                  AI Recommendation
                </h4>
                <span className="text-xs text-violet-600 ml-auto">
                  {assessment.aiRecommendation.confidence}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                {assessment.aiRecommendation.reasoning}
              </p>
              {assessment.aiRecommendation.factors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Key Factors:
                  </p>
                  {assessment.aiRecommendation.factors.map((factor, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-white rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          factor.impact === "positive"
                            ? "bg-emerald-500"
                            : factor.impact === "negative"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">
                            {factor.name}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              factor.impact === "positive"
                                ? "text-emerald-600"
                                : factor.impact === "negative"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {factor.score}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{factor.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Timeline</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Submitted: {formatDate(assessment.submittedAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Updated: {timeAgo(assessment.lastUpdated)}
                </div>
                {assessment.decisionDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    Decision: {formatDate(assessment.decisionDate)}
                  </div>
                )}
                {assessment.underwriter && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    Underwriter: {assessment.underwriter}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">
                Documents ({assessment.documents.length})
              </h4>
              <div className="space-y-1.5">
                {assessment.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{doc.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        doc.status === "verified"
                          ? "bg-emerald-100 text-emerald-700"
                          : doc.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {assessment.conditions && assessment.conditions.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-sm font-bold text-amber-900 mb-2">
                Conditions for Approval
              </h4>
              <ul className="space-y-1.5">
                {assessment.conditions.map((condition, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-800"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.notes.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                Recent Notes
              </h4>
              <div className="space-y-2">
                {assessment.notes.slice(-2).map((note, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {note.author}
                      </span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(note.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onSelect?.(assessment)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Full Assessment
              </button>
              {assessment.status !== "approved" &&
                assessment.status !== "declined" && (
                  <>
                    <button
                      onClick={() => onApprove?.(assessment)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => onRequestInfo?.(assessment)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Info
                    </button>
                    <button
                      onClick={() => onDecline?.(assessment)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
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
      onClick={() => onSelect?.(assessment)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.bgColor}`}
          >
            <span className={`text-sm font-bold ${typeConfig.color}`}>
              {assessment.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {assessment.applicantName}
            </h4>
            <p className="text-xs text-gray-500 font-mono">
              {assessment.applicationId}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${actionConfig.bgColor} ${actionConfig.color}`}
          >
            {actionConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Risk</p>
          <p className={`text-lg font-bold ${
            assessment.riskScore <= 30
              ? "text-emerald-600"
              : assessment.riskScore <= 60
              ? "text-amber-600"
              : "text-red-600"
          }`}>
            {assessment.riskScore}
          </p>
        </div>
        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Premium</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(assessment.annualPremium)}
          </p>
        </div>
        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Coverage</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(assessment.coverageAmount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo(assessment.lastUpdated)}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {assessment.documents.length} docs
        </span>
        {assessment.underwriter && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {assessment.underwriter}
          </span>
        )}
      </div>

      {assessment.aiRecommendation && (
        <div className="flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-200 rounded-lg mb-3">
          <Bot className="w-4 h-4 text-violet-600 shrink-0" />
          <p className="text-xs text-violet-700 line-clamp-1 flex-1">
            {assessment.aiRecommendation.reasoning}
          </p>
          <span className="text-xs font-bold text-violet-600">
            {assessment.aiRecommendation.confidence}%
          </span>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.(assessment);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestInfo?.(assessment);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Info
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecline?.(assessment);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default AssessmentCard;
