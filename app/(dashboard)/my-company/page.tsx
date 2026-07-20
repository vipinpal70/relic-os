"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Mail, Phone, MapPin, Wallet, CheckCircle2, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/components/providers/SessionProvider";
import {
  useMyChannelPartner,
  useChannelPartnerDetails,
  useChannelPartnerTransactions,
} from "@/lib/hooks/useChannelPartners";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PartnerLoading, PartnerUnlinkedNotice } from "@/components/partner/PartnerDashboard";

export default function MyCompanyPage() {
  const { user } = useSession();
  const isPartner = user?.role === "Channel Partner";

  return (
    <AppLayout title="My Company">
      {isPartner ? <MyCompanyContent /> : <StaffNotice />}
    </AppLayout>
  );
}

function StaffNotice() {
  return (
    <div className="card p-10 text-center max-w-lg mx-auto mt-8">
      <p className="text-sm font-medium text-[#374151]">
        This page is for channel partner accounts.
      </p>
      <Link href="/channel-partners" className="text-sm text-[#2563EB] hover:underline mt-2 inline-block">
        Go to Channel Partners
      </Link>
    </div>
  );
}

function MyCompanyContent() {
  const { partner, isLoading: meLoading, error: meError } = useMyChannelPartner();
  const partnerId = partner?._id || "";
  const { stats } = useChannelPartnerDetails(partnerId);
  const { transactions, isLoading: txLoading } = useChannelPartnerTransactions(partnerId);

  if (meLoading) return <PartnerLoading />;
  if (meError || !partner) return <PartnerUnlinkedNotice message={(meError as Error)?.message} />;

  const allTime = stats?.allTime;
  const address = [partner.address, partner.city, partner.state].filter(Boolean).join(", ");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="My Company" subtitle="Your profile, commission rates, and payout history" />

      {/* Profile card */}
      <div className="card p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-blue flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">{partner.companyName}</h2>
              <p className="text-sm text-[#6B7280]">{partner.name}</p>
            </div>
          </div>
          <StatusBadge status={partner.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mt-5 text-sm">
          <p className="flex items-center gap-2 text-[#374151]">
            <Mail size={14} className="text-[#9CA3AF]" /> {partner.email}
          </p>
          <p className="flex items-center gap-2 text-[#374151]">
            <Phone size={14} className="text-[#9CA3AF]" /> {partner.phone}
          </p>
          {address && (
            <p className="flex items-center gap-2 text-[#374151]">
              <MapPin size={14} className="text-[#9CA3AF]" /> {address}
            </p>
          )}
          <p className="text-[#374151]">
            <span className="text-xs font-semibold text-[#6B7280]">GSTIN: </span>
            {partner.gst || "—"}
          </p>
          <p className="text-[#374151]">
            <span className="text-xs font-semibold text-[#6B7280]">PAN: </span>
            {partner.pan || "—"}
          </p>
        </div>
      </div>

      {/* Payout summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Commission Earned" value={formatCurrency(allTime?.commissionExpected ?? 0)} icon={Wallet} gradientClass="gradient-blue" />
        <StatsCard title="Received" value={formatCurrency(allTime?.commissionPaid ?? 0)} icon={CheckCircle2} gradientClass="gradient-blue" />
        <StatsCard title="Pending" value={formatCurrency(allTime?.commissionPending ?? 0)} icon={Clock} gradientClass="gradient-blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Commission rates */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827]">My Commission Rates</h3>
            <p className="text-xs text-[#6B7280]">Rates agreed for loans you source</p>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Loan Type</th>
                <th className="text-right">Rate</th>
                <th className="text-left">Effective From</th>
              </tr>
            </thead>
            <tbody>
              {(partner.commissionTable || []).map((rule, i) => (
                <tr key={i}>
                  <td className="text-[#374151]">{rule.loanType}</td>
                  <td className="text-right font-semibold text-[#111827]">
                    {rule.commissionType === "Fixed"
                      ? `${formatCurrency(rule.commissionValue)} fixed`
                      : `${rule.commissionValue}%`}
                  </td>
                  <td className="text-xs text-[#9CA3AF]">{formatDate(rule.effectiveFrom)}</td>
                </tr>
              ))}
              {(partner.commissionTable || []).length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-xs text-[#9CA3AF]">
                    No commission rates configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payout transactions */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827]">Payout History</h3>
            <p className="text-xs text-[#6B7280]">Commission payments made to you</p>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Mode</th>
                <th className="text-left">Reference</th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-xs text-[#9CA3AF]">Loading...</td></tr>
              ) : (
                <>
                  {(transactions || []).map((tx: any) => (
                    <tr key={tx._id}>
                      <td className="text-xs text-[#6B7280]">{tx.paymentDate ? formatDate(tx.paymentDate) : "—"}</td>
                      <td className="text-right font-semibold text-green-600">{formatCurrency(tx.amount || 0)}</td>
                      <td className="text-[#374151]">{tx.paymentMode || "—"}</td>
                      <td className="font-mono text-xs text-[#6B7280]">{tx.referenceNumber || "—"}</td>
                    </tr>
                  ))}
                  {(transactions || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-[#9CA3AF]">
                        No payouts recorded yet.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
