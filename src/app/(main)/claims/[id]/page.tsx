'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Download,
  MessageSquare,
  Brain,
  Camera,
  Upload,
  Send,
  Phone,
  Mail,
  ExternalLink,
  Eye,
  Car,
  Home,
  Heart,
  Shield,
  ChevronRight,
  Info,
  Zap,
  User,
} from 'lucide-react';

const claimsData: Record<string, {
  id: string;
  title: string;
  policyName: string;
  policyId: string;
  dateFiled: string;
  dateOfIncident: string;
  amount: number;
  estimatedPayout: number;
  status: string;
  category: string;
  aiConfidence: number;
  description: string;
  documents: { name: string; date: string; type: string; size: string }[];
  timeline: { date: string; time: string; event: string; type: string; by?: string }[];
  adjuster?: { name: string; phone: string; email: string };
  notes: { date: string; author: string; content: string }[];
}> = {
  'CLM-2024-0851': {
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
    description:
      'Annual physical examination and laboratory work performed at Austin Medical Center. Includes comprehensive metabolic panel, CBC, and lipid panel. All services are in-network and covered under preventive care benefits.',
    documents: [
      { name: 'Medical Bill - Austin Medical Center', date: '2024-10-05', type: 'PDF', size: '245 KB' },
      { name: 'Lab Results', date: '2024-10-06', type: 'PDF', size: '128 KB' },
    ],
    timeline: [
      { date: '2024-10-08', time: '14:32', event: 'Claim submitted via mobile app', type: 'submit', by: 'John Doe' },
      { date: '2024-10-08', time: '14:32', event: 'AI initial review initiated', type: 'ai', by: 'InsureAI System' },
      { date: '2024-10-08', time: '14:33', event: 'AI confidence score: 94% — recommend approval', type: 'ai', by: 'InsureAI System' },
      { date: '2024-10-09', time: '09:15', event: 'Documents verified automatically', type: 'verify', by: 'InsureAI System' },
      { date: '2024-10-09', time: '10:00', event: 'Sent to adjuster for final review', type: 'assign', by: 'System' },
    ],
    adjuster: {
      name: 'Sarah Chen',
      phone: '1-800-INSURE ext. 2234',
      email: 'sarah.chen@insureai.com',
    },
    notes: [
      {
        date: '2024-10-09',
        author: 'AI Assistant',
        content: 'Claim meets all criteria for preventive care coverage. Estimated payout: $382 after $0 deductible for in-network preventive services.',
      },
    ],
  },
  'CLM-2024-0847': {
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
    description:
      'Rear-end collision at the intersection of Congress Ave and 6th St in Austin, TX. Other driver (Toyota RAV4, license plate ABC-1234) failed to stop at red light and struck rear of insured vehicle. Police report filed on scene. Damage includes rear bumper, trunk lid, and left tail light assembly. Vehicle drivable but requires repair.',
    documents: [
      { name: 'Police Report #PR-2024-9182', date: '2024-10-04', type: 'PDF', size: '1.2 MB' },
      { name: 'Photos - Vehicle Damage (8)', date: '2024-10-04', type: 'ZIP', size: '12.4 MB' },
      { name: 'Repair Estimate - Premium Auto Body', date: '2024-10-05', type: 'PDF', size: '340 KB' },
      { name: 'Other Driver Insurance Info', date: '2024-10-04', type: 'PDF', size: '89 KB' },
      { name: 'Towing Receipt', date: '2024-10-04', type: 'PDF', size: '45 KB' },
    ],
    timeline: [
      { date: '2024-10-04', time: '17:42', event: 'Accident occurred at Congress & 6th', type: 'incident', by: 'John Doe' },
      { date: '2024-10-04', time: '17:55', event: 'Police arrived — report filed', type: 'verify', by: 'APD Unit 214' },
      { date: '2024-10-04', time: '18:30', event: 'Photos uploaded via mobile app', type: 'submit', by: 'John Doe' },
      { date: '2024-10-04', time: '18:31', event: 'AI damage assessment initiated', type: 'ai', by: 'InsureAI System' },
      { date: '2024-10-04', time: '18:32', event: 'AI estimated repair cost: $2,850 - $3,400', type: 'ai', by: 'InsureAI System' },
      { date: '2024-10-05', time: '09:00', event: 'Formal claim submitted with police report', type: 'submit', by: 'John Doe' },
      { date: '2024-10-05', time: '09:01', event: 'AI review: 98% confidence — recommend full approval', type: 'ai', by: 'InsureAI System' },
      { date: '2024-10-05', time: '09:15', event: 'Claim APPROVED — payout of $2,700 authorized', type: 'approve', by: 'Auto Claims Team' },
      { date: '2024-10-05', time: '09:16', event: 'Repair shop notified — scheduling', type: 'payout', by: 'System' },
    ],
    adjuster: {
      name: 'Mike Thompson',
      phone: '1-800-INSURE ext. 3301',
      email: 'mike.thompson@insureai.com',
    },
    notes: [
      {
        date: '2024-10-05',
        author: 'AI Assistant',
        content: 'Liability clearly established against other driver. Police report confirms red light violation. Claim approved for full repair amount minus $500 deductible. Subrogation initiated against other driver\'s insurer.',
      },
      {
        date: '2024-10-05',
        author: 'Mike Thompson',
        content: 'Confirmed approval. Premium Auto Body has availability next week. Customer can drop off vehicle Monday morning.',
      },
    ],
  },
};

const defaultClaim = {
  id: '',
  title: 'Claim Details',
  policyName: 'Insurance',
  policyId: '',
  dateFiled: '',
  dateOfIncident: '',
  amount: 0,
  estimatedPayout: 0,
  status: 'processing',
  category: 'general',
  aiConfidence: 0,
  description: 'Claim details are being loaded...',
  documents: [],
  timeline: [],
  adjuster: undefined,
  notes: [],
};

const statusConfig: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  approved: { label: 'Approved', class: 'badge-green', icon: CheckCircle2 },
  processing: { label: 'Processing', class: 'badge-blue', icon: Clock },
  pending: { label: 'Pending Review', class: 'badge-yellow', icon: AlertCircle },
  denied: { label: 'Denied', class: 'badge-red', icon: XCircle },
  submitted: { label: 'Submitted', class: 'badge-slate', icon: FileText },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  auto: Car,
  home: Home,
  health: Heart,
  life: Shield,
};

export default function ClaimDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'timeline' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');

  const claim = claimsData[id] || { ...defaultClaim, id };
  const status = statusConfig[claim.status];
  const CategoryIcon = categoryIcons[claim.category] || AlertCircle;

  const tabs = [
    { key: 'details', label: 'Details', icon: Info },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/claims"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claims
      </Link>

      {/* Claim Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{claim.title}</h1>
                {status && (
                  <span className={status.class}>
                    <status.icon className="w-3.5 h-3.5 inline mr-1" />
                    {status.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-mono mb-4">{claim.id}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="btn-secondary btn-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="btn-primary btn-sm">
                <MessageSquare className="w-4 h-4" />
                Chat with AI
              </button>
            </div>
          </div>

          {/* Key Info */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500 mb-1">Claim Amount</p>
              <p className="text-lg font-bold text-slate-900">
                ${claim.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Estimated Payout</p>
              <p className="text-lg font-bold text-emerald-600">
                ${claim.estimatedPayout.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Date Filed</p>
              <p className="text-sm font-semibold text-slate-900">
                {claim.dateFiled
                  ? new Date(claim.dateFiled).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Incident Date</p>
              <p className="text-sm font-semibold text-slate-900">
                {claim.dateOfIncident
                  ? new Date(claim.dateOfIncident).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">AI Confidence</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-blue-600">{claim.aiConfidence}%</p>
                <Brain className="w-4 h-4 text-blue-500" />
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
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Claim Description
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {claim.description}
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">AI Analysis</h2>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-900">
                        Confidence Score
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {claim.aiConfidence}%
                      </span>
                    </div>
                    <div className="progress-bar bg-blue-200 mb-4">
                      <div
                        className="progress-fill bg-blue-600"
                        style={{ width: `${claim.aiConfidence}%` }}
                      />
                    </div>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Documentation is complete and verified</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Claim amount is within expected range for this type</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>No fraud indicators detected</span>
                      </div>
                      {claim.aiConfidence >= 95 && (
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">
                            Eligible for instant approval
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Supporting Documents ({claim.documents.length})
                  </h2>
                  <button className="btn-secondary btn-sm">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                <div className="space-y-3">
                  {claim.documents.length === 0 ? (
                    <div className="empty-state py-8">
                      <FileText className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    claim.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {doc.type} • {doc.size} •{' '}
                            {new Date(doc.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <Eye className="w-4 h-4 text-slate-500" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <Download className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Claim Timeline
                </h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-6">
                    {claim.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-4 relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                            event.type === 'approve'
                              ? 'bg-emerald-100'
                              : event.type === 'ai'
                              ? 'bg-blue-100'
                              : event.type === 'deny'
                              ? 'bg-red-100'
                              : event.type === 'payout'
                              ? 'bg-purple-100'
                              : event.type === 'incident'
                              ? 'bg-amber-100'
                              : 'bg-slate-100'
                          }`}
                        >
                          {event.type === 'approve' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                          {event.type === 'ai' && (
                            <Brain className="w-5 h-5 text-blue-600" />
                          )}
                          {event.type === 'deny' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {event.type === 'payout' && (
                            <DollarSign className="w-5 h-5 text-purple-600" />
                          )}
                          {event.type === 'submit' && (
                            <Send className="w-5 h-5 text-slate-600" />
                          )}
                          {event.type === 'verify' && (
                            <CheckCircle2 className="w-5 h-5 text-slate-600" />
                          )}
                          {event.type === 'assign' && (
                            <User className="w-5 h-5 text-slate-600" />
                          )}
                          {event.type === 'incident' && (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {event.event}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">
                              {event.date} at {event.time}
                            </span>
                            {event.by && (
                              <span className="text-xs text-slate-400">by {event.by}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Claim Notes
                </h2>

                {/* Add Note */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="input min-h-[80px] bg-white mb-3"
                    placeholder="Add a note about this claim..."
                  />
                  <button className="btn-primary btn-sm" disabled={!newNote.trim()}>
                    <Send className="w-4 h-4" />
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {claim.notes.length === 0 ? (
                    <div className="empty-state py-8">
                      <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No notes yet.</p>
                    </div>
                  ) : (
                    claim.notes.map((note, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            {note.author === 'AI Assistant' ? (
                              <Brain className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {note.author}
                          </span>
                          <span className="text-xs text-slate-400">{note.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Policy Link */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Linked Policy
              </h3>
              <Link
                href={`/policies/${claim.policyId}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{claim.policyName}</p>
                  <p className="text-xs text-slate-500 font-mono">{claim.policyId}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Adjuster */}
          {claim.adjuster && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Your Adjuster
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="avatar avatar-md bg-blue-600 text-white">
                    {claim.adjuster.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {claim.adjuster.name}
                    </p>
                    <p className="text-xs text-slate-500">Claims Adjuster</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <a
                    href={`tel:${claim.adjuster.phone}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{claim.adjuster.phone}</span>
                  </a>
                  <a
                    href={`mailto:${claim.adjuster.email}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{claim.adjuster.email}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
              <div className="space-y-2">
                {claim.status === 'processing' && (
                  <button className="btn-primary w-full text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Additional Documents
                  </button>
                )}
                <button className="btn-secondary w-full text-sm">
                  <MessageSquare className="w-4 h-4" />
                  Chat with AI Assistant
                </button>
                <button className="btn-ghost w-full text-sm">
                  <Download className="w-4 h-4" />
                  Download Claim Report
                </button>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Need Help?
              </h3>
              <div className="space-y-2">
                <a
                  href="#"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">1-800-INSURE</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">claims@insureai.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
