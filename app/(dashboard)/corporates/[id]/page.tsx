"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Edit3,
  Trash2, Loader2, AlertCircle, X, TrendingUp, DollarSign, CheckCircle2, Plus, Percent
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCorporateDetails, useCorporateLeads } from "@/lib/hooks/useCorporates";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";

export default function CorporateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { corporate, stats, isLoading, updateCorporate, isUpdating, deleteCorporate, isDeleting } = useCorporateDetails(id);
  const { data: leadsData } = useCorporateLeads(id, { limit: 50 });
  const { loanTypes } = useLoanTypes("Active");
  const leads = leadsData?.data || [];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [commissionRows, setCommissionRows] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
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

  useEffect(() => {
    if (corporate) {
      setEditForm({
        corporateName: corporate.corporateName || "",
        contactPerson: corporate.contactPerson || "",
        phone: corporate.phone || "",
        email: corporate.email || "",
        gst: corporate.gst || "",
        pan: corporate.pan || "",
        address: corporate.address || "",
        state: corporate.state || "",
        city: corporate.city || "",
        notes: corporate.notes || "",
        status: corporate.status || "Active",
      });
      setCommissionRows(
        (corporate.commissionTable || []).map((r) => ({
          loanType: r.loanType,
          commissionValue: r.commissionValue,
          commissionType: r.commissionType,
          effectiveFrom: r.effectiveFrom ? r.effectiveFrom.split("T")[0] : "",
          effectiveTo: r.effectiveTo ? r.effectiveTo.split("T")[0] : "",
          minAmount: r.minAmount ?? 0,
          maxAmount: r.maxAmount ?? 999999999,
        }))
      );
    }
  }, [corporate]);

  const addCommissionRow = () => {
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
      },
    ]);
  };

  const removeCommissionRow = (index: number) => {
    setCommissionRows(commissionRows.filter((_, i) => i !== index));
  };

  const changeCommissionRow = (index: number, field: string, value: any) => {
    const updated = [...commissionRows];
    updated[index] = { ...updated[index], [field]: value };
    setCommissionRows(updated);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    // Validate commission rows
    const loanTypesSeen = new Set<string>();
    for (let i = 0; i < commissionRows.length; i++) {
      const row = commissionRows[i];
      if (!row.loanType) {
        setEditError(`Commission row ${i + 1}: Loan type is required.`);
        return;
      }
      if (loanTypesSeen.has(row.loanType.toLowerCase())) {
        setEditError(`Duplicate commission rules are not allowed for "${row.loanType}".`);
        return;
      }
      loanTypesSeen.add(row.loanType.toLowerCase());
      if (row.commissionValue === undefined || row.commissionValue < 0) {
        setEditError(`Commission row ${i + 1}: Value must be 0 or greater.`);
        return;
      }
      if (!row.effectiveFrom) {
        setEditError(`Commission row ${i + 1}: Effective From date is required.`);
        return;
      }
      if (row.effectiveTo && row.effectiveFrom > row.effectiveTo) {
        setEditError(`Commission row ${i + 1}: Effective To must be after Effective From.`);
        return;
      }
    }

    try {
      await updateCorporate({
        ...editForm,
        commissionTable: commissionRows.map((r) => ({
          ...r,
          effectiveTo: r.effectiveTo || undefined,
        })),
      });
      setIsEditOpen(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to update corporate");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCorporate();
      router.push("/corporates");
    } catch (err: any) {
      alert(err.message || "Failed to delete corporate");
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Corporate">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        </div>
      </AppLayout>
    );
  }

  if (!corporate) {
    return (
      <AppLayout title="Corporate">
        <div className="card p-12 text-center text-[#6B7280]">
          <p className="text-sm">Corporate not found.</p>
          <Link href="/corporates" className="text-[#2563EB] font-semibold text-sm mt-2 inline-block">Back to Corporates</Link>
        </div>
      </AppLayout>
    );
  }

  const allTime = stats?.allTime;
  const currentMonth = stats?.currentMonth;

  return (
    <AppLayout title={corporate.corporateName}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/corporates" className="flex items-center gap-2 text-sm font-semibold text-[#4B5563] hover:text-[#111827] transition-colors">
            <ArrowLeft size={16} />
            <span>Back to Corporates</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditError(""); setIsEditOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xl shrink-0">
            {corporate.corporateName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#111827]">{corporate.corporateName}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${corporate.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {corporate.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[#6B7280]">
              {corporate.contactPerson && <span className="flex items-center gap-1"><Building2 size={13} />{corporate.contactPerson}</span>}
              {corporate.email && <span className="flex items-center gap-1"><Mail size={13} />{corporate.email}</span>}
              {corporate.phone && <span className="flex items-center gap-1"><Phone size={13} />{corporate.phone}</span>}
              {(corporate.city || corporate.state) && (
                <span className="flex items-center gap-1"><MapPin size={13} />{[corporate.city, corporate.state].filter(Boolean).join(", ")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-white"><FileText size={22} /></div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total Cases</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{allTime?.totalLeads || 0}</h3>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-indigo flex items-center justify-center text-white"><TrendingUp size={22} /></div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Loan Volume</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{formatCurrency(allTime?.totalLoanAmount || 0)}</h3>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center text-white"><DollarSign size={22} /></div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Disbursed</p>
              <h3 className="text-xl font-bold text-[#22C55E] mt-0.5">{formatCurrency(allTime?.disbursedAmount || 0)}</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{allTime?.disbursedLeads || 0} cases</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center text-white"><CheckCircle2 size={22} /></div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">This Month</p>
              <h3 className="text-xl font-bold text-[#111827] mt-0.5">{currentMonth?.leads || 0}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">{formatCurrency(currentMonth?.amount || 0)}</p>
            </div>
          </div>
        </div>

        {/* Details + Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company details */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-[#2563EB] inline-block"></span>
              Corporate Details
            </h3>
            <div className="space-y-3">
              {[
                { label: "Contact Person", value: corporate.contactPerson || "—" },
                { label: "Email", value: corporate.email || "—" },
                { label: "Phone", value: corporate.phone || "—" },
                { label: "GST", value: corporate.gst || "—" },
                { label: "PAN", value: corporate.pan || "—" },
                { label: "Address", value: corporate.address || "—" },
                { label: "City", value: corporate.city || "—" },
                { label: "State", value: corporate.state || "—" },
                { label: "Created", value: formatDate(corporate.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0 text-sm">
                  <span className="text-xs font-semibold text-[#6B7280]">{label}</span>
                  <span className="font-bold text-[#111827] text-right">{value}</span>
                </div>
              ))}
            </div>
            {corporate.notes && (
              <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                <p className="text-xs font-semibold text-[#6B7280] mb-1">Notes</p>
                <p className="text-sm text-[#374151]">{corporate.notes}</p>
              </div>
            )}
          </div>

          {/* Cases */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-emerald-500 inline-block"></span>
              Linked Cases ({leads.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full data-table border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th>Applicant</th>
                    <th>Loan Type</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any) => (
                    <tr
                      key={lead._id}
                      onClick={() => router.push(`/leads/${lead._id}`)}
                      className="hover:bg-[#F9FAFB] cursor-pointer border-b border-[#F3F4F6] transition-colors"
                    >
                      <td>
                        <p className="font-bold text-[#111827]">{lead.applicantName}</p>
                        <p className="text-xs text-[#6B7280]">{lead.applicationNumber}</p>
                      </td>
                      <td className="text-sm text-[#4B5563]">{lead.loanType}</td>
                      <td className="text-right font-semibold">{formatCurrency(lead.loanAmount || 0)}</td>
                      <td><StatusBadge status={lead.status === "Pending" ? "Processing" : lead.status} /></td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#9CA3AF] text-sm">
                        No cases linked to this corporate yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Loan Commission Rates */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-[#2563EB] inline-block"></span>
              Loan Commission Rates
            </h3>
            <button
              onClick={() => { setEditError(""); setIsEditOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all"
            >
              <Edit3 size={13} />
              <span>Edit Commissions</span>
            </button>
          </div>
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
                {(corporate.commissionTable || []).map((rule: any, i: number) => (
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
                {(!corporate.commissionTable || corporate.commissionTable.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#9CA3AF]">
                      No commission rules configured. Corporate receives flat 0%.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Drawer */}
        <AnimatePresence>
          {isEditOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsEditOpen(false)}
                className="absolute inset-0 bg-black/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="bg-white w-full max-w-2xl h-full shadow-2xl relative flex flex-col z-10 border-l border-[#E5E7EB]"
              >
                <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111827]">Edit Corporate</h3>
                  <button onClick={() => setIsEditOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500"><X size={20} /></button>
                </div>
                <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} /><span>{editError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Corporate Name *</label>
                      <input type="text" required value={editForm.corporateName} onChange={(e) => setEditForm({ ...editForm, corporateName: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Contact Person</label>
                      <input type="text" value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Phone</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">GST Number</label>
                      <input type="text" value={editForm.gst} onChange={(e) => setEditForm({ ...editForm, gst: e.target.value.toUpperCase() })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">PAN Number</label>
                      <input type="text" value={editForm.pan} onChange={(e) => setEditForm({ ...editForm, pan: e.target.value.toUpperCase() })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">City</label>
                      <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">State</label>
                      <input type="text" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Address</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B5563] mb-1">Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white cursor-pointer font-medium">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Notes</label>
                    <textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none" />
                  </div>

                  {/* Loan Commission Rates */}
                  <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wide flex items-center gap-2">
                        <Percent size={14} className="text-[#2563EB]" />
                        Loan Commission Rates
                      </h4>
                      <button
                        type="button"
                        onClick={addCommissionRow}
                        className="flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] text-xs font-bold transition-all"
                      >
                        <Plus size={14} />
                        <span>Add Row</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {commissionRows.map((row, idx) => (
                        <div key={idx} className="card p-4 bg-gray-50/70 border border-[#ECEEF2] relative">
                          <button
                            type="button"
                            onClick={() => removeCommissionRow(idx)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Loan Type *</label>
                              <select
                                value={row.loanType}
                                onChange={(e) => changeCommissionRow(idx, "loanType", e.target.value)}
                                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-xs bg-white focus:outline-none"
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
                              <label className="block text-xs font-bold text-[#6B7280] mb-1">Commission Type</label>
                              <select
                                value={row.commissionType}
                                onChange={(e) => changeCommissionRow(idx, "commissionType", e.target.value)}
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
                                step="any"
                                value={Number.isNaN(row.commissionValue) ? "" : row.commissionValue}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  changeCommissionRow(idx, "commissionValue", Number.isNaN(v) ? 0 : v);
                                }}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none"
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
                                    value={row.effectiveFrom}
                                    onChange={(e) => changeCommissionRow(idx, "effectiveFrom", e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-[#6B7280] mb-1">Effective To</label>
                                  <input
                                    type="date"
                                    value={row.effectiveTo}
                                    onChange={(e) => changeCommissionRow(idx, "effectiveTo", e.target.value)}
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
                                  changeCommissionRow(idx, "minAmount", Number.isNaN(v) ? 0 : v);
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
                                  changeCommissionRow(idx, "maxAmount", Number.isNaN(v) ? 0 : v);
                                }}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {commissionRows.length === 0 && (
                        <p className="text-xs text-[#9CA3AF] py-2">
                          No commission rules yet. Click &quot;Add Row&quot; to configure one.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E7EB]">
                    <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                    <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm">
                      {isUpdating && <Loader2 size={15} className="animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {isDeleteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 relative border border-[#E5E7EB]">
                <h3 className="text-lg font-bold text-[#111827]">Delete Corporate</h3>
                <p className="text-sm text-[#6B7280] mt-2">Are you sure you want to delete <span className="font-semibold text-[#111827]">{corporate.corporateName}</span>? This will soft-delete the record.</p>
                <div className="flex items-center justify-end gap-2.5 mt-6">
                  <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                  <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all">
                    {isDeleting && <Loader2 size={15} className="animate-spin" />}
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
}
