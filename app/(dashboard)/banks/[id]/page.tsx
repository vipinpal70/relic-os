"use client";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, useRouter } from "next/navigation";
import {
  useBankDetails,
  useBankAnalytics,
  useBankLeads,
  useBankTransactions,
  useBankCommissions
} from "@/lib/hooks/useBanks";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Loader2, Mail, Phone, MapPin, Calendar, ShieldCheck, UserCheck,
  Percent, ArrowUpDown, ChevronLeft, ChevronRight, Plus, Trash2,
  DollarSign, FileText, CalendarCheck, Settings, BarChart2, Briefcase,
  AlertCircle, CheckCircle, PlusCircle, CreditCard, Clock, CheckSquare, Search,
  Pencil, X
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "commission", label: "Commission Table", icon: Percent },
  { id: "cases", label: "Cases", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BankProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch base profile data and stats
  const { bank, stats, isLoading, error, updateBank, deleteBank } = useBankDetails(id);

  if (isLoading) {
    return (
      <AppLayout title="Bank Profile">
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
        </div>
      </AppLayout>
    );
  }

  if (error || !bank) {
    return (
      <AppLayout title="Bank Profile">
        <div className="card p-8 text-center text-red-500 max-w-md mx-auto mt-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h3 className="font-bold text-lg">Failed to Load Profile</h3>
          <p className="text-sm mt-1">The bank profile could not be retrieved, or does not exist.</p>
          <button
            onClick={() => router.push("/banks")}
            className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Back to Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${bank.bankName} — Profile`}>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-2xl border border-blue-100 flex-shrink-0">
              {bank.bankName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827]">{bank.bankName}</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    bank.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {bank.status}
                </span>
              </div>
              <p className="text-sm text-[#4B5563] font-medium mt-0.5">{bank.branch} Branch</p>
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  <span>{bank.email || "No email available"}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={14} />
                  <span>{bank.phone || "No phone available"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>
                    {bank.city}
                    {bank.city && bank.state ? ", " : ""}
                    {bank.state}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Header Summary */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 divide-x divide-gray-100 md:border-l md:border-gray-100 md:pl-8">
            <div className="px-2">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Cases Logged</p>
              <p className="text-lg font-bold text-[#111827] mt-0.5">{stats?.allTime.totalLeads ? stats.allTime.totalLeads : "No cases"}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Disbursed Amount</p>
              <p className="text-lg font-bold text-[#2563EB] mt-0.5">{formatCurrency(stats?.allTime.disbursedAmount || 0)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Receivables Claimed</p>
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
                className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
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
            <OverviewTab bank={bank} stats={stats} updateBank={updateBank} />
          )}
          {activeTab === "commission" && (
            <CommissionTab bank={bank} updateBank={updateBank} />
          )}
          {activeTab === "cases" && (
            <CasesTab bankId={id} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab bankId={id} />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab bankId={id} stats={stats} />
          )}
          {activeTab === "settings" && (
            <SettingsTab bank={bank} updateBank={updateBank} deleteBank={deleteBank} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ----------------------------------------------------
// TAB COMPONENTS
// ----------------------------------------------------

function OverviewTab({ bank, stats, updateBank }: { bank: any; stats: any; updateBank: any }) {
  const { user } = useSession();
  const isAdmin = user?.role === "Admin";
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Details Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#111827] text-base">Bank Credentials & Identity</h3>
            {isAdmin && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 border border-[#E5E7EB] hover:bg-gray-50 px-3.5 py-2 rounded-xl text-xs font-bold text-[#4B5563] transition-all cursor-pointer"
              >
                <Pencil size={13} />
                <span>Edit Details</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Bank Name</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{bank.bankName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Branch Location</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{bank.branch}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">IFSC Code</p>
              <p className="text-sm font-bold text-[#2563EB] font-mono mt-0.5">{bank.ifsc}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Branch Manager</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{bank.managerName || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Registered On</p>
              <p className="text-sm font-medium text-[#111827] mt-0.5">{formatDate(bank.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">City & State</p>
              <p className="text-sm font-semibold text-[#111827] mt-0.5">
                {bank.city}, {bank.state}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-[#6B7280]">Full Address</p>
              <p className="text-sm text-[#4B5563] mt-0.5">{bank.address || "—"}</p>
            </div>
          </div>
        </div>

        {/* Current Active Rules Preview */}
        <div className="card p-6">
          <h3 className="font-bold text-[#111827] text-base mb-3.5">Active Inward Commission Schema</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[#6B7280]">
                  <th className="py-2.5 px-3 font-semibold">Loan Product</th>
                  <th className="py-2.5 px-3 font-semibold">Inward Commission Rate</th>
                  <th className="py-2.5 px-3 font-semibold">Effective Period</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Applicable Threshold</th>
                </tr>
              </thead>
              <tbody>
                {bank.commissionTable.map((rule: any, i: number) => (
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
                {bank.commissionTable.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#9CA3AF]">
                      No inward commission rules configured. Flat 0% applied.
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
                <p className="text-base font-bold text-[#111827] mt-0.5">{stats?.currentMonth.leads ? stats.currentMonth.leads : "No cases"}</p>
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
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Expected Commission</p>
                <p className="text-base font-bold text-[#22C55E] mt-0.5">{formatCurrency(stats?.currentMonth.commissionExpected || 0)}</p>
              </div>
              <Percent className="text-[#22C55E] w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Status indicator Card */}
        <div className="card p-5 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${bank.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">Operational Status</p>
            <p className="text-sm font-bold text-[#111827] mt-0.5">
              {bank.status === "Active" ? "Verified & Operational" : "Deactivated"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Details Drawer (Admin only) */}
      <AnimatePresence>
        {isEditOpen && (
          <EditBankDrawer
            bank={bank}
            updateBank={updateBank}
            onClose={() => setIsEditOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditBankDrawer({ bank, updateBank, onClose }: { bank: any; updateBank: any; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState({
    bankName: bank.bankName || "",
    branch: bank.branch || "",
    ifsc: bank.ifsc || "",
    managerName: bank.managerName || "",
    phone: bank.phone || "",
    email: bank.email || "",
    address: bank.address || "",
    state: bank.state || "",
    city: bank.city || "",
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!details.bankName.trim() || details.bankName.trim().length < 2) {
      errors.bankName = "Bank name must be at least 2 characters";
    }
    if (!details.branch.trim() || details.branch.trim().length < 2) {
      errors.branch = "Branch must be at least 2 characters";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(details.ifsc)) {
      errors.ifsc = "Invalid IFSC code (e.g. SBIN0001234)";
    }
    if (details.phone && !/^[6-9]\d{9}$/.test(details.phone)) {
      errors.phone = "Invalid Indian mobile (10 digits starting with 6-9)";
    }
    if (details.email && !/\S+@\S+\.\S+/.test(details.email)) {
      errors.email = "Invalid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await updateBank(details);
      onClose();
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to update bank" });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backing Cover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-xs"
      />

      {/* Slider Body */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-white w-full max-w-2xl h-full shadow-2xl relative flex flex-col z-10 border-l border-[#E5E7EB]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Edit Lender Bank</h3>
            <p className="text-xs text-[#6B7280]">Update the credentials and identity details of this bank branch.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formErrors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{formErrors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={details.bankName}
                onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  formErrors.bankName ? "border-red-500" : "border-[#E5E7EB]"
                }`}
              />
              {formErrors.bankName && <p className="text-xs text-red-500 mt-1">{formErrors.bankName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Branch *</label>
              <input
                type="text"
                required
                value={details.branch}
                onChange={(e) => setDetails({ ...details, branch: e.target.value })}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  formErrors.branch ? "border-red-500" : "border-[#E5E7EB]"
                }`}
              />
              {formErrors.branch && <p className="text-xs text-red-500 mt-1">{formErrors.branch}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">IFSC Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SBIN0001234"
                value={details.ifsc}
                onChange={(e) => setDetails({ ...details, ifsc: e.target.value.toUpperCase() })}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  formErrors.ifsc ? "border-red-500" : "border-[#E5E7EB]"
                }`}
              />
              {formErrors.ifsc && <p className="text-xs text-red-500 mt-1">{formErrors.ifsc}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Branch Manager</label>
              <input
                type="text"
                value={details.managerName}
                onChange={(e) => setDetails({ ...details, managerName: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Phone Number</label>
              <input
                type="text"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  formErrors.phone ? "border-red-500" : "border-[#E5E7EB]"
                }`}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Email ID</label>
              <input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  formErrors.email ? "border-red-500" : "border-[#E5E7EB]"
                }`}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Full Address</label>
              <input
                type="text"
                value={details.address}
                onChange={(e) => setDetails({ ...details, address: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">City</label>
              <input
                type="text"
                value={details.city}
                onChange={(e) => setDetails({ ...details, city: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. KA"
                value={details.state}
                onChange={(e) => setDetails({ ...details, state: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CommissionTab({ bank, updateBank }: { bank: any; updateBank: any }) {
  const { loanTypes } = useLoanTypes("Active");
  const [rules, setRules] = useState<any[]>(bank.commissionTable);
  const [updating, setUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddRow = () => {
    setRules([
      ...rules,
      {
        loanType: "",
        commissionValue: 1.5,
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
      await updateBank({
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
          <h3 className="font-bold text-[#111827] text-base">Edit Receivable Commission Rules</h3>
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
            No rules configured. Click "Add Product Rule" to start.
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

function CasesTab({ bankId }: { bankId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch bank-specific cases
  const { data: casesQuery, isLoading } = useBankLeads(bankId, {
    search: searchTerm,
    status,
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
      case "Underwriting":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Sanctioned":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Reject":
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PDD":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Not Interested":
      case "Not Intrested":
        return "bg-red-50 text-red-700 border-red-200";
      case "Not Contactable":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Disbursed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
          <option value="">All Status</option>
          <option value="Underwriting">Underwriting</option>
          <option value="Sanctioned">Sanctioned</option>
          <option value="Reject">Reject</option>
          <option value="PDD">PDD</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Disbursed">Disbursed</option>
          <option value="Not Contactable">Not Contactable</option>
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
                  <th className="text-right text-[#22C55E]">Commissions Receivable</th>
                  <th className="text-right text-red-500">Pending Receipt</th>
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
                    <td className="text-right font-bold text-[#22C55E]">{formatCurrency(c.bankExpectedCommission)}</td>
                    <td className="text-right font-bold text-red-500">{formatCurrency(c.bankPendingCommission)}</td>
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
                      No cases logged under this bank branch yet.
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

function AnalyticsTab({ bankId }: { bankId: string }) {
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const { data: analytics, isLoading } = useBankAnalytics(bankId, dateRange);

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
          <h3 className="font-bold text-[#111827] text-base mb-4">Inward Commission Volume</h3>
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
          <h3 className="font-bold text-[#111827] text-base mb-4">Lending Distribution</h3>
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

function TransactionsTab({ bankId, stats }: { bankId: string; stats: any }) {
  const { transactions, isLoading, recordPayment } = useBankTransactions(bankId) as any;
  const { data: commissionsQuery } = useBankCommissions(bankId, { status: "Pending", limit: 50 }) as any;

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
      {/* Receipts Balance Header */}
      <div className="card p-5 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-[#111827] text-base">Inward Receipt ledger</h3>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Audit logs of commissions received from Bank. Total realized receipts:{" "}
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
          <span>Record Inward Receipt</span>
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
                  <th>Receipt Date</th>
                  <th>Applicant / Case</th>
                  <th>Reference (UTR)</th>
                  <th>Payment Mode</th>
                  <th className="text-right">Received Amount</th>
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
                        Cleared
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9CA3AF] text-sm">
                      No inward receipt transactions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
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
                <span>Record Inward Receipt from Bank</span>
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Post transaction ledger logs against outstanding receivables from bank.
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
                    <option value="">Choose pending commission claim...</option>
                    {commissionsQuery?.data?.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.caseId?.applicantName} ({c.caseId?.applicationNumber}) · Claim Due: {formatCurrency(c.pendingCommission)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Amount Received (₹) *</label>
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
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Receipt Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3 py-1 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="e.g. UTR987654321"
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
                    <span>Record Receipt</span>
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

function SettingsTab({ bank, updateBank, deleteBank }: { bank: any; updateBank: any; deleteBank: any }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleStatus = async () => {
    setUpdating(true);
    try {
      const nextStatus = bank.status === "Active" ? "Inactive" : "Active";
      await updateBank({ status: nextStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bank? This will perform a soft-delete and preserve historical data.")) {
      return;
    }
    setDeleting(true);
    try {
      await deleteBank();
      router.push("/banks");
    } catch (err: any) {
      alert(err.message || "Failed to delete bank.");
      setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Operations Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-[#111827] text-base">Bank Status Operations</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">Toggle lending eligibility. Deactivated banks cannot log new cases.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-[#111827]">Current Eligibility: {bank.status}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {bank.status === "Active" ? "Lender branch is operational." : "Lender branch operations are paused."}
              </p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                bank.status === "Active"
                  ? "bg-red-50 text-red-700 hover:bg-red-100/70"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70"
              }`}
            >
              {updating && <Loader2 size={13} className="animate-spin" />}
              <span>{bank.status === "Active" ? "Deactivate Branch" : "Activate Branch"}</span>
            </button>
          </div>
        </div>

        {/* Delete Card */}
        <div className="card p-6 border-red-200 bg-red-50/5 space-y-4">
          <div>
            <h3 className="font-bold text-red-600 text-base">Danger Zone</h3>
            <p className="text-sm text-red-700/80 mt-0.5">Permanently delete this bank branch. This action is irreversible.</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            <span>Soft Delete Lender Bank</span>
          </button>
        </div>
      </div>
    </div>
  );
}
