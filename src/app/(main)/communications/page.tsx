'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Inbox,
  Star,
  Archive,
  Trash2,
  Clock,
  CheckCircle,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Bell,
  AlertCircle,
  ChevronDown,
  Mail,
  MessageCircle,
  PhoneCall,
  FileText,
  User,
} from 'lucide-react';

type MessagePriority = 'high' | 'normal' | 'low';
type MessageStatus = 'unread' | 'read' | 'archived' | 'deleted';
type ChannelType = 'email' | 'sms' | 'in_app' | 'phone';

interface Message {
  id: string;
  subject: string;
  preview: string;
  from: string;
  fromAvatar?: string;
  to?: string;
  channel: ChannelType;
  priority: MessagePriority;
  status: MessageStatus;
  date: string;
  time: string;
  hasAttachment: boolean;
  policyId?: string;
  category: 'claim' | 'policy' | 'billing' | 'support' | 'general';
  isStarred: boolean;
}

interface Conversation {
  id: string;
  participant: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: ChannelType;
  isOnline: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  claim: { label: 'Claim', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  policy: { label: 'Policy', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  billing: { label: 'Billing', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  support: { label: 'Support', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  general: { label: 'General', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

const CHANNEL_ICONS: Record<ChannelType, React.ElementType> = {
  email: Mail,
  sms: MessageCircle,
  in_app: MessageSquare,
  phone: Phone,
};

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', participant: 'Sarah Chen', participantRole: 'Insurance Agent', lastMessage: 'I\'ve reviewed your claim and everything looks good!', lastMessageTime: '10 min ago', unreadCount: 2, channel: 'in_app', isOnline: true },
  { id: '2', participant: 'Claims Department', participantRole: 'Support Team', lastMessage: 'Your claim #CL-2024-0089 has been assigned to an adjuster.', lastMessageTime: '1 hour ago', unreadCount: 0, channel: 'email', isOnline: true },
  { id: '3', participant: 'Billing Support', participantRole: 'Finance', lastMessage: 'Payment received. Thank you!', lastMessageTime: '3 hours ago', unreadCount: 0, channel: 'sms', isOnline: false },
  { id: '4', participant: 'Dr. Emily Ross', participantRole: 'Medical Provider', lastMessage: 'Please submit the additional documentation by Friday.', lastMessageTime: 'Yesterday', unreadCount: 1, channel: 'email', isOnline: false },
  { id: '5', participant: 'Mike Johnson', participantRole: 'Claims Adjuster', lastMessage: 'The inspection is scheduled for next Tuesday.', lastMessageTime: '2 days ago', unreadCount: 0, channel: 'phone', isOnline: true },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    subject: 'Claim Update - Vehicle Damage Assessment',
    preview: 'Hi John, I\'ve reviewed your claim for the vehicle damage and I\'m pleased to inform you that everything looks good. The adjuster has completed...',
    from: 'Sarah Chen',
    channel: 'in_app',
    priority: 'normal',
    status: 'unread',
    date: 'Jan 15, 2024',
    time: '2:30 PM',
    hasAttachment: true,
    policyId: 'AP-2024-0847',
    category: 'claim',
    isStarred: true,
  },
  {
    id: '2',
    subject: 'Payment Confirmation - Invoice #INV-2024-0115',
    preview: 'Your payment of $189.00 has been successfully processed. Thank you for your prompt payment. This confirms your January premium for policy...',
    from: 'Billing Department',
    channel: 'email',
    priority: 'normal',
    status: 'read',
    date: 'Jan 15, 2024',
    time: '10:15 AM',
    hasAttachment: false,
    category: 'billing',
    isStarred: false,
  },
  {
    id: '3',
    subject: 'Action Required: Additional Documentation Needed',
    preview: 'Dear John, we require additional documentation to process your health insurance claim. Please submit your medical examination report and...',
    from: 'Claims Department',
    channel: 'email',
    priority: 'high',
    status: 'unread',
    date: 'Jan 14, 2024',
    time: '4:45 PM',
    hasAttachment: true,
    policyId: 'HL-2024-1234',
    category: 'claim',
    isStarred: true,
  },
  {
    id: '4',
    subject: 'Policy Renewal Reminder',
    preview: 'This is a friendly reminder that your Auto Insurance policy AP-2024-0847 is up for renewal on February 15, 2024. Please review your coverage...',
    from: 'Sarah Chen',
    channel: 'in_app',
    priority: 'normal',
    status: 'read',
    date: 'Jan 12, 2024',
    time: '9:00 AM',
    hasAttachment: false,
    policyId: 'AP-2024-0847',
    category: 'policy',
    isStarred: false,
  },
  {
    id: '5',
    subject: 'SMS: Your appointment is confirmed',
    preview: 'Your home inspection has been confirmed for Tuesday, Jan 23 at 10:00 AM. Please ensure someone is available at the property.',
    from: 'InsureAI SMS',
    channel: 'sms',
    priority: 'low',
    status: 'read',
    date: 'Jan 11, 2024',
    time: '3:20 PM',
    hasAttachment: false,
    category: 'general',
    isStarred: false,
  },
  {
    id: '6',
    subject: 'Welcome to InsureAI Support',
    preview: 'Thank you for choosing InsureAI! We\'re here to help with any questions about your policies, claims, or account. You can reach us...',
    from: 'Support Team',
    channel: 'email',
    priority: 'normal',
    status: 'archived',
    date: 'Jan 5, 2024',
    time: '8:00 AM',
    hasAttachment: false,
    category: 'support',
    isStarred: false,
  },
  {
    id: '7',
    subject: 'Claim Denial - Insufficient Information',
    preview: 'After careful review, we are unable to process claim #CL-2024-0045 due to insufficient documentation. Please resubmit with the required...',
    from: 'Claims Department',
    channel: 'email',
    priority: 'high',
    status: 'unread',
    date: 'Jan 10, 2024',
    time: '11:30 AM',
    hasAttachment: true,
    policyId: 'HM-2024-0567',
    category: 'claim',
    isStarred: false,
  },
  {
    id: '8',
    subject: 'Phone Call: Coverage Question',
    preview: 'Missed call from Support Team regarding your inquiry about umbrella policy coverage options. Please call back at your convenience.',
    from: 'Support Team',
    channel: 'phone',
    priority: 'normal',
    status: 'read',
    date: 'Jan 9, 2024',
    time: '2:15 PM',
    hasAttachment: false,
    category: 'support',
    isStarred: false,
  },
];

function MessageRow({ message, isSelected, onClick }: { message: Message; isSelected: boolean; onClick: () => void }) {
  const categoryConfig = CATEGORY_CONFIG[message.category];
  const ChannelIcon = CHANNEL_ICONS[message.channel];
  const isUnread = message.status === 'unread';

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-4 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
      } ${isUnread ? 'bg-blue-50/50' : ''}`}
    >
      <div className="relative mt-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isUnread ? 'bg-blue-100' : 'bg-slate-100'
        }`}>
          <User className={`w-5 h-5 ${isUnread ? 'text-blue-600' : 'text-slate-500'}`} />
        </div>
        <ChannelIcon className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-slate-400 bg-white rounded-full p-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
              {message.from}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${categoryConfig.bgColor} ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
            {message.priority === 'high' && (
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {message.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
            {message.hasAttachment && <Paperclip className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-xs text-slate-500">{message.time}</span>
          </div>
        </div>
        <p className={`text-sm mb-1 ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
          {message.subject}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">{message.preview}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400">{message.date}</span>
          {message.policyId && (
            <span className="text-xs text-blue-500 font-medium">{message.policyId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [activeChannel, setActiveChannel] = useState<'all' | ChannelType>('all');
  const [replyText, setReplyText] = useState('');

  const filters = [
    { key: 'all' as const, label: 'All Messages', icon: Inbox },
    { key: 'unread' as const, label: 'Unread', icon: Mail },
    { key: 'starred' as const, label: 'Starred', icon: Star },
    { key: 'archived' as const, label: 'Archived', icon: Archive },
  ];

  const channels = [
    { key: 'all' as const, label: 'All Channels', icon: MessageSquare },
    { key: 'email' as const, label: 'Email', icon: Mail },
    { key: 'sms' as const, label: 'SMS', icon: MessageCircle },
    { key: 'in_app' as const, label: 'In-App', icon: MessageSquare },
    { key: 'phone' as const, label: 'Phone', icon: Phone },
  ];

  const filteredMessages = MOCK_MESSAGES.filter((msg) => {
    const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' ||
      (activeFilter === 'unread' && msg.status === 'unread') ||
      (activeFilter === 'starred' && msg.isStarred) ||
      (activeFilter === 'archived' && msg.status === 'archived');
    const matchesChannel = activeChannel === 'all' || msg.channel === activeChannel;
    return matchesSearch && matchesFilter && matchesChannel;
  });

  const unreadCount = MOCK_MESSAGES.filter(m => m.status === 'unread').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Communications</h1>
              <p className="page-subtitle">Messages, notifications, and correspondence</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary relative">
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Conversations */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="input pl-10 text-sm"
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {MOCK_CONVERSATIONS.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {conv.participant.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {conv.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {conv.participant}
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mb-1">{conv.lastMessage}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{conv.participantRole}</span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeFilter === filter.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <filter.icon className="w-3.5 h-3.5" />
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {channels.map((ch) => (
                  <button
                    key={ch.key}
                    onClick={() => setActiveChannel(ch.key)}
                    className={`p-1.5 rounded-lg transition-all ${
                      activeChannel === ch.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={ch.label}
                  >
                    <ch.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Message List / Detail Split */}
            <div className="card overflow-hidden">
              {!selectedMessage ? (
                <div>
                  <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  <div className="max-h-[700px] overflow-y-auto">
                    {filteredMessages.map((msg) => (
                      <MessageRow
                        key={msg.id}
                        message={msg}
                        isSelected={false}
                        onClick={() => setSelectedMessage(msg)}
                      />
                    ))}
                    {filteredMessages.length === 0 && (
                      <div className="empty-state">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">No messages found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Message Detail Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                      </button>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{selectedMessage.subject}</h3>
                        <p className="text-xs text-slate-500">
                          From {selectedMessage.from} · {selectedMessage.date} {selectedMessage.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{selectedMessage.from}</span>
                          <span className="text-xs text-slate-500">{selectedMessage.time}</span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed space-y-4">
                          <p>Dear John,</p>
                          <p>{selectedMessage.preview}</p>
                          <p>Please don&apos;t hesitate to reach out if you have any questions or need further assistance.</p>
                          <p>Best regards,<br />{selectedMessage.from}</p>
                        </div>
                        {selectedMessage.hasAttachment && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="text-sm font-medium text-slate-700">attachment.pdf</p>
                                <p className="text-xs text-slate-500">2.4 MB</p>
                              </div>
                              <button className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700">
                                Download
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply Box */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">JM</span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            rows={3}
                            className="input resize-none"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Phone className="w-4 h-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Video className="w-4 h-4" />
                              </button>
                            </div>
                            <button className="btn-primary btn-sm">
                              <Send className="w-4 h-4" />
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
