import mongoose from "mongoose";
import { BankRepository } from "@/lib/repositories/bank.repository";
import { CommissionService } from "./commission.service";
import { IBank } from "@/lib/models/Bank";
import Case from "@/lib/models/Case";
import ActivityLog from "@/lib/models/ActivityLog";

export class BankService {
  private bankRepo = new BankRepository();
  private commissionService = new CommissionService();

  async createBank(data: Partial<IBank>, performedBy: string): Promise<IBank> {
    const bank = await this.bankRepo.create({
      ...data,
      createdBy: performedBy,
      updatedBy: performedBy,
    });

    await ActivityLog.create({
      entityType: "Bank",
      entityId: bank._id as mongoose.Types.ObjectId,
      action: "Created",
      details: `Bank "${bank.bankName}" created at branch "${bank.branch}".`,
      performedBy,
    });

    return bank;
  }

  async updateBank(id: string, data: Partial<IBank>, performedBy: string): Promise<IBank | null> {
    const original = await this.bankRepo.findById(id);
    if (!original) throw new Error("Bank not found");

    // Check if the commission table is being updated
    const isCommissionTableUpdated =
      data.commissionTable &&
      JSON.stringify(data.commissionTable) !== JSON.stringify(original.commissionTable);

    const updated = await this.bankRepo.update(id, {
      ...data,
      updatedBy: performedBy,
    });

    if (!updated) return null;

    // Log Activity
    await ActivityLog.create({
      entityType: "Bank",
      entityId: updated._id as mongoose.Types.ObjectId,
      action: "Updated",
      details: `Bank "${updated.bankName}" information updated.`,
      performedBy,
    });

    // If commission table updated, trigger recalculations
    if (isCommissionTableUpdated) {
      await this.commissionService.recalculateBankCommissions(id, performedBy);
    }

    return updated;
  }

  async deleteBank(id: string, performedBy: string): Promise<IBank | null> {
    const bank = await this.bankRepo.softDelete(id, performedBy);
    if (!bank) return null;

    await ActivityLog.create({
      entityType: "Bank",
      entityId: bank._id as mongoose.Types.ObjectId,
      action: "Deleted",
      details: `Bank "${bank.bankName}" was soft-deleted.`,
      performedBy,
    });

    return bank;
  }

  async getBankById(id: string) {
    return await this.bankRepo.findById(id);
  }

  async getBankDashboardStats(bankId: string) {
    // Current month start/end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const bId = new mongoose.Types.ObjectId(bankId);

    // Get case metrics for Bank (total cases, approved, rejected, pending, disbursed, amounts, commissions)
    const statsPipeline = [
      { $match: { bankId: bId, isDeleted: false } },
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
          commissionExpected: { $sum: "$bankExpectedCommission" },
          commissionPaid: { $sum: "$bankPaidCommission" },
          commissionPending: { $sum: "$bankPendingCommission" },
        },
      },
    ];

    const currentMonthPipeline = [
      {
        $match: {
          bankId: bId,
          isDeleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          cases: { $sum: 1 },
          amount: { $sum: "$loanAmount" },
          commissionExpected: { $sum: "$bankExpectedCommission" },
          commissionPaid: { $sum: "$bankPaidCommission" },
          commissionPending: { $sum: "$bankPendingCommission" },
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
