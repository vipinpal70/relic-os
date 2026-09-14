"use client";
import { Search } from "lucide-react";

interface LeadFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  bank: string;
  setBank: (v: string) => void;
  corporate: string;
  setCorporate: (v: string) => void;
  loanType: string;
  setLoanType: (v: string) => void;
  banks: string[];
  corporates: string[];
  loanTypes: string[];
}

const statuses = [
  "All",
  "Underwriting",
  "Sanctioned",
  "Reject",
  "PDD",
  "Not Interested",
  "Disbursed",
  "Not Contactable",
];

export function LeadFilters({
  search,
  setSearch,
  status,
  setStatus,
  bank,
  setBank,
  corporate,
  setCorporate,
  loanType,
  setLoanType,
  banks,
  corporates,
  loanTypes,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
      {/* Search Input */}
      <div className="relative w-full md:w-auto md:flex-1 md:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applicant, phone..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-[#374151]"
        />
      </div>

      {/* Filter Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 scrollbar-none md:overflow-visible md:pb-0 md:mx-0 md:px-0">
        {/* Status Filter */}
        <div className="shrink-0">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] font-semibold focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
          >
            <option value="All">All Status</option>
            {statuses.filter(s => s !== "All").map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Bank Filter */}
        <div className="shrink-0">
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
        </div>

        {/* Corporate Filter */}
        <div className="shrink-0">
          <select
            value={corporate}
            onChange={(e) => setCorporate(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] font-semibold focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
          >
            <option value="All">All Corporates</option>
            {corporates.filter(c => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Loan Type Filter */}
        <div className="shrink-0">
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
      </div>
    </div>
  );
}
