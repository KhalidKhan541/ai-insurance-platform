import React from "react";
import {
  FileText,
  Image,
  Video,
  File,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Clock,
  User,
  Tag,
  CheckCircle,
  AlertTriangle,
  Cloud,
  HardDrive,
  Link,
  MoreVertical,
  Grid,
  List,
  Search,
  Filter,
} from "lucide-react";

export interface ClaimDocument {
  id: string;
  name: string;
  type:
    | "pdf"
    | "image"
    | "video"
    | "doc"
    | "spreadsheet"
    | "other";
  category:
    | "policy"
    | "medical"
    | "police_report"
    | "photos"
    | "receipts"
    | "correspondence"
    | "legal"
    | "other";
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  lastAccessed?: string;
  status: "uploaded" | "processing" | "verified" | "rejected";
  tags: string[];
  description?: string;
  isRequired: boolean;
  aiExtracted?: boolean;
  aiConfidence?: number;
  version: number;
  previousVersions?: string[];
}

interface ClaimDocumentProps {
  documents: ClaimDocument[];
  onViewDocument?: (doc: ClaimDocument) => void;
  onDownloadDocument?: (doc: ClaimDocument) => void;
  onDeleteDocument?: (doc: ClaimDocument) => void;
  onUploadDocument?: () => void;
  onFilterChange?: (filter: string) => void;
  variant?: "grid" | "list";
  showUpload?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  ClaimDocument["type"],
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  pdf: { icon: FileText, color: "text-red-600", bgColor: "bg-red-50" },
  image: { icon: Image, color: "text-blue-600", bgColor: "bg-blue-50" },
  video: { icon: Video, color: "text-purple-600", bgColor: "bg-purple-50" },
  doc: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" },
  spreadsheet: {
    icon: File,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  other: { icon: File, color: "text-gray-600", bgColor: "bg-gray-50" },
};

const CATEGORY_CONFIG: Record<
  ClaimDocument["category"],
  { label: string; color: string; bgColor: string }
> = {
  policy: {
    label: "Policy",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  medical: {
    label: "Medical",
    color: "text-rose-700",
    bgColor: "bg-rose-100",
  },
  police_report: {
    label: "Police Report",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  photos: {
    label: "Photos",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  receipts: {
    label: "Receipts",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  correspondence: {
    label: "Correspondence",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  legal: {
    label: "Legal",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  other: {
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
};

const STATUS_CONFIG: Record<
  ClaimDocument["status"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  uploaded: {
    icon: Cloud,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Uploaded",
  },
  processing: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Processing",
  },
  verified: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Verified",
  },
  rejected: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Rejected",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DocumentViewer: React.FC<ClaimDocumentProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onUploadDocument,
  onFilterChange,
  variant = "grid",
  showUpload = true,
  className = "",
}) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">(variant);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedDocs, setSelectedDocs] = React.useState<Set<string>>(
    new Set()
  );

  const categories = React.useMemo(() => {
    const cats = new Set(documents.map((d) => d.category));
    return Array.from(cats);
  }, [documents]);

  const filteredDocuments = React.useMemo(() => {
    let result = [...documents];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    return result;
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  const stats = React.useMemo(() => {
    const total = documents.length;
    const totalSize = documents.reduce((sum, d) => sum + d.size, 0);
    const required = documents.filter((d) => d.isRequired).length;
    const uploaded = documents.filter(
      (d) => d.status === "uploaded" || d.status === "verified"
    ).length;
    return { total, totalSize, required, uploaded };
  }, [documents]);

  const toggleSelect = (docId: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const getDocumentIcon = (doc: ClaimDocument) => {
    const config = TYPE_CONFIG[doc.type];
    const Icon = config.icon;
    return (
      <div className={`p-3 rounded-xl ${config.bgColor}`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>
    );
  };

  const getStatusBadge = (status: ClaimDocument["status"]) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category: ClaimDocument["category"]) => {
    const config = CATEGORY_CONFIG[category];
    return (
      <span
        className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Documents</p>
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Size</p>
          <p className="text-lg font-bold text-gray-900">
            {formatFileSize(stats.totalSize)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Required</p>
          <p className="text-lg font-bold text-gray-900">{stats.required}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Uploaded/Verified</p>
          <p className="text-lg font-bold text-emerald-600">{stats.uploaded}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            onFilterChange?.(e.target.value);
          }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_CONFIG[cat].label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${
              viewMode === "grid"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${
              viewMode === "list"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {showUpload && onUploadDocument && (
          <button
            onClick={onUploadDocument}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Upload
          </button>
        )}
      </div>

      {selectedDocs.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
          <span className="text-sm font-medium text-indigo-700">
            {selectedDocs.size} document{selectedDocs.size > 1 ? "s" : ""}{" "}
            selected
          </span>
          <button
            onClick={() => setSelectedDocs(new Set())}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear selection
          </button>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            No documents found
          </p>
          <p className="text-xs text-gray-500">
            {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Upload your first document to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredDocuments.map((doc) => {
            const typeConfig = TYPE_CONFIG[doc.type];
            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer group hover:shadow-md ${
                  selectedDocs.has(doc.id)
                    ? "border-indigo-500 ring-1 ring-indigo-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg ${typeConfig.bgColor}`}
                  >
                    {getDocumentIcon(doc)}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                  {doc.name}
                </h4>
                {doc.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 mb-3">
                  {getCategoryBadge(doc.category)}
                  {getStatusBadge(doc.status)}
                  {doc.isRequired && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      Required
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(doc.size)}</span>
                  <span>v{doc.version}</span>
                </div>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onViewDocument?.(doc)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => onDownloadDocument?.(doc)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => onDeleteDocument?.(doc)}
                    className="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <input
              type="checkbox"
              checked={
                selectedDocs.size === filteredDocuments.length &&
                filteredDocuments.length > 0
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600"
            />
            <span>Document</span>
            <span>Category</span>
            <span>Status</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span>Actions</span>
          </div>
          {filteredDocuments.map((doc) => {
            const typeConfig = TYPE_CONFIG[doc.type];
            const Icon = typeConfig.icon;
            return (
              <div
                key={doc.id}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedDocs.has(doc.id) ? "bg-indigo-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.has(doc.id)}
                  onChange={() => toggleSelect(doc.id)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                />
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${typeConfig.bgColor} shrink-0`}>
                    <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <div>{getCategoryBadge(doc.category)}</div>
                <div>{getStatusBadge(doc.status)}</div>
                <span className="text-xs text-gray-500">
                  {formatFileSize(doc.size)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(doc.uploadedAt)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewDocument?.(doc)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadDocument?.(doc)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument?.(doc)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
