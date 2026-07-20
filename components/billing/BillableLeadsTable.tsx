"use client";

import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { BillableLead } from "@/lib/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BillableLeadsTableProps {
  leads: BillableLead[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  loading: boolean;
}

function formatRate(lead: BillableLead): string {
  if (lead.needsRateOverride) return "—";
  return lead.suggestedCommissionType === "Fixed"
    ? `${formatCurrency(lead.suggestedRate)} fixed`
    : `${lead.suggestedRate}%`;
}

export function BillableLeadsTable({
  leads,
  selected,
  onToggle,
  onToggleAll,
  loading,
}: BillableLeadsTableProps) {
  if (loading) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        <p className="text-sm text-[#474569] font-medium">Loading disbursed applications...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            <th className="w-8">
              <input
                type="checkbox"
                className="rounded"
                checked={selected.length === leads.length && leads.length > 0}
                onChange={onToggleAll}
              />
            </th>
            <th className="text-left">App No.</th>
            <th className="text-left">Applicant</th>
            <th className="text-left">Loan Type</th>
            <th className="text-right">Disbursed</th>
            <th className="text-right">Rate</th>
            <th className="text-right">Commission</th>
            <th className="text-left">Disbursed On</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <motion.tr
              key={lead._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={`cursor-pointer ${selected.includes(lead._id) ? "selected" : ""}`}
              onClick={() => onToggle(lead._id)}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selected.includes(lead._id)}
                  onChange={() => onToggle(lead._id)}
                />
              </td>
              <td className="font-mono text-xs text-[#6B7280]">{lead.applicationNumber}</td>
              <td>
                <p className="font-medium text-[#111827]">{lead.applicantName}</p>
                <p className="text-xs text-[#9CA3AF]">{lead.email}</p>
              </td>
              <td className="text-[#374151]">{lead.loanType}</td>
              <td className="text-right font-semibold text-[#111827]">
                {formatCurrency(lead.billableAmount)}
              </td>
              <td className="text-right text-[#374151]">
                {lead.needsRateOverride ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    <AlertTriangle size={11} />
                    No rate rule
                  </span>
                ) : (
                  formatRate(lead)
                )}
              </td>
              <td className="text-right font-semibold text-green-600">
                {lead.needsRateOverride ? "—" : formatCurrency(lead.suggestedCommission)}
              </td>
              <td className="text-xs text-[#9CA3AF]">
                {lead.disbursedDate ? formatDate(lead.disbursedDate) : "—"}
              </td>
            </motion.tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-8 text-xs text-[#9CA3AF]">
                No disbursed applications pending invoicing in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
