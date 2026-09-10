'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  File,
  FileImage,
  FileSpreadsheet,
  ChevronDown,
  Grid,
  List,
  Plus,
  Tag,
  Calendar,
  HardDrive,
} from 'lucide-react';

type DocStatus = 'verified' | 'pending' | 'expired' | 'action_required';
type DocCategory = 'policy' | 'claim' | 'identity' | 'medical' | 'financial' | 'legal';

interface Document {
  id: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  type: string;
  policyId?: string;
  expiryDate?: string;
  tags: string[];
}

const CATEGORY_CONFIG: Record<DocCategory, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  policy: { label: 'Policy Documents', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Shield },
  claim: { label: 'Claim Documents', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: FileText },
  identity: { label: 'Identity Verification', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: File },
  medical: { label: 'Medical Records', color: 'text-rose-600', bgColor: 'bg-rose-50', icon: FileText },
  financial: { label: 'Financial Records', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: FileSpreadsheet },
  legal: { label: 'Legal Documents', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: FileText },
};

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  verified: { label: 'Verified', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle },
  pending: { label: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  expired: { label: 'Expired', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertTriangle },
  action_required: { label: 'Action Required', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertTriangle },
};

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) return FileImage;
  if (type.includes('spreadsheet') || type.includes('csv') || type.includes('xlsx')) return FileSpreadsheet;
  return File;
}

const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Auto Policy #AP-2024-0847.pdf', category: 'policy', status: 'verified', uploadedBy: 'Agent Sarah Chen', uploadedAt: '2024-01-15', size: '2.4 MB', type: 'application/pdf', policyId: 'AP-2024-0847', tags: ['auto', 'renewal'] },
  { id: '2', name: 'Claim Report - Vehicle Damage.pdf', category: 'claim', status: 'pending', uploadedBy: 'John Mitchell', uploadedAt: '2024-01-12', size: '5.1 MB', type: 'application/pdf', policyId: 'AP-2024-0847', tags: ['claim', 'vehicle'] },
  { id: '3', name: 'Drivers License Front.jpg', category: 'identity', status: 'verified', uploadedBy: 'John Mitchell', uploadedAt: '2024-01-10', size: '1.8 MB', type: 'image/jpeg', tags: ['identity', 'license'] },
  { id: '4', name: 'Medical Examination Report.pdf', category: 'medical', status: 'expired', uploadedBy: 'Dr. Emily Ross', uploadedAt: '2023-06-20', size: '3.2 MB', type: 'application/pdf', policyId: 'HL-2024-1234', expiryDate: '2024-06-20', tags: ['medical', 'annual'] },
  { id: '5', name: 'Bank Statement - December 2023.pdf', category: 'financial', status: 'verified', uploadedBy: 'John Mitchell', uploadedAt: '2024-01-08', size: '890 KB', type: 'application/pdf', tags: ['financial', 'bank'] },
  { id: '6', name: 'Home Inspection Report.pdf', category: 'policy', status: 'action_required', uploadedBy: 'Inspector Mike', uploadedAt: '2024-01-05', size: '4.7 MB', type: 'application/pdf', policyId: 'HM-2024-0567', tags: ['home', 'inspection'] },
  { id: '7', name: 'Power of Attorney Form.pdf', category: 'legal', status: 'verified', uploadedBy: 'Attorney Jane Smith', uploadedAt: '2023-12-15', size: '567 KB', type: 'application/pdf', tags: ['legal', 'poa'] },
  { id: '8', name: 'Vehicle Registration.pdf', category: 'policy', status: 'verified', uploadedBy: 'DMV', uploadedAt: '2024-01-02', size: '1.2 MB', type: 'application/pdf', policyId: 'AP-2024-0847', tags: ['auto', 'registration'] },
  { id: '9', name: 'Pre-Auth Request Form.pdf', category: 'claim', status: 'pending', uploadedBy: 'Dr. Robert Kim', uploadedAt: '2024-01-14', size: '2.1 MB', type: 'application/pdf', policyId: 'HL-2024-1234', tags: ['medical', 'auth'] },
  { id: '10', name: 'Property Photos.zip', category: 'claim', status: 'verified', uploadedBy: 'John Mitchell', uploadedAt: '2024-01-11', size: '15.6 MB', type: 'application/zip', policyId: 'HM-2024-0567', tags: ['home', 'photos'] },
];

function DocumentRow({ doc }: { doc: Document }) {
  const statusConfig = STATUS_CONFIG[doc.status];
  const StatusIcon = statusConfig.icon;
  const FileIcon = getFileIcon(doc.type);

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <FileIcon className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
            <p className="text-xs text-slate-500">Uploaded by {doc.uploadedBy}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">{doc.size}</td>
      <td className="px-4 py-3.5 text-sm text-slate-600">{doc.uploadedAt}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DocStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const categories = Object.entries(CATEGORY_CONFIG) as [DocCategory, typeof CATEGORY_CONFIG[DocCategory]][];

  const filteredDocuments = MOCK_DOCUMENTS.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoryStats = categories.map(([key, config]) => ({
    ...config,
    key,
    count: MOCK_DOCUMENTS.filter((d) => d.category === key).length,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Documents</h1>
              <p className="page-subtitle">Manage and organize all your insurance documents</p>
            </div>
            <button className="btn-primary">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categoryStats.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? 'all' : cat.key)}
              className={`p-4 rounded-xl border transition-all ${
                selectedCategory === cat.key
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-lg ${cat.bgColor} w-fit mb-2`}>
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{cat.count}</p>
              <p className="text-xs text-slate-500">{cat.label}</p>
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="card mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search documents by name, policy ID, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as DocStatus | 'all')}
                  className="input w-44"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Review</option>
                  <option value="expired">Expired</option>
                  <option value="action_required">Action Required</option>
                </select>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        {viewMode === 'list' ? (
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Date</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const statusConfig = STATUS_CONFIG[doc.status];
              const StatusIcon = statusConfig.icon;
              const FileIcon = getFileIcon(doc.type);
              return (
                <div key={doc.id} className="card hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-blue-50 transition-colors">
                        <FileIcon className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{doc.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">Uploaded by {doc.uploadedBy}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {doc.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.uploadedAt}
                      </span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {doc.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Area */}
        <div className="card mt-6 border-dashed border-2 border-slate-300 hover:border-blue-400 transition-colors">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-2xl bg-blue-50 mb-4">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Drop files here to upload</h3>
            <p className="text-sm text-slate-500 mb-4">
              or click to browse. Supports PDF, JPEG, PNG, CSV, and XLSX up to 50MB.
            </p>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Choose Files
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <HardDrive className="w-4 h-4" />
              Storage Used
            </div>
            <span className="text-sm font-semibold text-slate-900">42.6 GB / 100 GB</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill bg-blue-500" style={{ width: '42.6%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">You have 57.4 GB remaining. Upgrade to Pro for unlimited storage.</p>
        </div>
      </div>
    </div>
  );
}
