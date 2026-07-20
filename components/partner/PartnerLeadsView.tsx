"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useMyChannelPartner,
  useChannelPartnerLeads,
} from "@/lib/hooks/useChannelPartners";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PartnerLoading, PartnerUnlinkedNotice } from "./PartnerDashboard";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  "New", "Assigned", "Not Connected", "Not Interested",
  "Document Pending", "Processing", "Approved", "Rejected", "Disbursed",
];

export function PartnerLeadsView() {
  const { partner, isLoading: meLoading, error: meError } = useMyChannelPartner();
  const partnerId = partner?._id || "";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loanType, setLoanType] = useState("");
  const [page, setPage] = useState(1);

  const { loanTypes } = useLoanTypes("Active");

  const { data: leadsData, isLoading } = useChannelPartnerLeads(partnerId, {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(loanType ? { loanType } : {}),
    page,
    limit: PAGE_SIZE,
  });

  if (meLoading) return <PartnerLoading />;
  if (meError || !partner) return <PartnerUnlinkedNotice message={(meError as Error)?.message} />;

  const leads: any[] = leadsData?.data || [];
  const total: number = leadsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = () => setPage(1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="My Leads"
        subtitle="Loan applications sourced through you and their current status"
      />

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder="Search applicant, app no, phone..."
              className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); resetPage(); }}
          className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={loanType}
          onChange={(e) => { setLoanType(e.target.value); resetPage(); }}
          className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Loan Types</option>
          {(loanTypes || []).map((lt: any) => (
            <option key={lt._id || lt.name} value={lt.name}>{lt.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <PartnerLoading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">App No.</th>
                <th className="text-left">Applicant</th>
                <th className="text-left">Bank</th>
                <th className="text-left">Loan Type</th>
                <th className="text-right">Loan Amount</th>
                <th className="text-right">Disbursed</th>
                <th className="text-left">Status</th>
                <th className="text-right">My Commission</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <motion.tr
                  key={lead._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <td className="font-mono text-xs text-[#6B7280]">{lead.applicationNumber}</td>
                  <td>
                    <p className="font-medium text-[#111827]">{lead.applicantName}</p>
                    <p className="text-xs text-[#9CA3AF]">{lead.phone}</p>
                  </td>
                  <td className="text-[#374151]">{lead.bankId?.bankName || "—"}</td>
                  <td className="text-[#374151]">{lead.loanType}</td>
                  <td className="text-right text-[#374151]">{formatCurrency(lead.loanAmount || 0)}</td>
                  <td className="text-right font-semibold text-[#111827]">
                    {lead.disbursedAmount ? formatCurrency(lead.disbursedAmount) : "—"}
                  </td>
                  <td>
                    <StatusBadge status={lead.status === "Pending" ? "Processing" : lead.status} size="sm" />
                  </td>
                  <td className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(lead.partnerExpectedCommission || 0)}
                    </p>
                    {(lead.partnerPendingCommission || 0) > 0 && (
                      <p className="text-[10px] text-amber-600">
                        {formatCurrency(lead.partnerPendingCommission)} pending
                      </p>
                    )}
                  </td>
                  <td className="text-xs text-[#9CA3AF]">
                    {lead.createdAt ? formatDate(lead.createdAt) : "—"}
                  </td>
                </motion.tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-[#9CA3AF]">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280]">
                Page {page} of {totalPages} · {total} leads
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB] transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
