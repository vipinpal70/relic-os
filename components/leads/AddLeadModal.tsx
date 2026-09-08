"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, UserPlus, X } from "lucide-react";
import { useBanks } from "@/lib/hooks/useBanks";
import { useChannelPartners } from "@/lib/hooks/useChannelPartners";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";

const STATUS_OPTIONS = [
  "Underwriting",
  "Sanctioned",
  "Reject",
  "PDD",
  "Not Interested",
  "Disbursed",
  "Not Contactable",
];

const initialForm = {
  applicationNumber: "",
  applicantName: "",
  email: "",
  phone: "",
  loanAmount: "",
  loanType: "",
  bankId: "",
  channelPartnerId: "",
  assignedUserId: "",
  status: "Underwriting",
  disbursedAmount: "0",
  remarks: "",
};

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddLeadModal({ open, onClose, onCreated }: AddLeadModalProps) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const { data: banks } = useBanks({ status: "Active", limit: 100 });
  const { data: partners } = useChannelPartners({ status: "Active", limit: 100 });
  const { loanTypes } = useLoanTypes("Active");

  useEffect(() => {
    if (!open) return;
    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : []))
      .then((users) => setTeamMembers(Array.isArray(users) ? users : []))
      .catch(() => setTeamMembers([]));
  }, [open]);

  const set = (field: keyof typeof initialForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData((f) => ({ ...f, [field]: e.target.value }));

  const handleClose = () => {
    if (submitting) return;
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          applicationNumber: formData.applicationNumber.trim(),
          applicantName: formData.applicantName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const messages = Object.entries(data.details)
            .filter(([key]) => key !== "_errors")
            .map(([, value]: [string, any]) => value?._errors?.[0])
            .filter(Boolean);
          setError(messages.join(" • ") || data.error || "Validation failed");
        } else {
          setError(data.error || "Failed to create lead");
        }
        return;
      }

      setFormData(initialForm);
      onCreated();
      onClose();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 z-10 relative border border-[#E5E7EB] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <UserPlus className="text-[#2563EB] w-5 h-5" />
                  <span>Add New Lead</span>
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Log a new loan application. Commissions are calculated automatically from the bank and partner rules.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 mt-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Application Number</label>
                  <input
                    type="text"
                    value={formData.applicationNumber}
                    onChange={set("applicationNumber")}
                    placeholder="e.g. APP-2026-001 (optional)"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={formData.applicantName}
                    onChange={set("applicantName")}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={set("email")}
                    placeholder="applicant@email.com"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={set("phone")}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Loan Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.loanAmount}
                    onChange={set("loanAmount")}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Loan Type *</label>
                  <select
                    required
                    value={formData.loanType}
                    onChange={set("loanType")}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  >
                    <option value="">Select loan type</option>
                    {loanTypes.map((lt) => (
                      <option key={lt._id} value={lt.name}>{lt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Bank *</label>
                  <select
                    required
                    value={formData.bankId}
                    onChange={set("bankId")}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  >
                    <option value="">Select bank</option>
                    {banks.map((b: any) => (
                      <option key={b._id} value={b._id}>{b.bankName} — {b.branch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Channel Partner</label>
                  <select
                    value={formData.channelPartnerId}
                    onChange={set("channelPartnerId")}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  >
                    <option value="">None (direct lead)</option>
                    {partners.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.companyName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Assigned To</label>
                  <select
                    value={formData.assignedUserId}
                    onChange={set("assignedUserId")}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={set("status")}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {formData.status === "Disbursed" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">Disbursed Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.disbursedAmount}
                      onChange={set("disbursedAmount")}
                      placeholder="Defaults to loan amount if 0"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={set("remarks")}
                  placeholder="Optional notes about this lead"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Lead"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
