"use client";
import { Search, Download, RefreshCw } from "lucide-react";

interface LeadFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
}

const statuses = [
  "All", "New", "Assigned", "Not Connected", "Not Interested",
  "Document Pending", "Processing", "Approved", "Rejected", "Disbursed",
];

export function LeadFilters({ search, setSearch, status, setStatus }: LeadFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applicant, phone..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:border-[#3B82F6] transition-all"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors">
          <RefreshCw size={14} />
          <span>Sync Now</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors">
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
