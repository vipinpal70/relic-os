"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { AdLeadTable } from "@/components/leads/AdLeadTable";
import { useSession } from "@/components/providers/SessionProvider";
import { PartnerLeadsView } from "@/components/partner/PartnerLeadsView";

interface IntegrationConfig {
  googleSheetUrl: string;
  syncInterval: string;
  isActive: boolean;
  lastSyncStatus: "success" | "failed" | "never";
  lastSyncTime?: string;
  lastSyncError?: string;
  recordsImportedInLastRun: number;
}

export default function AdLeadsPage() {
  const { user } = useSession();

  // Channel Partner users get a scoped, view-only leads list
  if (user?.role === "Channel Partner") {
    return (
      <AppLayout title="Ad Leads">
        <PartnerLeadsView />
      </AppLayout>
    );
  }

  return <AdminAdLeadsPage />;
}

function AdminAdLeadsPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");
  const [corporateFilter, setCorporateFilter] = useState("All");
  const [loanTypeFilter, setLoanTypeFilter] = useState("All");

  const [integration, setIntegration] = useState<IntegrationConfig | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchAdLeads = async () => {
    try {
      const res = await fetch("/api/ad-leads");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        setLeadsList(list);
      } else {
        console.error("[fetchAdLeads] Fetch response failed:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("[fetchAdLeads] Failed to load ad leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegration = async () => {
    try {
      const res = await fetch("/api/integrations/google-sheets");
      if (res.ok) {
        const data = await res.json();
        setIntegration(data);
      }
    } catch (error) {
      console.error("Failed to load integration:", error);
    }
  };

  useEffect(() => {
    fetchAdLeads();
    fetchIntegration();
  }, []);

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/google-sheets/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh integration status & ad leads list
        await fetchIntegration();
        await fetchAdLeads();
      } else {
        alert(data.error || "Sync failed. Check settings/permissions.");
        await fetchIntegration();
      }
    } catch (error) {
      console.error("Sync trigger error:", error);
      alert("An unexpected error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLeadRemoved = (id: string) => {
    setLeadsList((prev) => prev.filter((item) => item.id !== id));
  };

  const uniqueBanks = useMemo(() => {
    if (!Array.isArray(leadsList)) return ["All"];
    const banks = leadsList.map((l) => l.bank).filter(Boolean);
    return ["All", ...Array.from(new Set(banks))];
  }, [leadsList]);

  const uniqueCorporates = useMemo(() => {
    if (!Array.isArray(leadsList)) return ["All"];
    const corporates = leadsList.map((l) => l.corporate).filter(Boolean);
    return ["All", ...Array.from(new Set(corporates))];
  }, [leadsList]);

  const uniqueLoanTypes = useMemo(() => {
    if (!Array.isArray(leadsList)) return ["All"];
    const types = leadsList.map((l) => l.loan_type).filter(Boolean);
    return ["All", ...Array.from(new Set(types))];
  }, [leadsList]);

  const filtered = useMemo(() => {
    if (!Array.isArray(leadsList)) return [];
    return leadsList.filter((l) => {
      const applicantName = l.applicant_name || "";
      const phone = l.phone || "";
      const appNumber = l.application_number || "";

      const matchSearch =
        applicantName.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search) ||
        appNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "All" || l.status === status;
      const matchBank = bankFilter === "All" || l.bank === bankFilter;
      const matchCorporate = corporateFilter === "All" || l.corporate === corporateFilter;
      const matchLoanType = loanTypeFilter === "All" || l.loan_type === loanTypeFilter;
      return matchSearch && matchStatus && matchBank && matchCorporate && matchLoanType;
    });
  }, [leadsList, search, status, bankFilter, corporateFilter, loanTypeFilter]);

  // Formatter for sync status time
  const getSyncStatusText = () => {
    if (!integration) return "Checking Google Sheets integration status...";
    if (!integration.isActive) {
      return "Google Sheets integration is disabled. Enable it in settings.";
    }

    if (integration.lastSyncStatus === "never") {
      return "Google Sheets integration configured. No sync runs executed yet.";
    }

    const dateStr = integration.lastSyncTime ? new Date(integration.lastSyncTime).toLocaleString("en-IN") : "";
    const count = integration.recordsImportedInLastRun;

    if (integration.lastSyncStatus === "success") {
      return `Google Sheets synced successfully at ${dateStr} • ${count} records imported to Ad Leads.`;
    }

    return `Google Sheets sync failed: ${integration.lastSyncError || "Network error"}`;
  };

  return (
    <AppLayout title="Ad Leads">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Ad Leads"
          subtitle="Sync sheet leads, filter useful entries, and move them directly to main lead management database."
        />

        {/* Dynamic Sync Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5">
            {syncing ? (
              <Loader2 size={15} className="text-[#2563EB] animate-spin" />
            ) : integration?.lastSyncStatus === "failed" ? (
              <AlertCircle size={15} className="text-red-500" />
            ) : integration?.lastSyncStatus === "success" ? (
              <CheckCircle2 size={15} className="text-emerald-500" />
            ) : (
              <RefreshCw size={15} className="text-[#2563EB]" />
            )}
            <span className="text-xs text-[#1E3A8A] font-medium leading-relaxed">
              <strong>Sync Status:</strong> {getSyncStatusText()}
            </span>
          </div>
          {integration?.isActive && (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-xs font-semibold text-[#2563EB] rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {syncing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  Sync Sheet Now
                </>
              )}
            </button>
          )}
        </div>

        <LeadFilters
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          bank={bankFilter}
          setBank={setBankFilter}
          corporate={corporateFilter}
          setCorporate={setCorporateFilter}
          loanType={loanTypeFilter}
          setLoanType={setLoanTypeFilter}
          banks={uniqueBanks}
          corporates={uniqueCorporates}
          loanTypes={uniqueLoanTypes}
        />

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading ad leads...</p>
          </div>
        ) : (
          <AdLeadTable
            leads={filtered}
            onLeadMoved={handleLeadRemoved}
            onLeadDeleted={handleLeadRemoved}
          />
        )}
      </motion.div>
    </AppLayout>
  );
}
