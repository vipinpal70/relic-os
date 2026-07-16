import mongoose from "mongoose";
import Lead from "@/lib/models/Lead";

export class AnalyticsService {
  /**
   * Helper to build initial match criteria based on filters
   */
  private buildMatchCriteria(params: {
    bankId?: string;
    channelPartnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const match: any = { isDeleted: false };

    if (params.bankId) {
      match.bankId = new mongoose.Types.ObjectId(params.bankId);
    }
    if (params.channelPartnerId) {
      match.channelPartnerId = new mongoose.Types.ObjectId(params.channelPartnerId);
    }

    if (params.startDate || params.endDate) {
      match.createdAt = {};
      if (params.startDate) {
        match.createdAt.$gte = new Date(`${params.startDate}T00:00:00.000Z`);
      }
      if (params.endDate) {
        match.createdAt.$lte = new Date(`${params.endDate}T23:59:59.999Z`);
      }
    }

    return match;
  }

  /**
   * 1. Monthly Trends (Loan Volume, Leads Count, Commission Earned)
   */
  async getMonthlyTrends(params: {
    bankId?: string;
    channelPartnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const match = this.buildMatchCriteria(params);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          loanVolume: { $sum: "$loanAmount" },
          leadCount: { $sum: 1 },
          bankCommission: { $sum: "$bankExpectedCommission" },
          partnerCommission: { $sum: "$partnerExpectedCommission" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          // Format as "YYYY-MM" for charting convenience
          label: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" },
                },
              },
            ],
          },
          loanVolume: 1,
          leadCount: 1,
          bankCommission: 1,
          partnerCommission: 1,
        },
      },
      { $sort: { label: 1 } },
    ];

    return await Lead.aggregate(pipeline as any);
  }

  /**
   * 2. Loan Type Breakdown
   */
  async getLoanTypeBreakdown(params: {
    bankId?: string;
    channelPartnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const match = this.buildMatchCriteria(params);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$loanType",
          value: { $sum: "$loanAmount" },
          count: { $sum: 1 },
          commission: {
            $sum: params.bankId ? "$bankExpectedCommission" : "$partnerExpectedCommission",
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
          count: 1,
          commission: 1,
        },
      },
      { $sort: { value: -1 } },
    ];

    return await Lead.aggregate(pipeline as any);
  }

  /**
   * 3. Status Wise distribution
   */
  async getStatusBreakdown(params: {
    bankId?: string;
    channelPartnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const match = this.buildMatchCriteria(params);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$loanAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          amount: 1,
        },
      },
      { $sort: { count: -1 } },
    ];

    return await Lead.aggregate(pipeline as any);
  }

  /**
   * 4. Top Performing Partners (by volume)
   */
  async getTopPartners(limit: number = 5) {
    const pipeline = [
      { $match: { channelPartnerId: { $ne: null }, isDeleted: false } },
      {
        $group: {
          _id: "$channelPartnerId",
          totalVolume: { $sum: "$loanAmount" },
          leadCount: { $sum: 1 },
          commissionEarned: { $sum: "$partnerExpectedCommission" },
        },
      },
      {
        $lookup: {
          from: "channelpartners", // MongoDB collection name
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: "$partner" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$partner.name",
          companyName: "$partner.companyName",
          totalVolume: 1,
          leadCount: 1,
          commissionEarned: 1,
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: limit },
    ];

    return await Lead.aggregate(pipeline as any);
  }

  /**
   * 5. Top Performing Banks
   */
  async getTopBanks(limit: number = 5) {
    const pipeline = [
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$bankId",
          totalVolume: { $sum: "$loanAmount" },
          leadCount: { $sum: 1 },
          commissionEarned: { $sum: "$bankExpectedCommission" },
        },
      },
      {
        $lookup: {
          from: "banks",
          localField: "_id",
          foreignField: "_id",
          as: "bank",
        },
      },
      { $unwind: "$bank" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          bankName: "$bank.bankName",
          branch: "$bank.branch",
          totalVolume: 1,
          leadCount: 1,
          commissionEarned: 1,
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: limit },
    ];

    return await Lead.aggregate(pipeline as any);
  }

  /**
   * 6. State Wise distribution
   */
  async getStateBreakdown(params: { bankId?: string; channelPartnerId?: string }) {
    const match = this.buildMatchCriteria(params);
    const lookupCollection = params.bankId ? "banks" : "channelpartners";
    const localField = params.bankId ? "bankId" : "channelPartnerId";

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: lookupCollection,
          localField: localField,
          foreignField: "_id",
          as: "entity",
        },
      },
      { $unwind: "$entity" },
      {
        $group: {
          _id: "$entity.state",
          totalVolume: { $sum: "$loanAmount" },
          leadCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          state: { $ifNull: ["$_id", "Unknown"] },
          totalVolume: 1,
          leadCount: 1,
        },
      },
      { $sort: { totalVolume: -1 } },
    ];

    return await Lead.aggregate(pipeline as any);
  }
}
