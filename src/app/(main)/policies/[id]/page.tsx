'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Home,
  Heart,
  Shield,
  Briefcase,
  Calendar,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  Edit3,
  RefreshCw,
  ExternalLink,
  Copy,
  Info,
  Users,
  MapPin,
  Zap,
} from 'lucide-react';

const policiesData: Record<string, {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  status: string;
  premium: number;
  coverage: number;
  deductible: number;
  startDate: string;
  renewalDate: string;
  insurer: string;
  policyNumber: string;
  description: string;
  details: { label: string; value: string }[];
  documents: { name: string; date: string; type: string }[];
  claims: { id: string; date: string; amount: string; status: string }[];
}> = {
  'POL-2024-001': {
    id: 'POL-2024-001',
    name: 'Auto Insurance',
    icon: Car,
    type: 'Auto',
    status: 'active',
    premium: 85,
    coverage: 100000,
    deductible: 500,
    startDate: '2024-01-15',
    renewalDate: '2024-12-15',
    insurer: 'InsureAI Auto',
    policyNumber: 'AUTO-2024-84721',
    description:
      'Comprehensive auto insurance coverage including collision, liability, and uninsured motorist protection. AI-monitored driving behavior qualifies you for additional discounts.',
    details: [
      { label: 'Vehicle', value: '2022 Toyota Camry XSE' },
      { label: 'VIN', value: '4T1BZ1HK...NX12345' },
      { label: 'Liability Coverage', value: '$100,000 / $300,000' },
      { label: 'Collision Deductible', value: '$500' },
      { label: 'Comprehensive Deductible', value: '$250' },
      { label: 'Uninsured Motorist', value: '$100,000' },
      { label: 'Roadside Assistance', value: 'Included' },
      { label: 'Rental Reimbursement', value: '$50/day, 30 days max' },
      { label: 'Driving Score', value: '92/100 (Excellent)' },
      { label: 'Discount Applied', value: '15% Safe Driver' },
    ],
    documents: [
      { name: 'Policy Declaration Page', date: '2024-01-15', type: 'PDF' },
      { name: 'Certificate of Insurance', date: '2024-01-15', type: 'PDF' },
      { name: 'ID Card', date: '2024-01-15', type: 'PDF' },
      { name: 'Renewal Notice', date: '2024-11-15', type: 'PDF' },
    ],
    claims: [
      { id: 'CLM-2024-0847', date: '2024-10-05', amount: '$3,200', status: 'approved' },
      { id: 'CLM-2024-0612', date: '2024-07-20', amount: '$850', status: 'approved' },
    ],
  },
  'POL-2024-002': {
    id: 'POL-2024-002',
    name: 'Home Insurance',
    icon: Home,
    type: 'Home',
    status: 'active',
    premium: 125,
    coverage: 500000,
    deductible: 1000,
    startDate: '2024-03-01',
    renewalDate: '2025-03-01',
    insurer: 'InsureAI Home',
    policyNumber: 'HOME-2024-38912',
    description:
      'Complete home protection covering the structure, personal belongings, and liability. Smart home device integration provides additional discounts and real-time risk monitoring.',
    details: [
      { label: 'Property Type', value: 'Single Family Home' },
      { label: 'Address', value: '123 Main St, Austin, TX 78701' },
      { label: 'Year Built', value: '2018' },
      { label: 'Square Footage', value: '2,400 sq ft' },
      { label: 'Dwelling Coverage', value: '$400,000' },
      { label: 'Personal Property', value: '$100,000' },
      { label: 'Liability', value: '$300,000' },
      { label: 'Smart Home Discount', value: '10%' },
      { label: 'Claims-Free Discount', value: '5%' },
      { label: 'Monitoring', value: 'AI Risk Assessment Active' },
    ],
    documents: [
      { name: 'Policy Declaration Page', date: '2024-03-01', type: 'PDF' },
      { name: 'Home Inspection Report', date: '2024-02-20', type: 'PDF' },
      { name: 'Certificate of Insurance', date: '2024-03-01', type: 'PDF' },
    ],
    claims: [],
  },
  'POL-2024-003': {
    id: 'POL-2024-003',
    name: 'Life Insurance',
    icon: Heart,
    type: 'Life',
    status: 'active',
    premium: 42,
    coverage: 500000,
    deductible: 0,
    startDate: '2024-06-20',
    renewalDate: '2025-06-20',
    insurer: 'InsureAI Life',
    policyNumber: 'LIFE-2024-62847',
    description:
      'Term life insurance providing financial protection for your family. AI health assessment determines optimal coverage without invasive medical exams.',
    details: [
      { label: 'Coverage Type', value: 'Term Life - 20 Years' },
      { label: 'Benefit Amount', value: '$500,000' },
      { label: 'Beneficiary', value: 'Jane Doe (Spouse)' },
      { label: 'Secondary Beneficiary', value: 'Doe Family Trust' },
      { label: 'Health Rating', value: 'Preferred Plus' },
      { label: 'Medical Exam', value: 'Not Required (AI Assessment)' },
      { label: 'Accelerated Death Benefit', value: 'Included' },
      { label: 'Conversion Option', value: 'Available until Year 15' },
      { label: 'Contestability Period', value: '2 Years' },
      { label: 'Premium Lock', value: 'Guaranteed for 20 years' },
    ],
    documents: [
      { name: 'Policy Contract', date: '2024-06-20', type: 'PDF' },
      { name: 'Beneficiary Designation', date: '2024-06-20', type: 'PDF' },
      { name: 'AI Health Assessment', date: '2024-06-15', type: 'PDF' },
    ],
    claims: [],
  },
};

const defaultPolicy = {
  id: '',
  name: 'Policy',
  icon: Shield,
  type: 'General',
  status: 'active',
  premium: 0,
  coverage: 0,
  deductible: 0,
  startDate: '',
  renewalDate: '',
  insurer: 'InsureAI',
  policyNumber: '',
  description: 'Policy details not available.',
  details: [],
  documents: [],
  claims: [],
};

const statusConfig: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: 'Active', class: 'badge-green', icon: CheckCircle2 },
  expired: { label: 'Expired', class: 'badge-red', icon: AlertCircle },
  pending: { label: 'Pending', class: 'badge-yellow', icon: Clock },
};

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'claims' | 'billing'>('overview');

  const policy = policiesData[id] || { ...defaultPolicy, id };

  const daysUntilRenewal = Math.ceil(
    (new Date(policy.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Info },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'claims', label: 'Claims History', icon: AlertCircle },
    { key: 'billing', label: 'Billing', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/policies"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Policies
      </Link>

      {/* Policy Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <policy.icon className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{policy.name}</h1>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = statusConfig[policy.status];
                    return status ? (
                      <span className={status.class}>
                        <status.icon className="w-3.5 h-3.5 inline mr-1" />
                        {status.label}
                      </span>
                    ) : null;
                  })()}
                  <span className="badge-slate">{policy.type}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-mono mb-4">{policy.policyNumber}</p>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{policy.description}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="btn-secondary btn-sm">
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button className="btn-primary btn-sm">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Key Info */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500 mb-1">Monthly Premium</p>
              <p className="text-lg font-bold text-slate-900">${policy.premium}/mo</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Coverage</p>
              <p className="text-lg font-bold text-slate-900">
                ${policy.coverage.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Deductible</p>
              <p className="text-lg font-bold text-slate-900">
                ${policy.deductible.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Next Renewal</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">
                  {new Date(policy.renewalDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {policy.status === 'active' && daysUntilRenewal <= 30 && (
                  <span className="badge-yellow text-[10px]">{daysUntilRenewal}d</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Coverage Details */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Coverage Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {policy.details.map((detail) => (
                    <div key={detail.label} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">{detail.label}</p>
                        <p className="text-sm font-medium text-slate-900">{detail.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coverage Progress */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Coverage Utilization
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600">Claims Used</span>
                      <span className="font-medium text-slate-900">$3,200 / ${policy.coverage.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-blue-600"
                        style={{ width: `${(3200 / policy.coverage) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600">Deductible Met</span>
                      <span className="font-medium text-slate-900">$500 / ${policy.deductible.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-emerald-500"
                        style={{ width: `${(500 / Math.max(policy.deductible, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Need Help?</h3>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Call Us</p>
                      <p className="text-sm font-medium text-slate-900">1-800-INSURE</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">support@insureai.com</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Live Chat</p>
                      <p className="text-sm font-medium text-slate-900">Chat with AI Assistant</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/claims"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-slate-700">File a Claim</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </Link>
                  <Link
                    href="/quotes"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-700">Compare Quotes</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </Link>
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                    <Copy className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-slate-700">Share Policy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="card bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-cyan-200" />
                  <span className="text-sm font-semibold text-cyan-100">AI Recommendation</span>
                </div>
                <p className="text-sm text-blue-100 mb-4">
                  Based on your claims history, consider increasing your deductible to $750 to
                  save $12/mo on premiums.
                </p>
                <button className="btn bg-white/15 text-white border-white/20 hover:bg-white/25 text-sm w-full">
                  View Recommendation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Policy Documents</h2>
              <button className="btn-secondary btn-sm">
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>
            {policy.documents.length === 0 ? (
              <div className="empty-state">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No documents yet</h3>
                <p className="text-sm text-slate-500">Documents will appear here once generated.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policy.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">{doc.name}</h4>
                      <p className="text-xs text-slate-500">
                        {new Date(doc.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="badge-slate">{doc.type}</span>
                    <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <Download className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Claims History</h2>
              <Link href="/claims" className="btn-primary btn-sm">
                File New Claim
              </Link>
            </div>
            {policy.claims.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No claims filed</h3>
                <p className="text-sm text-slate-500">
                  You haven&apos;t filed any claims for this policy. Great driving!
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Date Filed</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {policy.claims.map((claim) => (
                      <tr key={claim.id}>
                        <td>
                          <span className="font-mono text-sm">{claim.id}</span>
                        </td>
                        <td>
                          {new Date(claim.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="font-semibold">{claim.amount}</td>
                        <td>
                          <span className={statusConfig[claim.status]?.class || 'badge-slate'}>
                            {statusConfig[claim.status]?.label || claim.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/claims/${claim.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Monthly Premium</span>
                  <span className="text-lg font-bold text-slate-900">${policy.premium}.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Annual Cost</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${(policy.premium * 12).toLocaleString()}.00
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-600">AI Savings Applied</span>
                  <span className="text-lg font-bold text-emerald-700">
                    -${(policy.premium * 12 * 0.15).toFixed(0)}.00/yr
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Visa ending in 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/2026</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <button className="btn-secondary w-full text-sm">
                  Update Payment Method
                </button>
                <button className="btn-ghost w-full text-sm">
                  View Payment History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
