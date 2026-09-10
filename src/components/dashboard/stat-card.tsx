import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Calendar,
  MoreVertical,
  Download,
  Maximize2,
  Info,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  trendLabel?: string;
  change?: number;
  changeLabel?: string;
  sparkline?: number[];
  onRefresh?: () => void;
  onExpand?: () => void;
  onClick?: () => void;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "outlined";
  className?: string;
}

const TrendIcon = ({
  trend,
  className = "",
}: {
  trend: "up" | "down" | "neutral";
  className?: string;
}) => {
  if (trend === "up")
    return <ArrowUpRight className={`w-4 h-4 text-emerald-500 ${className}`} />;
  if (trend === "down")
    return <ArrowDownRight className={`w-4 h-4 text-red-500 ${className}`} />;
  return <Minus className={`w-4 h-4 text-gray-400 ${className}`} />;
};

const MiniSparkline: React.FC<{ data: number[]; color?: string }> = ({
  data,
  color = "#6366f1",
}) => {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${
    width - padding
  },${height - padding}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
  trend,
  trendValue,
  trendLabel,
  change,
  changeLabel,
  sparkline,
  onRefresh,
  onExpand,
  onClick,
  loading = false,
  size = "md",
  variant = "default",
  className = "",
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const sizeClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  const valueSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const variantClasses = {
    default: "bg-white border border-gray-200",
    gradient:
      "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white",
    outlined: "bg-white border-2 border-gray-200",
  };

  if (loading) {
    return (
      <div
        className={`rounded-xl ${variantClasses[variant]} ${sizeClasses[size]} animate-pulse`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl ${variantClasses[variant]} ${sizeClasses[size]} transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      } ${isHovered && onClick ? "shadow-lg -translate-y-0.5" : ""} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`p-2.5 rounded-lg ${
                variant === "gradient" ? "bg-white/20" : iconBg
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  variant === "gradient" ? "text-white" : iconColor
                }`}
              />
            </div>
          )}
          <div>
            <p
              className={`text-xs font-medium ${
                variant === "gradient" ? "text-white/80" : "text-gray-500"
              }`}
            >
              {title}
            </p>
            {subtitle && (
              <p
                className={`text-xs ${
                  variant === "gradient" ? "text-white/60" : "text-gray-400"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {sparkline && (
            <MiniSparkline
              data={sparkline}
              color={variant === "gradient" ? "#ffffff" : "#6366f1"}
            />
          )}
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                variant === "gradient"
                  ? "text-white/60 hover:text-white hover:bg-white/10"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                variant === "gradient"
                  ? "text-white/60 hover:text-white hover:bg-white/10"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p
            className={`${valueSizes[size]} font-bold ${
              variant === "gradient" ? "text-white" : "text-gray-900"
            } mb-1`}
          >
            {typeof value === "number"
              ? new Intl.NumberFormat("en-US", {
                  maximumFractionDigits: 0,
                }).format(value)
              : value}
          </p>

          {trend && trendValue && (
            <div className="flex items-center gap-1.5">
              <TrendIcon trend={trend} />
              <span
                className={`text-xs font-semibold ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {trendValue}
              </span>
              {trendLabel && (
                <span
                  className={`text-xs ${
                    variant === "gradient" ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  {trendLabel}
                </span>
              )}
            </div>
          )}

          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  change >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span
                  className={`text-xs ${
                    variant === "gradient" ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatCardGroup: React.FC<{
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}> = ({ stats, columns = 4, className = "" }) => {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatCard;
