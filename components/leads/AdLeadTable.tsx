"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Trash2, ArrowRightLeft, Check, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface AdLeadItem {
  id: string;
  applicant_name: string;
  email: string;
  phone: string;
  loan_type: string;
  bank: string;
  loan_amount: number;
  status: string;
  assigned_user: string;
  created_at: string;
  application_number: string;
}

interface AdLeadTableProps {
  leads: AdLeadItem[];
  onLeadMoved: (id: string) => void;
  onLeadDeleted: (id: string) => void;
}

function StatusSelect({ leadId, initialStatus }: { leadId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Underwriting":    return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70";
      case "Sanctioned":      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70";
      case "Reject":
      case "Rejected":        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70";
      case "PDD":             return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70";
      case "Not Interested":
      case "Not Intrested":   return "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70";
      case "Disbursed":       return "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70";
      case "Not Contactable":
      case "Not Connected":   return "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100/70";
      // Legacy support
      case "New":             return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70";
      case "Assigned":        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70";
      case "Document Pending":return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70";
      case "Processing":      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70";
      case "Approved":        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70";
      default:                return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100/70";
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      const res = await fetch(`/api/ad-leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during status update.");
    } finally {
      setUpdating(false);
    }
  };

  const adStatusOptions = [
    "Underwriting",
    "Sanctioned",
    "Reject",
    "PDD",
    "Not Interested",
    "Disbursed",
    "Not Contactable",
  ];

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={updating}
        className={`appearance-none pl-3 pr-7 py-1 text-xs font-semibold rounded-full border cursor-pointer focus:outline-none transition-all duration-200 ${getStatusColor(status)}`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234B5563' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.4rem center",
          backgroundSize: "1.1rem",
          backgroundRepeat: "no-repeat",
        }}
      >
        {status && !adStatusOptions.includes(status) && (
          <option value={status}>{status}</option>
        )}
        {adStatusOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {updating && (
        <span className="absolute -right-5 flex items-center justify-center">
          <Loader2 size={12} className="animate-spin text-blue-500" />
        </span>
      )}
    </div>
  );
}

export function AdLeadTable({ leads, onLeadMoved, onLeadDeleted }: AdLeadTableProps) {
  const [movingId, setMovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleMove = async (lead: AdLeadItem) => {
    if (movingId || deletingId) return;
    setMovingId(lead.id);

    try {
      const res = await fetch(`/api/ad-leads/${lead.id}/move`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onLeadMoved(lead.id);
        showNotification("success", `Successfully moved "${lead.applicant_name}" to main Leads database!`);
      } else {
        showNotification("error", data.error || "Failed to move lead to main database.");
      }
    } catch (err) {
      console.error("Error moving lead:", err);
      showNotification("error", "An error occurred while moving the lead.");
    } finally {
      setMovingId(null);
    }
  };

  const handleDelete = async (lead: AdLeadItem) => {
    if (movingId || deletingId) return;
    if (!confirm(`Are you sure you want to delete "${lead.applicant_name}" from Ad Leads?`)) {
      return;
    }

    setDeletingId(lead.id);

    try {
      const res = await fetch(`/api/ad-leads/${lead.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onLeadDeleted(lead.id);
        showNotification("success", `Deleted "${lead.applicant_name}" from Ad Leads.`);
      } else {
        showNotification("error", data.error || "Failed to delete ad lead.");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
      showNotification("error", "An error occurred while deleting the ad lead.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card overflow-hidden relative">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`mx-4 mt-3 p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <AlertCircle size={14} className="text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" className="rounded" /></th>
              <th className="text-left">Applicant</th>
              <th className="text-left">App No.</th>
              <th className="text-left">Loan Type</th>
              <th className="text-left">Bank</th>
              <th className="text-right">Amount</th>
              <th className="text-left">Status</th>
              <th className="text-left">Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-slate-50/70"
              >
                <td><input type="checkbox" className="rounded" /></td>
                <td>
                  <div>
                    <p className="font-medium text-[#111827]">{lead.applicant_name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {lead.phone} {lead.email ? `• ${lead.email}` : ""}
                    </p>
                  </div>
                </td>
                <td className="text-[#4B5563] font-mono text-xs">{lead.application_number}</td>
                <td className="text-[#374151]">{lead.loan_type}</td>
                <td className="text-[#374151]">{lead.bank || "—"}</td>
                <td className="text-right font-semibold text-[#111827]">{formatCurrency(lead.loan_amount)}</td>
                <td>
                  <StatusSelect leadId={lead.id} initialStatus={lead.status} />
                </td>
                <td className="text-[#9CA3AF] text-xs">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-2">
                    {/* Move Button */}
                    <button
                      onClick={() => handleMove(lead)}
                      disabled={movingId === lead.id || deletingId === lead.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-all shadow-xs disabled:opacity-50"
                      title="Move lead to main Leads database"
                    >
                      {movingId === lead.id ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Moving...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft size={13} />
                          Move to Leads
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(lead)}
                      disabled={movingId === lead.id || deletingId === lead.id}
                      className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-md border border-gray-200 hover:border-red-200 transition-all disabled:opacity-50"
                      title="Delete ad lead"
                    >
                      {deletingId === lead.id ? (
                        <Loader2 size={14} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && (
        <div className="py-12 text-center text-[#9CA3AF]">
          <p className="text-sm font-medium">No ad leads found in database.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Sync your Google Sheet to import ad leads here.</p>
        </div>
      )}

      {/* Footer / Summary */}
      <div className="px-4 py-3 border-t border-[#F3F4F6] flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">Total {leads.length} ad lead(s)</p>
      </div>
    </div>
  );
}
