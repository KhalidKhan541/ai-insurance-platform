'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Search,
  Download,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  RefreshCw,
  Wallet,
  TrendingUp,
  FileText,
  Plus,
  ExternalLink,
} from 'lucide-react';

type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'scheduled';
type PaymentMethod = 'credit_card' | 'bank_transfer' | 'ach' | 'check' | 'wallet';

interface Payment {
  id: string;
  policyId: string;
  policyType: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
  dueDate?: string;
  description: string;
  reference: string;
  receiptUrl?: string;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: RefreshCw },
  scheduled: { label: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Calendar },
};

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  credit_card: { label: 'Credit Card', icon: CreditCard },
  bank_transfer: { label: 'Bank Transfer', icon: Banknote },
  ach: { label: 'ACH Transfer', icon: FileText },
  check: { label: 'Check', icon: Receipt },
  wallet: { label: 'Digital Wallet', icon: Wallet },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', policyId: 'AP-2024-0847', policyType: 'Auto Insurance', amount: 189.00, status: 'completed', method: 'credit_card', date: '2024-01-15', description: 'Monthly Premium - January 2024', reference: 'TXN-847-0115' },
  { id: '2', policyId: 'HM-2024-0567', policyType: 'Home Insurance', amount: 342.50, status: 'completed', method: 'bank_transfer', date: '2024-01-10', description: 'Quarterly Premium - Q1 2024', reference: 'TXN-567-0110' },
  { id: '3', policyId: 'HL-2024-1234', policyType: 'Health Insurance', amount: 567.00, status: 'pending', method: 'ach', date: '2024-01-20', dueDate: '2024-01-25', description: 'Monthly Premium - January 2024', reference: 'TXN-1234-0120' },
  { id: '4', policyId: 'CL-2024-0089', policyType: 'Life Insurance', amount: 125.00, status: 'completed', method: 'credit_card', date: '2024-01-08', description: 'Monthly Premium - January 2024', reference: 'TXN-089-0108' },
  { id: '5', policyId: 'AP-2024-0847', policyType: 'Auto Insurance', amount: 2450.00, status: 'refunded', method: 'credit_card', date: '2023-12-28', description: 'Annual Premium Refund - Overpayment', reference: 'RFND-847-1228' },
  { id: '6', policyId: 'HM-2024-0567', policyType: 'Home Insurance', amount: 342.50, status: 'scheduled', method: 'bank_transfer', date: '2024-02-10', dueDate: '2024-02-15', description: 'Quarterly Premium - Q1 2024 (Auto-Pay)', reference: 'SCH-567-0210' },
  { id: '7', policyId: 'AP-2024-0847', policyType: 'Auto Insurance', amount: 189.00, status: 'failed', method: 'credit_card', date: '2023-12-15', description: 'Monthly Premium - December 2023', reference: 'FAIL-847-1215' },
  { id: '8', policyId: 'CL-2024-0089', policyType: 'Life Insurance', amount: 125.00, status: 'completed', method: 'ach', date: '2023-12-08', description: 'Monthly Premium - December 2023', reference: 'TXN-089-1208' },
  { id: '9', policyId: 'HL-2024-1234', policyType: 'Health Insurance', amount: 567.00, status: 'completed', method: 'credit_card', date: '2023-12-20', description: 'Monthly Premium - December 2023', reference: 'TXN-1234-1220' },
  { id: '10', policyId: 'HM-2024-0567', policyType: 'Home Insurance', amount: 342.50, status: 'completed', method: 'bank_transfer', date: '2023-10-10', description: 'Quarterly Premium - Q4 2023', reference: 'TXN-567-1010' },
  { id: '11', policyId: 'AP-2024-0847', policyType: 'Auto Insurance', amount: 189.00, status: 'completed', method: 'credit_card', date: '2023-11-15', description: 'Monthly Premium - November 2023', reference: 'TXN-847-1115' },
  { id: '12', policyId: 'HL-2024-1234', policyType: 'Health Insurance', amount: 567.00, status: 'completed', method: 'ach', date: '2023-11-20', description: 'Monthly Premium - November 2023', reference: 'TXN-1234-1120' },
];

const MOCK_PAYMENT_METHODS = [
  { id: '1', type: 'Credit Card', last4: '4242', brand: 'Visa', expiry: '08/26', isDefault: true },
  { id: '2', type: 'Bank Account', last4: '6789', brand: 'Chase', expiry: '', isDefault: false },
];

function PaymentRow({ payment }: { payment: Payment }) {
  const statusConfig = STATUS_CONFIG[payment.status];
  const StatusIcon = statusConfig.icon;
  const methodConfig = METHOD_CONFIG[payment.method];
  const MethodIcon = methodConfig.icon;

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${payment.status === 'completed' ? 'bg-emerald-50' : payment.status === 'pending' ? 'bg-amber-50' : payment.status === 'failed' ? 'bg-red-50' : 'bg-slate-100'}`}>
            <MethodIcon className={`w-4 h-4 ${payment.status === 'completed' ? 'text-emerald-600' : payment.status === 'pending' ? 'text-amber-600' : payment.status === 'failed' ? 'text-red-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{payment.description}</p>
            <p className="text-xs text-slate-500">{payment.policyId} · {payment.reference}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
      <td className="px-4 py-3.5 text-sm text-slate-600">{payment.date}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          {payment.status === 'completed' && (
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          )}
          {payment.status === 'failed' && (
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
              Retry
            </button>
          )}
          {payment.status === 'scheduled' && (
            <button className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'history'>('all');

  const filteredPayments = MOCK_PAYMENTS.filter((payment) => {
    const matchesSearch = payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.policyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = MOCK_PAYMENTS.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const upcomingAmount = MOCK_PAYMENTS.filter(p => p.status === 'scheduled' || p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const failedCount = MOCK_PAYMENTS.filter(p => p.status === 'failed').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Payments</h1>
              <p className="page-subtitle">Track premiums, payments, and billing history</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="btn-primary">
                <CreditCard className="w-4 h-4" />
                Make Payment
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="stat-label">Total Paid (YTD)</p>
                <p className="stat-value">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="stat-label">Upcoming Payments</p>
                <p className="stat-value">{formatCurrency(upcomingAmount)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="stat-label">Pending</p>
                <p className="stat-value">{MOCK_PAYMENTS.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="stat-label">Failed</p>
                <p className="stat-value">{failedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card mb-6">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Payment Methods</h2>
              <button className="btn-ghost btn-sm">
                <Plus className="w-4 h-4" />
                Add Method
              </button>
            </div>
            <div className="flex items-center gap-4">
              {MOCK_PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    method.isDefault ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className={`w-8 h-8 ${method.isDefault ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{method.brand} ending in {method.last4}</p>
                    <p className="text-xs text-slate-500">{method.type} {method.expiry ? `· Exp ${method.expiry}` : ''}</p>
                  </div>
                  {method.isDefault && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Payments Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Upcoming Payment</p>
              <p className="text-xs text-amber-600">Health Insurance premium of {formatCurrency(567.00)} due on Jan 25, 2024</p>
            </div>
          </div>
          <button className="btn-primary btn-sm">Pay Now</button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          {(['all', 'upcoming', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'all' ? 'All Transactions' : tab === 'upcoming' ? 'Upcoming' : 'History'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus | 'all')}
            className="input w-44"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="empty-state">
              <Banknote className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No payments found</p>
              <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Auto-Pay Settings */}
        <div className="card mt-6">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50">
                  <RefreshCw className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Auto-Pay Enabled</h3>
                  <p className="text-xs text-slate-500">Your next auto-payment will be charged to Visa ending in 4242 on Feb 10, 2024</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
