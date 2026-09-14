"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadTable } from "@/components/leads/LeadTable";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { useSession } from "@/components/providers/SessionProvider";
import { PartnerLeadsView } from "@/components/partner/PartnerLeadsView";

export default function LeadsPage() {
  const { user } = useSession();

  // Channel Partner users get a scoped, view-only leads list
  if (user?.role === "Channel Partner") {
    return (
      <AppLayout title="Lead Management">
        <PartnerLeadsView />
      </AppLayout>
    );
  }

  return <AdminLeadsPage />;
}

function AdminLeadsPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");
  const [corporateFilter, setCorporateFilter] = useState("All");
  const [loanTypeFilter, setLoanTypeFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        setLeadsList(list);
      } else {
        console.error("[fetchLeads] Fetch response failed:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("[fetchLeads] Failed to load leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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

  // CSV Export — exports the currently filtered rows
  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert("No leads to export for the current filters.");
      return;
    }

    // Quote every value; escape embedded quotes so commas/newlines in data don't break columns
    const escapeCell = (value: any) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Application Number", "Applicant Name", "Email", "Phone", "Loan Type",
      "Loan Amount", "Bank", "Channel Partner", "Corporate", "Assigned To", "Source",
      "Status", "Disbursed Amount", "Approved Date", "Disbursed Date",
      "Remarks", "Created Date",
    ];
    const rows = filtered.map((l) => [
      l.application_number,
      l.applicant_name,
      l.email,
      l.phone,
      l.loan_type,
      l.loan_amount,
      l.bank,
      l.channel_partner,
      l.corporate,
      l.assigned_user,
      l.lead_source,
      l.status,
      l.disbursed_amount,
      l.approved_date,
      l.disbursed_date,
      l.remarks,
      l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN") : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");

    // BOM so Excel opens UTF-8 content correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Lead Management">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Lead Management"
          subtitle="Manage and track all loan applications"
          actions={
            <>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors"
              >
                <Upload size={15} />
                Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
              >
                <Plus size={15} />
                <span className="md:block hidden">Add Lead</span>
                <span className="md:hidden block">Add</span>
              </button>
            </>
          }
        />

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
            <p className="text-sm text-[#474569] font-medium">Loading database leads...</p>
          </div>
        ) : (
          <LeadTable leads={filtered} />
        )}

        <AddLeadModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={fetchLeads}
        />
      </motion.div>
    </AppLayout>
  );
}
