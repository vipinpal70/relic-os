"use client";
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, useRouter } from "next/navigation";
import {
  useChannelPartnerDetails,
  useChannelPartnerAnalytics,
  useChannelPartnerCases,
  useChannelPartnerTransactions,
  useChannelPartnerCommissions
} from "@/lib/hooks/useChannelPartners";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Loader2, Mail, Phone, MapPin, Calendar, ShieldCheck, UserCheck,
  Percent, ArrowUpDown, ChevronLeft, ChevronRight, Plus, Trash2,
  DollarSign, FileText, CalendarCheck, Settings, BarChart2, Briefcase,
  AlertCircle, CheckCircle, PlusCircle, CreditCard, Clock, CheckSquare, Search,
  Eye, EyeOff, RefreshCw, KeyRound, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "commission", label: "Commission Table", icon: Percent },
  { id: "cases", label: "Cases", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function ChannelPartnerProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch base profile data and stats
  const { partner, stats, isLoading, error, updatePartner, deletePartner } = useChannelPartnerDetails(id);

  if (isLoading) {
    return (
      <AppLayout title="Channel Partner Profile">
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
        </div>
      </AppLayout>
    );
  }

  if (error || !partner) {
    return (
      <AppLayout title="Channel Partner Profile">
        <div className="card p-8 text-center text-red-500 max-w-md mx-auto mt-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h3 className="font-bold text-lg">Failed to Load Profile</h3>
          <p className="text-sm mt-1">The channel partner profile could not be retrieved, or does not exist.</p>
          <button
            onClick={() => router.push("/channel-partners")}
            className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Back to Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${partner.name} — Profile`}>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-2xl border border-blue-100 flex-shrink-0">
              {partner.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827]">{partner.name}</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${partner.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                >
                  {partner.status}
                </span>
              </div>
              <p className="text-sm text-[#4B5563] font-medium mt-0.5">{partner.companyName}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  <span>{partner.email}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={14} />
                  <span>{partner.phone}</span>
                </span>
                {(partner.city || partner.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>
                      {partner.city}
                      {partner.city && partner.state ? ", " : ""}
                      {partner.state}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Header Summary */}
          <div className="grid grid-cols-3 gap-6 divide-x divide-gray-100 md:border-l md:border-gray-100 md:pl-8">
            <div className="px-2">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Total Cases</p>
              <p className="text-lg font-bold text-[#111827] mt-0.5">{stats?.allTime.totalCases || 0}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Disbursed Volume</p>
              <p className="text-lg font-bold text-[#2563EB] mt-0.5">{formatCurrency(stats?.allTime.disbursedAmount || 0)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Commissions Due</p>
              <p className="text-lg font-bold text-red-500 mt-0.5">{formatCurrency(stats?.allTime.commissionPending || 0)}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Bar */}
        <div className="border-b border-[#E5E7EB] flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${active ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
                  }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <OverviewTab partner={partner} stats={stats} />
          )}
          {activeTab === "commission" && (
            <CommissionTab partner={partner} updatePartner={updatePartner} />
          )}
          {activeTab === "cases" && (
            <CasesTab partnerId={id} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab partnerId={id} />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab partnerId={id} stats={stats} />
          )}
          {activeTab === "settings" && (
            <SettingsTab partner={partner} updatePartner={updatePartner} deletePartner={deletePartner} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ----------------------------------------------------
// TAB COMPONENTS
// ----------------------------------------------------

function OverviewTab({ partner, stats }: { partner: any; stats: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Details Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-[#111827] text-base">Business & Identity Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">GSTIN / Registration Number</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{partner.gst || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">PAN Card</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{partner.pan || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Alternative Mobile</p>
              <p className="text-sm font-semibold text-[#111827] mt-0.5">{partner.alternativePhone || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Partner Registered Since</p>
              <p className="text-sm font-medium text-[#111827] mt-0.5">{formatDate(partner.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-[#6B7280]">Full Address</p>
              <p className="text-sm text-[#4B5563] mt-0.5">{partner.address || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-[#6B7280]">Notes / Remarks</p>
              <p className="text-sm text-[#4B5563] italic mt-0.5">{partner.notes || "No notes available."}</p>
            </div>
          </div>
        </div>

        {/* Current Active Rules Preview */}
        <div className="card p-6">
          <h3 className="font-bold text-[#111827] text-base mb-3.5">Active Commission Schema</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[#6B7280]">
                  <th className="py-2.5 px-3 font-semibold">Loan Product</th>
                  <th className="py-2.5 px-3 font-semibold">Commission Structure</th>
                  <th className="py-2.5 px-3 font-semibold">Active Period</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Applicable Threshold</th>
                </tr>
              </thead>
              <tbody>
                {partner.commissionTable.map((rule: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 text-gray-700">
                    <td className="py-2.5 px-3 font-bold">{rule.loanType}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#2563EB]">
                        {rule.commissionType === "Percentage" ? `${rule.commissionValue}%` : formatCurrency(rule.commissionValue)}
                      </span>{" "}
                      ({rule.commissionType})
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280] font-mono">
                      {formatDate(rule.effectiveFrom)} to {rule.effectiveTo ? formatDate(rule.effectiveTo) : "Present"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600 font-mono">
                      {formatCurrency(rule.minAmount)} - {rule.maxAmount >= 999999999 ? "∞" : formatCurrency(rule.maxAmount)}
                    </td>
                  </tr>
                ))}
                {partner.commissionTable.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#9CA3AF]">
                      No commission rules configured. Partner receives flat 0%.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side: Current Month Performance Metrics */}
      <div className="space-y-6">
        <div className="card p-6 space-y-4 bg-white">
          <h3 className="font-bold text-[#111827] text-base flex items-center gap-1.5">
            <CalendarCheck className="text-[#2563EB] w-5 h-5" />
            <span>Monthly Performance</span>
          </h3>
          <p className="text-xs text-[#6B7280]">Key performance indicators mapped to the current calendar month.</p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Current Month Cases</p>
                <p className="text-base font-bold text-[#111827] mt-0.5">{stats?.currentMonth.cases || 0}</p>
              </div>
              <Clock className="text-[#6B7280] w-5 h-5" />
            </div>

            <div className="p-3.5 bg-[#EFF6FF]/70 border border-blue-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide">Monthly Disbursed Vol</p>
                <p className="text-base font-bold text-[#2563EB] mt-0.5">{formatCurrency(stats?.currentMonth.amount || 0)}</p>
              </div>
              <DollarSign className="text-[#2563EB] w-5 h-5" />
            </div>

            <div className="p-3.5 bg-[#ECFDF5]/70 border border-emerald-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Monthly Commission</p>
                <p className="text-base font-bold text-[#22C55E] mt-0.5">{formatCurrency(stats?.currentMonth.commissionExpected || 0)}</p>
              </div>
              <Percent className="text-[#22C55E] w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Status indicator Card */}
        <div className="card p-5 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${partner.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">Lending Authorization</p>
            <p className="text-sm font-bold text-[#111827] mt-0.5">
              {partner.status === "Active" ? "Verified & Operational" : "Deactivated"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommissionTab({ partner, updatePartner }: { partner: any; updatePartner: any }) {
  const { loanTypes } = useLoanTypes("Active");
  const [rules, setRules] = useState<any[]>(partner.commissionTable);
  const [updating, setUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddRow = () => {
    setRules([
      ...rules,
      {
        loanType: "",
        commissionValue: 1.0,
        commissionType: "Percentage",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
        minAmount: 0,
        maxAmount: 999999999,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleSave = async () => {
    // Validate
    setErrorMsg("");
    setSaveSuccess(false);

    const loanTypesSeen = new Set<string>();
    for (let i = 0; i < rules.length; i++) {
      const row = rules[i];
      if (!row.loanType) {
        setErrorMsg(`Row ${i + 1}: Loan product is required.`);
        return;
      }
      if (loanTypesSeen.has(row.loanType.toLowerCase())) {
        setErrorMsg(`Duplicate configurations are not allowed for "${row.loanType}".`);
        return;
      }
      loanTypesSeen.add(row.loanType.toLowerCase());

      if (row.commissionValue === undefined || row.commissionValue < 0) {
        setErrorMsg(`Row ${i + 1}: Commission value must be 0 or greater.`);
        return;
      }
      if (!row.effectiveFrom) {
        setErrorMsg(`Row ${i + 1}: Effective From date is required.`);
        return;
      }
      if (row.effectiveTo && row.effectiveFrom > row.effectiveTo) {
        setErrorMsg(`Row ${i + 1}: Effective To date cannot be before Effective From.`);
        return;
      }
    }

    setUpdating(true);
    try {
      await updatePartner({
        commissionTable: rules.map((r) => ({
          ...r,
          effectiveTo: r.effectiveTo || undefined,
        })),
      });
      setSaveSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update commission schema.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#111827] text-base">Edit Commission Rules</h3>
          <p className="text-sm text-[#6B7280]">
            Customize commission calculations on case disbursements. Saving triggers recalculation of any open or disbursed cases.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center justify-center gap-1.5 border border-[#E5E7EB] hover:bg-gray-50 px-3.5 py-2 rounded-xl text-xs font-bold text-[#4B5563] transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Product Rule</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Commission table updated successfully! Background recalculation triggered.</span>
        </div>
      )}

      <div className="space-y-4">
        {rules.map((row, idx) => (
          <div key={idx} className="p-4 bg-gray-50/70 border border-[#ECEEF2] rounded-2xl relative flex flex-col gap-3">
            <button
              onClick={() => handleRemoveRow(idx)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-6">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Loan Product *</label>
                <select
                  value={row.loanType}
                  onChange={(e) => handleRowChange(idx, "loanType", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="">Select product...</option>
                  {loanTypes.map((lt) => (
                    <option key={lt._id} value={lt.name}>
                      {lt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Payout Class</label>
                <select
                  value={row.commissionType}
                  onChange={(e) => handleRowChange(idx, "commissionType", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Commission Rate *</label>
                <input
                  type="number"
                  step="any"
                  value={row.commissionValue}
                  onChange={(e) => handleRowChange(idx, "commissionValue", parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-6">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Effective From *</label>
                <input
                  type="date"
                  value={row.effectiveFrom ? row.effectiveFrom.split("T")[0] : ""}
                  onChange={(e) => handleRowChange(idx, "effectiveFrom", e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#E5E7EB] rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Effective To</label>
                <input
                  type="date"
                  value={row.effectiveTo ? row.effectiveTo.split("T")[0] : ""}
                  onChange={(e) => handleRowChange(idx, "effectiveTo", e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#E5E7EB] rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Minimum Loan Amount</label>
                <input
                  type="number"
                  value={row.minAmount}
                  onChange={(e) => handleRowChange(idx, "minAmount", parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Maximum Loan Amount</label>
                <input
                  type="number"
                  value={row.maxAmount}
                  onChange={(e) => handleRowChange(idx, "maxAmount", parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="py-8 text-center text-[#9CA3AF] text-sm">
            No custom rules configured. Click "Add Product Rule" to start.
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
        <button
          onClick={handleSave}
          disabled={updating}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          {updating && <Loader2 size={16} className="animate-spin" />}
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

function CasesTab({ partnerId }: { partnerId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [loanType, setLoanType] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch partner-specific cases
  const { data: casesQuery, isLoading } = useChannelPartnerCases(partnerId, {
    search: searchTerm,
    status,
    loanType,
    page,
    limit,
    sortField,
    sortOrder,
  }) as any;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Disbursed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4 bg-white/70">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-[#9CA3AF] w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm bg-white cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Disbursed">Disbursed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th onClick={() => handleSort("applicationNumber")} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1">
                      <span>App No.</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Applicant</th>
                  <th>Loan Product</th>
                  <th className="text-right">Loan Amount</th>
                  <th className="text-right text-[#22C55E]">Commissions Expected</th>
                  <th className="text-right text-red-500">Unrealised</th>
                  <th>Status</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {casesQuery?.data?.map((c: any) => (
                  <tr key={c._id} className="hover:bg-gray-50 border-b border-[#F3F4F6]">
                    <td className="font-mono text-xs font-bold text-[#2563EB]">{c.applicationNumber}</td>
                    <td className="font-semibold">{c.applicantName}</td>
                    <td className="text-sm">{c.loanType}</td>
                    <td className="text-right font-bold">{formatCurrency(c.loanAmount)}</td>
                    <td className="text-right font-bold text-[#22C55E]">{formatCurrency(c.partnerExpectedCommission)}</td>
                    <td className="text-right font-bold text-red-500">{formatCurrency(c.partnerPendingCommission)}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-xs text-[#6B7280]">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
                {(!casesQuery || casesQuery.data?.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#9CA3AF] text-sm">
                      No cases logged under this channel partner yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {casesQuery?.total > limit && (
            <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <p className="text-xs text-[#6B7280]">
                Showing page {page} of {Math.ceil(casesQuery.total / limit)}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 border border-[#E5E7EB] rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page * limit >= casesQuery.total}
                  onClick={() => setPage(page + 1)}
                  className="p-1 border border-[#E5E7EB] rounded-lg disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ partnerId }: { partnerId: string }) {
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const { data: analytics, isLoading } = useChannelPartnerAnalytics(partnerId, dateRange);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const COLORS = ["#2563EB", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const trendData = analytics?.monthlyTrends?.map((t: any) => ({
    name: `${t._id.month}/${t._id.year}`,
    "Loan Volume": t.totalDisbursedAmount || t.totalLoanAmount,
    Commission: t.totalCommission,
  })) || [];

  const pieData = analytics?.loanTypes?.map((l: any) => ({
    name: l._id,
    value: l.totalDisbursedAmount || l.totalLoanAmount,
    cases: l.casesCount,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4 bg-white/70">
        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-1 border border-[#E5E7EB] rounded-xl text-xs font-mono focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-1 border border-[#E5E7EB] rounded-xl text-xs font-mono focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="card p-6">
          <h3 className="font-bold text-[#111827] text-base mb-4">Commission & Loan Volume Trend</h3>
          <div className="h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="Loan Volume" stroke="#2563EB" fillOpacity={1} fill="url(#volGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Commission" stroke="#10B981" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#9CA3AF] text-sm">
                No monthly transactional trend data.
              </div>
            )}
          </div>
        </div>

        {/* Loan Product Breakdown Pie Chart */}
        <div className="card p-6">
          <h3 className="font-bold text-[#111827] text-base mb-4">Loan Product Distribution</h3>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-around">
            {pieData.length > 0 ? (
              <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 md:mt-0">
                  {pieData.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-[#111827]">{item.name}</span>
                      <span className="text-[#6B7280]">({item.cases} cases · {formatCurrency(item.value)})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-[#9CA3AF] text-sm col-span-2">
                No data available for product division.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsTab({ partnerId, stats }: { partnerId: string; stats: any }) {
  const { transactions, isLoading, recordPayment } = useChannelPartnerTransactions(partnerId) as any;
  const { data: commissionsQuery } = useChannelPartnerCommissions(partnerId, { status: "Pending", limit: 50 }) as any;

  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [formData, setFormData] = useState({
    commissionId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "NEFT" as any,
    referenceNumber: "",
    remarks: "",
  });

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commissionId || !formData.amount || !formData.referenceNumber) {
      setModalError("All mandatory fields (*) are required.");
      return;
    }
    setModalError("");
    setSavingPayment(true);
    try {
      await recordPayment({
        commissionId: formData.commissionId,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber,
        remarks: formData.remarks,
      });
      setShowModal(false);
      // Reset
      setFormData({
        commissionId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "NEFT",
        referenceNumber: "",
        remarks: "",
      });
    } catch (err: any) {
      setModalError(err.message || "Failed to record payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payout Balance Header */}
      <div className="card p-5 bg-gradient-to-r from-red-500/5 to-amber-500/5 border border-amber-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-[#111827] text-base">Payout & Payment History</h3>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Claim ledger audits. Realised payments total:{" "}
            <span className="font-bold text-green-600">{formatCurrency(stats?.allTime.commissionPaid || 0)}</span>.
          </p>
        </div>
        <button
          onClick={() => {
            setModalError("");
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <CreditCard size={15} />
          <span>Record Payout Payment</span>
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th>Payment Date</th>
                  <th>Applicant / Case</th>
                  <th>Reference (UTR)</th>
                  <th>Payment Mode</th>
                  <th className="text-right">Disbursed Amount</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50 border-b border-[#F3F4F6]">
                    <td className="font-mono text-xs text-[#6B7280]">{formatDate(tx.paymentDate)}</td>
                    <td>
                      <div>
                        <p className="font-semibold text-sm">{tx.caseId?.applicantName || "—"}</p>
                        <p className="text-[10px] text-[#6B7280] font-mono">{tx.caseId?.applicationNumber || "—"}</p>
                      </div>
                    </td>
                    <td className="font-mono text-xs font-bold">{tx.referenceNumber}</td>
                    <td className="text-xs font-bold">{tx.paymentMode}</td>
                    <td className="text-right font-bold text-green-600">{formatCurrency(tx.amount)}</td>
                    <td className="text-xs text-[#6B7280]">{tx.remarks || "—"}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 rounded-full border border-green-200">
                        Processed
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9CA3AF] text-sm">
                      No payout transactions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payout Dialog */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 relative overflow-hidden border border-[#E5E7EB]"
            >
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <CreditCard className="text-[#2563EB] w-5 h-5" />
                <span>Record Payout to Partner</span>
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Post transaction ledger logs against outstanding partner commissions.
              </p>

              {modalError && (
                <div className="p-3 mt-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleRecordPayout} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Select Commission / Case *</label>
                  <select
                    required
                    value={formData.commissionId}
                    onChange={(e) => {
                      const comm = commissionsQuery?.data?.find((c: any) => c._id === e.target.value);
                      setFormData({
                        ...formData,
                        commissionId: e.target.value,
                        amount: comm ? comm.pendingCommission.toString() : "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
                  >
                    <option value="">Choose pending commission...</option>
                    {commissionsQuery?.data?.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.caseId?.applicantName} ({c.caseId?.applicationNumber}) · Pending: {formatCurrency(c.pendingCommission)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Amount Paid (₹) *</label>
                    <input
                      type="number"
                      required
                      step="any"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3 py-1 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
                    >
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Reference No. (UTR) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UTR12345678"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-[#4B5563] hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-4 py-2 text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {savingPayment && <Loader2 size={14} className="animate-spin" />}
                    <span>Record Payment</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsTab({ partner, updatePartner, deletePartner }: { partner: any; updatePartner: any; deletePartner: any }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Login Credentials State ──
  const [credsLoading, setCredsLoading] = useState(true);
  const [existingCreds, setExistingCreds] = useState<{ hasLogin: boolean; email?: string; userId?: string } | null>(null);
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsSuccess, setCredsSuccess] = useState("");
  const [credsError, setCredsError] = useState("");

  useEffect(() => {
    const fetchCreds = async () => {
      try {
        setCredsLoading(true);
        const res = await fetch(`/api/channel-partners/${partner._id}/credentials`);
        if (res.ok) {
          const data = await res.json();
          setExistingCreds(data);
          if (data.email) setCredEmail(data.email);
        }
      } catch (e) {
        console.error("Failed to load credentials:", e);
      } finally {
        setCredsLoading(false);
      }
    };
    fetchCreds();
  }, [partner._id]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredPassword(pwd);
    setShowPassword(true);
  };

  const handleSaveCreds = async () => {
    setCredsError("");
    setCredsSuccess("");
    if (!credEmail) { setCredsError("Email is required."); return; }
    if (!existingCreds?.hasLogin && !credPassword) { setCredsError("Password is required to create a new login."); return; }

    setCredsSaving(true);
    try {
      const method = existingCreds?.hasLogin ? "PATCH" : "POST";
      const res = await fetch(`/api/channel-partners/${partner._id}/credentials`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credEmail, password: credPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setCredsSuccess(existingCreds?.hasLogin ? "Credentials updated successfully!" : "Login created successfully!");
      setExistingCreds({ hasLogin: true, email: credEmail });
      setCredPassword("");
      setShowPassword(false);
    } catch (err: any) {
      setCredsError(err.message);
    } finally {
      setCredsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setUpdating(true);
    try {
      const nextStatus = partner.status === "Active" ? "Inactive" : "Active";
      await updatePartner({ status: nextStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this channel partner? This will perform a soft-delete and preserve historical data.")) {
      return;
    }
    setDeleting(true);
    try {
      await deletePartner();
      router.push("/channel-partners");
    } catch (err: any) {
      alert(err.message || "Failed to delete channel partner.");
      setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Operations Card */}
      <div className="lg:col-span-2 space-y-6">

        {/* ── Login Credentials Card ── */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#111827] text-base flex items-center gap-2">
                <KeyRound size={17} className="text-[#2563EB]" />
                Login Credentials
              </h3>
              <p className="text-sm text-[#6B7280] mt-0.5">
                {existingCreds?.hasLogin
                  ? "Manage the login email and password for this channel partner's portal access."
                  : "Create a portal login so this channel partner can access the system."}
              </p>
            </div>
            {existingCreds?.hasLogin && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle size={11} />
                Login Active
              </span>
            )}
            {!credsLoading && !existingCreds?.hasLogin && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <UserPlus size={11} />
                No Login Yet
              </span>
            )}
          </div>

          {credsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading credentials...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {credsError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{credsError}</span>
                </div>
              )}
              {credsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>{credsSuccess}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase tracking-wide">Login Email / Username</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="email"
                    value={credEmail}
                    onChange={(e) => setCredEmail(e.target.value)}
                    placeholder="e.g. partner@company.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-medium text-[#111827] placeholder-[#9CA3AF]"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase tracking-wide">
                  {existingCreds?.hasLogin ? "New Password (leave blank to keep current)" : "Password *"}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      placeholder={existingCreds?.hasLogin ? "Enter new password to reset..." : "Set a strong password..."}
                      className="w-full pl-9 pr-10 py-2.5 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-mono text-[#111827] placeholder-[#9CA3AF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Auto-generate button */}
                  <button
                    type="button"
                    onClick={generatePassword}
                    title="Auto-generate a strong password"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 border border-[#D1D5DB] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#2563EB] hover:text-[#2563EB] transition-all"
                  >
                    <RefreshCw size={13} />
                    <span>Generate</span>
                  </button>
                </div>
                {credPassword && (
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Password strength: {credPassword.length >= 12 ? "✅ Strong" : credPassword.length >= 8 ? "⚠️ Moderate" : "❌ Weak"}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSaveCreds}
                  disabled={credsSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {credsSaving && <Loader2 size={13} className="animate-spin" />}
                  <span>{existingCreds?.hasLogin ? "Update Credentials" : "Create Login Account"}</span>
                </button>
                {existingCreds?.hasLogin && credPassword && (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle size={11} />
                    Saving will immediately reset the partner's password.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Partner Status Toggle */}
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-[#111827] text-base">Partner Status Operations</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">Toggle lending eligibility. Deactivated partners cannot file new cases.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-[#111827]">Current Eligibility: {partner.status}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {partner.status === "Active" ? "Partner has full operational permissions." : "Partner access is frozen."}
              </p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${partner.status === "Active"
                ? "bg-red-50 text-red-700 hover:bg-red-100/70"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70"
                }`}
            >
              {updating && <Loader2 size={13} className="animate-spin" />}
              <span>{partner.status === "Active" ? "Deactivate Partner" : "Activate Partner"}</span>
            </button>
          </div>
        </div>

        {/* Delete Card */}
        <div className="card p-6 border-red-200 bg-red-50/5 space-y-4">
          <div>
            <h3 className="font-bold text-red-600 text-base">Danger Zone</h3>
            <p className="text-sm text-red-700/80 mt-0.5">Permanently delete this partner profile. This action is irreversible.</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            <span>Soft Delete Channel Partner</span>
          </button>
        </div>
      </div>
    </div>
  );
}
