import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  ChevronDown,
  X,
  Plus,
  Download,
  RefreshCw,
  Shield,
} from "lucide-react";
import PolicyCard, { Policy } from "./policy-card";

interface PolicyListProps {
  policies: Policy[];
  onSelectPolicy?: (policy: Policy) => void;
  onRenewPolicy?: (policy: Policy) => void;
  onViewClaims?: (policy: Policy) => void;
  onCreatePolicy?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

type SortField =
  | "premium"
  | "coverageLimit"
  | "effectiveDate"
  | "expirationDate"
  | "riskScore"
  | "policyNumber";
type SortDirection = "asc" | "desc";

interface Filters {
  type: Policy["type"] | "all";
  status: Policy["status"] | "all";
  maxPremium: number;
  minCoverage: number;
  searchQuery: string;
}

const PolicyList: React.FC<PolicyListProps> = ({
  policies,
  onSelectPolicy,
  onRenewPolicy,
  onViewClaims,
  onCreatePolicy,
  onRefresh,
  isLoading = false,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("effectiveDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    status: "all",
    maxPremium: 10000,
    minCoverage: 0,
    searchQuery: "",
  });

  const filteredPolicies = useMemo(() => {
    let result = [...policies];

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.policyNumber.toLowerCase().includes(q) ||
          p.holderName.toLowerCase().includes(q) ||
          p.insurer.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    if (filters.type !== "all") {
      result = result.filter((p) => p.type === filters.type);
    }

    if (filters.status !== "all") {
      result = result.filter((p) => p.status === filters.status);
    }

    result = result.filter(
      (p) =>
        p.premium <= filters.maxPremium && p.coverageLimit >= filters.minCoverage
    );

    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case "premium":
          aVal = a.premium;
          bVal = b.premium;
          break;
        case "coverageLimit":
          aVal = a.coverageLimit;
          bVal = b.coverageLimit;
          break;
        case "effectiveDate":
          aVal = new Date(a.effectiveDate).getTime();
          bVal = new Date(b.effectiveDate).getTime();
          break;
        case "expirationDate":
          aVal = new Date(a.expirationDate).getTime();
          bVal = new Date(b.expirationDate).getTime();
          break;
        case "riskScore":
          aVal = a.riskScore;
          bVal = b.riskScore;
          break;
        case "policyNumber":
          aVal = a.policyNumber;
          bVal = b.policyNumber;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [policies, filters, sortField, sortDir]);

  const stats = useMemo(() => {
    const active = policies.filter((p) => p.status === "active").length;
    const totalPremium = policies
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + p.premium, 0);
    const totalCoverage = policies
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + p.coverageLimit, 0);
    const avgRisk = policies.length
      ? policies.reduce((sum, p) => sum + p.riskScore, 0) / policies.length
      : 0;
    return { active, totalPremium, totalCoverage, avgRisk };
  }, [policies]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      status: "all",
      maxPremium: 10000,
      minCoverage: 0,
      searchQuery: "",
    });
  };

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.maxPremium !== 10000 ||
    filters.minCoverage !== 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const SortIcon = sortDir === "asc" ? SortAsc : SortDesc;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active Policies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <span className="text-lg font-bold text-emerald-600">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPremium)}
              </p>
              <p className="text-xs text-gray-500">Monthly Premiums</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <span className="text-lg font-bold text-amber-600">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalCoverage)}
              </p>
              <p className="text-xs text-gray-500">Total Coverage</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg">
              <span className="text-lg font-bold text-rose-600">
                {Math.round(stats.avgRisk)}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRisk.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Avg Risk Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search policies by number, holder, insurer..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((f) => ({ ...f, searchQuery: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((f) => ({ ...f, searchQuery: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-indigo-50 border-indigo-300 text-indigo-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
              {[filters.type !== "all", filters.status !== "all", filters.maxPremium !== 10000, filters.minCoverage !== 0].filter(Boolean).length}
            </span>
          )}
        </button>

        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-colors ${
              viewMode === "grid"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-colors ${
              viewMode === "list"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        )}

        <button className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
        </button>

        {onCreatePolicy && (
          <button
            onClick={onCreatePolicy}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Filter Policies
            </h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Policy Type
              </label>
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      type: e.target.value as Filters["type"],
                    }))
                  }
                  className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="auto">Auto</option>
                  <option value="home">Home</option>
                  <option value="health">Health</option>
                  <option value="life">Life</option>
                  <option value="business">Business</option>
                  <option value="umbrella">Umbrella</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      status: e.target.value as Filters["status"],
                    }))
                  }
                  className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Max Premium: {formatCurrency(filters.maxPremium)}/mo
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={filters.maxPremium}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxPremium: Number(e.target.value),
                  }))
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Min Coverage: {formatCurrency(filters.minCoverage)}
              </label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={filters.minCoverage}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minCoverage: Number(e.target.value),
                  }))
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredPolicies.length}</span> of{" "}
          <span className="font-semibold text-gray-900">{policies.length}</span> policies
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          {(
            [
              "effectiveDate",
              "premium",
              "coverageLimit",
              "riskScore",
              "policyNumber",
            ] as SortField[]
          ).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                sortField === field
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {field === "effectiveDate"
                ? "Date"
                : field === "premium"
                ? "Premium"
                : field === "coverageLimit"
                ? "Coverage"
                : field === "riskScore"
                ? "Risk"
                : "Number"}
              {sortField === field && <SortIcon className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No policies found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasActiveFilters || filters.searchQuery
              ? "Try adjusting your filters or search query."
              : "Get started by creating your first policy."}
          </p>
          {hasActiveFilters || filters.searchQuery ? (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          ) : onCreatePolicy ? (
            <button
              onClick={onCreatePolicy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          ) : null}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onSelect={onSelectPolicy}
              onRenew={onRenewPolicy}
              onViewClaims={onViewClaims}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              variant="compact"
              onSelect={onSelectPolicy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyList;
