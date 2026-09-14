"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Landmark, Users, Building2 } from "lucide-react";
import { useBanks } from "@/lib/hooks/useBanks";
import { useChannelPartners } from "@/lib/hooks/useChannelPartners";
import { useCorporates } from "@/lib/hooks/useCorporates";
import {
  useBillableLeads,
  useInvoices,
  GenerateInvoicePayload,
  Invoice,
} from "@/lib/hooks/useInvoices";
import { BillableLeadsTable } from "./BillableLeadsTable";
import { InvoiceHistoryTable } from "./InvoiceHistoryTable";
import { GenerateInvoiceModal } from "./GenerateInvoiceModal";
import { formatCurrency } from "@/lib/utils";

const HISTORY_PAGE_SIZE = 10;

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function EntityBillingPanel({
  entityType,
}: {
  entityType: "Bank" | "ChannelPartner" | "Corporate";
}) {
  const router = useRouter();
  const isBank = entityType === "Bank";
  const isCorporate = entityType === "Corporate";
  // Channel partners receive a payout statement; banks and corporates are invoiced.
  const isPayout = entityType === "ChannelPartner";

  const [entityId, setEntityId] = useState("");
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(todayStr());
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const banksQuery = useBanks({ status: "Active", limit: 100 });
  const partnersQuery = useChannelPartners({ status: "Active", limit: 100 });
  const corporatesQuery = useCorporates({ status: "Active", limit: 100 });

  const entities = useMemo(() => {
    if (isBank) return banksQuery.data.map((b) => ({ id: b._id, label: `${b.bankName} — ${b.branch}` }));
    if (isCorporate) return corporatesQuery.data.map((c) => ({ id: c._id, label: c.corporateName }));
    return partnersQuery.data.map((p) => ({ id: p._id, label: `${p.companyName} (${p.name})` }));
  }, [isBank, isCorporate, banksQuery.data, partnersQuery.data, corporatesQuery.data]);
  const entityLabel = entities.find((e) => e.id === entityId)?.label || "";

  const billable = useBillableLeads({ entityType, entityId, startDate, endDate });
  const invoices = useInvoices(
    { entityType, entityId, page: historyPage, limit: HISTORY_PAGE_SIZE },
    { enabled: !!entityId }
  );

  const selectedLeads = billable.data.filter((l) => selected.includes(l._id));
  const selectedDisbursed = selectedLeads.reduce((sum, l) => sum + l.billableAmount, 0);
  const selectedCommission = selectedLeads.reduce((sum, l) => sum + l.suggestedCommission, 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected(selected.length === billable.data.length ? [] : billable.data.map((l) => l._id));

  const changeEntity = (id: string) => {
    setEntityId(id);
    setSelected([]);
    setHistoryPage(1);
  };

  const handleGenerate = (payload: Omit<GenerateInvoicePayload, "entityType" | "entityId">) =>
    invoices.generateInvoice({ ...payload, entityType, entityId });

  const handleGenerated = (invoice: Invoice) => {
    setModalOpen(false);
    setSelected([]);
    router.push(`/billing/invoice/${invoice._id}`);
  };

  const handleMarkSent = (invoice: Invoice) =>
    invoices.updateInvoiceStatus({ id: invoice._id, status: "Sent" }).catch((err) => alert(err.message));

  const handleMarkPaid = (invoice: Invoice) => {
    if (!confirm(`Mark ${invoice.invoiceNumber} (${formatCurrency(invoice.grandTotal)}) as paid?`)) return;
    invoices.updateInvoiceStatus({ id: invoice._id, status: "Paid" }).catch((err) => alert(err.message));
  };

  const handleCancel = (invoice: Invoice) => {
    if (
      !confirm(
        `Cancel ${invoice.invoiceNumber}? Its ${invoice.totalApplications} application(s) will return to the billable pool.`
      )
    )
      return;
    invoices.cancelInvoice(invoice._id).catch((err) => alert(err.message));
  };

  const entityNoun = isBank ? "bank" : isCorporate ? "corporate" : "channel partner";
  const entityHeading = isBank ? "Bank" : isCorporate ? "Corporate" : "Channel Partner";

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap items-end gap-4">
        <div className="min-w-52 flex-1 sm:flex-none sm:w-72">
          <label className="block text-xs font-semibold text-[#4B5563] mb-1">
            {entityHeading}
          </label>
          <select
            value={entityId}
            onChange={(e) => changeEntity(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">Select a {entityNoun}...</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B5563] mb-1">Disbursed from</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setSelected([]);
            }}
            className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B5563] mb-1">Disbursed to</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setSelected([]);
            }}
            className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      {!entityId ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3 text-center">
          {isBank ? (
            <Landmark className="w-10 h-10 text-[#D1D5DB]" />
          ) : isCorporate ? (
            <Building2 className="w-10 h-10 text-[#D1D5DB]" />
          ) : (
            <Users className="w-10 h-10 text-[#D1D5DB]" />
          )}
          <p className="text-sm font-medium text-[#374151]">
            Select a {entityNoun} to view its invoices and disbursed applications.
          </p>
        </div>
      ) : (
        <>
          {/* Billable applications */}
          <h2 className="text-sm font-bold text-[#111827] mb-2">Disbursed Applications</h2>

          {selected.length > 0 && (
            <div className="mb-3 px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-[#1D4ED8]">
                <strong>{selected.length}</strong> selected · Disbursed:{" "}
                <strong>{formatCurrency(selectedDisbursed)}</strong> · Est. commission:{" "}
                <strong>{formatCurrency(selectedCommission)}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#2563EB] text-white rounded-md text-xs font-medium hover:bg-[#1D4ED8] transition-colors"
                >
                  <FileText size={12} />
                  {isPayout ? "Generate Payout Statement" : "Generate Invoice"}
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <BillableLeadsTable
            leads={billable.data}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            loading={billable.isLoading}
          />

          {/* Invoice history */}
          <h2 className="text-sm font-bold text-[#111827] mt-6 mb-2">Invoice History</h2>
          <InvoiceHistoryTable
            invoices={invoices.data}
            total={invoices.total}
            page={historyPage}
            limit={HISTORY_PAGE_SIZE}
            onPageChange={setHistoryPage}
            loading={invoices.isLoading}
            onMarkSent={handleMarkSent}
            onMarkPaid={handleMarkPaid}
            onCancel={handleCancel}
          />

          <GenerateInvoiceModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            entityType={entityType}
            entityLabel={entityLabel}
            leads={selectedLeads}
            periodStart={startDate}
            periodEnd={endDate}
            onGenerate={handleGenerate}
            isGenerating={invoices.isGenerating}
            onGenerated={handleGenerated}
          />
        </>
      )}
    </div>
  );
}
