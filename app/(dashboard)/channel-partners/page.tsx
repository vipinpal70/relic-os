"use client";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useChannelPartners, ChannelPartner } from "@/lib/hooks/useChannelPartners";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight,
  Loader2, UserCheck, UserX, Landmark, TrendingUp, DollarSign,
  AlertCircle, Trash2, X, Users, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChannelPartnersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch partners with filters
  const { data: partnersResponse, total, isLoading, stats, createPartner, isCreating } = useChannelPartners({
    search: searchTerm,
    status: statusFilter,
    state: stateFilter,
    city: cityFilter,
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
    name: "",
    companyName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    address: "",
    state: "",
    city: "",
    gst: "",
    pan: "",
    status: "Active" as "Active" | "Inactive",
    notes: "",
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
      commissionValue: 1.0,
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
        commissionValue: 1.0,
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

    if (!basicDetails.name.trim()) errors.name = "Name is required";
    if (!basicDetails.companyName.trim()) errors.companyName = "Company name is required";
    
    if (!basicDetails.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(basicDetails.email)) {
      errors.email = "Invalid email address";
    }

    if (!basicDetails.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(basicDetails.phone)) {
      errors.phone = "Invalid Indian mobile (10 digits starting with 6-9)";
    }

    if (basicDetails.gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(basicDetails.gst)) {
      errors.gst = "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)";
    }

    if (basicDetails.pan && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(basicDetails.pan)) {
      errors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
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

      await createPartner(data);
      setIsDrawerOpen(false);
      // Reset form
      setBasicDetails({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        alternativePhone: "",
        address: "",
        state: "",
        city: "",
        gst: "",
        pan: "",
        status: "Active",
        notes: "",
      });
      setCommissionRows([
        {
          loanType: "",
          commissionValue: 1.0,
          commissionType: "Percentage",
          effectiveFrom: new Date().toISOString().split("T")[0],
          effectiveTo: "",
          minAmount: 0,
          maxAmount: 999999999,
        }
      ]);
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to create partner" });
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!partnersResponse) return;
    const headers = ["Partner Name", "Company Name", "Email", "Phone", "GST", "PAN", "Total Cases", "Loan Volume", "Commission Earned", "Status"];
    const rows = (partnersResponse as any).map((p: any) => [
      p.name,
      p.companyName,
      p.email,
      p.phone,
      p.gst || "",
      p.pan || "",
      p.stats.totalCases,
      p.stats.loanAmount,
      p.stats.commissionEarned,
      p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `channel_partners_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Channel Partners">
      <div className="space-y-6">
        {/* Header Title & Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Channel Partner Directory</h1>
            <p className="text-sm text-[#6B7280]">Oversee distribution networks, payout commissions, and performance analytics.</p>
          </div>
          <button
            onClick={() => {
              setFormErrors({});
              setIsDrawerOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            <span>Add Channel Partner</span>
          </button>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-white">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total Partners</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{stats?.total || 0}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                <span className="text-green-600 font-semibold">{stats?.active || 0} Active</span> · {stats?.inactive || 0} Inactive
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-indigo flex items-center justify-center text-white">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Month Cases</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{stats?.monthCases || 0}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Volume: <span className="font-semibold text-[#111827]">{formatCurrency(stats?.monthLoanAmount || 0)}</span>
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center text-white">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Earned Payouts</p>
              <h3 className="text-xl font-bold text-[#22C55E] mt-0.5">{formatCurrency(stats?.monthCommission || 0)}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Current month commission</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center text-white">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Pending Commissions</p>
              <h3 className="text-xl font-bold text-red-500 mt-0.5">{formatCurrency(stats?.pendingCommission || 0)}</h3>
              <p className="text-xs text-green-600 mt-0.5">
                Paid: <span className="font-semibold">{formatCurrency(stats?.paidCommission || 0)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Actions toolbar */}
        <div className="card p-4 flex flex-col lg:flex-row items-center gap-4 justify-between bg-white/70 backdrop-blur-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-[#9CA3AF] w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search partners..."
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
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <input
              type="text"
              placeholder="State (e.g. MH)"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />

            <input
              type="text"
              placeholder="City (e.g. Pune)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
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
                    <th onClick={() => handleSort("name")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Partner</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("companyName")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Company</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th>Phone</th>
                    <th className="text-right">Total Cases</th>
                    <th className="text-right">Loan Amount</th>
                    <th className="text-right text-[#22C55E]">Earned</th>
                    <th className="text-right text-red-500">Pending</th>
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
                  {(partnersResponse as any)?.map((partner: any, idx: number) => (
                    <tr
                      key={partner._id}
                      onClick={() => router.push(`/channel-partners/${partner._id}`)}
                      className="hover:bg-[#F9FAFB] cursor-pointer border-b border-[#F3F4F6] transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm">
                            {partner.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#111827]">{partner.name}</p>
                            <p className="text-xs text-[#6B7280]">{partner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-[#4B5563]">{partner.companyName}</td>
                      <td className="text-sm font-mono text-[#4B5563]">{partner.phone}</td>
                      <td className="text-right font-medium">{partner.stats?.totalCases || 0}</td>
                      <td className="text-right font-semibold">{formatCurrency(partner.stats?.loanAmount || 0)}</td>
                      <td className="text-right font-bold text-[#22C55E]">{formatCurrency(partner.stats?.commissionEarned || 0)}</td>
                      <td className="text-right font-bold text-red-500">{formatCurrency(partner.stats?.commissionPending || 0)}</td>
                      <td className="text-sm text-[#6B7280]">
                        {formatDate(partner.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            partner.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {partner.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {(!partnersResponse || (partnersResponse as any).length === 0) && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#9CA3AF] text-sm">
                        No channel partners found matching the filter criteria.
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
                  of <span className="font-bold text-[#111827]">{total}</span> partners
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

        {/* Add Channel Partner Drawer */}
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
                    <h3 className="text-lg font-bold text-[#111827]">Add New Channel Partner</h3>
                    <p className="text-xs text-[#6B7280]">Establish a profile and define default commission structures.</p>
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
                    <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Basic Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Partner Name *</label>
                        <input
                          type="text"
                          required
                          value={basicDetails.name}
                          onChange={(e) => setBasicDetails({ ...basicDetails, name: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.name ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={basicDetails.companyName}
                          onChange={(e) => setBasicDetails({ ...basicDetails, companyName: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.companyName ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.companyName && <p className="text-xs text-red-500 mt-1">{formErrors.companyName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Email ID *</label>
                        <input
                          type="email"
                          required
                          value={basicDetails.email}
                          onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.email ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={basicDetails.phone}
                          onChange={(e) => setBasicDetails({ ...basicDetails, phone: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.phone ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Alternative Phone</label>
                        <input
                          type="text"
                          value={basicDetails.alternativePhone}
                          onChange={(e) => setBasicDetails({ ...basicDetails, alternativePhone: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">GSTIN</label>
                        <input
                          type="text"
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          value={basicDetails.gst}
                          onChange={(e) => setBasicDetails({ ...basicDetails, gst: e.target.value.toUpperCase() })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.gst ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.gst && <p className="text-xs text-red-500 mt-1">{formErrors.gst}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">PAN Card</label>
                        <input
                          type="text"
                          placeholder="e.g. ABCDE1234F"
                          value={basicDetails.pan}
                          onChange={(e) => setBasicDetails({ ...basicDetails, pan: e.target.value.toUpperCase() })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.pan ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.pan && <p className="text-xs text-red-500 mt-1">{formErrors.pan}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">City</label>
                        <input
                          type="text"
                          value={basicDetails.city}
                          onChange={(e) => setBasicDetails({ ...basicDetails, city: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Full Address</label>
                        <input
                          type="text"
                          value={basicDetails.address}
                          onChange={(e) => setBasicDetails({ ...basicDetails, address: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">State</label>
                        <input
                          type="text"
                          placeholder="e.g. MH"
                          value={basicDetails.state}
                          onChange={(e) => setBasicDetails({ ...basicDetails, state: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Internal Notes</label>
                      <textarea
                        rows={2}
                        value={basicDetails.notes}
                        onChange={(e) => setBasicDetails({ ...basicDetails, notes: e.target.value })}
                        className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  {/* Multiple Loan Commission Table Row additions */}
                  <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Loan Commission Rates</h4>
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

                          <div className="grid grid-cols-3 gap-3">
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

                          <div className="grid grid-cols-4 gap-2.5 mt-2.5">
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
                      <span>Add Partner</span>
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
