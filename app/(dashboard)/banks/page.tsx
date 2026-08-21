"use client";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBanks } from "@/lib/hooks/useBanks";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, Search, Download, ArrowUpDown, ChevronLeft, ChevronRight,
  Loader2, Landmark, TrendingUp, DollarSign, AlertCircle, Trash2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function BanksPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch banks with filters
  const { data: banksResponse, total, isLoading, stats, createBank, isCreating, updateBank } = useBanks({
    search: searchTerm,
    status: statusFilter,
    page,
    limit,
    sortField,
    sortOrder,
  } as any) as any;

  // Active Loan Types for commission rows
  const { loanTypes } = useLoanTypes("Active");

  // Form Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [basicDetails, setBasicDetails] = useState({
    bankName: "",
    branch: "",
    ifsc: "",
    managerName: "",
    phone: "",
    email: "",
    address: "",
    state: "",
    city: "",
    status: "Active" as "Active" | "Inactive",
  });

  // Multiple Row Commission table in Add Form
  const [commissionRows, setCommissionRows] = useState<Array<{
    loanType: string;
    commissionValue: number;
    commissionType: "Fixed" | "Percentage";
    effectiveFrom: string;
    effectiveTo: string;
    minAmount: number;
    maxAmount: number;
  }>>([
    {
      loanType: "",
      commissionValue: 1.5,
      commissionType: "Percentage",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
      minAmount: 0,
      maxAmount: 999999999,
    }
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleAddCommissionRow = () => {
    setCommissionRows([
      ...commissionRows,
      {
        loanType: "",
        commissionValue: 1.5,
        commissionType: "Percentage",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
        minAmount: 0,
        maxAmount: 999999999,
      }
    ]);
  };

  const handleRemoveCommissionRow = (index: number) => {
    setCommissionRows(commissionRows.filter((_, i) => i !== index));
  };

  const handleCommissionRowChange = (index: number, field: string, value: any) => {
    const updated = [...commissionRows];
    updated[index] = { ...updated[index], [field]: value };
    setCommissionRows(updated);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!basicDetails.bankName.trim()) errors.bankName = "Bank Name is required";
    if (!basicDetails.branch.trim()) errors.branch = "Branch is required";
    
    if (!basicDetails.ifsc.trim()) {
      errors.ifsc = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(basicDetails.ifsc)) {
      errors.ifsc = "Invalid IFSC format (e.g. SBIN0001234)";
    }

    if (basicDetails.email && !/\S+@\S+\.\S+/.test(basicDetails.email)) {
      errors.email = "Invalid email address";
    }

    if (basicDetails.phone && !/^[6-9]\d{9}$/.test(basicDetails.phone)) {
      errors.phone = "Invalid Indian mobile (10 digits starting with 6-9)";
    }

    // Validate commission rows
    const loanTypesSeen = new Set<string>();
    commissionRows.forEach((row, i) => {
      if (!row.loanType) {
        errors[`row_${i}_loanType`] = "Required";
      } else {
        if (loanTypesSeen.has(row.loanType.toLowerCase())) {
          errors[`row_${i}_loanType`] = "Duplicate product";
        }
        loanTypesSeen.add(row.loanType.toLowerCase());
      }

      if (row.commissionValue === undefined || row.commissionValue < 0) {
        errors[`row_${i}_val`] = "Min 0";
      }

      if (!row.effectiveFrom) {
        errors[`row_${i}_date`] = "Required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = {
        ...basicDetails,
        commissionTable: commissionRows.map(row => ({
          ...row,
          effectiveTo: row.effectiveTo || undefined
        }))
      };

      await createBank(data);
      setIsDrawerOpen(false);
      // Reset form
      setBasicDetails({
        bankName: "",
        branch: "",
        ifsc: "",
        managerName: "",
        phone: "",
        email: "",
        address: "",
        state: "",
        city: "",
        status: "Active",
      });
      setCommissionRows([
        {
          loanType: "",
          commissionValue: 1.5,
          commissionType: "Percentage",
          effectiveFrom: new Date().toISOString().split("T")[0],
          effectiveTo: "",
          minAmount: 0,
          maxAmount: 999999999,
        }
      ]);
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to create bank" });
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!banksResponse) return;
    const headers = ["Bank Name", "Branch", "IFSC", "Manager", "Phone", "Email", "Total Cases", "Loan Volume", "Commissions Due", "Status"];
    const rows = (banksResponse as any).map((b: any) => [
      b.bankName,
      b.branch,
      b.ifsc,
      b.managerName || "",
      b.phone || "",
      b.email || "",
      b.stats.totalLeads,
      b.stats.loanAmount,
      b.stats.commissionExpected,
      b.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `banks_list_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Banks">
      <div className="space-y-6">
        {/* Header Title & Button */}
        <div className="flex md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Lender Bank Management</h1>
            <p className="text-sm text-[#6B7280]">Add lenders, view case volumes, track expected payout percentages, and manage settings.</p>
          </div>

          <div className="item-start">
          <button
            onClick={() => {
              setFormErrors({});
              setIsDrawerOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            <span className="hidden md:block">Add Lender Bank</span>
            <span className="md:hidden">Add</span>
          </button>
          </div>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-white">
              <Landmark size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total Banks</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{stats?.total || 0}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                <span className="text-green-600 font-semibold">{stats?.active || 0} Active</span> branches
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-indigo flex items-center justify-center text-white">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Month Cases</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{stats?.monthLeads || 0}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Loan Volume: <span className="font-semibold text-[#111827]">{formatCurrency(stats?.monthLoanAmount || 0)}</span>
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center text-white">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Realised Inward Payouts</p>
              <h3 className="text-xl font-bold text-[#22C55E] mt-0.5">{formatCurrency(stats?.paidCommission || 0)}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Paid by banks</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center text-white">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Pending Claims</p>
              <h3 className="text-xl font-bold text-red-500 mt-0.5">{formatCurrency(stats?.pendingCommission || 0)}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Expected receivable commissions</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions toolbar */}
        <div className="card p-4 flex flex-col lg:flex-row items-center gap-4 justify-between bg-white/70 backdrop-blur-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-[#9CA3AF] w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search banks, branches, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9.5 pr-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 border border-[#E5E7EB] hover:bg-[#F9FAFB] px-4 py-2 rounded-xl text-sm font-semibold text-[#4B5563] transition-all w-full lg:w-auto justify-center mt-2 lg:mt-0"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto relative">
              <table className="w-full data-table border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th onClick={() => handleSort("bankName")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Bank Name</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("branch")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Branch</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th>IFSC Code</th>
                    <th className="text-right">Cases Logged</th>
                    <th className="text-right">Disbursed Amount</th>
                    <th className="text-right text-[#22C55E]">Receivable</th>
                    <th className="text-right text-red-500">Unrealised</th>
                    <th onClick={() => handleSort("createdAt")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Created Date</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(banksResponse as any)?.map((bank: any) => (
                    <tr
                      key={bank._id}
                      onClick={() => router.push(`/banks/${bank._id}`)}
                      className="hover:bg-[#F9FAFB] cursor-pointer border-b border-[#F3F4F6] transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm">
                            {bank.bankName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#111827]">{bank.bankName}</p>
                            <p className="text-xs text-[#6B7280]">Manager: {bank.managerName || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-[#4B5563]">{bank.branch}</td>
                      <td className="text-sm font-mono text-[#4B5563]">{bank.ifsc}</td>
                      <td className="text-right font-medium">
                        {bank.stats?.totalLeads ? bank.stats.totalLeads : <span className="text-[#9CA3AF]">No cases</span>}
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(bank.stats?.loanAmount || 0)}</td>
                      <td className="text-right font-bold text-[#22C55E]">{formatCurrency(bank.stats?.commissionExpected || 0)}</td>
                      <td className="text-right font-bold text-red-500">{formatCurrency(bank.stats?.commissionPending || 0)}</td>
                      <td className="text-sm text-[#6B7280]">
                        {formatDate(bank.createdAt)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await updateBank({
                                  id: bank._id,
                                  data: { status: bank.status === "Active" ? "Inactive" : "Active" }
                                });
                              } catch (err: any) {
                                alert(err.message || "Failed to update status");
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                              bank.status === "Active" ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-250 ease-in-out ${
                                bank.status === "Active" ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold transition-colors ${bank.status === "Active" ? "text-green-700" : "text-gray-500"}`}>
                            {bank.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {(!banksResponse || (banksResponse as any).length === 0) && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#9CA3AF] text-sm">
                        No banks found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {total > limit && (
              <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <p className="text-xs text-[#6B7280]">
                  Showing <span className="font-bold text-[#111827]">{(page - 1) * limit + 1}</span> to{" "}
                  <span className="font-bold text-[#111827]">
                    {Math.min(page * limit, total)}
                  </span>{" "}
                  of <span className="font-bold text-[#111827]">{total}</span> banks
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Bank Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backing Cover */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
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
                    <h3 className="text-lg font-bold text-[#111827]">Add New Lender Bank</h3>
                    <p className="text-xs text-[#6B7280]">Establish a branch profile and define default inward commission rules.</p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {formErrors.form && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{formErrors.form}</span>
                    </div>
                  )}

                  {/* Basic Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Branch Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HDFC Bank, SBI"
                          value={basicDetails.bankName}
                          onChange={(e) => setBasicDetails({ ...basicDetails, bankName: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.bankName ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.bankName && <p className="text-xs text-red-500 mt-1">{formErrors.bankName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Branch Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MG Road, Mumbai"
                          value={basicDetails.branch}
                          onChange={(e) => setBasicDetails({ ...basicDetails, branch: e.target.value })}
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
                          placeholder="e.g. HDFC0001234"
                          value={basicDetails.ifsc}
                          onChange={(e) => setBasicDetails({ ...basicDetails, ifsc: e.target.value.toUpperCase() })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.ifsc ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.ifsc && <p className="text-xs text-red-500 mt-1">{formErrors.ifsc}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Branch Manager Name</label>
                        <input
                          type="text"
                          value={basicDetails.managerName}
                          onChange={(e) => setBasicDetails({ ...basicDetails, managerName: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Manager Phone</label>
                        <input
                          type="text"
                          value={basicDetails.phone}
                          onChange={(e) => setBasicDetails({ ...basicDetails, phone: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.phone ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Manager Email</label>
                        <input
                          type="email"
                          value={basicDetails.email}
                          onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.email ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Branch Address</label>
                        <input
                          type="text"
                          value={basicDetails.address}
                          onChange={(e) => setBasicDetails({ ...basicDetails, address: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Status</label>
                        <select
                          value={basicDetails.status}
                          onChange={(e) => setBasicDetails({ ...basicDetails, status: e.target.value as any })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white cursor-pointer font-medium"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">City</label>
                        <input
                          type="text"
                          value={basicDetails.city}
                          onChange={(e) => setBasicDetails({ ...basicDetails, city: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">State</label>
                        <input
                          type="text"
                          placeholder="e.g. KA"
                          value={basicDetails.state}
                          onChange={(e) => setBasicDetails({ ...basicDetails, state: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multiple Loan Commission Table Row additions */}
                  <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Receivable Commission Rates</h4>
                      <button
                        type="button"
                        onClick={handleAddCommissionRow}
                        className="flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] text-xs font-bold transition-all"
                      >
                        <Plus size={14} />
                        <span>Add Row</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {commissionRows.map((row, idx) => (
                        <div key={idx} className="card p-4 bg-gray-50/70 border border-[#ECEEF2] relative">
                          {commissionRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCommissionRow(idx)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Loan Type *</label>
                              <select
                                required
                                value={row.loanType}
                                onChange={(e) => handleCommissionRowChange(idx, "loanType", e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none ${
                                  formErrors[`row_${idx}_loanType`] ? "border-red-500" : "border-[#E5E7EB]"
                                }`}
                              >
                                <option value="">Select product...</option>
                                {loanTypes.map((lt) => (
                                  <option key={lt._id} value={lt.name}>
                                    {lt.name}
                                  </option>
                                ))}
                              </select>
                              {formErrors[`row_${idx}_loanType`] && (
                                <p className="text-[10px] text-red-500 font-medium">{formErrors[`row_${idx}_loanType`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Commission Type</label>
                              <select
                                value={row.commissionType}
                                onChange={(e) => handleCommissionRowChange(idx, "commissionType", e.target.value)}
                                className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs bg-white focus:outline-none"
                              >
                                <option value="Percentage">Percentage (%)</option>
                                <option value="Fixed">Fixed Amount (₹)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Commission Value *</label>
                              <input
                                type="number"
                                required
                                step="any"
                                value={row.commissionValue}
                                onChange={(e) => handleCommissionRowChange(idx, "commissionValue", parseFloat(e.target.value))}
                                className={`w-full px-2 py-1 border rounded-lg text-xs focus:outline-none ${
                                  formErrors[`row_${idx}_val`] ? "border-red-500" : "border-[#E5E7EB]"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                            <div className="col-span-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Effective From *</label>
                                  <input
                                    type="date"
                                    required
                                    value={row.effectiveFrom}
                                    onChange={(e) => handleCommissionRowChange(idx, "effectiveFrom", e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E5E7EB] rounded-lg text-xs font-mono focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Effective To</label>
                                  <input
                                    type="date"
                                    value={row.effectiveTo}
                                    onChange={(e) => handleCommissionRowChange(idx, "effectiveTo", e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E5E7EB] rounded-lg text-xs font-mono focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Min Amount</label>
                              <input
                                type="number"
                                value={row.minAmount}
                                onChange={(e) => handleCommissionRowChange(idx, "minAmount", parseFloat(e.target.value))}
                                className="w-full px-2 py-1 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Max Amount</label>
                              <input
                                type="number"
                                value={row.maxAmount}
                                onChange={(e) => handleCommissionRowChange(idx, "maxAmount", parseFloat(e.target.value))}
                                className="w-full px-2 py-1 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      {isCreating && <Loader2 size={15} className="animate-spin" />}
                      <span>Add Bank</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
