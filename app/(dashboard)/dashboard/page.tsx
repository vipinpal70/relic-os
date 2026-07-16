"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, TrendingUp, Percent, CheckCircle, BadgeDollarSign,
  Clock, Wallet, CreditCard, Plus, BarChart2, Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/ui/StatsCard";
import { MonthlyApplicationsChart, LoanTypeChart, BankDisbursementChart } from "@/components/dashboard/DashboardCharts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
          setLeadsList(list);
        }
      } catch (error) {
        console.error("Failed to load dashboard leads:", error);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchDashboardStats();
    fetchRecentLeads();
  }, []);

  const stats = [
    { title: "Total Applications", value: dashboardData?.stats?.totalApplications ?? 0, icon: FileText, gradientClass: "gradient-blue", change: 8.2 },
    { title: "Open Applications", value: dashboardData?.stats?.openApplications ?? 0, icon: TrendingUp, gradientClass: "gradient-indigo", change: -3.1 },
    { title: "Conversion Rate", value: dashboardData?.stats?.conversionRate ?? 0, icon: Percent, gradientClass: "gradient-green", suffix: "%", change: 2.5 },
    { title: "Approved Loans", value: dashboardData?.stats?.approvedLoans ?? 0, icon: CheckCircle, gradientClass: "gradient-emerald", change: 5.4 },
    { title: "Disbursed Loans", value: dashboardData?.stats?.disbursedLoans ?? 0, icon: BadgeDollarSign, gradientClass: "gradient-emerald", change: 6.1 },
    { title: "Pending Payments", value: dashboardData?.stats?.pendingPayments ?? 0, icon: Clock, gradientClass: "gradient-amber", change: -12 },
    { title: "Receivable Amount", value: formatCurrency(dashboardData?.stats?.receivableAmount ?? 0), icon: Wallet, gradientClass: "gradient-purple", change: 3.8 },
    { title: "Commission Payable", value: formatCurrency(dashboardData?.stats?.commissionPayable ?? 0), icon: CreditCard, gradientClass: "gradient-indigo", change: 1.2 },
    { title: "Today's New Leads", value: dashboardData?.stats?.todayNewLeads ?? 0, icon: Plus, gradientClass: "gradient-blue", change: 16.7 },
    { title: "Monthly Volume", value: formatCurrency(dashboardData?.stats?.monthlyLoanVolume ?? 0), icon: BarChart2, gradientClass: "gradient-purple", change: 9.3 },
  ];

  const recentLeads = Array.isArray(leadsList) ? leadsList.slice(0, 5) : [];

  return (
    <AppLayout title="Dashboard">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Stats Grid */}
        {loading ? (
          <div className="card p-12 mb-6 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading live database insights...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, i) => (
              <StatsCard key={i} {...stat} />
            ))}
          </div>
        )}

        {/* Charts Row */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <MonthlyApplicationsChart data={dashboardData?.monthlyData} />
            </div>
            <LoanTypeChart data={dashboardData?.loanTypeData} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Leads */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111827]">Recent Leads</h3>
              <Link href="/leads" className="text-xs text-[#2563EB] font-medium hover:underline">View all</Link>
            </div>
            
            {loadingLeads ? (
              <div className="p-8 flex items-center justify-center gap-2">
                <Loader2 size={16} className="text-[#2563EB] animate-spin" />
                <span className="text-xs text-[#474569]">Loading recent leads...</span>
              </div>
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">Applicant</th>
                    <th className="text-left">Loan Type</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <p className="font-medium text-[#111827]">{lead.applicant_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{lead.bank || "—"}</p>
                      </td>
                      <td className="text-[#374151] text-sm">{lead.loan_type}</td>
                      <td className="text-right font-semibold text-[#111827]">{formatCurrency(lead.loan_amount)}</td>
                      <td><StatusBadge status={lead.status} /></td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-xs text-[#9CA3AF]">
                        No leads found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Bank Disbursement + Activity */}
          {!loading && (
            <div className="space-y-4">
              <BankDisbursementChart data={dashboardData?.bankDisbursementData} />
              <RecentActivity data={dashboardData?.recentActivity} />
            </div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}
