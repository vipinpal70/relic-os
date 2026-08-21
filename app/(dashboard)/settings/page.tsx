"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Link as LinkIcon, RefreshCw, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: LinkIcon },
];

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        on ? "bg-green-500" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ControlledToggle({ value, onChange }: { value: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        value ? "bg-green-500" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("general");

  // General settings state
  const [systemName, setSystemName] = useState("Relic OS");
  const [organizationName, setOrganizationName] = useState("Elevana Consultancy");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("INR (₹)");
  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState(false);

  // Google Sheets integration state
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [syncInterval, setSyncInterval] = useState("every_2_hours");
  const [isActive, setIsActive] = useState(false);

  // Stats & Sync log status
  const [lastSyncStatus, setLastSyncStatus] = useState("never");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [recordsImported, setRecordsImported] = useState(0);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Fetch General Settings
  const fetchGeneralSettings = async () => {
    try {
      const res = await fetch("/api/settings/general");
      if (res.ok) {
        const data = await res.json();
        setSystemName(data.systemName || "Relic OS");
        setOrganizationName(data.organizationName || "Elevana Consultancy");
        setTimezone(data.timezone || "Asia/Kolkata (IST)");
        setDateFormat(data.dateFormat || "DD/MM/YYYY");
        setCurrency(data.currency || "INR (₹)");
      }
    } catch (error) {
      console.error("Failed to load general settings:", error);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Save General Settings
  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setGeneralSuccess(false);
    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemName,
          organizationName,
          timezone,
          dateFormat,
          currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSystemName(data.systemName);
        setOrganizationName(data.organizationName);
        setTimezone(data.timezone);
        setDateFormat(data.dateFormat);
        setCurrency(data.currency);
        setGeneralSuccess(true);
        setTimeout(() => setGeneralSuccess(false), 4000);
      } else {
        alert("Failed to save general settings.");
      }
    } catch (error) {
      console.error("Error saving general settings:", error);
      alert("An unexpected error occurred while saving.");
    } finally {
      setSavingGeneral(false);
    }
  };

  // Fetch integration settings
  const fetchIntegrationSettings = async () => {
    try {
      const res = await fetch("/api/integrations/google-sheets");
      if (res.ok) {
        const data = await res.json();
        setGoogleSheetUrl(data.googleSheetUrl || "");
        setSyncInterval(data.syncInterval || "every_2_hours");
        setIsActive(data.isActive || false);
        setLastSyncStatus(data.lastSyncStatus || "never");
        setLastSyncTime(data.lastSyncTime || null);
        setLastSyncError(data.lastSyncError || null);
        setRecordsImported(data.recordsImportedInLastRun || 0);
      }
    } catch (error) {
      console.error("Failed to load Google Sheets settings:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchGeneralSettings();
    fetchIntegrationSettings();
  }, []);

  const handleSaveIntegration = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleSheetUrl,
          syncInterval,
          isActive,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleSheetUrl(data.googleSheetUrl || "");
        setSyncInterval(data.syncInterval || "every_2_hours");
        setIsActive(data.isActive || false);
        alert("Google Sheets configuration saved successfully.");
      } else {
        alert("Failed to save configuration.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTriggerSync = async () => {
    if (syncingSheets) return;
    setSyncingSheets(true);
    try {
      const res = await fetch("/api/integrations/google-sheets/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Sync complete! Successfully synced/updated ${data.count} leads.`);
        await fetchIntegrationSettings();
      } else {
        alert(data.error || "Sync failed. Make sure spreadsheet share settings allow read access.");
        await fetchIntegrationSettings();
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during sync.");
    } finally {
      setSyncingSheets(false);
    }
  };

  return (
    <AppLayout title="Settings">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader title="Settings" subtitle="Configure system preferences" />

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* Sidebar */}
          <div className="card p-2 h-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#474569] hover:bg-[#F7F8FA]"
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {tab === "general" && (
              <div className="card p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-5">General Settings</h3>

                {loadingGeneral ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
                    <p className="text-xs text-[#474569] font-medium">Loading general settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
                    {generalSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>General settings saved successfully!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-0">
                      <label className="text-sm font-medium text-[#374151]">System Name</label>
                      <input
                        type="text"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all max-w-xs bg-white text-[#111827]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-0">
                      <label className="text-sm font-medium text-[#374151]">Organization Name</label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all max-w-xs bg-white text-[#111827]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-0">
                      <label className="text-sm font-medium text-[#374151]">Timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all max-w-xs bg-white text-[#111827]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-0">
                      <label className="text-sm font-medium text-[#374151]">Date Format</label>
                      <input
                        type="text"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all max-w-xs bg-white text-[#111827]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-0">
                      <label className="text-sm font-medium text-[#374151]">Currency</label>
                      <input
                        type="text"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all max-w-xs bg-white text-[#111827]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingGeneral}
                      className="mt-6 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingGeneral && <Loader2 size={14} className="animate-spin" />}
                      Save Changes
                    </button>
                  </form>
                )}
              </div>
            )}

            {tab === "notifications" && (
              <div className="card p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-5">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: "Lead Assigned", desc: "When a lead is assigned to you", on: true },
                    { label: "Status Changed", desc: "When a lead status changes", on: true },
                    { label: "Invoice Generated", desc: "When a new invoice is created", on: true },
                    { label: "Commission Updated", desc: "When commission rates change", on: false },
                    { label: "Document Uploaded", desc: "When a file is uploaded", on: false },
                    { label: "Invoice Paid", desc: "When an invoice is marked paid", on: true },
                    { label: "Google Form Sync", desc: "When sync completes", on: false },
                  ].map(({ label, desc, on }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{label}</p>
                        <p className="text-xs text-[#9CA3AF]">{desc}</p>
                      </div>
                      <Toggle defaultOn={on} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "integrations" && (
              <div className="card p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-5">Integrations</h3>

                {loadingConfig ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
                    <p className="text-xs text-[#474569] font-medium">Loading settings...</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Google Spreadsheet Sync Integration */}
                    <div className="p-5 border border-[#E5E7EB] rounded-xl bg-white shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm border border-emerald-100">
                            G
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827]">Google Sheets Leads Sync</p>
                            <p className="text-[11px] text-[#4B5563] flex items-center gap-1.5 mt-0.5">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Sync
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#9CA3AF] font-medium">
                                  ● Idle
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ControlledToggle value={isActive} onChange={setIsActive} />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#374151] block">Spreadsheet URL</label>
                          <input
                            type="text"
                            value={googleSheetUrl}
                            onChange={(e) => setGoogleSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/1lHM-.../edit?gid=..."
                            className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-[#111827] bg-white placeholder-[#9CA3AF]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#374151] block">Sync Interval</label>
                            <select
                              value={syncInterval}
                              onChange={(e) => setSyncInterval(e.target.value)}
                              className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-[#111827] bg-white cursor-pointer"
                            >
                              <option value="every_hour">Every hour</option>
                              <option value="every_2_hours">Every 2 hours (recommended)</option>
                              <option value="every_4_hours">Every 4 hours</option>
                              <option value="every_12_hours">Every 12 hours</option>
                              <option value="every_24_hours">Every 24 hours</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 flex flex-col justify-end">
                            {isActive && (
                              <button
                                type="button"
                                onClick={handleTriggerSync}
                                disabled={syncingSheets || !googleSheetUrl}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#2563EB] hover:bg-blue-50 text-[#2563EB] rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm h-[38px]"
                              >
                                {syncingSheets ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Synchronizing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={13} />
                                    Sync Now
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Log Info Box */}
                      {lastSyncStatus !== "never" && (
                        <div className={`p-4 rounded-xl border text-xs font-medium space-y-1 ${lastSyncStatus === "success"
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                          : "bg-red-50/50 border-red-100 text-red-800"
                          }`}>
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            {lastSyncStatus === "success" ? (
                              <>
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                Successful Sync Run
                              </>
                            ) : (
                              <>
                                <AlertCircle size={14} className="text-red-600" />
                                Sync Execution Failed
                              </>
                            )}
                          </div>
                          {lastSyncStatus === "success" ? (
                            <p>
                              Imported / updated <strong>{recordsImported}</strong> lead records on{" "}
                              {lastSyncTime ? new Date(lastSyncTime).toLocaleString("en-IN") : ""}.
                            </p>
                          ) : (
                            <p className="leading-relaxed">
                              Error detail: {lastSyncError || "Spreadsheet is not readable."}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="p-4 bg-blue-50/40 border border-blue-100/50 rounded-xl space-y-1.5 text-xs text-[#334155] leading-relaxed">
                        <span className="font-bold text-[#2563EB] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Sheet Access Guide
                        </span>
                        <p>
                          To allow secure background synchronization, the spreadsheet must be shared.
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-[#475569]">
                          <li>Open your Google Spreadsheet.</li>
                          <li>Click the blue <strong>Share</strong> button in the top-right corner.</li>
                          <li>Under General access, change setting to <strong>&quot;Anyone with the link can view&quot;</strong>.</li>
                          <li>Copy the URL from your browser address bar and paste it in the field above.</li>
                        </ol>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleSaveIntegration}
                          disabled={savingConfig}
                          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                          {savingConfig && <Loader2 size={12} className="animate-spin" />}
                          Save Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
