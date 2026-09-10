import React from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Zap,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  Info,
  ExternalLink,
  Filter,
  ArrowRight,
  Bot,
  Heart,
  Car,
  Home,
} from "lucide-react";

export interface Quote {
  id: string;
  providerName: string;
  providerLogo?: string;
  providerRating: number;
  type: "auto" | "home" | "health" | "life" | "business";
  monthlyPremium: number;
  annualPremium: number;
  deductible: number;
  coverageLimit: number;
  effectiveDate: string;
  expirationDate: string;
  features: Array<{
    name: string;
    included: boolean;
    value?: string;
    highlight?: boolean;
  }>;
  discounts: Array<{
    name: string;
    amount: number;
    type: "percentage" | "fixed";
  }>;
  aiScore: number;
  aiRecommendation?: string;
  recommended?: boolean;
  popular?: boolean;
  waitingPeriod?: string;
  claimProcessDays?: number;
  customerSatisfaction?: number;
  financialStrength?: string;
}

interface QuoteComparisonProps {
  quotes: Quote[];
  onSelectQuote?: (quote: Quote) => void;
  onGetDetails?: (quote: Quote) => void;
  sortBy?: "premium" | "coverage" | "aiScore" | "rating";
  showAiRecommendation?: boolean;
  highlightedFeatures?: string[];
  maxDisplay?: number;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getAiScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getAiScoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-50 border-emerald-200";
  if (score >= 75) return "bg-blue-50 border-blue-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

const QuoteComparison: React.FC<QuoteComparisonProps> = ({
  quotes,
  onSelectQuote,
  onGetDetails,
  sortBy = "aiScore",
  showAiRecommendation = true,
  highlightedFeatures = [],
  maxDisplay = 4,
  className = "",
}) => {
  const [expandedQuote, setExpandedQuote] = React.useState<string | null>(null);
  const [currentSort, setCurrentSort] = React.useState(sortBy);
  const [showAll, setShowAll] = React.useState(false);

  const sortedQuotes = React.useMemo(() => {
    const sorted = [...quotes];
    switch (currentSort) {
      case "premium":
        sorted.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
        break;
      case "coverage":
        sorted.sort((a, b) => b.coverageLimit - a.coverageLimit);
        break;
      case "aiScore":
        sorted.sort((a, b) => b.aiScore - a.aiScore);
        break;
      case "rating":
        sorted.sort((a, b) => b.providerRating - a.providerRating);
        break;
    }
    return sorted;
  }, [quotes, currentSort]);

  const displayedQuotes = showAll
    ? sortedQuotes
    : sortedQuotes.slice(0, maxDisplay);

  const allFeatures = React.useMemo(() => {
    const featureSet = new Set<string>();
    quotes.forEach((q) => q.features.forEach((f) => featureSet.add(f.name)));
    return Array.from(featureSet);
  }, [quotes]);

  const bestValues = React.useMemo(() => {
    return {
      lowestPremium: Math.min(...quotes.map((q) => q.monthlyPremium)),
      highestCoverage: Math.max(...quotes.map((q) => q.coverageLimit)),
      lowestDeductible: Math.min(...quotes.map((q) => q.deductible)),
      highestAiScore: Math.max(...quotes.map((q) => q.aiScore)),
    };
  }, [quotes]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quote Comparison</h3>
          <p className="text-sm text-gray-500">
            {quotes.length} quotes from leading providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          {(
            ["aiScore", "premium", "coverage", "rating"] as const
          ).map((sort) => (
            <button
              key={sort}
              onClick={() => setCurrentSort(sort)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentSort === sort
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sort === "aiScore"
                ? "AI Score"
                : sort === "premium"
                ? "Premium"
                : sort === "coverage"
                ? "Coverage"
                : "Rating"}
            </button>
          ))}
        </div>
      </div>

      {showAiRecommendation && (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Bot className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-violet-900 mb-1">
                AI Recommendation
              </h4>
              <p className="text-sm text-gray-700">
                Based on your profile and needs, we recommend the{" "}
                <span className="font-semibold text-violet-700">
                  {sortedQuotes[0]?.providerName}
                </span>{" "}
                plan with an AI score of{" "}
                <span className="font-semibold text-violet-700">
                  {sortedQuotes[0]?.aiScore}/100
                </span>
                . It offers the best balance of coverage, price, and reliability.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayedQuotes.map((quote, index) => {
          const isExpanded = expandedQuote === quote.id;
          const isBest =
            quote.aiScore === bestValues.highestAiScore && index === 0;

          return (
            <div
              key={quote.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                isBest
                  ? "border-violet-500 shadow-lg ring-2 ring-violet-100"
                  : quote.recommended
                  ? "border-indigo-300 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {(isBest || quote.recommended) && (
                <div
                  className={`px-4 py-2 text-center text-xs font-bold ${
                    isBest
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                      : "bg-indigo-500 text-white"
                  }`}
                >
                  {isBest ? "Best Match" : "Recommended"}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">
                      {quote.providerName}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(quote.providerRating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        {quote.providerRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg border ${getAiScoreBg(
                      quote.aiScore
                    )}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className={`w-4 h-4 ${getAiScoreColor(quote.aiScore)}`} />
                      <span
                        className={`text-lg font-bold ${getAiScoreColor(
                          quote.aiScore
                        )}`}
                      >
                        {quote.aiScore}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">AI Score</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(quote.monthlyPremium)}
                    </span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatCurrency(quote.annualPremium)}/year
                  </p>
                  {quote.discounts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {quote.discounts.map((discount, i) => (
                        <span
                          key={i}
                          className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded"
                        >
                          {discount.type === "percentage"
                            ? `${discount.amount}% off`
                            : `${formatCurrency(discount.amount)} off`}{" "}
                          {discount.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Deductible</p>
                    <p
                      className={`text-sm font-bold ${
                        quote.deductible === bestValues.lowestDeductible
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(quote.deductible)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Coverage</p>
                    <p
                      className={`text-sm font-bold ${
                        quote.coverageLimit === bestValues.highestCoverage
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(quote.coverageLimit)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Satisfaction</p>
                    <p className="text-sm font-bold text-gray-900">
                      {quote.customerSatisfaction
                        ? `${quote.customerSatisfaction}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {quote.claimProcessDays && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    Claims processed in ~{quote.claimProcessDays} days
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {quote.features.slice(0, 5).map((feature, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between text-sm ${
                        highlightedFeatures.includes(feature.name)
                          ? "font-semibold"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-700" : "text-gray-400"
                          }
                        >
                          {feature.name}
                        </span>
                      </div>
                      {feature.value && (
                        <span
                          className={`text-xs ${
                            feature.included ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          {feature.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {quote.features.length > 5 && (
                  <button
                    onClick={() =>
                      setExpandedQuote(isExpanded ? null : quote.id)
                    }
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-4"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />+
                        {quote.features.length - 5} more features
                      </>
                    )}
                  </button>
                )}

                {isExpanded && (
                  <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
                    {quote.features.slice(5).map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300" />
                          )}
                          <span
                            className={
                              feature.included
                                ? "text-gray-700"
                                : "text-gray-400"
                            }
                          >
                            {feature.name}
                          </span>
                        </div>
                        {feature.value && (
                          <span
                            className={`text-xs ${
                              feature.included
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {feature.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onSelectQuote?.(quote)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      isBest
                        ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    Select Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onGetDetails?.(quote)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedQuotes.length > maxDisplay && !showAll && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Show all {sortedQuotes.length} quotes
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {allFeatures.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900">
              Detailed Feature Comparison
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 bg-gray-50">
                    Feature
                  </th>
                  {displayedQuotes.map((quote) => (
                    <th
                      key={quote.id}
                      className="text-center p-3 text-xs font-semibold text-gray-700 bg-gray-50 min-w-[140px]"
                    >
                      {quote.providerName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((featureName, i) => (
                  <tr
                    key={featureName}
                    className={`border-b border-gray-50 ${
                      highlightedFeatures.includes(featureName)
                        ? "bg-indigo-50"
                        : ""
                    }`}
                  >
                    <td className="p-3 text-sm text-gray-700">{featureName}</td>
                    {displayedQuotes.map((quote) => {
                      const feature = quote.features.find(
                        (f) => f.name === featureName
                      );
                      return (
                        <td key={quote.id} className="text-center p-3">
                          {feature ? (
                            feature.included ? (
                              <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteComparison;
