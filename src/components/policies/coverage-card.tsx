import React from "react";
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  FileText,
  Heart,
  Car,
  Home,
  Building,
  Umbrella,
  Star,
  Zap,
} from "lucide-react";

export interface Coverage {
  id: string;
  name: string;
  description: string;
  type: "standard" | "optional" | "riders" | "exclusion";
  category:
    | "liability"
    | "collision"
    | "comprehensive"
    | "property"
    | "personal"
    | "medical"
    | "other";
  limit: number;
  deductible: number;
  premium: number;
  included: boolean;
  details: string[];
  conditions: string[];
  exclusions: string[];
  aiRecommendation?: "recommended" | "optional" | "not-recommended";
  aiConfidence?: number;
  aiReason?: string;
}

interface CoverageCardProps {
  coverage: Coverage;
  onToggle?: (coverageId: string, included: boolean) => void;
  onViewDetails?: (coverage: Coverage) => void;
  variant?: "default" | "selectable" | "detailed";
  showAiRecommendation?: boolean;
  className?: string;
  disabled?: boolean;
}

const CATEGORY_CONFIG: Record<
  Coverage["category"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  liability: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Liability",
  },
  collision: {
    icon: Car,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    label: "Collision",
  },
  comprehensive: {
    icon: Star,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Comprehensive",
  },
  property: {
    icon: Home,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Property",
  },
  personal: {
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    label: "Personal",
  },
  medical: {
    icon: Heart,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    label: "Medical",
  },
  other: {
    icon: FileText,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "Other",
  },
};

const TYPE_CONFIG: Record<
  Coverage["type"],
  { color: string; bgColor: string; label: string }
> = {
  standard: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    label: "Standard",
  },
  optional: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    label: "Optional",
  },
  riders: {
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    label: "Rider",
  },
  exclusion: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Exclusion",
  },
};

const AI_CONFIG: Record<
  NonNullable<Coverage["aiRecommendation"]>,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  recommended: {
    icon: Zap,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    label: "AI Recommended",
  },
  optional: {
    icon: Info,
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    label: "AI Optional",
  },
  "not-recommended": {
    icon: AlertTriangle,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    label: "AI Not Recommended",
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

const CoverageCard: React.FC<CoverageCardProps> = ({
  coverage,
  onToggle,
  onViewDetails,
  variant = "default",
  showAiRecommendation = false,
  className = "",
  disabled = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [showAllDetails, setShowAllDetails] = React.useState(false);
  const categoryConfig = CATEGORY_CONFIG[coverage.category];
  const typeConfig = TYPE_CONFIG[coverage.type];
  const CategoryIcon = categoryConfig.icon;

  const aiConfig = coverage.aiRecommendation
    ? AI_CONFIG[coverage.aiRecommendation]
    : null;
  const AiIcon = aiConfig?.icon;

  if (variant === "selectable") {
    return (
      <div
        className={`relative bg-white rounded-xl border-2 transition-all duration-200 ${
          coverage.included
            ? "border-indigo-500 shadow-md ring-1 ring-indigo-100"
            : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {coverage.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}
                  >
                    {typeConfig.label}
                  </span>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${categoryConfig.bgColor} ${categoryConfig.color}`}
                  >
                    {categoryConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onToggle?.(coverage.id, !coverage.included)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                coverage.included ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  coverage.included ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {coverage.description}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Limit</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(coverage.limit)}
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Deductible</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(coverage.deductible)}
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Premium</p>
              <p className="text-sm font-bold text-indigo-600">
                {formatCurrency(coverage.premium)}/mo
              </p>
            </div>
          </div>

          {showAiRecommendation && aiConfig && (
            <div
              className={`p-2.5 rounded-lg border ${aiConfig.bgColor} mb-2`}
            >
              <div className="flex items-center gap-2">
                {AiIcon && <AiIcon className={`w-4 h-4 ${aiConfig.color}`} />}
                <span className={`text-xs font-semibold ${aiConfig.color}`}>
                  {aiConfig.label}
                </span>
                {coverage.aiConfidence !== undefined && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {coverage.aiConfidence}% confidence
                  </span>
                )}
              </div>
              {coverage.aiReason && (
                <p className="text-xs text-gray-600 mt-1 ml-6">
                  {coverage.aiReason}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Less details
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> More details
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              {coverage.details.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">
                    Coverage Details
                  </h5>
                  <ul className="space-y-1">
                    {coverage.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {coverage.conditions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">
                    Conditions
                  </h5>
                  <ul className="space-y-1">
                    {coverage.conditions.map((condition, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <Info className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {coverage.exclusions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">
                    Exclusions
                  </h5>
                  <ul className="space-y-1">
                    {coverage.exclusions.map((exclusion, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <X className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                        {exclusion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${categoryConfig.bgColor}`}>
                <CategoryIcon className={`w-6 h-6 ${categoryConfig.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {coverage.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}
                  >
                    {typeConfig.label}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryConfig.bgColor} ${categoryConfig.color}`}
                  >
                    {categoryConfig.label}
                  </span>
                  {coverage.included && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showAiRecommendation && aiConfig && (
              <div
                className={`px-3 py-2 rounded-lg border ${aiConfig.bgColor}`}
              >
                <div className="flex items-center gap-2">
                  {AiIcon && (
                    <AiIcon className={`w-4 h-4 ${aiConfig.color}`} />
                  )}
                  <span className={`text-sm font-semibold ${aiConfig.color}`}>
                    {aiConfig.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">{coverage.description}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">Coverage Limit</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(coverage.limit)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">Deductible</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(coverage.deductible)}
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl text-center">
              <DollarSign className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xs text-indigo-600 mb-0.5">Monthly Premium</p>
              <p className="text-xl font-bold text-indigo-700">
                {formatCurrency(coverage.premium)}
              </p>
            </div>
          </div>

          {showAiRecommendation && coverage.aiReason && (
            <div
              className={`p-4 rounded-xl border ${aiConfig?.bgColor}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {AiIcon && (
                  <AiIcon className={`w-5 h-5 ${aiConfig?.color}`} />
                )}
                <span className={`text-sm font-bold ${aiConfig?.color}`}>
                  AI Analysis
                </span>
                {coverage.aiConfidence !== undefined && (
                  <span className="text-xs text-gray-500 ml-auto">
                    Confidence: {coverage.aiConfidence}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{coverage.aiReason}</p>
            </div>
          )}

          {coverage.details.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Coverage Details
              </h4>
              <ul className="space-y-2">
                {coverage.details.map((detail, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded-lg"
                  >
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {coverage.conditions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Conditions
              </h4>
              <ul className="space-y-2">
                {coverage.conditions.map((condition, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 bg-blue-50 rounded-lg"
                  >
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {coverage.exclusions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Exclusions
              </h4>
              <ul className="space-y-2">
                {coverage.exclusions.map((exclusion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{exclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onToggle && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onToggle(coverage.id, !coverage.included)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  coverage.included
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {coverage.included ? "Remove Coverage" : "Add Coverage"}
              </button>
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(coverage)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Full Details
                </button>
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
      className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
            <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{coverage.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}
              >
                {typeConfig.label}
              </span>
            </div>
          </div>
        </div>

        {coverage.included && (
          <div className="p-1.5 bg-indigo-100 rounded-full">
            <Check className="w-3.5 h-3.5 text-indigo-600" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {coverage.description}
      </p>

      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-600">
            Limit: <span className="font-semibold">{formatCurrency(coverage.limit)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">
            Premium:{" "}
            <span className="font-semibold text-indigo-600">
              {formatCurrency(coverage.premium)}/mo
            </span>
          </span>
        </div>
      </div>

      {showAiRecommendation && aiConfig && (
        <div
          className={`p-2 rounded-lg border ${aiConfig.bgColor} mb-3`}
        >
          <div className="flex items-center gap-1.5">
            {AiIcon && <AiIcon className={`w-3.5 h-3.5 ${aiConfig.color}`} />}
            <span className={`text-xs font-semibold ${aiConfig.color}`}>
              {aiConfig.label}
            </span>
          </div>
        </div>
      )}

      {coverage.details.length > 0 && (
        <div className="space-y-1 mb-3">
          {(showAllDetails ? coverage.details : coverage.details.slice(0, 2)).map(
            (detail, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {detail}
              </div>
            )
          )}
          {coverage.details.length > 2 && !showAllDetails && (
            <button
              onClick={() => setShowAllDetails(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-5"
            >
              +{coverage.details.length - 2} more
            </button>
          )}
        </div>
      )}

      {onToggle && (
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => onToggle(coverage.id, !coverage.included)}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
              coverage.included
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {coverage.included ? "Remove" : "Add Coverage"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverageCard;
