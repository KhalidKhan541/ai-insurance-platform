'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Shield,
  Target,
  Zap,
} from 'lucide-react';

const STATS = [
  { title: 'Total Clients', value: '47', change: 8.2, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Active Policies', value: '89', change: 12.5, icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { title: 'Monthly Commission', value: '$12,450', change: 15.3, icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { title: 'Pending Claims', value: '6', change: -4.1, icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50' },
];

const PERFORMANCE_METRICS = [
  { label: 'Conversion Rate', value: '34.2%', target: '30%', status: 'above' as const },
  { label: 'Policy Retention', value: '94.8%', target: '90%', status: 'above' as const },
  { label: 'Avg. Quote Time', value: '4.2 min', target: '5 min', status: 'above' as const },
  { label: 'Customer Satisfaction', value: '4.8/5', target: '4.5/5', status: 'above' as const },
];

const UPCOMING_TASKS = [
  { id: '1', task: 'Follow up with John Mitchell on renewal', client: 'John Mitchell', due: 'Today, 2:00 PM', priority: 'high' as const, type: 'call' as const },
  { id: '2', task: 'Send home insurance quote to Sarah Williams', client: 'Sarah Williams', due: 'Today, 4:00 PM', priority: 'medium' as const, type: 'email' as const },
  { id: '3', task: 'Process claim documents for Robert Davis', client: 'Robert Davis', due: 'Tomorrow, 10:00 AM', priority: 'medium' as const, type: 'document' as const },
  { id: '4', task: 'Schedule annual review with Tech Corp Inc.', client: 'Tech Corp Inc.', due: 'Jan 20, 2024', priority: 'low' as const, type: 'meeting' as const },
  { id: '5', task: 'Renewal reminder for Lisa Anderson', client: 'Lisa Anderson', due: 'Jan 22, 2024', priority: 'low' as const, type: 'email' as const },
];

const RECENT_ACTIVITIES = [
  { id: '1', action: 'New policy sold', detail: 'Auto Insurance for James Brown — $189/mo', time: '2 hours ago', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: '2', action: 'Claim approved', detail: 'Home damage claim #CL-2024-0089 — $4,200', time: '5 hours ago', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: '3', action: 'Client added', detail: 'New client: Emily White (Health Insurance)', time: '1 day ago', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: '4', action: 'Commission earned', detail: 'Monthly commission — $1,245', time: '2 days ago', icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: '5', action: 'Policy renewed', detail: 'Home Insurance for Mark Taylor — Annual', time: '3 days ago', icon: RefreshCw, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
];

const TOP_CLIENTS = [
  { id: '1', name: 'Tech Corp Inc.', policies: 5, premium: 8400, status: 'active' as const },
  { id: '2', name: 'John Mitchell', policies: 3, premium: 4200, status: 'active' as const },
  { id: '3', name: 'Sarah Williams', policies: 2, premium: 3600, status: 'active' as const },
  { id: '4', name: 'Robert Davis', policies: 2, premium: 2800, status: 'renewal' as const },
  { id: '5', name: 'Lisa Anderson', policies: 1, premium: 1800, status: 'renewal' as const },
];

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' },
  medium: { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  low: { label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

export default function AgentDashboard() {
  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, Sarah!</h1>
            <p className="text-sm text-slate-500 mt-1">Here&apos;s your performance overview for January 2024</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/agent/clients" className="btn-secondary btn-sm">
              <Users className="w-4 h-4" />
              View All Clients
            </Link>
            <button className="btn-primary btn-sm">
              <Plus className="w-4 h-4" />
              New Quote
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Metrics */}
        <div className="card lg:col-span-1">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Performance</h3>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="p-5 space-y-4">
            {PERFORMANCE_METRICS.map((metric, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{metric.value}</span>
                    <span className="text-xs text-emerald-600 font-medium">↑</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill bg-emerald-500"
                    style={{ width: `${Math.min((parseFloat(metric.value) / parseFloat(metric.target)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Target: {metric.target}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card lg:col-span-1">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Upcoming Tasks</h3>
              <Link href="/agent/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {UPCOMING_TASKS.map((task) => {
              const priority = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{task.task}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${priority.bgColor} ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{task.client}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {task.due}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card lg:col-span-1">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${activity.bgColor} mt-0.5`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500 truncate">{activity.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clients & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Top Clients</h3>
              <Link href="/agent/clients" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Policies</th>
                  <th>Annual Premium</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_CLIENTS.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-600">
                            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-600">{client.policies}</td>
                    <td className="text-sm font-semibold text-slate-900">${client.premium.toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {client.status === 'active' ? 'Active' : 'Renewal Due'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Generate Quote', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-50', href: '/quotes/new' },
              { label: 'Add Client', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50', href: '/clients/new' },
              { label: 'File Claim', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', href: '/claims/new' },
              { label: 'Send Message', icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50', href: '/messages/new' },
              { label: 'View Reports', icon: BarChart3, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: '/reports' },
              { label: 'Schedule Meeting', icon: Calendar, color: 'text-rose-600', bgColor: 'bg-rose-50', href: '/calendar/new' },
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

      {/* Commission Goal */}
      <div className="card mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-purple-900">Monthly Commission Goal</h3>
              <p className="text-sm text-purple-700 mt-1">You&apos;ve earned $12,450 of your $15,000 goal</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-900">83%</p>
              <p className="text-xs text-purple-600">$2,550 remaining</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-bar h-3">
              <div className="progress-fill bg-purple-500 rounded-full" style={{ width: '83%' }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-purple-600">
              <span>$0</span>
              <span>$15,000 Goal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
