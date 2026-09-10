import React from "react";
import {
  Bot,
  Upload,
  FileText,
  Image,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Loader2,
  Shield,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Camera,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Target,
  Info,
} from "lucide-react";

export interface ClaimAnalysis {
  id: string;
  claimId: string;
  claimNumber: string;
  status: "processing" | "completed" | "error";
  submittedAt: string;
  completedAt?: string;
  result?: {
    severityScore: number;
    severityLabel: "low" | "moderate" | "high" | "critical";
    estimatedCost: number;
    confidenceScore: number;
    recommendedAction: string;
    fraudRiskScore: number;
    fraudRiskLevel: "low" | "medium" | "high" | "very_high";
    keyFindings: Array<{
      category: string;
      finding: string;
      impact: "positive" | "negative" | "neutral";
      confidence: number;
    }>;
    documentAnalysis: Array<{
      documentName: string;
      type: string;
      status: "verified" | "suspicious" | "inconclusive";
      extractedData: Record<string, string>;
    }>;
    photoAnalysis?: Array<{
      imageUrl: string;
      detectedObjects: string[];
      damageAssessment: string;
      estimatedRepairCost: number;
    }>;
    timelineAnalysis: {
      incidentDate: string;
      reportDate: string;
      delayDays: number;
      delayAssessment: string;
    };
    recommendation: {
      action: "approve" | "investigate" | "deny" | "review";
      reasoning: string;
      nextSteps: string[];
    };
  };
}

interface ClaimsAnalyzerProps {
  analyses: ClaimAnalysis[];
  onStartAnalysis?: (claimId: string) => void;
  onViewReport?: (analysis: ClaimAnalysis) => void;
  onDownloadReport?: (analysis: ClaimAnalysis) => void;
  onUploadDocuments?: (claimId: string) => void;
  variant?: "default" | "detailed" | "dashboard";
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "low":
      return { color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
    case "moderate":
      return { color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
    case "high":
      return { color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
    case "critical":
      return { color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
    default:
      return { color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
  }
}

function getFraudRiskConfig(level: string) {
  switch (level) {
    case "low":
      return { color: "text-emerald-600", bgColor: "bg-emerald-50" };
    case "medium":
      return { color: "text-amber-600", bgColor: "bg-amber-50" };
    case "high":
      return { color: "text-orange-600", bgColor: "bg-orange-50" };
    case "very_high":
      return { color: "text-red-600", bgColor: "bg-red-50" };
    default:
      return { color: "text-gray-600", bgColor: "bg-gray-50" };
  }
}

function getActionConfig(action: string) {
  switch (action) {
    case "approve":
      return { icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50", label: "Approve" };
    case "investigate":
      return { icon: Eye, color: "text-amber-600", bgColor: "bg-amber-50", label: "Investigate" };
    case "deny":
      return { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50", label: "Deny" };
    case "review":
      return { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50", label: "Review" };
    default:
      return { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50", label: "Review" };
  }
}

const ClaimsAnalyzer: React.FC<ClaimsAnalyzerProps> = ({
  analyses,
  onStartAnalysis,
  onViewReport,
  onDownloadReport,
  onUploadDocuments,
  variant = "default",
  className = "",
}) => {
  const [selectedAnalysis, setSelectedAnalysis] =
    React.useState<ClaimAnalysis | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "findings" | "documents" | "recommendation"
  >("overview");

  const stats = React.useMemo(() => {
    const completed = analyses.filter((a) => a.status === "completed");
    const avgSeverity =
      completed.length > 0
        ? completed.reduce(
            (sum, a) => sum + (a.result?.severityScore || 0),
            0
          ) / completed.length
        : 0;
    const avgFraudRisk =
      completed.length > 0
        ? completed.reduce(
            (sum, a) => sum + (a.result?.fraudRiskScore || 0),
            0
          ) / completed.length
        : 0;
    const totalEstCost = completed.reduce(
      (sum, a) => sum + (a.result?.estimatedCost || 0),
      0
    );

    return {
      total: analyses.length,
      completed: completed.length,
      processing: analyses.filter((a) => a.status === "processing").length,
      avgSeverity: Math.round(avgSeverity),
      avgFraudRisk: Math.round(avgFraudRisk),
      totalEstCost,
    };
  }, [analyses]);

  if (variant === "dashboard") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 rounded-lg">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500">Total Analyses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgSeverity}
                </p>
                <p className="text-xs text-gray-500">Avg Severity</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgFraudRisk}%
                </p>
                <p className="text-xs text-gray-500">Avg Fraud Risk</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900">
              Recent Analyses
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {analyses.slice(0, 5).map((analysis) => {
              const severityConfig = analysis.result
                ? getSeverityConfig(analysis.result.severityLabel)
                : null;
              return (
                <div
                  key={analysis.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedAnalysis(analysis);
                    onViewReport?.(analysis);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          analysis.status === "completed"
                            ? "bg-emerald-50"
                            : analysis.status === "processing"
                            ? "bg-amber-50"
                            : "bg-red-50"
                        }`}
                      >
                        {analysis.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : analysis.status === "processing" ? (
                          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {analysis.claimNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(analysis.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {analysis.result && (
                        <>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${severityConfig?.bgColor} ${severityConfig?.color}`}
                          >
                            Severity: {analysis.result.severityScore}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(analysis.result.estimatedCost)}
                          </span>
                        </>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (selectedAnalysis?.result) {
    const result = selectedAnalysis.result;
    const severityConfig = getSeverityConfig(result.severityLabel);
    const fraudConfig = getFraudRiskConfig(result.fraudRiskLevel);
    const actionConfig = getActionConfig(result.recommendation.action);

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedAnalysis(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              AI Analysis Report — {selectedAnalysis.claimNumber}
            </h3>
            <p className="text-sm text-gray-500">
              Completed {formatDate(selectedAnalysis.completedAt || "")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-xl border ${severityConfig.borderColor} ${severityConfig.bgColor}`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">
              Severity Score
            </p>
            <p className={`text-2xl font-bold ${severityConfig.color}`}>
              {result.severityScore}/100
            </p>
            <p className={`text-xs font-medium ${severityConfig.color} capitalize`}>
              {result.severityLabel}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${fraudConfig.borderColor || "border-gray-200"} ${fraudConfig.bgColor}`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">
              Fraud Risk
            </p>
            <p className={`text-2xl font-bold ${fraudConfig.color}`}>
              {result.fraudRiskScore}%
            </p>
            <p className={`text-xs font-medium ${fraudConfig.color} capitalize`}>
              {result.fraudRiskLevel.replace("_", " ")}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Estimated Cost
            </p>
            <p className="text-2xl font-bold text-indigo-700">
              {formatCurrency(result.estimatedCost)}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-1">
              AI Confidence
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {result.confidenceScore}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-200">
          {(
            ["overview", "findings", "documents", "recommendation"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                Timeline Analysis
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Incident Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(result.timelineAnalysis.incidentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Report Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(result.timelineAnalysis.reportDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delay</p>
                  <p
                    className={`text-sm font-semibold ${
                      result.timelineAnalysis.delayDays > 30
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {result.timelineAnalysis.delayDays} days
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                {result.timelineAnalysis.delayAssessment}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Key Findings
              </h4>
              <div className="space-y-2">
                {result.keyFindings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        finding.impact === "positive"
                          ? "bg-emerald-500"
                          : finding.impact === "negative"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">
                          {finding.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {finding.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {finding.finding}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "findings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.keyFindings.map((finding, i) => (
                <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      {finding.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        finding.impact === "positive"
                          ? "bg-emerald-100 text-emerald-700"
                          : finding.impact === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {finding.impact === "positive"
                        ? "Positive"
                        : finding.impact === "negative"
                        ? "Negative"
                        : "Neutral"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{finding.finding}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${finding.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {finding.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.documentAnalysis.map((doc, i) => (
                <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {doc.documentName}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        doc.status === "verified"
                          ? "bg-emerald-100 text-emerald-700"
                          : doc.status === "suspicious"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(doc.extractedData).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{key}:</span>
                        <span className="font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {result.photoAnalysis && result.photoAnalysis.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  Photo Analysis
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.photoAnalysis.map((photo, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          Photo {i + 1}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {photo.detectedObjects.map((obj, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {photo.damageAssessment}
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        Est. Repair: {formatCurrency(photo.estimatedRepairCost)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendation" && (
          <div className="space-y-4">
            <div
              className={`p-6 rounded-xl border ${
                actionConfig.bgColor
              } border-2`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-xl ${
                    actionConfig.bgColor
                  }`}
                >
                  {React.createElement(actionConfig.icon, {
                    className: `w-6 h-6 ${actionConfig.color}`,
                  })}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Recommended Action:{" "}
                    <span className={actionConfig.color}>
                      {actionConfig.label}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500">
                    Based on AI analysis with {result.confidenceScore}%
                    confidence
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                {result.recommendation.reasoning}
              </p>

              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">
                  Recommended Next Steps:
                </p>
                <ul className="space-y-2">
                  {result.recommendation.nextSteps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onDownloadReport && (
                <button
                  onClick={() => onDownloadReport(selectedAnalysis)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 rounded-xl">
            <Bot className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              AI Claims Analyzer
            </h3>
            <p className="text-sm text-gray-500">
              Automated claim analysis and fraud detection
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Analyses</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Avg Severity</p>
          <p className="text-2xl font-bold text-amber-600">
            {stats.avgSeverity}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Est. Cost</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalEstCost)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {analyses.map((analysis) => {
          const severityConfig = analysis.result
            ? getSeverityConfig(analysis.result.severityLabel)
            : null;

          return (
            <div
              key={analysis.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setSelectedAnalysis(analysis);
                onViewReport?.(analysis);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      analysis.status === "completed"
                        ? "bg-emerald-50"
                        : analysis.status === "processing"
                        ? "bg-amber-50"
                        : "bg-red-50"
                    }`}
                  >
                    {analysis.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : analysis.status === "processing" ? (
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {analysis.claimNumber}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Submitted {formatDate(analysis.submittedAt)}</span>
                      {analysis.completedAt && (
                        <span>
                          Completed {formatDate(analysis.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {analysis.result && (
                    <>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Severity</p>
                        <p className={`text-lg font-bold ${severityConfig?.color}`}>
                          {analysis.result.severityScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Est. Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(analysis.result.estimatedCost)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Fraud Risk</p>
                        <p
                          className={`text-lg font-bold ${
                            getFraudRiskConfig(analysis.result.fraudRiskLevel)
                              .color
                          }`}
                        >
                          {analysis.result.fraudRiskScore}%
                        </p>
                      </div>
                    </>
                  )}
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClaimsAnalyzer;
