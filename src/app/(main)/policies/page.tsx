'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Shield,
  Car,
  Home,
  Heart,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  FileText,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';

const allPolicies = [
  {
    id: 'POL-2024-001',
    name: 'Auto Insurance',
    icon: Car,
    status: 'active',
    premium: 85,
    premiumFrequency: 'monthly',
    coverage: 100000,
    deductible: 500,
    startDate: '2024-01-15',
    renewalDate: '2024-12-15',
    insurer: 'InsureAI Auto',
    type: 'auto',
  },
  {
    id: 'POL-2024-002',
    name: 'Home Insurance',
    icon: Home,
    status: 'active',
    premium: 125,
    premiumFrequency: 'monthly',
    coverage: 500000,
    deductible: 1000,
    startDate: '2024-03-01',
    renewalDate: '2025-03-01',
    insurer: 'InsureAI Home',
    type: 'home',
  },
  {
    id: 'POL-2024-003',
    name: 'Life Insurance',
    icon: Heart,
    status: 'active',
    premium: 42,
    premiumFrequency: 'monthly',
    coverage: 500000,
    deductible: 0,
    startDate: '2024-06-20',
    renewalDate: '2025-06-20',
    insurer: 'InsureAI Life',
    type: 'life',
  },
  {
    id: 'POL-2023-004',
    name: 'Renters Insurance',
    icon: Shield,
    status: 'expired',
    premium: 18,
    premiumFrequency: 'monthly',
    coverage: 50000,
    deductible: 250,
    startDate: '2023-06-10',
    renewalDate: '2024-06-10',
    insurer: 'InsureAI Renters',
    type: 'renters',
  },
  {
    id: 'POL-2024-005',
    name: 'Business Insurance',
    icon: Briefcase,
    status: 'active',
    premium: 210,
    premiumFrequency: 'monthly',
    coverage: 1000000,
    deductible: 2500,
    startDate: '2024-02-01',
    renewalDate: '2025-02-01',
    insurer: 'InsureAI Business',
    type: 'business',
  },
  {
    id: 'POL-2023-006',
    name: 'Pet Insurance',
    icon: Heart,
    status: 'expired',
    premium: 35,
    premiumFrequency: 'monthly',
    coverage: 10000,
    deductible: 200,
    startDate: '2023-08-15',
    renewalDate: '2024-08-15',
    insurer: 'InsureAI Pet',
    type: 'pet',
  },
];

const statusConfig: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: 'Active', class: 'badge-green', icon: CheckCircle2 },
  expired: { label: 'Expired', class: 'badge-red', icon: AlertCircle },
  pending: { label: 'Pending', class: 'badge-yellow', icon: Clock },
};

const typeFilters = ['All', 'Auto', 'Home', 'Life', 'Business', 'Renters', 'Pet'];

export default function PoliciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'premium' | 'coverage' | 'renewalDate'>('renewalDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPolicies = allPolicies
    .filter((policy) => {
      const matchesSearch =
        policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
      const matchesType = typeFilter === 'All' || policy.type === typeFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'premium') return (a.premium - b.premium) * multiplier;
      if (sortBy === 'coverage') return (a.coverage - b.coverage) * multiplier;
      if (sortBy === 'renewalDate') {
        return (new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()) * multiplier;
      }
      return a.name.localeCompare(b.name) * multiplier;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalMonthlyPremium = allPolicies
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.premium, 0);

  const totalCoverage = allPolicies
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.coverage, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Policies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your insurance policies in one place.
          </p>
        </div>
        <Link href="/quotes" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Policy
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Policies</p>
              <p className="text-2xl font-bold text-slate-900">
                {allPolicies.filter((p) => p.status === 'active').length}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  / {allPolicies.length} total
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Coverage</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(totalCoverage / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Monthly Premium</p>
              <p className="text-2xl font-bold text-slate-900">${totalMonthlyPremium}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies..."
                className="input pl-10"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn-secondary"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Desktop Filters */}
            <div className={`lg:flex items-center gap-3 ${showFilters ? 'flex flex-col' : 'hidden'}`}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>

              <div className="flex gap-1.5 flex-wrap">
                {typeFilters.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      typeFilter === type
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {filteredPolicies.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No policies found</h3>
              <p className="text-sm text-slate-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('All');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          filteredPolicies.map((policy) => {
            const status = statusConfig[policy.status];
            const daysUntilRenewal = Math.ceil(
              (new Date(policy.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={policy.id} className="card hover:shadow-md transition-all duration-200">
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <policy.icon className="w-6 h-6 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">
                              {policy.name}
                            </h3>
                            <span className={status.class}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {policy.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <Download className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Monthly Premium</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">
                            ${policy.premium}/mo
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Coverage</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">
                            ${policy.coverage.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Deductible</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">
                            ${policy.deductible.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Renewal</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">
                              {policy.renewalDate === 'Expired'
                                ? 'Expired'
                                : new Date(policy.renewalDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                            </span>
                            {policy.status === 'active' && daysUntilRenewal <= 30 && (
                              <span className="badge-yellow text-[10px]">
                                {daysUntilRenewal}d left
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Provider: <span className="font-medium text-slate-700">{policy.insurer}</span>
                        </p>
                        <Link
                          href={`/policies/${policy.id}`}
                          className="btn-ghost btn-sm text-blue-600"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
