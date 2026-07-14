import mongoose from "mongoose";
import { CaseRepository } from "@/lib/repositories/case.repository";
import { CommissionRepository } from "@/lib/repositories/commission.repository";
import Bank, { ICommissionRule } from "@/lib/models/Bank";
import ChannelPartner from "@/lib/models/ChannelPartner";
import Case from "@/lib/models/Case";
import Commission from "@/lib/models/Commission";
import ActivityLog from "@/lib/models/ActivityLog";

export class CommissionService {
  private caseRepo = new CaseRepository();
  private commissionRepo = new CommissionRepository();

  /**
   * Helper to format a Date object as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Find matching commission rule and calculate commission amount
   */
  calculateCommissionAmount(
    loanAmount: number,
    loanType: string,
    rules: ICommissionRule[],
    dateStr: string
  ): { rate: number; commissionType: "Fixed" | "Percentage"; amount: number } {
    // Filter by loan type
    const matches = rules.filter(
      (r) => r.loanType.toLowerCase() === loanType.toLowerCase()
    );

    // Filter by effective date range
    const dateMatch = matches.filter((r) => {
      const fromCheck = r.effectiveFrom <= dateStr;
      const toCheck = !r.effectiveTo || r.effectiveTo >= dateStr;
      return fromCheck && toCheck;
    });

    // Filter by amount range
    const finalRule = dateMatch.find((r) => {
      const min = r.minAmount ?? 0;
      const max = r.maxAmount ?? 999999999;
      return loanAmount >= min && loanAmount <= max;
    });

    if (!finalRule) {
      return { rate: 0, commissionType: "Percentage", amount: 0 };
    }

    const rate = finalRule.commissionValue;
    if (finalRule.commissionType === "Fixed") {
      return { rate, commissionType: "Fixed", amount: rate };
    } else {
      return {
        rate,
        commissionType: "Percentage",
        amount: Math.round(loanAmount * (rate / 100) * 100) / 100,
      };
    }
  }

  /**
   * Calculates and saves commissions for a case
   */
  async calculateCaseCommissions(caseId: string, performedBy: string = "System"): Promise<void> {
    const loanCase = await this.caseRepo.findById(caseId);
    if (!loanCase) throw new Error("Case not found");

    const dateStr = this.formatDate(loanCase.createdAt);
    const loanAmount = loanCase.loanAmount;
    const loanType = loanCase.loanType;

    // 1. Calculate Bank Commission
    const bank = await Bank.findById(loanCase.bankId);
    let bankExpected = 0;
    let bankRate = 0;
    let bankCommType: "Fixed" | "Percentage" = "Percentage";

    if (bank && bank.status === "Active") {
      const calc = this.calculateCommissionAmount(loanAmount, loanType, bank.commissionTable, dateStr);
      bankExpected = calc.amount;
      bankRate = calc.rate;
      bankCommType = calc.commissionType;
    }

    // 2. Calculate Channel Partner Commission
    let partnerExpected = 0;
    let partnerRate = 0;
    let partnerCommType: "Fixed" | "Percentage" = "Percentage";

    if (loanCase.channelPartnerId) {
      const partner = await ChannelPartner.findById(loanCase.channelPartnerId);
      if (partner && partner.status === "Active") {
        const calc = this.calculateCommissionAmount(loanAmount, loanType, partner.commissionTable, dateStr);
        partnerExpected = calc.amount;
        partnerRate = calc.rate;
        partnerCommType = calc.commissionType;
      }
    }

    // 3. Upsert Bank Commission document
    const bankComm = await this.commissionRepo.findOne({ caseId: loanCase._id, entityType: "Bank" });
    const bankPaid = bankComm ? bankComm.paidCommission : 0;
    const bankPending = Math.max(0, bankExpected - bankPaid);
    const bankStatus = bankPending === 0 ? "Paid" : bankPaid > 0 ? "Partially Paid" : "Unpaid";

    await this.commissionRepo.upsert(loanCase._id.toString(), "Bank", {
      caseId: loanCase._id,
      entityType: "Bank",
      entityId: loanCase.bankId,
      rate: bankRate,
      commissionType: bankCommType,
      expectedCommission: bankExpected,
      paidCommission: bankPaid,
      pendingCommission: bankPending,
      status: bankStatus,
      updatedBy: performedBy,
    });

    // 4. Upsert Channel Partner Commission document if CP exists
    let cpPaid = 0;
    let cpPending = 0;
    if (loanCase.channelPartnerId) {
      const cpComm = await this.commissionRepo.findOne({
        caseId: loanCase._id,
        entityType: "ChannelPartner",
      });
      cpPaid = cpComm ? cpComm.paidCommission : 0;
      cpPending = Math.max(0, partnerExpected - cpPaid);
      const cpStatus = cpPending === 0 ? "Paid" : cpPaid > 0 ? "Partially Paid" : "Unpaid";

      await this.commissionRepo.upsert(loanCase._id.toString(), "ChannelPartner", {
        caseId: loanCase._id,
        entityType: "ChannelPartner",
        entityId: loanCase.channelPartnerId,
        rate: partnerRate,
        commissionType: partnerCommType,
        expectedCommission: partnerExpected,
        paidCommission: cpPaid,
        pendingCommission: cpPending,
        status: cpStatus,
        updatedBy: performedBy,
      });
    }

    // 5. Sync back to Case document
    await Case.updateOne(
      { _id: loanCase._id },
      {
        $set: {
          bankExpectedCommission: bankExpected,
          bankPaidCommission: bankPaid,
          bankPendingCommission: bankPending,
          partnerExpectedCommission: partnerExpected,
          partnerPaidCommission: cpPaid,
          partnerPendingCommission: cpPending,
        },
      }
    );
  }

  /**
   * Recalculates all commissions for a Bank
   */
  async recalculateBankCommissions(bankId: string, performedBy: string): Promise<number> {
    const cases = await Case.find({ bankId, isDeleted: false });
    let count = 0;
    for (const c of cases) {
      await this.calculateCaseCommissions(c._id.toString(), performedBy);
      count++;
    }

    await ActivityLog.create({
      entityType: "Bank",
      entityId: new mongoose.Types.ObjectId(bankId),
      action: "Commissions Recalculated",
      details: `Recalculated commissions for ${count} cases due to rule updates.`,
      performedBy,
    });

    return count;
  }

  /**
   * Recalculates all commissions for a Channel Partner
   */
  async recalculatePartnerCommissions(partnerId: string, performedBy: string): Promise<number> {
    const cases = await Case.find({ channelPartnerId: partnerId, isDeleted: false });
    let count = 0;
    for (const c of cases) {
      await this.calculateCaseCommissions(c._id.toString(), performedBy);
      count++;
    }

    await ActivityLog.create({
      entityType: "ChannelPartner",
      entityId: new mongoose.Types.ObjectId(partnerId),
      action: "Commissions Recalculated",
      details: `Recalculated commissions for ${count} cases due to rule updates.`,
      performedBy,
    });

    return count;
  }

  /**
   * Records a commission payment transaction and updates balances
   */
  async recordPayment(params: {
    commissionId: string;
    amount: number;
    paymentDate: string;
    paymentMode: "NEFT" | "RTGS" | "IMPS" | "UPI" | "Cheque" | "Cash";
    referenceNumber: string;
    invoiceNumber?: string;
    remarks?: string;
    performedBy: string;
  }): Promise<void> {
    const commission = await Commission.findById(params.commissionId);
    if (!commission) throw new Error("Commission record not found");

    // Add new payment record
    await this.commissionRepo.createPayment({
      commissionId: commission._id,
      caseId: commission.caseId,
      amount: params.amount,
      paymentDate: params.paymentDate,
      paymentMode: params.paymentMode,
      referenceNumber: params.referenceNumber,
      invoiceNumber: params.invoiceNumber,
      remarks: params.remarks,
      createdBy: params.performedBy,
      updatedBy: params.performedBy,
    });

    // Recalculate totals on Commission
    const newPaid = commission.paidCommission + params.amount;
    const newPending = Math.max(0, commission.expectedCommission - newPaid);
    const newStatus = newPending === 0 ? "Paid" : newPaid > 0 ? "Partially Paid" : "Unpaid";

    commission.paidCommission = newPaid;
    commission.pendingCommission = newPending;
    commission.status = newStatus;
    commission.updatedBy = params.performedBy;
    await commission.save();

    // Sync to Case document
    const updateField =
      commission.entityType === "Bank"
        ? { bankPaidCommission: newPaid, bankPendingCommission: newPending }
        : { partnerPaidCommission: newPaid, partnerPendingCommission: newPending };

    await Case.updateOne({ _id: commission.caseId }, { $set: updateField });

    // Log Activity
    await ActivityLog.create({
      entityType: commission.entityType,
      entityId: commission.entityId,
      action: "Payment Received",
      details: `Recorded payment of ₹${params.amount.toLocaleString("en-IN")} via ${params.paymentMode}. UTR: ${params.referenceNumber}`,
      performedBy: params.performedBy,
    });
  }
}
