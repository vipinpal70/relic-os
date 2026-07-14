import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Bank from "@/lib/models/Bank";
import ActivityLog from "@/lib/models/ActivityLog";

export async function GET() {
  try {
    await dbConnect();

    // 1. Core Counts
    const totalApplications = await Case.countDocuments({ isDeleted: false });
    const openApplications = await Case.countDocuments({
      status: { $in: ["New", "Pending", "Approved"] },
      isDeleted: false,
    });
    const approvedLoans = await Case.countDocuments({ status: "Approved", isDeleted: false });
    const disbursedLoans = await Case.countDocuments({ status: "Disbursed", isDeleted: false });

    // 2. Conversion rate
    const approvedOrDisbursed = await Case.countDocuments({
      status: { $in: ["Approved", "Disbursed"] },
      isDeleted: false,
    });
    const conversionRate = totalApplications > 0 ? parseFloat(((approvedOrDisbursed / totalApplications) * 100).toFixed(1)) : 0;

    // 3. Commissions & Receivables
    const commissionStats = await Case.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          receivableAmount: { $sum: "$bankPendingCommission" },
          commissionPayable: { $sum: "$partnerPendingCommission" },
        },
      },
    ]);
    const receivableAmount = commissionStats[0]?.receivableAmount || 0;
    const commissionPayable = commissionStats[0]?.commissionPayable || 0;

    // 4. Pending Payments Count (cases where bank/partner commission is still pending)
    const pendingPayments = await Case.countDocuments({
      isDeleted: false,
      $or: [
        { bankPendingCommission: { $gt: 0 } },
        { partnerPendingCommission: { $gt: 0 } },
      ],
    });

    // 5. Today's New Leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNewLeads = await Case.countDocuments({
      createdAt: { $gte: today },
      isDeleted: false,
    });

    // 6. Monthly Loan Volume (Disbursed volume in the current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyVolumeStats = await Case.aggregate([
      {
        $match: {
          status: "Disbursed",
          createdAt: { $gte: startOfMonth },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$disbursedAmount" },
        },
      },
    ]);
    const monthlyLoanVolume = monthlyVolumeStats[0]?.total || 0;

    // 7. Monthly Trends (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Case.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          applications: { $sum: 1 },
          disbursed: {
            $sum: { $cond: [{ $eq: ["$status", "Disbursed"] }, 1, 0] },
          },
          commission: { $sum: "$bankExpectedCommission" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      
      const match = monthlyTrends.find(
        (t) => t._id.year === yr && t._id.month === mIdx + 1
      );

      return {
        month: months[mIdx],
        applications: match?.applications || 0,
        disbursed: match?.disbursed || 0,
        commission: match?.commission || 0,
      };
    });

    // 8. Loan Type distribution (Pie Chart)
    const loanTypeStats = await Case.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$loanType", value: { $sum: 1 } } },
    ]);
    const colors = ["#3B82F6", "#6366F1", "#22C55E", "#F59E0B", "#06B6D4", "#EC4899"];
    const loanTypeData = loanTypeStats.map((t, idx) => ({
      name: t._id,
      value: t.value,
      color: colors[idx % colors.length],
    }));

    // 9. Bank Wise Disbursement (Bar Chart)
    const bankDisbursementStats = await Case.aggregate([
      { $match: { status: "Disbursed", isDeleted: false } },
      { $group: { _id: "$bankId", amount: { $sum: "$disbursedAmount" } } },
    ]);
    const populatedBankStats = await Bank.populate(bankDisbursementStats, {
      path: "_id",
      select: "bankName",
    });
    const bankDisbursementData = populatedBankStats.map((b) => ({
      bank: b._id?.bankName || "Unknown",
      amount: b.amount,
    }));

    // If empty, supply fallback elements for presentation
    if (bankDisbursementData.length === 0) {
      bankDisbursementData.push({ bank: "No Data", amount: 0 });
    }

    // 10. Recent Activity Logs
    const rawLogs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(6);

    const getIcon = (action: string) => {
      if (action.includes("Create") || action.includes("New")) return "UserPlus";
      if (action.includes("Upload") || action.includes("Document")) return "Upload";
      if (action.includes("Commission")) return "FileText";
      if (action.includes("Pay") || action.includes("Disburse")) return "CheckCircle";
      if (action.includes("Assign")) return "Users";
      return "ArrowRight";
    };

    const getColor = (action: string) => {
      if (action.includes("Create") || action.includes("New")) return "#2563EB";
      if (action.includes("Upload")) return "#6366F1";
      if (action.includes("Pay") || action.includes("Disburse")) return "#22C55E";
      return "#F59E0B";
    };

    const getRelativeTime = (date: Date) => {
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.round(diffHr / 24)}d ago`;
    };

    const recentActivity = rawLogs.map((log) => ({
      id: log._id.toString(),
      type: "log",
      icon: getIcon(log.action),
      message: `${log.performedBy} performed ${log.action}: ${log.details}`,
      time: getRelativeTime(log.createdAt),
      color: getColor(log.action),
    }));

    return NextResponse.json({
      stats: {
        totalApplications,
        openApplications,
        conversionRate,
        approvedLoans,
        disbursedLoans,
        pendingPayments,
        receivableAmount,
        commissionPayable,
        todayNewLeads,
        monthlyLoanVolume,
      },
      monthlyData,
      loanTypeData,
      bankDisbursementData,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Dashboard stats computation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
