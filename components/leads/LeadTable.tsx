"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Lead {
  id: string;
  applicant_name: string;
  loan_type: string;
  bank: string;
  loan_amount: number;
  status: string;
  assigned_user: string;
  created_at: string;
  application_number: string;
}

interface LeadTableProps {
  leads: Lead[];
}

interface StatusSelectProps {
  leadId: string;
  initialStatus: string;
}

function StatusSelect({ leadId, initialStatus }: StatusSelectProps) {
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "New":             return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70";
      case "Assigned":        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70";
      case "Not Connected":   return "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100/70";
      case "Not Interested":  return "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70";
      case "Document Pending":return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70";
      case "Processing":      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70";
      case "Approved":        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70";
      case "Disbursed":       return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70";
      case "Rejected":        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70";
      default:                return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100/70";
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
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

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={updating}
        className={`appearance-none pl-3 pr-7 py-1 text-xs font-semibold rounded-full border cursor-pointer focus:outline-none transition-all duration-200 font-medium ${getStatusColor(status)}`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234B5563' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.4rem center",
          backgroundSize: "1.1rem",
          backgroundRepeat: "no-repeat",
        }}
      >
        <option value="New">New</option>
        <option value="Assigned">Assigned</option>
        <option value="Not Connected">Not Connected</option>
        <option value="Not Interested">Not Interested</option>
        <option value="Document Pending">Document Pending</option>
        <option value="Processing">Processing</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Disbursed">Disbursed</option>
      </select>
      {updating && (
        <span className="absolute -right-5 flex items-center justify-center">
          <Loader2 size={12} className="animate-spin text-blue-500" />
        </span>
      )}
    </div>
  );
}

export function LeadTable({ leads }: LeadTableProps) {
  return (
    <div className="card overflow-hidden">
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
              <th className="text-left">Assigned To</th>
              <th className="text-left">Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="cursor-pointer"
              >
                <td><input type="checkbox" className="rounded" /></td>
                <td>
                  <div>
                    <p className="font-medium text-[#111827]">{lead.applicant_name}</p>
                    <p className="text-xs text-[#9CA3AF]">{lead.id}</p>
                  </div>
                </td>
                <td className="text-[#4B5563] font-mono text-xs">{lead.application_number}</td>
                <td className="text-[#374151]">{lead.loan_type}</td>
                <td className="text-[#374151]">{lead.bank || "—"}</td>
                <td className="text-right font-semibold text-[#111827]">{formatCurrency(lead.loan_amount)}</td>
                <td>
                  <StatusSelect leadId={lead.id} initialStatus={lead.status} />
                </td>
                <td className="text-[#374151]">{lead.assigned_user || "—"}</td>
                <td className="text-[#9CA3AF] text-xs">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/leads/${lead.id}`}>
                      <button className="p-1.5 hover:bg-[#EFF6FF] rounded-md transition-colors">
                        <Eye size={15} className="text-[#2563EB]" />
                      </button>
                    </Link>
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
                      <MoreHorizontal size={15} className="text-[#6B7280]" />
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
          <p className="text-sm">No leads found</p>
        </div>
      )}

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-[#F3F4F6] flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">Showing {leads.length} results</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${p === 1 ? "bg-[#2563EB] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
