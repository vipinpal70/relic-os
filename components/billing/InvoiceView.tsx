"use client";

import { Invoice } from "@/lib/hooks/useInvoices";
import { formatCurrency, formatDate, numberToWordsINR } from "@/lib/utils";

// Relic's own company details printed on every invoice — edit here.
const RELIC_COMPANY = {
  name: "Relic Wealth Solutions Pvt Ltd",
  addressLines: ["A-802, 8th Floor, Tower A, Picasso Centre", "Golf Course Extension Road", "Sector 61, DLF Phase 5, Gurugram, Haryana."],
  gst: "",
  pan: "",
  email: "",
  phone: "",
};

function formatRate(rate: number, commissionType: "Fixed" | "Percentage"): string {
  return commissionType === "Fixed" ? `${formatCurrency(rate)} fixed` : `${rate}%`;
}

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  // Channel partners receive a payout statement; banks and corporates are invoiced.
  const isPayout = invoice.entityType === "ChannelPartner";
  const snap = invoice.entitySnapshot;
  const entityAddress = [snap.address, [snap.city, snap.state].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative bg-white shadow-lg print:shadow-none rounded-xl print:rounded-none p-8 sm:p-10 text-[#111827] overflow-hidden">
      {invoice.status === "Cancelled" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-7xl font-black text-red-500/20 border-8 border-red-500/20 rounded-2xl px-10 py-4 -rotate-12 tracking-widest">
            CANCELLED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-[#111827]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2563EB]">{RELIC_COMPANY.name}</h1>
          {RELIC_COMPANY.addressLines.map((line) => (
            <p key={line} className="text-xs text-[#6B7280]">{line}</p>
          ))}
          {RELIC_COMPANY.email && <p className="text-xs text-[#6B7280]">{RELIC_COMPANY.email}</p>}
          {RELIC_COMPANY.phone && <p className="text-xs text-[#6B7280]">{RELIC_COMPANY.phone}</p>}
          {RELIC_COMPANY.gst && <p className="text-xs text-[#6B7280]">GSTIN: {RELIC_COMPANY.gst}</p>}
          {RELIC_COMPANY.pan && <p className="text-xs text-[#6B7280]">PAN: {RELIC_COMPANY.pan}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            {isPayout ? "Commission Payout Statement" : "Tax Invoice"}
          </h2>
          <p className="text-sm font-mono font-semibold mt-1">{invoice.invoiceNumber}</p>
          <p className="text-xs text-[#6B7280] mt-1">Date: {formatDate(invoice.invoiceDate)}</p>
          {invoice.periodStart && invoice.periodEnd && (
            <p className="text-xs text-[#6B7280]">
              Period: {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </p>
          )}
        </div>
      </div>

      {/* Parties */}
      <div className="py-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280] mb-1">
          {isPayout ? "Payable To" : "Bill To"}
        </p>
        <p className="text-base font-bold">{snap.name}</p>
        {snap.branch && <p className="text-sm text-[#374151]">Branch: {snap.branch}</p>}
        {snap.ifsc && <p className="text-sm text-[#374151]">IFSC: {snap.ifsc}</p>}
        {entityAddress && <p className="text-sm text-[#374151]">{entityAddress}</p>}
        {snap.email && <p className="text-sm text-[#374151]">{snap.email}</p>}
        {snap.gst && <p className="text-sm text-[#374151]">GSTIN: {snap.gst}</p>}
        {snap.pan && <p className="text-sm text-[#374151]">PAN: {snap.pan}</p>}
      </div>

      {/* Line items */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#111827] text-white text-xs uppercase tracking-wide">
            <th className="text-left px-3 py-2 font-semibold">#</th>
            <th className="text-left px-3 py-2 font-semibold">App No.</th>
            <th className="text-left px-3 py-2 font-semibold">Applicant</th>
            <th className="text-left px-3 py-2 font-semibold">Loan Type</th>
            <th className="text-right px-3 py-2 font-semibold">Disbursed Amount</th>
            <th className="text-right px-3 py-2 font-semibold">Rate</th>
            <th className="text-right px-3 py-2 font-semibold">Commission</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li, i) => (
            <tr key={li.leadId} className="border-b border-[#E5E7EB]">
              <td className="px-3 py-2 text-[#6B7280]">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-xs">{li.applicationNumber}</td>
              <td className="px-3 py-2">{li.applicantName}</td>
              <td className="px-3 py-2 text-[#374151]">{li.loanType}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(li.disbursedAmount)}</td>
              <td className="px-3 py-2 text-right">{formatRate(li.rate, li.commissionType)}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {formatCurrency(li.commissionAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex flex-wrap justify-between gap-6 mt-5">
        <div className="text-xs text-[#6B7280] max-w-xs">
          <p>
            <span className="font-semibold text-[#374151]">Total applications:</span>{" "}
            {invoice.totalApplications}
          </p>
          <p>
            <span className="font-semibold text-[#374151]">Total disbursed:</span>{" "}
            {formatCurrency(invoice.totalDisbursedAmount)}
          </p>
          <p className="mt-3 italic">
            Amount in words: {numberToWordsINR(invoice.grandTotal)}
          </p>
          {invoice.notes && (
            <p className="mt-3">
              <span className="font-semibold text-[#374151]">Notes:</span> {invoice.notes}
            </p>
          )}
        </div>
        <div className="w-64 text-sm space-y-1.5">
          <div className="flex justify-between text-[#374151]">
            <span>Commission subtotal</span>
            <span>{formatCurrency(invoice.commissionSubtotal)}</span>
          </div>
          <div className="flex justify-between text-[#374151]">
            <span>GST @ {invoice.taxRate}%</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-[#111827] pt-1.5 font-bold text-base">
            <span>{isPayout ? "Total Payout" : "Total Payable"}</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
          {invoice.status === "Paid" && invoice.paidDate && (
            <p className="text-xs text-green-700 font-semibold text-right">
              Paid on {formatDate(invoice.paidDate)}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-[#E5E7EB] flex flex-wrap items-end justify-between gap-4">
        <p className="text-[10px] text-[#9CA3AF]">
          This is a computer-generated document and does not require a signature.
          {invoice.createdBy && ` Generated by ${invoice.createdBy}.`}
        </p>
        <div className="text-center">
          <div className="h-12" />
          <p className="text-xs font-semibold border-t border-[#374151] pt-1 px-6">
            For {RELIC_COMPANY.name}
          </p>
        </div>
      </div>
    </div>
  );
}
