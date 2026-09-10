import React from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Bot,
  Zap,
  Target,
  Eye,
  Activity,
} from "lucide-react";

interface RiskIndicatorProps {
  score: number;
  maxScore?: number;
  label?: string;
  sublabel?: string;
  variant?: "gauge" | "bar" | "badge" | "circle" | "inline";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showValue?: boolean;
  animated?: boolean;
  aiPowered?: boolean;
  aiConfidence?: number;
  breakdown?: Array<{
    factor: string;
    score: number;
    weight: number;
    impact: "positive" | "negative" | "neutral";
  }>;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  className?: string;
}

function getRiskLevel(
  score: number,
  maxScore: number,
  thresholds?: { low: number; medium: number; high: number }
): {
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  gradient: string;
} {
  const normalized = (score / maxScore) * 100;
  const low = thresholds?.low ?? 30;
  const medium = thresholds?.medium ?? 60;
  const high = thresholds?.high ?? 80;

  if (normalized <= low) {
    return {
      level: "Low Risk",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: CheckCircle,
      gradient: "from-emerald-400 to-emerald-600",
    };
  }
  if (normalized <= medium) {
    return {
      level: "Medium Risk",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: AlertTriangle,
      gradient: "from-amber-400 to-amber-600",
    };
  }
  if (normalized <= high) {
    return {
      level: "High Risk",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: AlertTriangle,
      gradient: "from-orange-400 to-orange-600",
    };
  }
  return {
    level: "Critical Risk",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
    gradient: "from-red-400 to-red-600",
  };
}

const GaugeChart: React.FC<{
  score: number;
  maxScore: number;
  size: number;
  risk: ReturnType<typeof getRiskLevel>;
  animated: boolean;
}> = ({ score, maxScore, size, risk, animated }) => {
  const percentage = (score / maxScore) * 100;
  const radius = size / 2 - 12;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      <path
        d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
        strokeLinecap="round"
      />

      <path
        d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animated ? strokeDashoffset : circumference}
        style={{
          transition: animated ? "stroke-dashoffset 1.5s ease-in-out" : "none",
        }}
      />

      <text
        x={size / 2}
        y={size / 2 - 5}
        textAnchor="middle"
        className="text-2xl font-bold fill-gray-900"
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        className="text-xs fill-gray-500"
      >
        / {maxScore}
      </text>
    </svg>
  );
};

const CircleChart: React.FC<{
  score: number;
  maxScore: number;
  size: number;
  risk: ReturnType<typeof getRiskLevel>;
  animated: boolean;
}> = ({ score, maxScore, size, risk, animated }) => {
  const percentage = (score / maxScore) * 100;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage <= 30) return "#10b981";
    if (percentage <= 60) return "#f59e0b";
    if (percentage <= 80) return "#f97316";
    return "#ef4444";
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animated ? strokeDashoffset : circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: animated ? "stroke-dashoffset 1.5s ease-in-out" : "none",
        }}
      />
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        className="text-xl font-bold fill-gray-900"
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        className="text-xs fill-gray-500"
      >
        / {maxScore}
      </text>
    </svg>
  );
};

const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  maxScore = 100,
  label,
  sublabel,
  variant = "bar",
  size = "md",
  showLabel = true,
  showValue = true,
  animated = true,
  aiPowered = false,
  aiConfidence,
  breakdown,
  thresholds,
  className = "",
}) => {
  const [isAnimated, setIsAnimated] = React.useState(false);
  const risk = getRiskLevel(score, maxScore, thresholds);
  const RiskIcon = risk.icon;
  const percentage = (score / maxScore) * 100;

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const sizeConfig = {
    sm: { gauge: 120, circle: 64, bar: "h-2", text: "text-lg" },
    md: { gauge: 160, circle: 80, bar: "h-3", text: "text-2xl" },
    lg: { gauge: 200, circle: 100, bar: "h-4", text: "text-3xl" },
  };

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${risk.bgColor} border ${risk.borderColor} ${className}`}
      >
        <RiskIcon className={`w-4 h-4 ${risk.color}`} />
        {showValue && (
          <span className={`text-sm font-bold ${risk.color}`}>{score}</span>
        )}
        {showLabel && (
          <span className={`text-xs font-medium ${risk.color}`}>{risk.level}</span>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${risk.bgColor}`}>
          <RiskIcon className={`w-3 h-3 ${risk.color}`} />
          <span className={`text-xs font-bold ${risk.color}`}>{score}</span>
        </div>
        {showLabel && (
          <span className={`text-xs ${risk.color}`}>{risk.level}</span>
        )}
      </div>
    );
  }

  if (variant === "gauge") {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            {showLabel && (
              <h4 className="text-sm font-bold text-gray-900">
                {label || "Risk Score"}
              </h4>
            )}
            {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
          </div>
          {aiPowered && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-lg">
              <Bot className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">AI</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <GaugeChart
            score={score}
            maxScore={maxScore}
            size={sizeConfig[size].gauge}
            risk={risk}
            animated={isAnimated}
          />
          <div
            className={`mt-2 px-3 py-1 rounded-full ${risk.bgColor} border ${risk.borderColor}`}
          >
            <span className={`text-sm font-bold ${risk.color}`}>
              {risk.level}
            </span>
          </div>
        </div>

        {aiConfidence !== undefined && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <Bot className="w-3.5 h-3.5 text-violet-500" />
            <span>AI Confidence: {aiConfidence}%</span>
          </div>
        )}

        {breakdown && breakdown.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700">
              Risk Breakdown
            </p>
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 flex-1 truncate">
                  {item.factor}
                </span>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: isAnimated ? `${item.score}%` : "0%",
                      backgroundColor:
                        item.impact === "positive"
                          ? "#10b981"
                          : item.impact === "negative"
                          ? "#ef4444"
                          : "#9ca3af",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            {showLabel && (
              <h4 className="text-sm font-bold text-gray-900">
                {label || "Risk Score"}
              </h4>
            )}
            {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <CircleChart
            score={score}
            maxScore={maxScore}
            size={sizeConfig[size].circle}
            risk={risk}
            animated={isAnimated}
          />
          <div className={`mt-3 flex items-center gap-1.5 ${risk.color}`}>
            <RiskIcon className="w-4 h-4" />
            <span className="text-sm font-bold">{risk.level}</span>
          </div>
        </div>

        {breakdown && breakdown.length > 0 && (
          <div className="mt-4 space-y-2">
            {breakdown.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{item.factor}</span>
                <span
                  className={
                    item.impact === "positive"
                      ? "text-emerald-600"
                      : item.impact === "negative"
                      ? "text-red-600"
                      : "text-gray-500"
                  }
                >
                  {item.impact === "positive" ? "+" : ""}
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: bar variant
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {showLabel && (
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                {label || "Risk Score"}
              </h4>
              {sublabel && (
                <p className="text-xs text-gray-500">{sublabel}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {aiPowered && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-lg">
              <Bot className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">AI</span>
            </div>
          )}
          {showValue && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${risk.bgColor}`}>
              <RiskIcon className={`w-4 h-4 ${risk.color}`} />
              <span className={`text-lg font-bold ${risk.color}`}>{score}</span>
              <span className={`text-xs ${risk.color}`}>/ {maxScore}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <div className={`w-full ${sizeConfig[size].bar} bg-gray-100 rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${risk.gradient} transition-all duration-1000`}
            style={{ width: isAnimated ? `${percentage}%` : "0%" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">0</span>
            <span className="text-xs text-emerald-400">Low</span>
            <span className="text-xs text-amber-400">Medium</span>
            <span className="text-xs text-orange-400">High</span>
            <span className="text-xs text-red-400">Critical</span>
          </div>
          <span className="text-xs text-gray-400">{maxScore}</span>
        </div>
      </div>

      {showLabel && (
        <div className={`flex items-center gap-2 p-2.5 rounded-lg ${risk.bgColor}`}>
          <RiskIcon className={`w-4 h-4 ${risk.color}`} />
          <span className={`text-sm font-bold ${risk.color}`}>{risk.level}</span>
          {aiConfidence !== undefined && (
            <span className="text-xs text-gray-500 ml-auto">
              AI Confidence: {aiConfidence}%
            </span>
          )}
        </div>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-700">Factor Breakdown</p>
          {breakdown.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{item.factor}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    weight: {item.weight}%
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      item.impact === "positive"
                        ? "text-emerald-600"
                        : item.impact === "negative"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.score}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: isAnimated ? `${item.score}%` : "0%",
                    backgroundColor:
                      item.impact === "positive"
                        ? "#10b981"
                        : item.impact === "negative"
                        ? "#ef4444"
                        : "#9ca3af",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskIndicator;
