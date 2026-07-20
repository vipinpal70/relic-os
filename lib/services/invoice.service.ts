import Lead, { ILead } from "@/lib/models/Lead";
import Bank from "@/lib/models/Bank";
import ChannelPartner from "@/lib/models/ChannelPartner";
import Commission, { ICommission } from "@/lib/models/Commission";
import ActivityLog from "@/lib/models/ActivityLog";
import Invoice, { IInvoice, IInvoiceEntitySnapshot, IInvoiceLineItem } from "@/lib/models/Invoice";
import { getNextSequence } from "@/lib/models/Counter";
import { CommissionService } from "@/lib/services/commission.service";
import { GenerateInvoiceInput, UpdateInvoiceStatusInput } from "@/lib/validations/invoice.validation";

const round2 = (n: number) => Math.round(n * 100) / 100;
const todayStr = () => new Date().toISOString().split("T")[0];

export class InvoiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type EntityType = "Bank" | "ChannelPartner";

export class InvoiceService {
  private commissionService = new CommissionService();

  private async findEntity(entityType: EntityType, entityId: string) {
    const Model = entityType === "Bank" ? Bank : ChannelPartner;
    const entity = await Model.findOne({ _id: entityId, isDeleted: false });
    if (!entity) {
      throw new InvoiceError(
        entityType === "Bank" ? "Bank not found" : "Channel partner not found",
        404
      );
    }
    return entity;
  }

  /**
   * Resolves the billing rate and commission for a lead line.
   * Priority: explicit override > stored Commission record > entity commissionTable.
   * The commission base is the disbursed amount (falling back to loan amount for
   * legacy leads where disbursedAmount was never set). Note this may differ from
   * the stored expectedCommission, which is computed on loanAmount at lead
   * creation — the invoice snapshot is the billing source of truth.
   */
  private resolveLine(
    lead: ILead,
    entity: any,
    commission?: ICommission,
    override?: { rate: number; commissionType: "Fixed" | "Percentage" }
  ): { base: number; rate: number; commissionType: "Fixed" | "Percentage"; amount: number } {
    const base = lead.disbursedAmount > 0 ? lead.disbursedAmount : lead.loanAmount;

    let rate: number;
    let commissionType: "Fixed" | "Percentage";

    if (override) {
      rate = override.rate;
      commissionType = override.commissionType;
    } else if (commission && commission.rate > 0) {
      rate = commission.rate;
      commissionType = commission.commissionType;
    } else {
      const calc = this.commissionService.calculateCommissionAmount(
        base,
        lead.loanType,
        entity.commissionTable || [],
        lead.disbursedDate || todayStr()
      );
      rate = calc.rate;
      commissionType = calc.commissionType;
    }

    const amount = commissionType === "Fixed" ? round2(rate) : round2((base * rate) / 100);
    return { base, rate, commissionType, amount };
  }

  /**
   * Disbursed leads for an entity within a date range that are not yet on an
   * invoice (for this entity type), enriched with a suggested rate/commission.
   */
  async getBillableLeads(params: {
    entityType: EntityType;
    entityId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; total: number }> {
    const { entityType, entityId, startDate, endDate } = params;
    const entity = await this.findEntity(entityType, entityId);

    const filter: any = {
      [entityType === "Bank" ? "bankId" : "channelPartnerId"]: entityId,
      status: "Disbursed",
      isDeleted: false,
    };
    // disbursedDate is a YYYY-MM-DD string, so string comparison is correct
    if (startDate || endDate) {
      filter.disbursedDate = {};
      if (startDate) filter.disbursedDate.$gte = startDate;
      if (endDate) filter.disbursedDate.$lte = endDate;
    }

    const leads = await Lead.find(filter).sort({ disbursedDate: -1 });
    const commissions = await Commission.find({
      caseId: { $in: leads.map((l) => l._id) },
      entityType,
      isDeleted: false,
    });
    const commByCase = new Map(commissions.map((c) => [c.caseId.toString(), c]));

    const data = leads
      .filter((lead) => !commByCase.get(lead._id.toString())?.invoiceId)
      .map((lead) => {
        const { base, rate, commissionType, amount } = this.resolveLine(
          lead,
          entity,
          commByCase.get(lead._id.toString())
        );
        return {
          ...lead.toObject(),
          billableAmount: base,
          suggestedRate: rate,
          suggestedCommissionType: commissionType,
          suggestedCommission: amount,
          needsRateOverride: rate <= 0,
        };
      });

    return { data, total: data.length };
  }

  async generateInvoice(input: GenerateInvoiceInput, performedBy: string): Promise<IInvoice> {
    const { entityType, entityId, taxRate, lineOverrides, periodStart, periodEnd, notes } = input;
    const entity = await this.findEntity(entityType, entityId);

    const leadIds = [...new Set(input.leadIds)];
    const leads = await Lead.find({ _id: { $in: leadIds }, isDeleted: false });
    if (leads.length !== leadIds.length) {
      throw new InvoiceError("Some selected applications could not be found", 400);
    }

    const entityField = entityType === "Bank" ? "bankId" : "channelPartnerId";
    const appNos = (list: ILead[]) => list.map((l) => l.applicationNumber).join(", ");

    const wrongEntity = leads.filter((l) => (l as any)[entityField]?.toString() !== entityId);
    if (wrongEntity.length > 0) {
      throw new InvoiceError(
        `These applications do not belong to the selected ${entityType === "Bank" ? "bank" : "channel partner"}: ${appNos(wrongEntity)}`,
        400
      );
    }

    const notDisbursed = leads.filter((l) => l.status !== "Disbursed");
    if (notDisbursed.length > 0) {
      throw new InvoiceError(`These applications are not disbursed: ${appNos(notDisbursed)}`, 400);
    }

    const commissions = await Commission.find({
      caseId: { $in: leadIds },
      entityType,
      isDeleted: false,
    });
    const commByCase = new Map(commissions.map((c) => [c.caseId.toString(), c]));

    // Re-check on the server so a double submit / concurrent generation fails
    // cleanly instead of billing the same application twice.
    const alreadyInvoiced = leads.filter((l) => commByCase.get(l._id.toString())?.invoiceId);
    if (alreadyInvoiced.length > 0) {
      throw new InvoiceError(
        `These applications are already on an invoice: ${appNos(alreadyInvoiced)}`,
        409
      );
    }

    const lineItems: IInvoiceLineItem[] = leads.map((lead) => {
      const override = lineOverrides?.[lead._id.toString()];
      const { base, rate, commissionType, amount } = this.resolveLine(
        lead,
        entity,
        commByCase.get(lead._id.toString()),
        override
      );
      if (rate <= 0 && !override) {
        throw new InvoiceError(
          `No commission rule matches application ${lead.applicationNumber}. Set a custom rate for it.`,
          422
        );
      }
      return {
        leadId: lead._id,
        applicationNumber: lead.applicationNumber,
        applicantName: lead.applicantName,
        loanType: lead.loanType,
        loanAmount: lead.loanAmount,
        disbursedAmount: base,
        rate,
        commissionType,
        commissionAmount: amount,
      };
    });

    const commissionSubtotal = round2(lineItems.reduce((sum, li) => sum + li.commissionAmount, 0));
    const taxAmount = round2((commissionSubtotal * taxRate) / 100);
    const grandTotal = round2(commissionSubtotal + taxAmount);

    const entitySnapshot: IInvoiceEntitySnapshot =
      entityType === "Bank"
        ? {
            name: entity.bankName,
            branch: entity.branch,
            ifsc: entity.ifsc,
            email: entity.email,
            address: entity.address,
            city: entity.city,
            state: entity.state,
          }
        : {
            name: entity.companyName || entity.name,
            email: entity.email,
            address: entity.address,
            city: entity.city,
            state: entity.state,
            gst: entity.gst,
            pan: entity.pan,
          };

    const doc = {
      entityType,
      entityId: entity._id,
      entitySnapshot,
      invoiceDate: todayStr(),
      periodStart,
      periodEnd,
      lineItems,
      totalApplications: lineItems.length,
      totalLoanAmount: round2(lineItems.reduce((sum, li) => sum + li.loanAmount, 0)),
      totalDisbursedAmount: round2(lineItems.reduce((sum, li) => sum + li.disbursedAmount, 0)),
      commissionSubtotal,
      taxRate,
      taxAmount,
      grandTotal,
      status: "Generated" as const,
      notes,
      createdBy: performedBy,
      updatedBy: performedBy,
    };

    const year = new Date().getFullYear();
    let invoice: IInvoice;
    try {
      invoice = await Invoice.create({ ...doc, invoiceNumber: await this.nextInvoiceNumber(year) });
    } catch (err: any) {
      // The atomic counter makes collisions near-impossible; the unique index
      // is a backstop — retry once with a fresh sequence number.
      if (err?.code === 11000) {
        invoice = await Invoice.create({ ...doc, invoiceNumber: await this.nextInvoiceNumber(year) });
      } else {
        throw err;
      }
    }

    // Mark commissions as invoiced. Upsert covers legacy leads that never got
    // a Commission record, so they can't be billed twice either. Ordering
    // matters: a crash before this point leaves leads billable, never locked.
    for (const li of lineItems) {
      await Commission.updateOne(
        { caseId: li.leadId, entityType },
        {
          $set: {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            updatedBy: performedBy,
          },
          $setOnInsert: {
            entityId: entity._id,
            rate: li.rate,
            commissionType: li.commissionType,
            expectedCommission: li.commissionAmount,
            paidCommission: 0,
            pendingCommission: li.commissionAmount,
            status: "Unpaid",
            createdBy: performedBy,
            isDeleted: false,
          },
        },
        { upsert: true }
      );
    }

    await ActivityLog.create({
      entityType,
      entityId: entity._id,
      action: "Invoice Generated",
      details: `Generated invoice ${invoice.invoiceNumber} for ${lineItems.length} application(s) — total ₹${grandTotal.toLocaleString("en-IN")} (incl. ${taxRate}% tax).`,
      performedBy,
    });

    return invoice;
  }

  private async nextInvoiceNumber(year: number): Promise<string> {
    const seq = await getNextSequence(`invoice-${year}`);
    return `RELIC/${year}/${String(seq).padStart(4, "0")}`;
  }

  async updateStatus(
    id: string,
    input: UpdateInvoiceStatusInput,
    performedBy: string
  ): Promise<IInvoice> {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) throw new InvoiceError("Invoice not found", 404);
    if (invoice.status === "Cancelled") {
      throw new InvoiceError("Cancelled invoices cannot be updated", 400);
    }

    const allowedTransitions: Record<string, string[]> = {
      Generated: ["Sent", "Paid"],
      Sent: ["Paid"],
      Paid: [],
    };
    if (!allowedTransitions[invoice.status]?.includes(input.status)) {
      throw new InvoiceError(`Cannot change status from ${invoice.status} to ${input.status}`, 400);
    }

    invoice.status = input.status;
    if (input.status === "Paid") invoice.paidDate = input.paidDate || todayStr();
    invoice.updatedBy = performedBy;
    await invoice.save();

    await ActivityLog.create({
      entityType: invoice.entityType,
      entityId: invoice.entityId,
      action: `Invoice ${input.status}`,
      details: `Invoice ${invoice.invoiceNumber} marked as ${input.status}.`,
      performedBy,
    });

    return invoice;
  }

  async cancelInvoice(id: string, performedBy: string): Promise<IInvoice> {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) throw new InvoiceError("Invoice not found", 404);
    if (invoice.status === "Cancelled") throw new InvoiceError("Invoice is already cancelled", 400);
    if (invoice.status === "Paid") throw new InvoiceError("Paid invoices cannot be cancelled", 400);

    invoice.status = "Cancelled";
    invoice.updatedBy = performedBy;
    await invoice.save();

    // Release the applications back into the billable pool.
    await Commission.updateMany(
      { invoiceId: invoice._id },
      { $unset: { invoiceId: "", invoiceNumber: "" }, $set: { updatedBy: performedBy } }
    );

    await ActivityLog.create({
      entityType: invoice.entityType,
      entityId: invoice.entityId,
      action: "Invoice Cancelled",
      details: `Cancelled invoice ${invoice.invoiceNumber}; ${invoice.totalApplications} application(s) returned to the billable pool.`,
      performedBy,
    });

    return invoice;
  }
}
