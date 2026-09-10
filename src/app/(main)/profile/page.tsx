'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  Building,
  Globe,
  CreditCard,
  FileText,
  Trash2,
  Plus,
  ExternalLink,
  Key,
  Smartphone,
  Monitor,
  Clock,
} from 'lucide-react';

type ProfileTab = 'personal' | 'security' | 'notifications' | 'billing' | 'activity';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const MOCK_NOTIFICATIONS: NotificationSetting[] = [
  { id: '1', label: 'Policy Updates', description: 'Get notified about changes to your policies', email: true, sms: false, push: true },
  { id: '2', label: 'Payment Reminders', description: 'Reminders before payment due dates', email: true, sms: true, push: true },
  { id: '3', label: 'Claim Status', description: 'Updates on your claim processing status', email: true, sms: true, push: true },
  { id: '4', label: 'Renewal Notices', description: 'Notifications about upcoming policy renewals', email: true, sms: false, push: true },
  { id: '5', label: 'Security Alerts', description: 'Important security notifications', email: true, sms: true, push: true },
  { id: '6', label: 'Marketing', description: 'New products, offers, and tips', email: false, sms: false, push: false },
];

const MOCK_DEVICES = [
  { id: '1', name: 'MacBook Pro', type: 'Desktop', os: 'macOS 14.2', browser: 'Chrome 120', lastActive: '2 hours ago', current: true },
  { id: '2', name: 'iPhone 15 Pro', type: 'Mobile', os: 'iOS 17.2', browser: 'Safari', lastActive: '1 hour ago', current: false },
  { id: '3', name: 'iPad Air', type: 'Tablet', os: 'iPadOS 17.2', browser: 'Safari', lastActive: '3 days ago', current: false },
];

const MOCK_ACTIVITY = [
  { id: '1', action: 'Logged in', timestamp: '2024-01-15 14:32', ip: '192.168.1.1', device: 'MacBook Pro' },
  { id: '2', action: 'Updated phone number', timestamp: '2024-01-14 09:15', ip: '192.168.1.1', device: 'MacBook Pro' },
  { id: '3', action: 'Changed password', timestamp: '2024-01-12 16:45', ip: '192.168.1.1', device: 'MacBook Pro' },
  { id: '4', action: 'Logged in', timestamp: '2024-01-12 08:22', ip: '10.0.0.1', device: 'iPhone 15 Pro' },
  { id: '5', action: 'Downloaded policy document', timestamp: '2024-01-10 11:30', ip: '192.168.1.1', device: 'MacBook Pro' },
  { id: '6', action: 'Logged in', timestamp: '2024-01-10 08:01', ip: '192.168.1.1', device: 'MacBook Pro' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const tabs: { key: ProfileTab; label: string; icon: React.ElementType }[] = [
    { key: 'personal', label: 'Personal Info', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'billing', label: 'Billing', icon: CreditCard },
    { key: 'activity', label: 'Activity Log', icon: Clock },
  ];

  const toggleNotification = (id: string, field: 'email' | 'sms' | 'push') => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [field]: !n[field] } : n))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>

        {/* Profile Header Card */}
        <div className="card mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">JM</span>
                </div>
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
              <div className="flex-1 pb-1">
                <h2 className="text-xl font-bold text-slate-900">John Mitchell</h2>
                <p className="text-sm text-slate-500">Member since January 2023</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Verified Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Personal Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-ghost btn-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      defaultValue="John"
                      disabled={!isEditing}
                      className="input disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Mitchell"
                      disabled={!isEditing}
                      className="input disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        defaultValue="john.mitchell@email.com"
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-slate-50 disabled:text-slate-600"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        defaultValue="+1 (555) 234-5678"
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-slate-50 disabled:text-slate-600"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <div className="relative">
                      <input
                        type="date"
                        defaultValue="1985-06-15"
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-slate-50 disabled:text-slate-600"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="label">SSN (Last 4)</label>
                    <input
                      type="text"
                      defaultValue="••••"
                      disabled={!isEditing}
                      className="input disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue="1234 Oak Avenue, Suite 567, Springfield, IL 62704"
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-slate-50 disabled:text-slate-600"
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center justify-end gap-3 mt-5 pt-5 border-t border-slate-100">
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button className="btn-primary">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Emergency Contact</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="label">Contact Name</label>
                    <input type="text" defaultValue="Sarah Mitchell" className="input" />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <select className="input">
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input type="tel" defaultValue="+1 (555) 345-6789" className="input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Password */}
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" placeholder="Enter new password" className="input" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="input" />
                </div>
                <div className="flex items-center justify-end">
                  <button className="btn-primary">
                    <Lock className="w-4 h-4" />
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Two-Factor Authentication</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">2FA is enabled</p>
                      <p className="text-xs text-emerald-600">Your account is protected with authenticator app</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost btn-sm text-slate-600">
                      <Key className="w-4 h-4" />
                      Backup Codes
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Active Sessions</h3>
                  <button className="text-xs font-semibold text-red-600 hover:text-red-700">Revoke All</button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {MOCK_DEVICES.map((device) => (
                  <div key={device.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Monitor className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{device.name}</p>
                          {device.current && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{device.os} · {device.browser} · Last active {device.lastActive}</p>
                      </div>
                    </div>
                    {!device.current && (
                      <button className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
            </div>
            <div className="p-5">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Notification Type</th>
                      <th className="text-center">Email</th>
                      <th className="text-center">SMS</th>
                      <th className="text-center">Push</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification) => (
                      <tr key={notification.id}>
                        <td>
                          <p className="text-sm font-semibold text-slate-900">{notification.label}</p>
                          <p className="text-xs text-slate-500">{notification.description}</p>
                        </td>
                        <td className="text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notification.email}
                              onChange={() => toggleNotification(notification.id, 'email')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                          </label>
                        </td>
                        <td className="text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notification.sms}
                              onChange={() => toggleNotification(notification.id, 'sms')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                          </label>
                        </td>
                        <td className="text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notification.push}
                              onChange={() => toggleNotification(notification.id, 'push')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Billing Address</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Address Line 1</label>
                    <input type="text" defaultValue="1234 Oak Avenue" className="input" />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input type="text" defaultValue="Springfield" className="input" />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <select className="input" defaultValue="IL">
                      <option>Illinois</option>
                      <option>California</option>
                      <option>New York</option>
                      <option>Texas</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">ZIP Code</label>
                    <input type="text" defaultValue="62704" className="input" />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <select className="input" defaultValue="US">
                      <option>United States</option>
                      <option>Canada</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-5 pt-5 border-t border-slate-100">
                  <button className="btn-primary">
                    <Save className="w-4 h-4" />
                    Save Address
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Saved Payment Methods</h3>
                  <button className="btn-ghost btn-sm">
                    <Plus className="w-4 h-4" />
                    Add Method
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Visa ending in 4242</p>
                      <p className="text-xs text-slate-500">Expires 08/2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Default</span>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Chase checking ····6789</p>
                      <p className="text-xs text-slate-500">ACH Transfer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Set Default</button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Account Activity</h3>
                <button className="btn-ghost btn-sm">
                  <Download className="w-4 h-4" />
                  Export Log
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_ACTIVITY.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Shield className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500">
                        {activity.device} · IP: {activity.ip}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card mt-6 border-red-200">
          <div className="p-5">
            <h3 className="text-base font-semibold text-red-600 mb-1">Danger Zone</h3>
            <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated data.</p>
            <button className="btn-danger btn-sm">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Banknote(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
