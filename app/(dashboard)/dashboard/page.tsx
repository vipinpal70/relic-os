"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, TrendingUp, Percent, CheckCircle, BadgeDollarSign,
  Clock, Wallet, CreditCard, Plus, BarChart2, Loader2,
  ChevronDown, ChevronUp, ChevronRight, Calendar
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
  const [showAllMetrics, setShowAllMetrics] = useState(false);

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

  const primaryMobileStats = [
    { title: "Total Applications", value: dashboardData?.stats?.totalApplications ?? 0, icon: FileText, colorClass: "text-blue-600 bg-blue-50 border-blue-100", change: 8.2, sparkline: "purple" },
    { title: "Open Applications", value: dashboardData?.stats?.openApplications ?? 0, icon: TrendingUp, colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100", change: -3.1, sparkline: "purple" },
    { title: "Approved Loans", value: dashboardData?.stats?.approvedLoans ?? 0, icon: CheckCircle, colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100", change: 5.4, sparkline: "green" },
    { title: "Pending Payments", value: dashboardData?.stats?.pendingPayments ?? 0, icon: Clock, colorClass: "text-amber-600 bg-amber-50 border-amber-100", change: -12, sparkline: "orange" },
  ];

  const secondaryMobileStats = [
    { title: "Conversion Rate", value: `${dashboardData?.stats?.conversionRate ?? 0}%`, icon: Percent, colorClass: "text-purple-600 bg-purple-50 border-purple-100", change: 2.5 },
    { title: "Disbursed Loans", value: dashboardData?.stats?.disbursedLoans ?? 0, icon: BadgeDollarSign, colorClass: "text-green-600 bg-green-50 border-green-100", change: 6.1 },
    { title: "Receivable Amount", value: formatCurrency(dashboardData?.stats?.receivableAmount ?? 0), icon: Wallet, colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100", change: 3.8 },
    { title: "Commission Payable", value: formatCurrency(dashboardData?.stats?.commissionPayable ?? 0), icon: CreditCard, colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100", change: 1.2 },
    { title: "Today's New Leads", value: dashboardData?.stats?.todayNewLeads ?? 0, icon: Plus, colorClass: "text-blue-600 bg-blue-50 border-blue-100", change: 16.7 },
    { title: "Monthly Volume", value: formatCurrency(dashboardData?.stats?.monthlyLoanVolume ?? 0), icon: BarChart2, colorClass: "text-purple-600 bg-purple-50 border-purple-100", change: 9.3 },
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
          <>
            {/* Desktop Stats Grid */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              {stats.map((stat, i) => (
                <StatsCard key={i} {...stat} />
              ))}
            </div>

            {/* Mobile Redesigned Stats */}
            <div className="block md:hidden mb-6">
              {/* Date Filter Pill Badge */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366F1] text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer hover:bg-[#5046E5] transition-all">
                  <span>This Month</span>
                  <ChevronDown size={11} strokeWidth={2.5} />
                  <Calendar size={11} strokeWidth={2.5} className="ml-0.5" />
                </div>
              </div>

              {/* 2x2 Grid for Primary Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {primaryMobileStats.map((stat, i) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={i} className="card p-4 flex flex-col justify-between bg-white relative overflow-hidden h-36 border border-[#EFF2F6] rounded-2xl shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.colorClass} shrink-0`}>
                          <IconComponent size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide truncate">{stat.title}</p>
                          <p className="text-lg font-extrabold text-[#111827] leading-tight">
                            {typeof stat.value === "number" ? stat.value.toLocaleString("en-IN") : stat.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className={`text-[9px] font-bold flex items-center gap-0.5 ${stat.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}% <span className="text-gray-400 font-medium">vs last month</span>
                        </div>
                        <div className="w-14 h-7 flex items-end">
                          {stat.sparkline === "purple" && (
                            <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M0,25 Q15,20 30,22 T60,10 T90,5" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="90" cy="5" r="2.5" fill="currentColor" />
                            </svg>
                          )}
                          {stat.sparkline === "green" && (
                            <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M0,25 Q20,23 40,25 T80,12 T90,10" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="90" cy="10" r="2.5" fill="currentColor" />
                            </svg>
                          )}
                          {stat.sparkline === "orange" && (
                            <svg className="w-full h-full text-amber-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M0,10 Q20,15 40,12 T80,22 T90,20" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="90" cy="20" r="2.5" fill="currentColor" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Metrics Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="w-full py-2.5 px-4 bg-[#EFF6FF]/65 border border-[#BFDBFE]/65 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition-all cursor-pointer shadow-xs mb-3"
              >
                <span>{showAllMetrics ? "Hide Metrics" : "View All Metrics"}</span>
                {showAllMetrics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Collapsible List of Secondary Stats */}
              {showAllMetrics && (
                <div className="bg-white border border-[#EFF2F6] divide-y divide-[#EFF2F6] rounded-2xl overflow-hidden shadow-xs">
                  {secondaryMobileStats.map((stat, idx) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.colorClass} shrink-0`}>
                            <IconComponent size={16} />
                          </div>
                          <span className="text-xs font-bold text-[#374151]">{stat.title}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-extrabold text-[#111827]">{stat.value}</span>
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${stat.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
                          </span>
                          <ChevronRight size={14} className="text-[#9CA3AF]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
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
