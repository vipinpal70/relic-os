"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { EntityBillingPanel } from "@/components/billing/EntityBillingPanel";

const TABS = [
  { key: "Bank", label: "Banks" },
  { key: "ChannelPartner", label: "Channel Partners" },
  { key: "Corporate", label: "Corporates" },
] as const;

export default function BillingPage() {
  const [tab, setTab] = useState<"Bank" | "ChannelPartner" | "Corporate">("Bank");

  return (
    <AppLayout title="Billing & Invoices">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Billing & Invoices"
          subtitle="Generate bank, channel partner, and corporate invoices for disbursed loans"
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-[#E5E7EB]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* key resets entity selection and lead selection when switching tabs */}
        <EntityBillingPanel key={tab} entityType={tab} />
      </motion.div>
    </AppLayout>
  );
}
