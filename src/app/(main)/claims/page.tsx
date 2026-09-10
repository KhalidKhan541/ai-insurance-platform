'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Camera,
  Upload,
  MessageSquare,
  Brain,
  Eye,
} from 'lucide-react';

const allClaims = [
  {
    id: 'CLM-2024-0851',
    title: 'Medical Expense Claim',
    policyName: 'Health Insurance',
    policyId: 'POL-2024-007',
    dateFiled: '2024-10-08',
    dateOfIncident: '2024-10-05',
    amount: 450,
    estimatedPayout: 382,
    status: 'processing',
    category: 'health',
    aiConfidence: 94,
    description: 'Annual physical examination and lab work at Austin Medical Center.',
    documents: 2,
    timeline: [
      { date: '2024-10-08', event: 'Claim submitted via mobile app', type: 'submit' },
      { date: '2024-10-08', event: 'AI initial review — high confidence approval', type: 'ai' },
      { date: '2024-10-09', event: 'Documents verified', type: 'verify' },
    ],
  },
  {
    id: 'CLM-2024-0847',
    title: 'Auto Collision Claim',
    policyName: 'Auto Insurance',
    policyId: 'POL-2024-001',
    dateFiled: '2024-10-05',
    dateOfIncident: '2024-10-04',
    amount: 3200,
    estimatedPayout: 2700,
    status: 'approved',
    category: 'auto',
    aiConfidence: 98,
    description: 'Rear-end collision at intersection. Other driver found at fault. Repair estimate from certified shop included.',
    documents: 5,
    timeline: [
      { date: '2024-10-04', event: 'Accident occurred — photos uploaded', type: 'submit' },
      { date: '2024-10-04', event: 'Police report filed (#PR-2024-9182)', type: 'verify' },
      { date: '2024-10-05', event: 'Claim submitted via AI assistant', type: 'submit' },
      { date: '2024-10-05', event: 'AI analysis complete — 98% confidence', type: 'ai' },
      { date: '2024-10-05', event: 'Claim approved — payout processing', type: 'approve' },
    ],
  },
  {
    id: 'CLM-2024-0839',
    title: 'Water Damage Claim',
    policyName: 'Home Insurance',
    policyId: 'POL-2024-002',
    dateFiled: '2024-09-28',
    dateOfIncident: '2024-09-27',
    amount: 8500,
    estimatedPayout: 7500,
    status: 'approved',
    category: 'home',
    aiConfidence: 96,
    description: 'Burst pipe in basement causing water damage to flooring and walls. Emergency repair completed.',
    documents: 8,
    timeline: [
      { date: '2024-09-27', event: 'Incident reported — emergency repair initiated', type: 'submit' },
      { date: '2024-09-27', event: 'Contractor assessment completed', type: 'verify' },
      { date: '2024-09-28', event: 'Claim filed with documentation', type: 'submit' },
      { date: '2024-09-29', event: 'AI document analysis — 96% confidence', type: 'ai' },
      { date: '2024-09-30', event: 'Adjuster review — approved', type: 'approve' },
      { date: '2024-10-02', event: 'Payout of $7,500 issued', type: 'payout' },
    ],
  },
  {
    id: 'CLM-2024-0812',
    title: 'Phone Screen Replacement',
    policyName: 'Renters Insurance',
    policyId: 'POL-2023-004',
    dateFiled: '2024-09-15',
    dateOfIncident: '2024-09-14',
    amount: 280,
    estimatedPayout: 0,
    status: 'denied',
    category: 'renters',
    aiConfidence: 87,
    description: 'Phone dropped and screen cracked. Claimed under personal property coverage.',
    documents: 3,
    timeline: [
      { date: '2024-09-14', event: 'Phone damaged', type: 'submit' },
      { date: '2024-09-15', event: 'Claim submitted', type: 'submit' },
      { date: '2024-09-16', event: 'AI review — below deductible threshold', type: 'ai' },
      { date: '2024-09-16', event: 'Claim denied — $280 < $250 deductible + depreciation', type: 'deny' },
    ],
  },
  {
    id: 'CLM-2024-0798',
    title: 'Life Insurance Benefit',
    policyName: 'Life Insurance',
    policyId: 'POL-2024-003',
    dateFiled: '2024-08-20',
    dateOfIncident: '2024-08-18',
    amount: 500000,
    estimatedPayout: 500000,
    status: 'processing',
    category: 'life',
    aiConfidence: 99,
    description: 'Claim filed for policyholder benefit. Full documentation submitted.',
    documents: 12,
    timeline: [
      { date: '2024-08-18', event: 'Beneficiary notification received', type: 'submit' },
      { date: '2024-08-19', event: 'Documentation package submitted', type: 'submit' },
      { date: '2024-08-20', event: 'AI verification — 99% confidence', type: 'ai' },
      { date: '2024-08-21', event: 'Underwriter assigned for final review', type: 'verify' },
    ],
  },
  {
    id: 'CLM-2024-0756',
    title: 'Windshield Repair',
    policyName: 'Auto Insurance',
    policyId: 'POL-2024-001',
    dateFiled: '2024-08-01',
    dateOfIncident: '2024-07-30',
    amount: 450,
    estimatedPayout: 450,
    status: 'approved',
    category: 'auto',
    aiConfidence: 99,
    description: 'Cracked windshield from road debris. Full replacement at approved shop.',
    documents: 2,
    timeline: [
      { date: '2024-07-30', event: 'Damage occurred', type: 'submit' },
      { date: '2024-08-01', event: 'Claim submitted via app', type: 'submit' },
      { date: '2024-08-01', event: 'AI instant approval — $0 deductible for glass', type: 'ai' },
      { date: '2024-08-03', event: 'Repair completed', type: 'payout' },
    ],
  },
];

const statusConfig: Record<string, { label: string; class: string; color: string }> = {
  approved: { label: 'Approved', class: 'badge-green', color: 'text-emerald-600' },
  processing: { label: 'Processing', class: 'badge-blue', color: 'text-blue-600' },
  pending: { label: 'Pending Review', class: 'badge-yellow', color: 'text-amber-600' },
  denied: { label: 'Denied', class: 'badge-red', color: 'text-red-600' },
  submitted: { label: 'Submitted', class: 'badge-slate', color: 'text-slate-600' },
};

const categoryColors: Record<string, string> = {
  auto: 'bg-blue-100 text-blue-700',
  home: 'bg-emerald-100 text-emerald-700',
  health: 'bg-purple-100 text-purple-700',
  life: 'bg-rose-100 text-rose-700',
  renters: 'bg-amber-100 text-amber-700',
};

export default function ClaimsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);

  const filteredClaims = allClaims.filter((claim) => {
    const matchesSearch =
      claim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: allClaims.length,
    approved: allClaims.filter((c) => c.status === 'approved').length,
    processing: allClaims.filter((c) => c.status === 'processing').length,
    totalPaid: allClaims
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.estimatedPayout, 0),
  };

  const expandedClaim = selectedClaim ? allClaims.find((c) => c.id === selectedClaim) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Claims</h1>
          <p className="text-sm text-slate-500 mt-1">
            File, track, and manage your insurance claims with AI assistance.
          </p>
        </div>
        <button
          onClick={() => setShowNewClaimModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          File New Claim
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Claims</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Approved</p>
                <p className="text-xl font-bold text-slate-900">{stats.approved}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Processing</p>
                <p className="text-xl font-bold text-slate-900">{stats.processing}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="text-xl font-bold text-slate-900">
                  ${(stats.totalPaid / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims by ID or description..."
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'processing', 'approved', 'pending', 'denied'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All' : statusConfig[status]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Banner */}
      <div className="card bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="card-body py-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-200 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                AI Claims Processing Active
              </p>
              <p className="text-xs text-blue-100">
                Our AI reviews claims in seconds. Average approval time: 3.8 minutes for straightforward claims.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-lg px-4 py-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-200" />
              <span className="text-sm font-semibold">98.2% Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No claims found</h3>
              <p className="text-sm text-slate-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const status = statusConfig[claim.status];
            const isExpanded = selectedClaim === claim.id;

            return (
              <div
                key={claim.id}
                className={`card transition-all duration-200 ${
                  isExpanded ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
                }`}
              >
                <div className="card-body">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setSelectedClaim(isExpanded ? null : claim.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {claim.title}
                            </h3>
                            <span className={status.class}>{status.label}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[claim.category]}`}>
                              {claim.policyName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {claim.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">
                              ${claim.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              Est. payout: ${claim.estimatedPayout.toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Filed {new Date(claim.dateFiled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {claim.documents} documents
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-blue-500" />
                          AI Confidence: {claim.aiConfidence}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && expandedClaim && (
                    <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
                      <p className="text-sm text-slate-600 mb-4">{expandedClaim.description}</p>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Timeline */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Claim Timeline</h4>
                          <div className="space-y-3">
                            {expandedClaim.timeline.map((event, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  event.type === 'approve'
                                    ? 'bg-emerald-500'
                                    : event.type === 'ai'
                                    ? 'bg-blue-500'
                                    : event.type === 'deny'
                                    ? 'bg-red-500'
                                    : event.type === 'payout'
                                    ? 'bg-purple-500'
                                    : 'bg-slate-300'
                                }`} />
                                <div>
                                  <p className="text-sm text-slate-700">{event.event}</p>
                                  <p className="text-xs text-slate-400">{event.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Actions</h4>
                          <Link
                            href={`/claims/${claim.id}`}
                            className="btn-secondary w-full text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Details
                          </Link>
                          <button className="btn-ghost w-full text-sm">
                            <MessageSquare className="w-4 h-4" />
                            Chat with AI About This Claim
                          </button>
                          {claim.status === 'processing' && (
                            <button className="btn-ghost w-full text-sm">
                              <Upload className="w-4 h-4" />
                              Upload Additional Documents
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewClaimModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">File a New Claim</h2>
                <button
                  onClick={() => setShowNewClaimModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Select Policy</label>
                  <select className="input">
                    <option value="">Choose a policy...</option>
                    <option value="POL-2024-001">Auto Insurance (POL-2024-001)</option>
                    <option value="POL-2024-002">Home Insurance (POL-2024-002)</option>
                    <option value="POL-2024-003">Life Insurance (POL-2024-003)</option>
                  </select>
                </div>

                <div>
                  <label className="label">What happened?</label>
                  <textarea
                    className="input min-h-[100px]"
                    placeholder="Describe the incident in detail. Our AI will help process your claim faster..."
                  />
                </div>

                <div>
                  <label className="label">When did it happen?</label>
                  <input type="date" className="input" />
                </div>

                <div>
                  <label className="label">Estimated Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      className="input pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Upload Documents</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Drag & drop photos or{' '}
                      <span className="text-blue-600 font-medium">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG, PDF up to 10MB each
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI-Powered Processing</p>
                    <p className="text-xs text-blue-700">
                      Our AI will automatically review your claim and provide an instant
                      assessment. Most claims are processed in under 5 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowNewClaimModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button className="btn-primary flex-1">
                    <Zap className="w-4 h-4" />
                    Submit Claim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
