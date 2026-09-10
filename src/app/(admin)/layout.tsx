'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  MessageSquare,
  Database,
  Zap,
  Lock,
  Globe,
  HelpCircle,
  Menu,
  Activity,
  TrendingUp,
  UserCheck,
  DollarSign,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/policies', label: 'Policies', icon: Shield },
  { href: '/admin/claims', label: 'Claims', icon: FileText },
  { href: '/admin/fraud', label: 'Fraud Detection', icon: AlertTriangle, badge: 3 },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/ai', label: 'AI Insights', icon: Zap },
];

const ADMIN_INFO = {
  name: 'Alex Thompson',
  role: 'System Administrator',
  email: 'admin@insureai.com',
  avatar: 'AT',
  lastLogin: '2 hours ago',
};

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/50">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">InsureAI</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Admin Profile */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{ADMIN_INFO.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{ADMIN_INFO.name}</p>
              <p className="text-xs text-slate-400">{ADMIN_INFO.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">System Operational</span>
          </div>
          <div className="text-[10px] text-slate-500">
            API Response: 42ms · Uptime: 99.98%
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-700/50 space-y-1">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </Link>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, policies, claims..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <Activity className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{ADMIN_INFO.avatar}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{ADMIN_INFO.name}</p>
              <p className="text-xs text-slate-500">Last login: {ADMIN_INFO.lastLogin}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
