'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  Shield,
  FileText,
  DollarSign,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';

type ClientStatus = 'active' | 'prospect' | 'inactive' | 'renewal';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  policies: number;
  annualPremium: number;
  riskScore: number;
  joinDate: string;
  lastContact: string;
  location: string;
  tags: string[];
  avatar: string;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  prospect: { label: 'Prospect', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  inactive: { label: 'Inactive', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  renewal: { label: 'Renewal Due', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Tech Corp Inc.', email: 'admin@techcorp.com', phone: '+1 (555) 100-2000', status: 'active', policies: 5, annualPremium: 8400, riskScore: 28, joinDate: '2022-03-15', lastContact: '2024-01-12', location: 'Chicago, IL', tags: ['commercial', 'umbrella'], avatar: 'TC' },
  { id: '2', name: 'John Mitchell', email: 'john.mitchell@email.com', phone: '+1 (555) 234-5678', status: 'active', policies: 3, annualPremium: 4200, riskScore: 42, joinDate: '2023-01-10', lastContact: '2024-01-15', location: 'Springfield, IL', tags: ['auto', 'home', 'life'], avatar: 'JM' },
  { id: '3', name: 'Sarah Williams', email: 'sarah.w@email.com', phone: '+1 (555) 345-6789', status: 'active', policies: 2, annualPremium: 3600, riskScore: 35, joinDate: '2023-06-20', lastContact: '2024-01-10', location: 'Naperville, IL', tags: ['home', 'auto'], avatar: 'SW' },
  { id: '4', name: 'Robert Davis', email: 'r.davis@email.com', phone: '+1 (555) 456-7890', status: 'renewal', policies: 2, annualPremium: 2800, riskScore: 55, joinDate: '2022-08-05', lastContact: '2024-01-08', location: 'Aurora, IL', tags: ['auto', 'health'], avatar: 'RD' },
  { id: '5', name: 'Lisa Anderson', email: 'lisa.a@email.com', phone: '+1 (555) 567-8901', status: 'renewal', policies: 1, annualPremium: 1800, riskScore: 38, joinDate: '2023-02-28', lastContact: '2024-01-05', location: 'Joliet, IL', tags: ['auto'], avatar: 'LA' },
  { id: '6', name: 'Michael Brown', email: 'mbrown@email.com', phone: '+1 (555) 678-9012', status: 'prospect', policies: 0, annualPremium: 0, riskScore: 0, joinDate: '2024-01-14', lastContact: '2024-01-14', location: 'Peoria, IL', tags: ['auto', 'home'], avatar: 'MB' },
  { id: '7', name: 'Emily Garcia', email: 'emily.g@email.com', phone: '+1 (555) 789-0123', status: 'prospect', policies: 0, annualPremium: 0, riskScore: 0, joinDate: '2024-01-12', lastContact: '2024-01-12', location: 'Rockford, IL', tags: ['health'], avatar: 'EG' },
  { id: '8', name: 'David Wilson', email: 'd.wilson@email.com', phone: '+1 (555) 890-1234', status: 'inactive', policies: 1, annualPremium: 1200, riskScore: 62, joinDate: '2022-11-10', lastContact: '2023-09-15', location: 'Champaign, IL', tags: ['auto'], avatar: 'DW' },
  { id: '9', name: 'Jennifer Lee', email: 'j.lee@email.com', phone: '+1 (555) 901-2345', status: 'active', policies: 4, annualPremium: 6800, riskScore: 22, joinDate: '2021-05-20', lastContact: '2024-01-13', location: 'Evanston, IL', tags: ['home', 'auto', 'umbrella', 'life'], avatar: 'JL' },
  { id: '10', name: 'James Martinez', email: 'j.martinez@email.com', phone: '+1 (555) 012-3456', status: 'active', policies: 2, annualPremium: 3200, riskScore: 45, joinDate: '2023-04-12', lastContact: '2024-01-11', location: 'Elgin, IL', tags: ['auto', 'home'], avatar: 'JM' },
];

function ClientRow({ client }: { client: Client }) {
  const statusConfig = STATUS_CONFIG[client.status];

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">{client.avatar}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{client.name}</p>
            <p className="text-xs text-slate-500">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">{client.policies}</td>
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">
        {client.annualPremium > 0 ? `$${client.annualPremium.toLocaleString()}` : '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            client.riskScore <= 30 ? 'bg-emerald-500' : client.riskScore <= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-slate-600">
            {client.riskScore > 0 ? client.riskScore : 'N/A'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">{client.lastContact}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Mail className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'premium' | 'recent'>('name');

  const filteredClients = MOCK_CLIENTS.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'premium') return b.annualPremium - a.annualPremium;
    if (sortBy === 'recent') return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
    return a.name.localeCompare(b.name);
  });

  const totalClients = MOCK_CLIENTS.length;
  const activeClients = MOCK_CLIENTS.filter(c => c.status === 'active').length;
  const totalPremium = MOCK_CLIENTS.reduce((sum, c) => sum + c.annualPremium, 0);
  const renewalClients = MOCK_CLIENTS.filter(c => c.status === 'renewal').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your client portfolio and relationships</p>
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="stat-label">Total Clients</p>
              <p className="stat-value">{totalClients}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="stat-label">Active</p>
              <p className="stat-value">{activeClients}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="stat-label">Total Premium</p>
              <p className="stat-value">${totalPremium.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="stat-label">Renewals Due</p>
              <p className="stat-value">{renewalClients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ClientStatus | 'all')}
                className="input w-40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="renewal">Renewal Due</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'premium' | 'recent')}
                className="input w-40"
              >
                <option value="name">Sort by Name</option>
                <option value="premium">Sort by Premium</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Policies</th>
                <th>Annual Premium</th>
                <th>Risk</th>
                <th>Last Contact</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <ClientRow key={client.id} client={client} />
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="empty-state">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No clients found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-slate-500">
          Showing 1-{filteredClients.length} of {filteredClients.length} clients
        </p>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Previous
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            1
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            2
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
