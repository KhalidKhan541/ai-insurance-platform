import React from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  User,
  Camera,
  Upload,
  Bot,
  Scale,
  Shield,
  ArrowRight,
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  type:
    | "status_change"
    | "document_uploaded"
    | "note_added"
    | "call_logged"
    | "email_sent"
    | "payment"
    | "adjuster_assigned"
    | "inspection_scheduled"
    | "inspection_completed"
    | "ai_analysis"
    | "fraud_flag"
    | "approval"
    | "denial"
    | "appeal"
    | "communication";
  title: string;
  description: string;
  timestamp: string;
  author?: string;
  authorRole?: "claimant" | "adjuster" | "insurer" | "ai" | "system";
  metadata?: {
    previousValue?: string;
    newValue?: string;
    amount?: number;
    documentName?: string;
    recipient?: string;
    confidence?: number;
  };
  isSystemGenerated?: boolean;
}

interface ClaimTimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onAddNote?: () => void;
  onUploadDocument?: () => void;
  variant?: "default" | "compact" | "detailed";
  showFilters?: boolean;
  className?: string;
}

const EVENT_CONFIG: Record<
  TimelineEvent["type"],
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  status_change: {
    icon: ArrowRight,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Status Changed",
  },
  document_uploaded: {
    icon: Upload,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Document Uploaded",
  },
  note_added: {
    icon: MessageSquare,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "Note Added",
  },
  call_logged: {
    icon: Phone,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Call Logged",
  },
  email_sent: {
    icon: Mail,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    label: "Email Sent",
  },
  payment: {
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "Payment",
  },
  adjuster_assigned: {
    icon: User,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "Adjuster Assigned",
  },
  inspection_scheduled: {
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "Inspection Scheduled",
  },
  inspection_completed: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "Inspection Completed",
  },
  ai_analysis: {
    icon: Bot,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    label: "AI Analysis",
  },
  fraud_flag: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Fraud Flag",
  },
  approval: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "Approved",
  },
  denial: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Denied",
  },
  appeal: {
    icon: Scale,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Appeal Filed",
  },
  communication: {
    icon: MessageSquare,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    label: "Communication",
  },
};

const ROLE_CONFIG: Record<
  NonNullable<TimelineEvent["authorRole"]>,
  { color: string; bgColor: string; label: string }
> = {
  claimant: { color: "text-blue-700", bgColor: "bg-blue-100", label: "Claimant" },
  adjuster: {
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    label: "Adjuster",
  },
  insurer: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    label: "Insurer",
  },
  ai: { color: "text-violet-700", bgColor: "bg-violet-100", label: "AI" },
  system: { color: "text-gray-700", bgColor: "bg-gray-100", label: "System" },
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ClaimTimeline: React.FC<ClaimTimelineProps> = ({
  events,
  onEventClick,
  onAddNote,
  onUploadDocument,
  variant = "default",
  showFilters = true,
  className = "",
}) => {
  const [filter, setFilter] = React.useState<string>("all");
  const [expandedEvent, setExpandedEvent] = React.useState<string | null>(null);

  const eventTypes = React.useMemo(() => {
    const types = new Set(events.map((e) => e.type));
    return Array.from(types);
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const sortedEvents = React.useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredEvents]);

  const toggleExpand = (eventId: string) => {
    setExpandedEvent((prev) => (prev === eventId ? null : eventId));
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        {sortedEvents.slice(0, 5).map((event) => {
          const config = EVENT_CONFIG[event.type];
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onEventClick?.(event)}
            >
              <div
                className={`p-1.5 rounded-lg ${config.bgColor} shrink-0`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {event.description}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {(onAddNote || onUploadDocument) && (
        <div className="flex items-center gap-3">
          {onAddNote && (
            <button
              onClick={onAddNote}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Add Note
            </button>
          )}
          {onUploadDocument && (
            <button
              onClick={onUploadDocument}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Events ({events.length})
          </button>
          {eventTypes.map((type) => {
            const config = EVENT_CONFIG[type];
            const count = events.filter((e) => e.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === type
                    ? `${config.bgColor} ${config.color}`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {config.label}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-1">
          {sortedEvents.map((event, index) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;
            const isExpanded = expandedEvent === event.id;
            const roleConfig = event.authorRole
              ? ROLE_CONFIG[event.authorRole]
              : null;

            return (
              <div key={event.id} className="relative pl-12">
                <div
                  className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 ${config.borderColor} bg-white z-10`}
                />

                <div
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    isExpanded
                      ? "bg-white border border-gray-200 shadow-sm"
                      : "bg-white/50 hover:bg-white hover:border-gray-100 border border-transparent"
                  } cursor-pointer`}
                  onClick={() => {
                    toggleExpand(event.id);
                    onEventClick?.(event);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${config.bgColor} shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </h4>
                          {roleConfig && (
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 rounded ${roleConfig.bgColor} ${roleConfig.color}`}
                            >
                              {roleConfig.label}
                            </span>
                          )}
                          {event.isSystemGenerated && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(event.timestamp)}
                      </p>
                      {event.author && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.author}
                        </p>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Full Timestamp:</span>{" "}
                        {formatFullTimestamp(event.timestamp)}
                      </p>
                      {event.metadata && (
                        <div className="space-y-1.5">
                          {event.metadata.previousValue && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Previous:</span>
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded font-mono">
                                {event.metadata.previousValue}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-mono">
                                {event.metadata.newValue}
                              </span>
                            </div>
                          )}
                          {event.metadata.amount !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-semibold text-gray-900">
                                $
                                {event.metadata.amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {event.metadata.documentName && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Document:</span>
                              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                <FileText className="w-3 h-3" />
                                {event.metadata.documentName}
                              </span>
                            </div>
                          )}
                          {event.metadata.confidence !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Confidence:</span>
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500 rounded-full"
                                  style={{
                                    width: `${event.metadata.confidence}%`,
                                  }}
                                />
                              </div>
                              <span className="font-medium text-gray-700">
                                {event.metadata.confidence}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sortedEvents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            No timeline events
          </p>
          <p className="text-xs text-gray-500">
            {filter !== "all"
              ? "Try selecting a different filter."
              : "Events will appear as the claim progresses."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimTimeline;
