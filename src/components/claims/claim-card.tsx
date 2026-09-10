import React from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Camera,
  MessageSquare,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Eye,
} from "lucide-react";

export interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  type: "auto" | "home" | "health" | "life" | "business" | "property";
  status:
    | "submitted"
    | "under_review"
    | "investigating"
    | "approved"
    | "denied"
    | "paid"
    | "closed"
    | "appealed";
  title: string;
  description: string;
  incidentDate: string;
  filedDate: string;
  lastUpdated: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  adjuster?: string;
  estimatedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  deductible: number;
  location: string;
  documentsCount: number;
  photosCount: number;
  notesCount: number;
  priority: "low" | "medium" | "high" | "critical";
  fraudFlag?: boolean;
  aiSeverityScore?: number;
  tags: string[];
}

interface ClaimCardProps {
  claim: Claim;
  onSelect?: (claim: Claim) => void;
  onViewDocuments?: (claim: Claim) => void;
  onAddNote?: (claim: Claim) => void;
  variant?: "default" | "compact" | "detailed" | "dashboard";
  showActions?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  Claim["type"],
  { color: string; bgColor: string; label: string }
> = {
  auto: { color: "text-blue-600", bgColor: "bg-blue-50", label: "Auto" },
  home: { color: "text-emerald-600", bgColor: "bg-emerald-50", label: "Home" },
  health: { color: "text-rose-600", bgColor: "bg-rose-50", label: "Health" },
  life: { color: "text-purple-600", bgColor: "bg-purple-50", label: "Life" },
  business: {
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Business",
  },
  property: {
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    label: "Property",
  },
};

const STATUS_CONFIG: Record<
  Claim["status"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  submitted: {
    icon: FileText,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Submitted",
  },
  under_review: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Under Review",
  },
  investigating: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Investigating",
  },
  approved: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Approved",
  },
  denied: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Denied",
  },
  paid: {
    icon: DollarSign,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Paid",
  },
  closed: {
    icon: CheckCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Closed",
  },
  appealed: {
    icon: AlertTriangle,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Appealed",
  },
};

const PRIORITY_CONFIG: Record<
  Claim["priority"],
  { color: string; bgColor: string; label: string }
> = {
  low: { color: "text-gray-600", bgColor: "bg-gray-100", label: "Low" },
  medium: { color: "text-amber-600", bgColor: "bg-amber-100", label: "Medium" },
  high: { color: "text-orange-600", bgColor: "bg-orange-100", label: "High" },
  critical: { color: "text-red-600", bgColor: "bg-red-100", label: "Critical" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysSince(dateStr: string): number {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getSeverityColor(score: number): string {
  if (score <= 30) return "text-emerald-600";
  if (score <= 60) return "text-amber-600";
  return "text-red-600";
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  onSelect,
  onViewDocuments,
  onAddNote,
  variant = "default",
  showActions = true,
  className = "",
}) => {
  const typeConfig = TYPE_CONFIG[claim.type];
  const statusConfig = STATUS_CONFIG[claim.status];
  const priorityConfig = PRIORITY_CONFIG[claim.priority];
  const StatusIcon = statusConfig.icon;
  const daysAgo = daysSince(claim.lastUpdated);

  if (variant === "compact") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group ${className}`}
        onClick={() => onSelect?.(claim)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                claim.status === "approved"
                  ? "bg-emerald-500"
                  : claim.status === "denied"
                  ? "bg-red-500"
                  : claim.status === "paid"
                  ? "bg-blue-500"
                  : "bg-amber-500"
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {claim.claimNumber}
              </p>
              <p className="text-xs text-gray-500">{claim.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${className}`}
        onClick={() => onSelect?.(claim)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}
            >
              {typeConfig.label}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}
            >
              {priorityConfig.label}
            </span>
            {claim.fraudFlag && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                Fraud Flag
              </span>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>

        <h4 className="text-sm font-bold text-gray-900 mb-1">{claim.title}</h4>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {claim.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {claim.claimNumber}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(claim.incidentDate)}
            </span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(claim.estimatedAmount)}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all ${className}`}
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {claim.title}
                </h3>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
                >
                  <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {claim.claimNumber}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Filed {formatDate(claim.filedDate)}
                </span>
                {claim.adjuster && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {claim.adjuster}
                  </span>
                )}
              </div>
            </div>

            {claim.fraudFlag && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Estimated Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(claim.estimatedAmount)}
              </p>
            </div>
            {claim.approvedAmount !== undefined && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs text-emerald-600 mb-1">Approved</p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(claim.approvedAmount)}
                </p>
              </div>
            )}
            {claim.paidAmount !== undefined && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 mb-1">Paid</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(claim.paidAmount)}
                </p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Deductible</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(claim.deductible)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600">{claim.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Incident Details</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(claim.incidentDate)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {claim.location}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Claimant</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {claim.claimantName}
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  {claim.claimantEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Camera className="w-4 h-4 text-gray-400" />
              {claim.photosCount} photos
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4 text-gray-400" />
              {claim.documentsCount} documents
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              {claim.notesCount} notes
            </div>
            {claim.aiSeverityScore !== undefined && (
              <div className="flex items-center gap-2 text-sm ml-auto">
                <span className="text-gray-500">AI Severity:</span>
                <span
                  className={`font-bold ${getSeverityColor(
                    claim.aiSeverityScore
                  )}`}
                >
                  {claim.aiSeverityScore}/100
                </span>
              </div>
            )}
          </div>

          {claim.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {claim.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onSelect?.(claim)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Full Details
              </button>
              <button
                onClick={() => onViewDocuments?.(claim)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Documents
              </button>
              <button
                onClick={() => onAddNote?.(claim)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Add Note
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
      onClick={() => onSelect?.(claim)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.bgColor}`}
          >
            <FileText className={`w-5 h-5 ${typeConfig.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {claim.title}
            </h4>
            <p className="text-xs text-gray-500 font-mono">
              {claim.claimNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}
          >
            {priorityConfig.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-4 line-clamp-2">
        {claim.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(claim.incidentDate)}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{claim.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3.5 h-3.5" />
          {claim.claimantName}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Updated {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div>
          <p className="text-xs text-gray-500">Estimated</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(claim.estimatedAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Deductible</p>
          <p className="text-sm font-semibold text-gray-700">
            {formatCurrency(claim.deductible)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Attachments</p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-0.5">
              <Camera className="w-3 h-3" /> {claim.photosCount}
            </span>
            <span className="flex items-center gap-0.5">
              <FileText className="w-3 h-3" /> {claim.documentsCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}
        >
          {typeConfig.label}
        </span>
        {claim.fraudFlag && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Fraud Flag
          </span>
        )}
        {claim.aiSeverityScore !== undefined && (
          <span
            className={`text-xs font-medium ${getSeverityColor(
              claim.aiSeverityScore
            )}`}
          >
            Severity: {claim.aiSeverityScore}
          </span>
        )}
      </div>

      {claim.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {claim.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDocuments?.(claim);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Docs ({claim.documentsCount})
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNote?.(claim);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Notes ({claim.notesCount})
          </button>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
