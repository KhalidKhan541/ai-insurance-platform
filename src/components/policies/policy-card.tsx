import React from "react";
import {
  Shield,
  Calendar,
  DollarSign,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MapPin,
  User,
  FileText,
  Star,
} from "lucide-react";

export interface Policy {
  id: string;
  policyNumber: string;
  type: "auto" | "home" | "health" | "life" | "business" | "umbrella";
  status: "active" | "pending" | "expired" | "cancelled" | "suspended";
 holderName: string;
  holderEmail: string;
  holderPhone: string;
  premium: number;
  deductible: number;
  coverageLimit: number;
  effectiveDate: string;
  expirationDate: string;
  description: string;
  insurer: string;
  insurerLogo?: string;
  riskScore: number;
  claimsCount: number;
  location?: string;
  renewalOption: "auto" | "manual" | "none";
  tags: string[];
}

interface PolicyCardProps {
  policy: Policy;
  onSelect?: (policy: Policy) => void;
  onRenew?: (policy: Policy) => void;
  onViewClaims?: (policy: Policy) => void;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  Policy["type"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  auto: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Auto Insurance",
  },
  home: {
    icon: MapPin,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    label: "Home Insurance",
  },
  health: {
    icon: CheckCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    label: "Health Insurance",
  },
  life: {
    icon: User,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Life Insurance",
  },
  business: {
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Business Insurance",
  },
  umbrella: {
    icon: Shield,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    label: "Umbrella Policy",
  },
};

const STATUS_CONFIG: Record<
  Policy["status"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  active: {
    icon: CheckCircle,
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    label: "Active",
  },
  pending: {
    icon: Clock,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    label: "Pending",
  },
  expired: {
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Expired",
  },
  cancelled: {
    icon: XCircle,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "Cancelled",
  },
  suspended: {
    icon: AlertTriangle,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    label: "Suspended",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntilExpiration(expirationDate: string): number {
  const now = new Date();
  const exp = new Date(expirationDate);
  const diff = exp.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRiskLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score <= 30)
    return { label: "Low Risk", color: "text-emerald-600", bgColor: "bg-emerald-50" };
  if (score <= 60)
    return { label: "Medium Risk", color: "text-amber-600", bgColor: "bg-amber-50" };
  return { label: "High Risk", color: "text-red-600", bgColor: "bg-red-50" };
}

function getRenewalBadge(option: Policy["renewalOption"]): string {
  switch (option) {
    case "auto":
      return "Auto-Renew";
    case "manual":
      return "Manual Renew";
    case "none":
      return "No Renewal";
  }
}

const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onSelect,
  onRenew,
  onViewClaims,
  variant = "default",
  showActions = true,
  className = "",
}) => {
  const typeConfig = TYPE_CONFIG[policy.type];
  const statusConfig = STATUS_CONFIG[policy.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  const daysLeft = daysUntilExpiration(policy.expirationDate);
  const riskLevel = getRiskLevel(policy.riskScore);
  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  if (variant === "compact") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
        onClick={() => onSelect?.(policy)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {policy.policyNumber}
              </p>
              <p className="text-xs text-gray-500">{typeConfig.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${typeConfig.bgColor}`}>
                <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {typeConfig.label}
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  {policy.policyNumber}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policyholder
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {policy.holderName}
              </p>
              <p className="text-xs text-gray-500">{policy.holderEmail}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Insurer
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {policy.insurer}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Premium
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(policy.premium)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage Limit
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(policy.coverageLimit)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductible
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(policy.deductible)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claims Filed
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {policy.claimsCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Policy Period
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(policy.effectiveDate)}</span>
                <span className="text-gray-400">→</span>
                <span>{formatDate(policy.expirationDate)}</span>
              </div>
            </div>
            {policy.status === "active" && (
              <div
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  isExpiringSoon
                    ? "bg-amber-100 text-amber-700"
                    : isExpired
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isExpired
                  ? "Expired"
                  : isExpiringSoon
                  ? `${daysLeft} days left`
                  : `${daysLeft} days left`}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-lg ${riskLevel.bgColor}`}
            >
              <span className={`text-xs font-semibold ${riskLevel.color}`}>
                Risk Score: {policy.riskScore}/100 — {riskLevel.label}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-xs font-semibold text-gray-600">
                {getRenewalBadge(policy.renewalOption)}
              </span>
            </div>
          </div>

          {policy.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {policy.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => onSelect?.(policy)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
              {policy.status === "active" && (
                <button
                  onClick={() => onRenew?.(policy)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Renew
                </button>
              )}
              <button
                onClick={() => onViewClaims?.(policy)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Claims
              </button>
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
      onClick={() => onSelect?.(policy)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${typeConfig.bgColor}`}>
            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {typeConfig.label}
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              {policy.policyNumber}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Premium</span>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(policy.premium)}/mo
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Coverage Limit</span>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(policy.coverageLimit)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Deductible</span>
          <span className="text-sm font-semibold text-gray-700">
            {formatCurrency(policy.deductible)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-2.5 bg-gray-50 rounded-lg">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-600">
          {formatDate(policy.effectiveDate)} — {formatDate(policy.expirationDate)}
        </span>
        {policy.status === "active" && (
          <span
            className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${
              isExpiringSoon
                ? "bg-amber-100 text-amber-700"
                : isExpired
                ? "bg-red-100 text-red-700"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isExpired ? "Expired" : `${daysLeft}d`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className={`px-2 py-0.5 rounded ${riskLevel.bgColor}`}>
          <span className={`text-xs font-semibold ${riskLevel.color}`}>
            Risk: {policy.riskScore}
          </span>
        </div>
        {policy.claimsCount > 0 && (
          <span className="text-xs text-gray-500">
            {policy.claimsCount} claim{policy.claimsCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {policy.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {policy.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {policy.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
              +{policy.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewClaims?.(policy);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Claims
          </button>
          {policy.status === "active" && isExpiringSoon && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRenew?.(policy);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Renew
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      )}
    </div>
  );
};

export default PolicyCard;
