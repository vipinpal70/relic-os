import mongoose from "mongoose";
import { CorporateRepository } from "@/lib/repositories/corporate.repository";
import { ICorporate } from "@/lib/models/Corporate";
import Lead from "@/lib/models/Lead";
import ActivityLog from "@/lib/models/ActivityLog";

export class CorporateService {
  private corporateRepo = new CorporateRepository();

  async createCorporate(data: Partial<ICorporate>, performedBy: string): Promise<ICorporate> {
    const corporate = await this.corporateRepo.create({
      ...data,
      createdBy: performedBy,
      updatedBy: performedBy,
    });

    await ActivityLog.create({
      entityType: "Corporate",
      entityId: corporate._id as mongoose.Types.ObjectId,
      action: "Created",
      details: `Corporate "${corporate.corporateName}" created.`,
      performedBy,
    });

    return corporate;
  }

  async updateCorporate(id: string, data: Partial<ICorporate>, performedBy: string): Promise<ICorporate | null> {
    const original = await this.corporateRepo.findById(id);
    if (!original) throw new Error("Corporate not found");

    const updated = await this.corporateRepo.update(id, {
      ...data,
      updatedBy: performedBy,
    });

    if (!updated) return null;

    await ActivityLog.create({
      entityType: "Corporate",
      entityId: updated._id as mongoose.Types.ObjectId,
      action: "Updated",
      details: `Corporate "${updated.corporateName}" information updated.`,
      performedBy,
    });

    return updated;
  }

  async deleteCorporate(id: string, performedBy: string): Promise<ICorporate | null> {
    const corporate = await this.corporateRepo.softDelete(id, performedBy);
    if (!corporate) return null;

    await ActivityLog.create({
      entityType: "Corporate",
      entityId: corporate._id as mongoose.Types.ObjectId,
      action: "Deleted",
      details: `Corporate "${corporate.corporateName}" was soft-deleted.`,
      performedBy,
    });

    return corporate;
  }

  async getCorporateById(id: string) {
    return await this.corporateRepo.findById(id);
  }

  async getCorporateDashboardStats(corporateId: string) {
    // Current month start/end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const cId = new mongoose.Types.ObjectId(corporateId);

    const statsPipeline = [
      { $match: { corporateId: cId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          approvedLeads: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          rejectedLeads: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          pendingLeads: { $sum: { $cond: [{ $in: ["$status", ["New", "Pending"]] }, 1, 0] } },
          disbursedLeads: { $sum: { $cond: [{ $eq: ["$status", "Disbursed"] }, 1, 0] } },
          totalLoanAmount: { $sum: "$loanAmount" },
          disbursedAmount: { $sum: "$disbursedAmount" },
        },
      },
    ];

    const currentMonthPipeline = [
      {
        $match: {
          corporateId: cId,
          isDeleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          leads: { $sum: 1 },
          amount: { $sum: "$loanAmount" },
        },
      },
    ];

    const [allTimeStats, currentMonthStats] = await Promise.all([
      Lead.aggregate(statsPipeline),
      Lead.aggregate(currentMonthPipeline),
    ]);

    const defaultAllTime = {
      totalLeads: 0,
      approvedLeads: 0,
      rejectedLeads: 0,
      pendingLeads: 0,
      disbursedLeads: 0,
      totalLoanAmount: 0,
      disbursedAmount: 0,
    };

    const defaultMonth = {
      leads: 0,
      amount: 0,
    };

    return {
      allTime: allTimeStats[0] || defaultAllTime,
      currentMonth: currentMonthStats[0] || defaultMonth,
    };
  }
}
