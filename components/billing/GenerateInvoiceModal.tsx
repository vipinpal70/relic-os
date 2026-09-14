"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, FileText, X } from "lucide-react";
import { BillableLead, GenerateInvoicePayload, Invoice } from "@/lib/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface LineEdit {
  rate: string;
  commissionType: "Fixed" | "Percentage";
}

interface GenerateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "Bank" | "ChannelPartner" | "Corporate";
  entityLabel: string;
  leads: BillableLead[];
  periodStart: string;
  periodEnd: string;
  onGenerate: (payload: Omit<GenerateInvoicePayload, "entityType" | "entityId">) => Promise<Invoice>;
  isGenerating: boolean;
  onGenerated: (invoice: Invoice) => void;
}

// Outer wrapper: the content component mounts fresh each time the modal opens,
// so its state initializers reset without effects. AnimatePresence keeps it
// mounted during the exit animation.
export function GenerateInvoiceModal(props: GenerateInvoiceModalProps) {
  return <AnimatePresence>{props.open && <GenerateInvoiceModalContent {...props} />}</AnimatePresence>;
}

function GenerateInvoiceModalContent({
  onClose,
  entityType,
  entityLabel,
  leads,
  periodStart,
  periodEnd,
  onGenerate,
  isGenerating,
  onGenerated,
}: GenerateInvoiceModalProps) {
  const [lines, setLines] = useState<Record<string, LineEdit>>(() => {
    const initial: Record<string, LineEdit> = {};
    for (const lead of leads) {
      initial[lead._id] = {
        rate: lead.needsRateOverride ? "" : String(lead.suggestedRate),
        commissionType: lead.suggestedCommissionType,
      };
    }
    return initial;
  });
  const [taxRate, setTaxRate] = useState("18");
  const [applyAllRate, setApplyAllRate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const lineAmount = (lead: BillableLead): number => {
    const edit = lines[lead._id];
    if (!edit) return 0;
    const rate = parseFloat(edit.rate);
    if (isNaN(rate) || rate <= 0) return 0;
    return edit.commissionType === "Fixed" ? round2(rate) : round2((lead.billableAmount * rate) / 100);
  };

  const totals = useMemo(() => {
    const subtotal = round2(leads.reduce((sum, lead) => sum + lineAmount(lead), 0));
    const tax = parseFloat(taxRate);
    const taxAmount = isNaN(tax) ? 0 : round2((subtotal * tax) / 100);
    return { subtotal, taxAmount, grandTotal: round2(subtotal + taxAmount) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, lines, taxRate]);

  const invalidLines = leads.filter((lead) => {
    const rate = parseFloat(lines[lead._id]?.rate ?? "");
    return isNaN(rate) || rate <= 0;
  });
  const taxInvalid = isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0 || parseFloat(taxRate) > 100;
  const canSubmit = leads.length > 0 && invalidLines.length === 0 && !taxInvalid && !isGenerating;

  const setLine = (id: string, patch: Partial<LineEdit>) =>
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const applyRateToAll = () => {
    const rate = parseFloat(applyAllRate);
    if (isNaN(rate) || rate < 0) return;
    setLines((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { rate: applyAllRate, commissionType: "Percentage" };
      }
      return next;
    });
  };

  const handleClose = () => {
    if (isGenerating) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    try {
      // Every row is sent as an explicit override so the server bills exactly
      // the rates the user confirmed in this dialog.
      const lineOverrides: GenerateInvoicePayload["lineOverrides"] = {};
      for (const lead of leads) {
        const edit = lines[lead._id];
        lineOverrides[lead._id] = {
          rate: parseFloat(edit.rate),
          commissionType: edit.commissionType,
        };
      }
      const invoice = await onGenerate({
        leadIds: leads.map((l) => l._id),
        periodStart,
        periodEnd,
        taxRate: parseFloat(taxRate),
        lineOverrides,
        notes: notes.trim() || undefined,
      });
      onGenerated(invoice);
    } catch (err: any) {
      setError(err?.message || "Failed to generate invoice");
    }
  };

  // Channel partners receive a payout statement; banks and corporates are invoiced.
  const isPayout = entityType === "ChannelPartner";

  return (
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 z-10 relative border border-[#E5E7EB] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <FileText className="text-[#2563EB] w-5 h-5" />
              <span>{isPayout ? "Generate Payout Statement" : "Generate Invoice"}</span>
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {entityLabel} · {leads.length} application{leads.length !== 1 ? "s" : ""} · Review
              and adjust rates before generating.
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
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                Apply rate to all (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={applyAllRate}
                  onChange={(e) => setApplyAllRate(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-28 px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={applyRateToAll}
                  className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="ml-auto">
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                Tax / GST rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-28 px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] text-xs text-[#6B7280]">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">App No.</th>
                  <th className="text-left px-3 py-2 font-semibold">Applicant</th>
                  <th className="text-right px-3 py-2 font-semibold">Disbursed</th>
                  <th className="text-right px-3 py-2 font-semibold">Rate</th>
                  <th className="text-left px-3 py-2 font-semibold">Type</th>
                  <th className="text-right px-3 py-2 font-semibold">Commission</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const edit = lines[lead._id];
                  const rate = parseFloat(edit?.rate ?? "");
                  const invalid = isNaN(rate) || rate <= 0;
                  return (
                    <tr key={lead._id} className="border-t border-[#F3F4F6]">
                      <td className="px-3 py-2 font-mono text-xs text-[#6B7280]">
                        {lead.applicationNumber}
                      </td>
                      <td className="px-3 py-2 text-[#111827]">{lead.applicantName}</td>
                      <td className="px-3 py-2 text-right text-[#374151]">
                        {formatCurrency(lead.billableAmount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={edit?.rate ?? ""}
                          onChange={(e) => setLine(lead._id, { rate: e.target.value })}
                          placeholder="Rate"
                          className={`w-24 px-2 py-1 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                            invalid ? "border-amber-400 bg-amber-50" : "border-[#E5E7EB]"
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={edit?.commissionType ?? "Percentage"}
                          onChange={(e) =>
                            setLine(lead._id, {
                              commissionType: e.target.value as "Fixed" | "Percentage",
                            })
                          }
                          className="px-2 py-1 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="Percentage">%</option>
                          <option value="Fixed">₹ Fixed</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-green-600">
                        {invalid ? "—" : formatCurrency(lineAmount(lead))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invalidLines.length > 0 && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              Enter a rate above 0 for every application before generating.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Shown on the invoice document"
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-[#6B7280]">
              <span>Commission subtotal</span>
              <span className="font-medium text-[#111827]">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Tax @ {taxRate || 0}%</span>
              <span className="font-medium text-[#111827]">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-1.5 font-bold text-[#111827]">
              <span>Grand total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
            >
              {isGenerating && <Loader2 size={14} className="animate-spin" />}
              {isPayout ? "Generate Statement" : "Generate Invoice"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
