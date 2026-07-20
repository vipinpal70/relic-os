"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { useInvoice } from "@/lib/hooks/useInvoices";
import { InvoiceView } from "@/components/billing/InvoiceView";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { invoice, isLoading, error } = useInvoice(id);

  return (
    <div className="min-h-screen bg-[#F3F4F6] print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <Link
          href="/billing"
          className="flex items-center gap-1.5 text-sm text-[#374151] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Billing
        </Link>
        {invoice && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
          >
            <Printer size={15} />
            Download PDF / Print
          </button>
        )}
      </div>

      <div className="max-w-[210mm] mx-auto py-8 px-4 print:p-0 print:max-w-none">
        {isLoading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading invoice...</p>
          </div>
        ) : error || !invoice ? (
          <div className="card p-12 text-center">
            <p className="text-sm font-medium text-[#374151]">Invoice not found.</p>
            <Link href="/billing" className="text-sm text-[#2563EB] hover:underline mt-2 inline-block">
              Back to Billing
            </Link>
          </div>
        ) : (
          <InvoiceView invoice={invoice} />
        )}
      </div>
    </div>
  );
}
