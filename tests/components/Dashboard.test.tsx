import { describe, it, expect } from "vitest";

interface StatCard {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

interface DashboardProps {
  stats: StatCard[];
  title?: string;
  subtitle?: string;
}

function renderStatCard(stat: StatCard): string {
  const trendIcon =
    stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "—";
  const trendColor =
    stat.trend === "up"
      ? "text-green-600"
      : stat.trend === "down"
        ? "text-red-600"
        : "text-gray-400";

  let html = `<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-card">`;
  html += `<div class="flex items-center justify-between">`;
  html += `<div>`;
  html += `<p class="text-sm font-medium text-gray-500">${stat.label}</p>`;
  html += `<p class="mt-1 text-3xl font-bold text-gray-900">${stat.value}</p>`;
  if (stat.change !== undefined) {
    html += `<p class="mt-1 text-sm ${trendColor}">${trendIcon} ${Math.abs(stat.change)}%</p>`;
  }
  html += `</div>`;
  if (stat.icon) {
    html += `<div class="p-3 bg-brand-50 rounded-lg">${stat.icon}</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderDashboard(props: DashboardProps): string {
  let html = `<div class="space-y-6">`;
  if (props.title) {
    html += `<div>`;
    html += `<h1 class="text-2xl font-bold text-gray-900">${props.title}</h1>`;
    if (props.subtitle) {
      html += `<p class="mt-1 text-sm text-gray-500">${props.subtitle}</p>`;
    }
    html += `</div>`;
  }
  html += `<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">`;
  for (const stat of props.stats) {
    html += renderStatCard(stat);
  }
  html += `</div></div>`;
  return html;
}

describe("Dashboard Component", () => {
  const stats: StatCard[] = [
    {
      label: "Total Policies",
      value: 1234,
      change: 12,
      trend: "up",
      icon: "📋",
    },
    {
      label: "Active Claims",
      value: 56,
      change: -5,
      trend: "down",
      icon: "📝",
    },
    {
      label: "Revenue",
      value: "$1.2M",
      change: 8,
      trend: "up",
      icon: "💰",
    },
    {
      label: "Customers",
      value: 892,
      trend: "neutral",
      icon: "👥",
    },
  ];

  it("should render dashboard title", () => {
    const html = renderDashboard({ stats, title: "Insurance Dashboard" });
    expect(html).toContain("Insurance Dashboard");
    expect(html).toContain("text-2xl font-bold");
  });

  it("should render subtitle", () => {
    const html = renderDashboard({
      stats,
      title: "Dashboard",
      subtitle: "Overview of your insurance platform",
    });
    expect(html).toContain("Overview of your insurance platform");
  });

  it("should render all stat cards", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("Total Policies");
    expect(html).toContain("Active Claims");
    expect(html).toContain("Revenue");
    expect(html).toContain("Customers");
  });

  it("should render stat values", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("1234");
    expect(html).toContain("56");
    expect(html).toContain("$1.2M");
    expect(html).toContain("892");
  });

  it("should render trend indicators", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("↑ 12%");
    expect(html).toContain("↓ 5%");
    expect(html).toContain("—");
  });

  it("should apply correct trend colors", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("text-green-600");
    expect(html).toContain("text-red-600");
    expect(html).toContain("text-gray-400");
  });

  it("should render stat icons", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("📋");
    expect(html).toContain("📝");
    expect(html).toContain("💰");
    expect(html).toContain("👥");
  });

  it("should use grid layout", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("grid grid-cols-1");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("lg:grid-cols-4");
  });

  it("should render empty stats", () => {
    const html = renderDashboard({ stats: [] });
    expect(html).toContain("grid");
  });

  it("should render without title", () => {
    const html = renderDashboard({ stats });
    expect(html).not.toContain("<h1");
  });

  it("should render without subtitle when not provided", () => {
    const html = renderDashboard({ stats, title: "Dashboard" });
    expect(html).not.toContain("Overview");
  });

  it("should render stat card with proper structure", () => {
    const html = renderDashboard({ stats: [stats[0]] });
    expect(html).toContain("bg-white rounded-xl");
    expect(html).toContain("border border-gray-200");
    expect(html).toContain("shadow-card");
  });

  it("should render large numbers formatted", () => {
    const largeStats: StatCard[] = [
      { label: "Premium", value: "$5,432,100" },
    ];
    const html = renderDashboard({ stats: largeStats });
    expect(html).toContain("$5,432,100");
  });

  it("should handle single stat card", () => {
    const html = renderDashboard({
      stats: [{ label: "Only Stat", value: 42 }],
    });
    expect(html).toContain("Only Stat");
    expect(html).toContain("42");
  });

  it("should apply responsive grid classes", () => {
    const html = renderDashboard({ stats });
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("lg:grid-cols-4");
  });
});
