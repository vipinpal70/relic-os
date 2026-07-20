"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, Send, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Invoice } from "@/lib/hooks/useInvoices";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceHistoryTableProps {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  onMarkSent: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
}

export function InvoiceHistoryTable({
  invoices,
  total,
  page,
  limit,
  onPageChange,
  loading,
  onMarkSent,
  onMarkPaid,
  onCancel,
}: InvoiceHistoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        <p className="text-sm text-[#474569] font-medium">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            <th className="text-left">Invoice No.</th>
            <th className="text-left">Date</th>
            <th className="text-left">Period</th>
            <th className="text-center">Apps</th>
            <th className="text-right">Subtotal</th>
            <th className="text-right">Tax</th>
            <th className="text-right">Grand Total</th>
            <th className="text-left">Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <motion.tr
              key={inv._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <td className="font-mono text-xs text-[#374151]">{inv.invoiceNumber}</td>
              <td className="text-xs text-[#6B7280]">{formatDate(inv.invoiceDate)}</td>
              <td className="text-xs text-[#6B7280]">
                {inv.periodStart && inv.periodEnd
                  ? `${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}`
                  : "—"}
              </td>
              <td className="text-center text-[#374151]">{inv.totalApplications}</td>
              <td className="text-right text-[#374151]">{formatCurrency(inv.commissionSubtotal)}</td>
              <td className="text-right text-[#6B7280]">{formatCurrency(inv.taxAmount)}</td>
              <td className="text-right font-semibold text-[#111827]">
                {formatCurrency(inv.grandTotal)}
              </td>
              <td>
                <StatusBadge status={inv.status} size="sm" />
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/billing/invoice/${inv._id}`}
                    title="View / download invoice"
                    className="p-1.5 hover:bg-[#EFF6FF] rounded-md transition-colors"
                  >
                    <Eye size={13} className="text-[#2563EB]" />
                  </Link>
                  {inv.status === "Generated" && (
                    <button
                      onClick={() => onMarkSent(inv)}
                      title="Mark as sent"
                      className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors"
                    >
                      <Send size={13} className="text-[#6B7280]" />
                    </button>
                  )}
                  {(inv.status === "Generated" || inv.status === "Sent") && (
                    <>
                      <button
                        onClick={() => onMarkPaid(inv)}
                        title="Mark as paid"
                        className="p-1.5 hover:bg-[#DCFCE7] rounded-md transition-colors"
                      >
                        <CheckCircle size={13} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => onCancel(inv)}
                        title="Cancel invoice"
                        className="p-1.5 hover:bg-[#FEE2E2] rounded-md transition-colors"
                      >
                        <XCircle size={13} className="text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-8 text-xs text-[#9CA3AF]">
                No invoices generated yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
          <span className="text-xs text-[#6B7280]">
            Page {page} of {totalPages} · {total} invoices
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
