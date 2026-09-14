"use client";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCorporates } from "@/lib/hooks/useCorporates";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, Search, Download, ArrowUpDown, ChevronLeft, ChevronRight,
  Loader2, Building2, TrendingUp, DollarSign, AlertCircle, X, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CorporatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch corporates with filters
  const { data: corporatesResponse, total, isLoading, stats, createCorporate, isCreating, updateCorporate } = useCorporates({
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
    corporateName: "",
    contactPerson: "",
    phone: "",
    email: "",
    gst: "",
    pan: "",
    address: "",
    state: "",
    city: "",
    notes: "",
    status: "Active" as "Active" | "Inactive",
  });

  // Multiple Row Commission table in Add Form
  const emptyCommissionRow = () => ({
    loanType: "",
    commissionValue: 1.0,
    commissionType: "Percentage" as "Fixed" | "Percentage",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
    minAmount: 0,
    maxAmount: 999999999,
  });

  const [commissionRows, setCommissionRows] = useState<Array<ReturnType<typeof emptyCommissionRow>>>([
    emptyCommissionRow(),
  ]);

  const handleAddCommissionRow = () => {
    setCommissionRows([...commissionRows, emptyCommissionRow()]);
  };

  const handleRemoveCommissionRow = (index: number) => {
    setCommissionRows(commissionRows.filter((_, i) => i !== index));
  };

  const handleCommissionRowChange = (index: number, field: string, value: any) => {
    const updated = [...commissionRows];
    updated[index] = { ...updated[index], [field]: value };
    setCommissionRows(updated);
  };

  const resetForm = () => {
    setBasicDetails({
      corporateName: "",
      contactPerson: "",
      phone: "",
      email: "",
      gst: "",
      pan: "",
      address: "",
      state: "",
      city: "",
      notes: "",
      status: "Active",
    });
    setCommissionRows([emptyCommissionRow()]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!basicDetails.corporateName.trim()) errors.corporateName = "Corporate Name is required";

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
          effectiveTo: row.effectiveTo || undefined,
        })),
      };

      await createCorporate(data);
      setIsDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to create corporate" });
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!corporatesResponse) return;
    const headers = ["Corporate Name", "Contact Person", "Phone", "Email", "GST", "City", "State", "Total Cases", "Loan Volume", "Status"];
    const rows = (corporatesResponse as any).map((c: any) => [
      c.corporateName,
      c.contactPerson || "",
      c.phone || "",
      c.email || "",
      c.gst || "",
      c.city || "",
      c.state || "",
      c.stats.totalLeads,
      c.stats.loanAmount,
      c.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `corporates_list_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Corporates">
      <div className="space-y-6">
        {/* Header Title & Button */}
        <div className="flex md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Corporate Management</h1>
            <p className="text-sm text-[#6B7280]">Add corporate clients, track case volumes, and manage their details.</p>
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
            <span className="hidden md:block">Add Corporate</span>
            <span className="md:hidden">Add</span>
          </button>
          </div>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-white">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total Corporates</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{stats?.total || 0}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                <span className="text-green-600 font-semibold">{stats?.active || 0} Active</span> accounts
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
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Active Accounts</p>
              <h3 className="text-xl font-bold text-[#22C55E] mt-0.5">{stats?.active || 0}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Currently onboarded</p>
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
                placeholder="Search corporates, contact, location..."
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
                    <th onClick={() => handleSort("corporateName")} className="cursor-pointer hover:bg-gray-100 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Corporate Name</span>
                        <ArrowUpDown size={13} className="text-gray-400" />
                      </div>
                    </th>
                    <th>Contact Person</th>
                    <th>GST</th>
                    <th>Location</th>
                    <th className="text-right">Cases Logged</th>
                    <th className="text-right">Loan Volume</th>
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
                  {(corporatesResponse as any)?.map((corporate: any) => (
                    <tr
                      key={corporate._id}
                      onClick={() => router.push(`/corporates/${corporate._id}`)}
                      className="hover:bg-[#F9FAFB] cursor-pointer border-b border-[#F3F4F6] transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm">
                            {corporate.corporateName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#111827]">{corporate.corporateName}</p>
                            <p className="text-xs text-[#6B7280]">{corporate.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-[#4B5563]">{corporate.contactPerson || "—"}</td>
                      <td className="text-sm font-mono text-[#4B5563]">{corporate.gst || "—"}</td>
                      <td className="text-sm text-[#4B5563]">
                        {[corporate.city, corporate.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="text-right font-medium">
                        {corporate.stats?.totalLeads ? corporate.stats.totalLeads : <span className="text-[#9CA3AF]">No cases</span>}
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(corporate.stats?.loanAmount || 0)}</td>
                      <td className="text-sm text-[#6B7280]">
                        {formatDate(corporate.createdAt)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await updateCorporate({
                                  id: corporate._id,
                                  data: { status: corporate.status === "Active" ? "Inactive" : "Active" }
                                });
                              } catch (err: any) {
                                alert(err.message || "Failed to update status");
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                              corporate.status === "Active" ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-250 ease-in-out ${
                                corporate.status === "Active" ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold transition-colors ${corporate.status === "Active" ? "text-green-700" : "text-gray-500"}`}>
                            {corporate.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {(!corporatesResponse || (corporatesResponse as any).length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#9CA3AF] text-sm">
                        No corporates found matching the filter criteria.
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
                  of <span className="font-bold text-[#111827]">{total}</span> corporates
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

        {/* Add Corporate Drawer */}
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
                    <h3 className="text-lg font-bold text-[#111827]">Add New Corporate</h3>
                    <p className="text-xs text-[#6B7280]">Create a corporate client profile.</p>
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
                    <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Corporate Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Corporate Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Industries Pvt Ltd"
                          value={basicDetails.corporateName}
                          onChange={(e) => setBasicDetails({ ...basicDetails, corporateName: e.target.value })}
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            formErrors.corporateName ? "border-red-500" : "border-[#E5E7EB]"
                          }`}
                        />
                        {formErrors.corporateName && <p className="text-xs text-red-500 mt-1">{formErrors.corporateName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Contact Person</label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={basicDetails.contactPerson}
                          onChange={(e) => setBasicDetails({ ...basicDetails, contactPerson: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Phone</label>
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
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Email</label>
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
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">GST Number</label>
                        <input
                          type="text"
                          value={basicDetails.gst}
                          onChange={(e) => setBasicDetails({ ...basicDetails, gst: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">PAN Number</label>
                        <input
                          type="text"
                          value={basicDetails.pan}
                          onChange={(e) => setBasicDetails({ ...basicDetails, pan: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#4B5563] mb-1">Address</label>
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

                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Notes</label>
                      <textarea
                        rows={2}
                        value={basicDetails.notes}
                        onChange={(e) => setBasicDetails({ ...basicDetails, notes: e.target.value })}
                        className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
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

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Loan Type *</label>
                              <select
                                required
                                value={row.loanType}
                                onChange={(e) => handleCommissionRowChange(idx, "loanType", e.target.value)}
                                className={`w-full px-3 py-2.5 border rounded-lg text-xs bg-white focus:outline-none ${
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
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Commission Type</label>
                              <select
                                value={row.commissionType}
                                onChange={(e) => handleCommissionRowChange(idx, "commissionType", e.target.value)}
                                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-xs bg-white focus:outline-none"
                              >
                                <option value="Percentage">Percentage (%)</option>
                                <option value="Fixed">Fixed Amount (₹)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Commission Value *</label>
                              <input
                                type="number"
                                required
                                step="any"
                                value={Number.isNaN(row.commissionValue) ? "" : row.commissionValue}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  handleCommissionRowChange(idx, "commissionValue", Number.isNaN(v) ? 0 : v);
                                }}
                                className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                                  formErrors[`row_${idx}_val`] ? "border-red-500" : "border-[#E5E7EB]"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                            <div className="col-span-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-bold text-[#6B7280] mb-1">Effective From *</label>
                                  <input
                                    type="date"
                                    required
                                    value={row.effectiveFrom}
                                    onChange={(e) => handleCommissionRowChange(idx, "effectiveFrom", e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-[#6B7280] mb-1">Effective To</label>
                                  <input
                                    type="date"
                                    value={row.effectiveTo}
                                    onChange={(e) => handleCommissionRowChange(idx, "effectiveTo", e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Min Amount</label>
                              <input
                                type="number"
                                value={Number.isNaN(row.minAmount) ? "" : row.minAmount}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  handleCommissionRowChange(idx, "minAmount", Number.isNaN(v) ? 0 : v);
                                }}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-[#6B7280] mb-1">Max Amount</label>
                              <input
                                type="number"
                                value={Number.isNaN(row.maxAmount) ? "" : row.maxAmount}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  handleCommissionRowChange(idx, "maxAmount", Number.isNaN(v) ? 0 : v);
                                }}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none"
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
                      <span>Add Corporate</span>
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
