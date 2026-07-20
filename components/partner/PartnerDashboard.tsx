"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, AlertCircle, Users, CheckCircle2, IndianRupee, Wallet,
  Clock, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useMyChannelPartner,
  useChannelPartnerDetails,
  useChannelPartnerAnalytics,
  useChannelPartnerLeads,
} from "@/lib/hooks/useChannelPartners";
import { formatCurrency, formatDate } from "@/lib/utils";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PartnerUnlinkedNotice({ message }: { message?: string }) {
  return (
    <div className="card p-10 flex flex-col items-center justify-center gap-3 text-center max-w-lg mx-auto mt-8">
      <AlertCircle className="w-10 h-10 text-amber-500" />
      <p className="text-sm font-bold text-[#111827]">Partner profile not linked</p>
      <p className="text-sm text-[#6B7280]">
        {message || "Your login isn't linked to a channel partner profile yet. Please contact your administrator."}
      </p>
    </div>
  );
}

export function PartnerLoading() {
  return (
    <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      <p className="text-sm text-[#474569] font-medium">Loading your portal...</p>
    </div>
  );
}

export function PartnerDashboard() {
  const { partner, isLoading: meLoading, error: meError } = useMyChannelPartner();
  const partnerId = partner?._id || "";

  const { stats, isLoading: statsLoading } = useChannelPartnerDetails(partnerId);
  const { data: analytics } = useChannelPartnerAnalytics(partnerId);
  const { data: leadsData } = useChannelPartnerLeads(partnerId, { limit: 5 });

  if (meLoading) return <PartnerLoading />;
  if (meError || !partner) return <PartnerUnlinkedNotice message={(meError as Error)?.message} />;

  const allTime = stats?.allTime;
  const month = stats?.currentMonth;

  const chartData = (analytics?.monthlyTrends || []).map((t: any) => ({
    label: `${MONTH_NAMES[t.month] || t.month} ${String(t.year).slice(2)}`,
    leads: t.leadCount,
    disbursed: t.loanVolume,
    commission: t.partnerCommission,
  }));

  const recentLeads: any[] = leadsData?.data || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
          Welcome, {partner.name?.split(" ")[0] || partner.companyName}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {partner.companyName} · Your performance overview
        </p>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <PartnerLoading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatsCard title="Total Leads" value={allTime?.totalLeads ?? 0} icon={Users} gradientClass="gradient-blue" />
            <StatsCard title="Disbursed Loans" value={allTime?.disbursedLeads ?? 0} icon={CheckCircle2} gradientClass="gradient-blue" />
            <StatsCard title="Total Disbursed" value={formatCurrency(allTime?.disbursedAmount ?? 0)} icon={IndianRupee} gradientClass="gradient-blue" />
            <StatsCard title="This Month Leads" value={month?.leads ?? 0} icon={TrendingUp} gradientClass="gradient-blue" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard title="Commission Earned" value={formatCurrency(allTime?.commissionExpected ?? 0)} icon={Wallet} gradientClass="gradient-blue" />
            <StatsCard title="Commission Received" value={formatCurrency(allTime?.commissionPaid ?? 0)} icon={CheckCircle2} gradientClass="gradient-blue" />
            <StatsCard title="Commission Pending" value={formatCurrency(allTime?.commissionPending ?? 0)} icon={Clock} gradientClass="gradient-blue" />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly trend chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4">Monthly Performance</h3>
          {chartData.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] py-10 text-center">No activity yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="partnerDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(value: any, name: any) => name === "leads" ? [value, "Leads"] : [formatCurrency(Number(value)), name === "disbursed" ? "Loan Volume" : "My Commission"]} />
                <Area type="monotone" dataKey="disbursed" stroke="#2563EB" fill="url(#partnerDisbursed)" strokeWidth={2} />
                <Area type="monotone" dataKey="commission" stroke="#16A34A" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent leads */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Recent Leads</h3>
            <Link href="/leads" className="text-xs text-[#2563EB] hover:underline">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] py-6 text-center">No leads yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLeads.map((lead) => (
                <li key={lead._id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{lead.applicantName}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {formatCurrency(lead.loanAmount || 0)} · {lead.loanType}
                    </p>
                  </div>
                  <StatusBadge status={lead.status === "Pending" ? "Processing" : lead.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
