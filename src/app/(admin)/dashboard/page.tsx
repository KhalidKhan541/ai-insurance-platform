'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  Zap,
  Eye,
  BarChart3,
  Server,
  Database,
  Wifi,
  Cpu,
  HardDrive,
  Globe,
  Lock,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const PLATFORM_STATS = [
  { title: 'Total Users', value: '12,847', change: 14.2, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Active Policies', value: '34,521', change: 8.7, icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { title: 'Total Premium', value: '$2.4M', change: 12.1, icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { title: 'Claims Processing', value: '1,247', change: -3.2, icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50' },
];

const SYSTEM_HEALTH = [
  { label: 'API Gateway', status: 'healthy', latency: '42ms', icon: Globe },
  { label: 'Database', status: 'healthy', latency: '12ms', icon: Database },
  { label: 'AI Engine', status: 'healthy', latency: '128ms', icon: Cpu },
  { label: 'Cache', status: 'healthy', latency: '3ms', icon: HardDrive },
  { label: 'Auth Service', status: 'healthy', latency: '18ms', icon: Lock },
  { label: 'File Storage', status: 'degraded', latency: '245ms', icon: Server },
];

const RECENT_ALERTS = [
  { id: '1', type: 'fraud' as const, message: 'Suspicious claim pattern detected — Policy #AP-2024-1892', time: '15 min ago', severity: 'high' as const },
  { id: '2', type: 'system' as const, message: 'File storage service experiencing elevated latency', time: '1 hour ago', severity: 'medium' as const },
  { id: '3', type: 'user' as const, message: 'New agent registration pending approval — Lisa Park', time: '2 hours ago', severity: 'low' as const },
  { id: '4', type: 'fraud' as const, message: 'AI flagged potential duplicate claim — CL-2024-0234', time: '3 hours ago', severity: 'high' as const },
  { id: '5', type: 'system' as const, message: 'Scheduled maintenance window: Jan 20, 2024 2:00-4:00 AM', time: '5 hours ago', severity: 'low' as const },
];

const TOP_AGENTS = [
  { id: '1', name: 'Sarah Chen', policies: 89, premium: 124500, conversion: 34.2, status: 'active' },
  { id: '2', name: 'Mike Johnson', policies: 76, premium: 98200, conversion: 31.8, status: 'active' },
  { id: '3', name: 'Emily Davis', policies: 68, premium: 87400, conversion: 29.5, status: 'active' },
  { id: '4', name: 'James Wilson', policies: 54, premium: 72100, conversion: 27.1, status: 'active' },
  { id: '5', name: 'Lisa Park', policies: 42, premium: 56800, conversion: 25.4, status: 'pending' },
];

const RECENT_CLAIMS = [
  { id: '1', claimId: 'CL-2024-0234', client: 'Robert Davis', type: 'Auto', amount: 4200, status: 'investigating', aiFlag: true },
  { id: '2', claimId: 'CL-2024-0233', client: 'Sarah Williams', type: 'Home', amount: 12800, status: 'approved', aiFlag: false },
  { id: '3', claimId: 'CL-2024-0232', client: 'John Mitchell', type: 'Health', amount: 850, status: 'pending', aiFlag: false },
  { id: '4', claimId: 'CL-2024-0231', client: 'Emily Garcia', type: 'Auto', amount: 3100, status: 'approved', aiFlag: false },
  { id: '5', claimId: 'CL-2024-0230', client: 'David Wilson', type: 'Home', amount: 18500, status: 'investigating', aiFlag: true },
];

const SEVERITY_CONFIG = {
  high: { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  medium: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  low: { color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
};

const CLAIM_STATUS_CONFIG = {
  investigating: { label: 'Investigating', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  pending: { label: 'Pending', color: 'text-blue-700', bgColor: 'bg-blue-1000' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Platform overview and system monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
            </div>
            <button className="btn-primary btn-sm">
              <Zap className="w-4 h-4" />
              AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLATFORM_STATS.map((stat, i) => (
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

      {/* System Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Health */}
        <div className="card lg:col-span-1">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">System Health</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {SYSTEM_HEALTH.map((service, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <service.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{service.label}</p>
                    <p className="text-xs text-slate-500">Latency: {service.latency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    service.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {service.status === 'healthy' ? 'Healthy' : 'Degraded'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card lg:col-span-2">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Recent Alerts</h3>
              <Link href="/admin/alerts" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {RECENT_ALERTS.map((alert) => {
              const severity = SEVERITY_CONFIG[alert.severity];
              return (
                <div key={alert.id} className={`p-4 flex items-start gap-3 border-l-4 ${severity.borderColor}`}>
                  <div className={`p-1.5 rounded-lg ${severity.bgColor} mt-0.5`}>
                    {alert.type === 'fraud' ? (
                      <AlertTriangle className={`w-4 h-4 ${severity.color}`} />
                    ) : alert.type === 'system' ? (
                      <Server className={`w-4 h-4 ${severity.color}`} />
                    ) : (
                      <UserCheck className={`w-4 h-4 ${severity.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Agents & Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Agents */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Top Performing Agents</h3>
              <Link href="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Policies</th>
                  <th>Premium</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {TOP_AGENTS.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {agent.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-600">{agent.policies}</td>
                    <td className="text-sm font-semibold text-slate-900">{formatCurrency(agent.premium)}</td>
                    <td className="text-sm text-slate-600">{agent.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Recent Claims</h3>
              <Link href="/admin/claims" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {RECENT_CLAIMS.map((claim) => {
              const statusConfig = CLAIM_STATUS_CONFIG[claim.status as keyof typeof CLAIM_STATUS_CONFIG];
              return (
                <div key={claim.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{claim.claimId}</p>
                      {claim.aiFlag && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                          AI FLAGGED
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{claim.client} · {claim.type}</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(claim.amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="card mb-8">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Platform Revenue (Last 12 Months)</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-slate-600">Premiums</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-slate-600">Claims Paid</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-2 h-40">
            {[180, 195, 210, 205, 220, 235, 248, 260, 275, 290, 305, 320].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-blue-500 rounded-t opacity-80"
                    style={{ height: `${(value / 320) * 60}%` }}
                  />
                  <div
                    className="w-full bg-emerald-500 rounded-b opacity-60"
                    style={{ height: `${(value * 0.6 / 320) * 60}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', href: '/admin/users' },
            { label: 'Fraud Detection', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', href: '/admin/fraud' },
            { label: 'System Settings', icon: Settings, color: 'text-slate-600', bgColor: 'bg-slate-100', href: '/admin/settings' },
            { label: 'View Reports', icon: BarChart3, color: 'text-purple-600', bgColor: 'bg-purple-50', href: '/admin/reports' },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Settings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
