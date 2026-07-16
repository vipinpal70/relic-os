"use client";
import { Search } from "lucide-react";

interface LeadFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  bank: string;
  setBank: (v: string) => void;
  loanType: string;
  setLoanType: (v: string) => void;
  banks: string[];
  loanTypes: string[];
}

const statuses = [
  "All", "New", "Assigned", "Not Connected", "Not Interested",
  "Document Pending", "Processing", "Approved", "Rejected", "Disbursed",
];

export function LeadFilters({
  search,
  setSearch,
  status,
  setStatus,
  bank,
  setBank,
  loanType,
  setLoanType,
  banks,
  loanTypes,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applicant, phone..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-[#374151]"
        />
      </div>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] font-semibold focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
      >
        <option value="All">All Statuses</option>
        {statuses.filter(s => s !== "All").map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Bank Filter */}
      <select
        value={bank}
        onChange={(e) => setBank(e.target.value)}
        className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] font-semibold focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
      >
        <option value="All">All Banks</option>
        {banks.filter(b => b !== "All").map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {/* Loan Type Filter */}
      <select
        value={loanType}
        onChange={(e) => setLoanType(e.target.value)}
        className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] font-semibold focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
      >
        <option value="All">All Loan Types</option>
        {loanTypes.filter(t => t !== "All").map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
