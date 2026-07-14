"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { activityLogs } from "@/lib/data";

const modules = ["All", "Leads", "Documents", "Invoice", "Commission", "Team"];

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("All");

  const filtered = activityLogs.filter((log) => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchModule = module === "All" || log.module === module;
    return matchSearch && matchModule;
  });

  const moduleColors: Record<string, string> = {
    Leads: "#EFF6FF",
    Documents: "#EEF2FF",
    Invoice: "#DCFCE7",
    Commission: "#FEF3C7",
    Team: "#F3F4F6",
  };

  const moduleTextColors: Record<string, string> = {
    Leads: "#2563EB",
    Documents: "#4F46E5",
    Invoice: "#15803D",
    Commission: "#B45309",
    Team: "#4B5563",
  };

  return (
    <AppLayout title="Activity Logs">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Activity Logs"
          subtitle="Full audit trail of all user actions"
        />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action..."
              className="pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] transition-all min-w-[220px]"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setModule(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  module === m ? "bg-[#2563EB] text-white" : "bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              <Filter size={12} />
              Date Range
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">User</th>
                <th className="text-left">Module</th>
                <th className="text-left">Action</th>
                <th className="text-left">IP Address</th>
                <th className="text-left">Browser</th>
                <th className="text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {log.user.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-[#111827]">{log.user}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        backgroundColor: moduleColors[log.module] ?? "#F3F4F6",
                        color: moduleTextColors[log.module] ?? "#4B5563",
                      }}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {log.module}
                    </span>
                  </td>
                  <td className="text-[#374151] text-sm max-w-xs truncate">{log.action}</td>
                  <td className="text-[#9CA3AF] text-xs font-mono">{log.ip}</td>
                  <td className="text-[#9CA3AF] text-xs">{log.browser}</td>
                  <td className="text-[#9CA3AF] text-xs">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[#9CA3AF] text-sm">No activity logs found</div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}
