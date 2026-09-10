import React from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
  Maximize2,
  MoreVertical,
  Settings,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from "lucide-react";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: "bar" | "line" | "area" | "pie" | "donut" | "progress";
  data?: ChartDataPoint[];
  timeSeriesData?: TimeSeriesPoint[];
  totalValue?: string;
  totalLabel?: string;
  change?: number;
  changeLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  height?: number;
  colors?: string[];
  onRefresh?: () => void;
  onExpand?: () => void;
  onDateRangeChange?: (range: string) => void;
  loading?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
  footer?: React.ReactNode;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type,
  data = [],
  timeSeriesData = [],
  totalValue,
  totalLabel,
  change,
  changeLabel,
  showLegend = true,
  showGrid = true,
  showLabels = true,
  height = 200,
  colors = DEFAULT_COLORS,
  onRefresh,
  onExpand,
  onDateRangeChange,
  loading = false,
  variant = "default",
  className = "",
  footer,
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [dateRange, setDateRange] = React.useState("30d");

  const maxValue = React.useMemo(() => {
    if (type === "pie" || type === "donut") return 0;
    const allValues = data.map((d) => d.value);
    if (timeSeriesData.length) {
      allValues.push(...timeSeriesData.map((d) => d.value));
    }
    return Math.max(...allValues, 1);
  }, [data, timeSeriesData, type]);

  const total = React.useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const renderBarChart = () => {
    const chartHeight = height;
    const barWidth = Math.min(40, (300 / data.length) - 8);

    return (
      <div className="relative" style={{ height: chartHeight }}>
        {showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 w-full" />
            ))}
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-around px-2">
          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * (chartHeight - 40);
            const isHovered = hoveredIndex === index;
            const color = point.color || colors[index % colors.length];

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {showLabels && isHovered && (
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {new Intl.NumberFormat("en-US").format(point.value)}
                  </div>
                )}
                <div
                  className="rounded-t-md transition-all duration-200 relative group"
                  style={{
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: color,
                    opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                  }}
                >
                  {point.secondaryValue !== undefined && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md opacity-40"
                      style={{
                        height: `${
                          (point.secondaryValue / point.value) * 100
                        }%`,
                        backgroundColor: "rgba(255,255,255,0.3)",
                      }}
                    />
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 truncate max-w-[60px] text-center">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    const chartHeight = height;
    const padding = 20;
    const width = 400;
    const dataPoints = timeSeriesData.length ? timeSeriesData : data.map((d, i) => ({ date: d.label || `Day ${i}`, value: d.value }));

    if (!dataPoints.length) return null;

    const points = dataPoints.map((point, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (width - padding * 2);
      const y =
        chartHeight -
        padding -
        (point.value / maxValue) * (chartHeight - padding * 2);
      return { x, y, ...point };
    });

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${
      chartHeight - padding
    } L ${points[0].x} ${chartHeight - padding} Z`;

    return (
      <div className="relative" style={{ height: chartHeight }}>
        {showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 w-full" />
            ))}
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#areaGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              fill="white"
              stroke="#6366f1"
              strokeWidth="2"
              className="transition-all duration-150"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-10"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: points[hoveredIndex].y - 30,
              transform: "translateX(-50%)",
            }}
          >
            {points[hoveredIndex].label || points[hoveredIndex].date}:{" "}
            {new Intl.NumberFormat("en-US").format(points[hoveredIndex].value)}
          </div>
        )}

        {showLabels && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-5">
            {points
              .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
              .map((p, i) => (
                <span key={i} className="text-xs text-gray-400">
                  {p.date}
                </span>
              ))}
          </div>
        )}
      </div>
    );
  };

  const renderPieChart = () => {
    const size = Math.min(height, 200);
    const radius = size / 2 - 10;
    const innerRadius = type === "donut" ? radius * 0.6 : 0;

    let cumulativeAngle = -90;

    const slices = data.map((point, index) => {
      const percentage = (point.value / total) * 100;
      const angle = (point.value / total) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      const endAngle = cumulativeAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = size / 2 + radius * Math.cos(startRad);
      const y1 = size / 2 + radius * Math.sin(startRad);
      const x2 = size / 2 + radius * Math.cos(endRad);
      const y2 = size / 2 + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      let d: string;
      if (type === "donut") {
        const ix1 = size / 2 + innerRadius * Math.cos(startRad);
        const iy1 = size / 2 + innerRadius * Math.sin(startRad);
        const ix2 = size / 2 + innerRadius * Math.cos(endRad);
        const iy2 = size / 2 + innerRadius * Math.sin(endRad);
        d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      } else {
        d = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      return {
        d,
        color: point.color || colors[index % colors.length],
        percentage,
        label: point.label,
        value: point.value,
        index,
      };
    });

    return (
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            {slices.map((slice) => (
              <path
                key={slice.index}
                d={slice.d}
                fill={slice.color}
                opacity={
                  hoveredIndex !== null && hoveredIndex !== slice.index ? 0.5 : 1
                }
                className="transition-opacity duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>
          {type === "donut" && totalValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gray-900">
                {totalValue}
              </span>
              {totalLabel && (
                <span className="text-xs text-gray-500">{totalLabel}</span>
              )}
            </div>
          )}
        </div>

        {showLegend && (
          <div className="flex-1 space-y-2">
            {slices.map((slice) => (
              <div
                key={slice.index}
                className={`flex items-center justify-between text-sm ${
                  hoveredIndex === slice.index ? "font-semibold" : ""
                }`}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-gray-700">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat("en-US").format(slice.value)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {slice.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProgressChart = () => {
    return (
      <div className="space-y-3">
        {data.map((point, index) => {
          const percentage = (point.value / maxValue) * 100;
          const color = point.color || colors[index % colors.length];
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="space-y-1"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{point.label}</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat("en-US").format(point.value)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    opacity: isHovered ? 1 : 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return renderBarChart();
      case "line":
      case "area":
        return renderLineChart();
      case "pie":
      case "donut":
        return renderPieChart();
      case "progress":
        return renderProgressChart();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-5 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(type === "line" || type === "area") && onDateRangeChange && (
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {["7d", "30d", "90d", "1y"].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      onDateRangeChange(range);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      dateRange === range
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-sm font-semibold ${
                change >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-gray-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-5">{renderChart()}</div>

      {footer && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartCard;
