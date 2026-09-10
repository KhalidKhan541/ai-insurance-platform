'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Shield,
  Car,
  Home,
  Heart,
  BarChart3,
  Wallet,
  Activity,
} from 'lucide-react';

const stats = [
  {
    label: 'Active Policies',
    value: '4',
    change: '+1 this month',
    trend: 'up',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    label: 'Open Claims',
    value: '2',
    change: '1 pending review',
    trend: 'neutral',
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  {
    label: 'Total Premiums',
    value: '$342',
    change: '-$28 vs last month',
    trend: 'down',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  {
    label: 'Savings',
    value: '$1,240',
    change: '35% vs traditional',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'claim',
    title: 'Auto Accident Claim',
    description: 'Claim #CLM-2024-0847 processed — approved for $3,200',
    time: '2 hours ago',
    icon: Car,
    status: 'approved',
  },
  {
    id: 2,
    type: 'policy',
    title: 'Home Insurance Renewed',
    description: 'Your home insurance policy has been auto-renewed for 12 months',
    time: '1 day ago',
    icon: Home,
    status: 'completed',
  },
  {
    id: 3,
    type: 'claim',
    title: 'Health Claim Submitted',
    description: 'Claim #CLM-2024-0851 submitted for $450 medical expense',
    time: '2 days ago',
    icon: Heart,
    status: 'pending',
  },
  {
    id: 4,
    type: 'payment',
    title: 'Premium Payment',
    description: 'Monthly premium of $85.50 processed via Visa ••••4242',
    time: '5 days ago',
    icon: Wallet,
    status: 'completed',
  },
  {
    id: 5,
    type: 'quote',
    title: 'New Quote Generated',
    description: 'AI recommended $45/mo for updated auto coverage',
    time: '1 week ago',
    icon: FileText,
    status: 'new',
  },
];

const policies = [
  {
    id: 1,
    name: 'Auto Insurance',
    icon: Car,
    status: 'active',
    premium: '$85/mo',
    coverage: '$100,000',
    renewal: 'Dec 15, 2024',
  },
  {
    id: 2,
    name: 'Home Insurance',
    icon: Home,
    status: 'active',
    premium: '$125/mo',
    coverage: '$500,000',
    renewal: 'Mar 1, 2025',
  },
  {
    id: 3,
    name: 'Life Insurance',
    icon: Heart,
    status: 'active',
    premium: '$42/mo',
    coverage: '$500,000',
    renewal: 'Jun 20, 2025',
  },
  {
    id: 4,
    name: 'Renters Insurance',
    icon: Shield,
    status: 'expired',
    premium: '$18/mo',
    coverage: '$50,000',
    renewal: 'Expired',
  },
];

const statusStyles: Record<string, string> = {
  approved: 'badge-green',
  completed: 'badge-blue',
  pending: 'badge-yellow',
  new: 'badge-slate',
  rejected: 'badge-red',
};

function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <div className="card group hover:shadow-md transition-all duration-200">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {stat.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
              {stat.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />}
              {stat.trend === 'neutral' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
              <span className="text-xs text-slate-500">{stat.change}</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, John</h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your insurance today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <Link href="/quotes" className="btn-primary btn-sm">
            Get Quote
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <Link
                href="/claims"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {activity.title}
                      </h3>
                      <span className={statusStyles[activity.status]}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs text-slate-400">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions + Policies */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/quotes"
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-semibold">Get a Quote</div>
                    <div className="text-xs text-blue-600">AI-powered instant pricing</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>

                <Link
                  href="/claims"
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-semibold">File a Claim</div>
                    <div className="text-xs text-amber-600">Report an incident</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>

                <Link
                  href="/policies"
                  className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-semibold">View Policies</div>
                    <div className="text-xs text-emerald-600">Manage your coverage</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              </div>
            </div>
          </div>

          {/* My Policies */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">My Policies</h2>
                <Link
                  href="/policies"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {policies.map((policy) => (
                  <Link
                    key={policy.id}
                    href={`/policies/${policy.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <policy.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {policy.name}
                        </h3>
                        {policy.status === 'active' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {policy.premium} • {policy.coverage} coverage
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-200" />
                <span className="text-sm font-semibold text-blue-100">AI Insight</span>
              </div>
              <h3 className="text-lg font-bold mb-2">
                You could save $47/mo
              </h3>
              <p className="text-sm text-blue-100 mb-4">
                Based on your driving data, switching to pay-per-mile could reduce your auto
                premium significantly.
              </p>
              <Link
                href="/quotes"
                className="btn bg-white/15 text-white border-white/20 hover:bg-white/25 text-sm w-full"
              >
                See Updated Quote
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Summary Chart Placeholder */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Coverage Overview</h2>
              <p className="text-sm text-slate-500">Your active coverage breakdown</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">Expired</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    policy.status === 'active' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <policy.icon className={`w-5 h-5 ${
                      policy.status === 'active' ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{policy.name}</div>
                    <div className={`text-xs ${policy.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {policy.status === 'active' ? 'Active' : 'Expired'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Premium</span>
                    <span className="font-medium text-slate-700">{policy.premium}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Coverage</span>
                    <span className="font-medium text-slate-700">{policy.coverage}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Renewal</span>
                    <span className="font-medium text-slate-700">{policy.renewal}</span>
                  </div>
                </div>
                {policy.status === 'expired' && (
                  <div className="mt-3">
                    <Link
                      href="/quotes"
                      className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full text-xs"
                    >
                      Renew Now
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
