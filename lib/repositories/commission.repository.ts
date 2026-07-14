import Commission, { ICommission } from "@/lib/models/Commission";
import CommissionPayment, { ICommissionPayment } from "@/lib/models/CommissionPayment";

export class CommissionRepository {
  async create(data: Partial<ICommission>): Promise<ICommission> {
    return await Commission.create(data);
  }

  async findById(id: string): Promise<ICommission | null> {
    return await Commission.findOne({ _id: id, isDeleted: false })
      .populate("caseId")
      .populate("entityId");
  }

  async findOne(filter: any): Promise<ICommission | null> {
    return await Commission.findOne({ ...filter, isDeleted: false });
  }

  async update(id: string, data: any): Promise<ICommission | null> {
    return await Commission.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async upsert(caseId: string, entityType: "Bank" | "ChannelPartner", data: Partial<ICommission>): Promise<ICommission> {
    return await Commission.findOneAndUpdate(
      { caseId, entityType, isDeleted: false },
      { $set: data },
      { new: true, upsert: true }
    );
  }

  async findAll(params: {
    entityType?: "Bank" | "ChannelPartner";
    entityId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ICommission[]; total: number }> {
    const { entityType, entityId, status, page = 1, limit = 10 } = params;
    const filter: any = { isDeleted: false };

    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Commission.find(filter)
        .populate("caseId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Commission.countDocuments(filter),
    ]);

    return { data, total };
  }

  // Payments Repository Methods
  async createPayment(data: Partial<ICommissionPayment>): Promise<ICommissionPayment> {
    return await CommissionPayment.create(data);
  }

  async findPayments(query: any): Promise<ICommissionPayment[]> {
    return await CommissionPayment.find({ ...query, isDeleted: false }).sort({ paymentDate: -1 });
  }
}
