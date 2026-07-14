"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadTable } from "@/components/leads/LeadTable";

interface IntegrationConfig {
  googleSheetUrl: string;
  syncInterval: string;
  isActive: boolean;
  lastSyncStatus: "success" | "failed" | "never";
  lastSyncTime?: string;
  lastSyncError?: string;
  recordsImportedInLastRun: number;
}

export default function LeadsPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [integration, setIntegration] = useState<IntegrationConfig | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeadsList(data);
      }
    } catch (error) {
      console.error("Failed to load leads:", error);
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
    fetchLeads();
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
        // Refresh settings & leads list
        await fetchIntegration();
        await fetchLeads();
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

  const filtered = useMemo(() => {
    return leadsList.filter((l) => {
      const matchSearch =
        l.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search) ||
        l.application_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "All" || l.status === status;
      return matchSearch && matchStatus;
    });
  }, [leadsList, search, status]);

  // Formatter for time
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
      return `Google Sheets synced successfully at ${dateStr} • ${count} records processed/updated.`;
    }

    return `Google Sheets sync failed: ${integration.lastSyncError || "Network error"}`;
  };

  return (
    <AppLayout title="Lead Management">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Lead Management"
          subtitle="Manage and track all loan applications"
          actions={
            <>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors">
                <Upload size={15} />
                Import
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
                <Plus size={15} />
                Add Lead
              </button>
            </>
          }
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-xs font-semibold text-[#2563EB] rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {syncing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  Sync Now
                </>
              )}
            </button>
          )}
        </div>

        <LeadFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} />

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading database leads...</p>
          </div>
        ) : (
          <LeadTable leads={filtered} />
        )}
      </motion.div>
    </AppLayout>
  );
}
