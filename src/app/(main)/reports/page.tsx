'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  FileText,
  Users,
  Shield,
  Clock,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Printer,
  Share2,
} from 'lucide-react';

type ReportType = 'overview' | 'premiums' | 'claims' | 'policies' | 'risk';
type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface StatCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ChartBar {
  label: string;
  value: number;
  maxValue: number;
}

interface TrendItem {
  label: string;
  value: string;
  change: number;
  period: string;
}

const MOCK_STATS: StatCard[] = [
  { title: 'Total Premiums', value: '$24,580', change: 12.5, changeLabel: 'vs last period', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { title: 'Active Policies', value: '47', change: 8.2, changeLabel: 'vs last period', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Claims Filed', value: '12', change: -4.1, changeLabel: 'vs last period', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { title: 'Avg. Processing Time', value: '3.2 days', change: -15.3, changeLabel: 'vs last period', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50' },
];

const MOCK_MONTHLY_PREMIUMS: ChartBar[] = [
  { label: 'Jul', value: 1850, maxValue: 2500 },
  { label: 'Aug', value: 1920, maxValue: 2500 },
  { label: 'Sep', value: 2100, maxValue: 2500 },
  { label: 'Oct', value: 2050, maxValue: 2500 },
  { label: 'Nov', value: 2200, maxValue: 2500 },
  { label: 'Dec', value: 2340, maxValue: 2500 },
  { label: 'Jan', value: 2480, maxValue: 2500 },
];

const MOCK_CLAIMS_BY_TYPE = [
  { label: 'Auto', value: 45, color: 'bg-blue-500', amount: '$8,200' },
  { label: 'Home', value: 25, color: 'bg-emerald-500', amount: '$12,400' },
  { label: 'Health', value: 20, color: 'bg-rose-500', amount: '$6,800' },
  { label: 'Life', value: 5, color: 'bg-purple-500', amount: '$3,200' },
  { label: 'Other', value: 5, color: 'bg-slate-400', amount: '$1,100' },
];

const MOCK_RISK_TRENDS: TrendItem[] = [
  { label: 'Overall Risk Score', value: '42/100', change: -3.2, period: 'vs last month' },
  { label: 'Fraud Probability', value: '2.1%', change: -0.5, period: 'vs last month' },
  { label: 'Claims Severity Index', value: '6.8', change: 1.2, period: 'vs last month' },
  { label: 'Policy Retention Rate', value: '94.2%', change: 2.1, period: 'vs last month' },
];

const MOCK_RECENT_REPORTS = [
  { id: '1', name: 'Monthly Premium Summary - January 2024', type: 'premiums', date: '2024-01-15', size: '245 KB' },
  { id: '2', name: 'Claims Analysis Report - Q4 2023', type: 'claims', date: '2024-01-10', size: '1.2 MB' },
  { id: '3', name: 'Risk Assessment Overview', type: 'risk', date: '2024-01-08', size: '890 KB' },
  { id: '4', name: 'Policy Portfolio Review', type: 'policies', date: '2024-01-05', size: '567 KB' },
  { id: '5', name: 'Annual Insurance Report 2023', type: 'overview', date: '2024-01-02', size: '3.4 MB' },
];

function BarChartComponent({ data, title }: { data: ChartBar[]; title: string }) {
  return (
    <div className="card">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-3 h-48">
          {data.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                ${bar.value.toLocaleString()}
              </span>
              <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '120px' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(bar.value / bar.maxValue) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonutChartComponent({ data }: { data: typeof MOCK_CLAIMS_BY_TYPE }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="card">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">Claims by Type</h3>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {data.map((item, i) => {
                const percent = (item.value / total) * 100;
                const strokeDasharray = `${percent} ${100 - percent}`;
                const strokeDashoffset = -cumulativePercent;
                cumulativePercent += percent;
                const colors = ['stroke-blue-500', 'stroke-emerald-500', 'stroke-rose-500', 'stroke-purple-500', 'stroke-slate-400'];
                return (
                  <circle
                    key={i}
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    className={colors[i]}
                    strokeWidth="3.5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-xs text-slate-500">Total Claims</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, i) => {
            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-purple-500', 'bg-slate-400'];
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{item.value}%</span>
                  <span className="text-xs text-slate-500">{item.amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const tabs: { key: ReportType; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'premiums', label: 'Premiums', icon: DollarSign },
    { key: 'claims', label: 'Claims', icon: FileText },
    { key: 'policies', label: 'Policies', icon: Shield },
    { key: 'risk', label: 'Risk Analysis', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Reports & Analytics</h1>
              <p className="page-subtitle">Insights into your insurance portfolio performance</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="btn-secondary">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="btn-primary">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs & Date Range */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === range
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '1 Year' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {MOCK_STATS.map((stat, i) => (
            <div key={i} className="card">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                    stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stat.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BarChartComponent data={MOCK_MONTHLY_PREMIUMS} title="Monthly Premium Collection" />
          <DonutChartComponent data={MOCK_CLAIMS_BY_TYPE} />
        </div>

        {/* Risk Analysis & Recent Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Trends */}
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Risk Analysis</h3>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_RISK_TRENDS.map((trend, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{trend.label}</p>
                    <p className="text-xs text-slate-500">{trend.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{trend.value}</p>
                    <p className={`text-xs font-semibold ${trend.change <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trend.change <= 0 ? '↓' : '↑'} {Math.abs(trend.change)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recent Reports</h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_RECENT_REPORTS.map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.date} · {report.size}</p>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="card mb-8">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Performance Summary</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Revenue Metrics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Gross Premium Written</span>
                    <span className="text-sm font-semibold text-slate-900">$24,580</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Net Premium Earned</span>
                    <span className="text-sm font-semibold text-slate-900">$22,120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Loss Ratio</span>
                    <span className="text-sm font-semibold text-emerald-600">62.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Expense Ratio</span>
                    <span className="text-sm font-semibold text-slate-900">28.1%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Claims Metrics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Claims</span>
                    <span className="text-sm font-semibold text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avg. Claim Amount</span>
                    <span className="text-sm font-semibold text-slate-900">$2,633</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Claims Settlement Rate</span>
                    <span className="text-sm font-semibold text-emerald-600">91.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avg. Processing Time</span>
                    <span className="text-sm font-semibold text-slate-900">3.2 days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Customer Metrics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Active Policyholders</span>
                    <span className="text-sm font-semibold text-slate-900">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Retention Rate</span>
                    <span className="text-sm font-semibold text-emerald-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">NPS Score</span>
                    <span className="text-sm font-semibold text-slate-900">72</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avg. Response Time</span>
                    <span className="text-sm font-semibold text-slate-900">4.2 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-blue-900 mb-2">AI-Powered Insights</h3>
                <div className="space-y-2">
                  <p className="text-sm text-blue-800">
                    <strong>Revenue Trend:</strong> Premium collection has increased 12.5% over the last quarter. Consider adjusting pricing for auto policies in high-risk areas to optimize profitability.
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Claims Pattern:</strong> Home insurance claims severity has increased. Recommend proactive property inspections for policies over $300K coverage limit.
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Retention Alert:</strong> 3 policies are up for renewal within 30 days with a combined annual premium of $8,400. Early engagement recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
