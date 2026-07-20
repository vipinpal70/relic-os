import Invoice, { IInvoice } from "@/lib/models/Invoice";

export class InvoiceRepository {
  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    return await Invoice.create(data);
  }

  async findById(id: string): Promise<IInvoice | null> {
    return await Invoice.findOne({ _id: id, isDeleted: false });
  }

  async update(id: string, data: any): Promise<IInvoice | null> {
    return await Invoice.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async findAll(params: {
    entityType?: string;
    entityId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IInvoice[]; total: number }> {
    const { entityType, entityId, status, page = 1, limit = 10 } = params;

    const filter: any = { isDeleted: false };
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);

    return { data, total };
  }
}
