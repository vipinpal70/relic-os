"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, FileText, Send, CheckCircle, Download, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { invoices } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function BillingPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    const fetchBillingLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          setLeadsList(data);
        }
      } catch (error) {
        console.error("Failed to load billing leads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBillingLeads();
  }, []);

  const disbursedLeads = leadsList.filter((l) => l.status === "Disbursed");

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === disbursedLeads.length ? [] : disbursedLeads.map((l) => l.id));

  const totalSelected = disbursedLeads
    .filter((l) => selected.includes(l.id))
    .reduce((sum, l) => sum + (l.disbursed_amount * 0.015), 0);

  return (
    <AppLayout title="Billing & Invoices">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Billing & Invoices"
          subtitle="Generate and manage commission invoices"
          actions={
            selected.length > 0 ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors animate-pulse">
                <FileText size={15} />
                Generate Invoice ({selected.length})
              </button>
            ) : null
          }
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-[#E5E7EB]">
          {(["pending", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {t === "pending" ? "Pending Commissions" : "Invoice History"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading billing data...</p>
          </div>
        ) : tab === "pending" ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              {["Current Month", "Bank", "Channel Partner", "Status"].map((f) => (
                <button key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  <Filter size={12} />
                  {f}
                </button>
              ))}
            </div>

            {/* Selected summary */}
            {selected.length > 0 && (
              <div className="mb-3 px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between">
                <span className="text-sm text-[#1D4ED8]">
                  <strong>{selected.length}</strong> applications selected · Commission: <strong>{formatCurrency(totalSelected)}</strong>
                </span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[#2563EB] text-white rounded-md text-xs font-medium hover:bg-[#1D4ED8] transition-colors">
                    Generate Invoice
                  </button>
                  <button onClick={() => setSelected([])} className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="card overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.length === disbursedLeads.length && disbursedLeads.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="text-left">App No.</th>
                    <th className="text-left">Applicant</th>
                    <th className="text-left">Bank</th>
                    <th className="text-right">Loan Amount</th>
                    <th className="text-right">Disbursed</th>
                    <th className="text-right">Commission (1.5%)</th>
                    <th className="text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursedLeads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={selected.includes(lead.id) ? "selected" : ""}
                      onClick={() => toggle(lead.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selected.includes(lead.id)}
                          onChange={() => toggle(lead.id)}
                        />
                      </td>
                      <td className="font-mono text-xs text-[#6B7280]">{lead.application_number}</td>
                      <td>
                        <p className="font-medium text-[#111827]">{lead.applicant_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{lead.channel_partner || "—"}</p>
                      </td>
                      <td className="text-[#374151]">{lead.bank || "—"}</td>
                      <td className="text-right text-[#374151]">{formatCurrency(lead.loan_amount)}</td>
                      <td className="text-right font-semibold text-[#111827]">{formatCurrency(lead.disbursed_amount)}</td>
                      <td className="text-right font-semibold text-green-600">
                        {formatCurrency(lead.disbursed_amount * 0.015)}
                      </td>
                      <td className="text-xs text-[#9CA3AF]">{lead.disbursed_date ? formatDate(lead.disbursed_date) : "—"}</td>
                    </motion.tr>
                  ))}
                  {disbursedLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-xs text-[#9CA3AF]">
                        No disbursed loans pending commission generation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Invoice No.</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Partner / Bank</th>
                  <th className="text-center">Applications</th>
                  <th className="text-right">Commission</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Created By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="font-mono text-xs text-[#374151]">{inv.invoice_number}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.invoice_type === "Bank" ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#EEF2FF] text-[#4F46E5]"
                      }`}>{inv.invoice_type}</span>
                    </td>
                    <td className="font-medium text-[#111827]">{inv.partner}</td>
                    <td className="text-center text-[#374151]">{inv.total_application}</td>
                    <td className="text-right font-semibold text-[#111827]">{formatCurrency(inv.total_commission)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-[#6B7280] text-xs">{inv.created_by}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-[#EFF6FF] rounded-md transition-colors">
                          <Download size={13} className="text-[#2563EB]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
                          <Send size={13} className="text-[#6B7280]" />
                        </button>
                        {inv.status !== "Paid" && (
                          <button className="p-1.5 hover:bg-[#DCFCE7] rounded-md transition-colors">
                            <CheckCircle size={13} className="text-green-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
