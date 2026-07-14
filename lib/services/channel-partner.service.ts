import mongoose from "mongoose";
import { ChannelPartnerRepository } from "@/lib/repositories/channel-partner.repository";
import { CommissionService } from "./commission.service";
import { IChannelPartner } from "@/lib/models/ChannelPartner";
import Case from "@/lib/models/Case";
import ActivityLog from "@/lib/models/ActivityLog";

export class ChannelPartnerService {
  private partnerRepo = new ChannelPartnerRepository();
  private commissionService = new CommissionService();

  async createPartner(data: Partial<IChannelPartner>, performedBy: string): Promise<IChannelPartner> {
    const partner = await this.partnerRepo.create({
      ...data,
      createdBy: performedBy,
      updatedBy: performedBy,
    });

    await ActivityLog.create({
      entityType: "ChannelPartner",
      entityId: partner._id as mongoose.Types.ObjectId,
      action: "Created",
      details: `Channel Partner "${partner.name}" (${partner.companyName}) created.`,
      performedBy,
    });

    return partner;
  }

  async updatePartner(id: string, data: Partial<IChannelPartner>, performedBy: string): Promise<IChannelPartner | null> {
    const original = await this.partnerRepo.findById(id);
    if (!original) throw new Error("Channel partner not found");

    // Check if the commission table is being updated
    const isCommissionTableUpdated =
      data.commissionTable &&
      JSON.stringify(data.commissionTable) !== JSON.stringify(original.commissionTable);

    const updated = await this.partnerRepo.update(id, {
      ...data,
      updatedBy: performedBy,
    });

    if (!updated) return null;

    // Log Activity
    await ActivityLog.create({
      entityType: "ChannelPartner",
      entityId: updated._id as mongoose.Types.ObjectId,
      action: "Updated",
      details: `Channel Partner "${updated.name}" updated.`,
      performedBy,
    });

    // If commission table updated, trigger recalculations
    if (isCommissionTableUpdated) {
      await this.commissionService.recalculatePartnerCommissions(id, performedBy);
    }

    return updated;
  }

  async deletePartner(id: string, performedBy: string): Promise<IChannelPartner | null> {
    const partner = await this.partnerRepo.softDelete(id, performedBy);
    if (!partner) return null;

    await ActivityLog.create({
      entityType: "ChannelPartner",
      entityId: partner._id as mongoose.Types.ObjectId,
      action: "Deleted",
      details: `Channel Partner "${partner.name}" was soft-deleted.`,
      performedBy,
    });

    return partner;
  }

  async getPartnerById(id: string) {
    return await this.partnerRepo.findById(id);
  }

  async getPartnerDashboardStats(partnerId: string) {
    // Current month start/end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const cpId = new mongoose.Types.ObjectId(partnerId);

    // Get case metrics for Channel Partner (total cases, approved, rejected, pending, disbursed, amounts, commissions)
    const statsPipeline = [
      { $match: { channelPartnerId: cpId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          approvedCases: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          rejectedCases: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          pendingCases: { $sum: { $cond: [{ $in: ["$status", ["New", "Pending"]] }, 1, 0] } },
          disbursedCases: { $sum: { $cond: [{ $eq: ["$status", "Disbursed"] }, 1, 0] } },
          totalLoanAmount: { $sum: "$loanAmount" },
          disbursedAmount: { $sum: "$disbursedAmount" },
          commissionExpected: { $sum: "$partnerExpectedCommission" },
          commissionPaid: { $sum: "$partnerPaidCommission" },
          commissionPending: { $sum: "$partnerPendingCommission" },
        },
      },
    ];

    const currentMonthPipeline = [
      {
        $match: {
          channelPartnerId: cpId,
          isDeleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          cases: { $sum: 1 },
          amount: { $sum: "$loanAmount" },
          commissionExpected: { $sum: "$partnerExpectedCommission" },
          commissionPaid: { $sum: "$partnerPaidCommission" },
          commissionPending: { $sum: "$partnerPendingCommission" },
        },
      },
    ];

    const [allTimeStats, currentMonthStats] = await Promise.all([
      Case.aggregate(statsPipeline),
      Case.aggregate(currentMonthPipeline),
    ]);

    const defaultAllTime = {
      totalCases: 0,
      approvedCases: 0,
      rejectedCases: 0,
      pendingCases: 0,
      disbursedCases: 0,
      totalLoanAmount: 0,
      disbursedAmount: 0,
      commissionExpected: 0,
      commissionPaid: 0,
      commissionPending: 0,
    };

    const defaultMonth = {
      cases: 0,
      amount: 0,
      commissionExpected: 0,
      commissionPaid: 0,
      commissionPending: 0,
    };

    return {
      allTime: allTimeStats[0] || defaultAllTime,
      currentMonth: currentMonthStats[0] || defaultMonth,
    };
  }
}
