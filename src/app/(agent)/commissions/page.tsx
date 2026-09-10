'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Clock,
  CheckCircle,
  FileText,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
} from 'lucide-react';

type CommissionStatus = 'paid' | 'pending' | 'processing' | 'held';
type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface Commission {
  id: string;
  policyId: string;
  policyType: string;
  clientName: string;
  premiumAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  earnedDate: string;
  paidDate?: string;
  transactionType: 'new_sale' | 'renewal' | 'endorsement';
}

const STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  paid: { label: 'Paid', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: RefreshCw },
  held: { label: 'On Hold', color: 'text-red-700', bgColor: 'bg-red-100', icon: Clock },
};

const TRANSACTION_TYPES: Record<string, { label: string; color: string; bgColor: string }> = {
  new_sale: { label: 'New Sale', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  renewal: { label: 'Renewal', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  endorsement: { label: 'Endorsement', color: 'text-purple-700', bgColor: 'bg-purple-50' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const MOCK_COMMISSIONS: Commission[] = [
  { id: '1', policyId: 'AP-2024-0847', policyType: 'Auto Insurance', clientName: 'John Mitchell', premiumAmount: 2268, commissionRate: 12, commissionAmount: 272.16, status: 'paid', earnedDate: '2024-01-15', paidDate: '2024-01-20', transactionType: 'renewal' },
  { id: '2', policyId: 'HM-2024-0567', policyType: 'Home Insurance', clientName: 'Sarah Williams', premiumAmount: 1370, commissionRate: 15, commissionAmount: 205.50, status: 'paid', earnedDate: '2024-01-10', paidDate: '2024-01-15', transactionType: 'new_sale' },
  { id: '3', policyId: 'HL-2024-1234', policyType: 'Health Insurance', clientName: 'Robert Davis', premiumAmount: 6804, commissionRate: 10, commissionAmount: 680.40, status: 'pending', earnedDate: '2024-01-08', transactionType: 'renewal' },
  { id: '4', policyId: 'CL-2024-0089', policyType: 'Life Insurance', clientName: 'Lisa Anderson', premiumAmount: 1500, commissionRate: 18, commissionAmount: 270.00, status: 'processing', earnedDate: '2024-01-05', transactionType: 'new_sale' },
  { id: '5', policyId: 'AP-2024-0912', policyType: 'Auto Insurance', clientName: 'Michael Brown', premiumAmount: 2100, commissionRate: 12, commissionAmount: 252.00, status: 'pending', earnedDate: '2024-01-14', transactionType: 'new_sale' },
  { id: '6', policyId: 'HM-2024-0623', policyType: 'Home Insurance', clientName: 'Emily Garcia', premiumAmount: 960, commissionRate: 15, commissionAmount: 144.00, status: 'held', earnedDate: '2024-01-12', transactionType: 'new_sale' },
  { id: '7', policyId: 'AP-2024-0756', policyType: 'Auto Insurance', clientName: 'David Wilson', premiumAmount: 1800, commissionRate: 12, commissionAmount: 216.00, status: 'paid', earnedDate: '2023-12-15', paidDate: '2023-12-20', transactionType: 'renewal' },
  { id: '8', policyId: 'HL-2024-1301', policyType: 'Health Insurance', clientName: 'Jennifer Lee', premiumAmount: 8160, commissionRate: 10, commissionAmount: 816.00, status: 'paid', earnedDate: '2023-12-10', paidDate: '2023-12-15', transactionType: 'renewal' },
  { id: '9', policyId: 'UM-2024-0234', policyType: 'Umbrella Policy', clientName: 'Tech Corp Inc.', premiumAmount: 4800, commissionRate: 14, commissionAmount: 672.00, status: 'paid', earnedDate: '2023-12-01', paidDate: '2023-12-05', transactionType: 'new_sale' },
  { id: '10', policyId: 'AP-2024-0689', policyType: 'Auto Insurance', clientName: 'James Martinez', premiumAmount: 1920, commissionRate: 12, commissionAmount: 230.40, status: 'processing', earnedDate: '2024-01-11', transactionType: 'endorsement' },
];

const MOCK_MONTHLY_EARNINGS = [
  { month: 'Aug', amount: 4200 },
  { month: 'Sep', amount: 4800 },
  { month: 'Oct', amount: 5100 },
  { month: 'Nov', amount: 5600 },
  { month: 'Dec', amount: 6200 },
  { month: 'Jan', amount: 7100 },
];

export default function CommissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CommissionStatus | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');

  const filteredCommissions = MOCK_COMMISSIONS.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.policyId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalEarned = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPaid = MOCK_COMMISSIONS.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPending = MOCK_COMMISSIONS.filter(c => c.status === 'pending' || c.status === 'processing').reduce((sum, c) => sum + c.commissionAmount, 0);
  const avgCommissionRate = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.commissionRate, 0) / MOCK_COMMISSIONS.length;

  const maxEarning = Math.max(...MOCK_MONTHLY_EARNINGS.map(e => e.amount));

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
            <p className="text-sm text-slate-500 mt-1">Track your earnings, payouts, and commission history</p>
          </div>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                18.2%
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-slate-500 mt-1">Total Earned (YTD)</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-slate-500 mt-1">Total Paid Out</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-slate-500 mt-1">Pending / Processing</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgCommissionRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">Avg. Commission Rate</p>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="card mb-8">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Monthly Earnings</h3>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-4 h-48">
            {MOCK_MONTHLY_EARNINGS.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {formatCurrency(item.amount)}
                </span>
                <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '120px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(item.amount / maxEarning) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Goal */}
      <div className="card mb-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-emerald-900">Annual Commission Goal</h3>
              <p className="text-sm text-emerald-700 mt-1">You&apos;ve earned {formatCurrency(totalEarned)} of your $100,000 goal</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-900">{((totalEarned / 100000) * 100).toFixed(1)}%</p>
              <p className="text-xs text-emerald-600">{formatCurrency(100000 - totalEarned)} remaining</p>
            </div>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill bg-emerald-500 rounded-full" style={{ width: `${(totalEarned / 100000) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client or policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as CommissionStatus | 'all')}
          className="input w-40"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="held">On Hold</option>
        </select>
      </div>

      {/* Commissions Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client / Policy</th>
                <th>Type</th>
                <th>Premium</th>
                <th>Rate</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Earned</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((commission) => {
                const statusConfig = STATUS_CONFIG[commission.status];
                const StatusIcon = statusConfig.icon;
                const txType = TRANSACTION_TYPES[commission.transactionType];
                return (
                  <tr key={commission.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{commission.clientName}</p>
                        <p className="text-xs text-slate-500">{commission.policyId} · {commission.policyType}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${txType.bgColor} ${txType.color}`}>
                        {txType.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{formatCurrency(commission.premiumAmount)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{commission.commissionRate}%</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{formatCurrency(commission.commissionAmount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {commission.earnedDate}
                      {commission.paidDate && (
                        <span className="block text-emerald-600">Paid {commission.paidDate}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="card mt-6">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Commission Tiers</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: 'Bronze', rate: '10-12%', sales: '$0 - $50K', color: 'border-amber-300 bg-amber-50', current: false },
            { tier: 'Silver', rate: '12-15%', sales: '$50K - $150K', color: 'border-slate-300 bg-slate-50', current: true },
            { tier: 'Gold', rate: '15-18%', sales: '$150K+', color: 'border-yellow-300 bg-yellow-50', current: false },
          ].map((tier, i) => (
            <div key={i} className={`p-4 rounded-xl border-2 ${tier.color} ${tier.current ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{tier.tier}</span>
                {tier.current && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Current
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{tier.rate}</p>
              <p className="text-xs text-slate-500 mt-1">Annual Sales: {tier.sales}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
