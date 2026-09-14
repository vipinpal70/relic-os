import Lead, { ILead } from "@/lib/models/Lead";
// Side-effect imports: ensure referenced models are registered with mongoose
// before any populate() runs, regardless of the caller's import graph.
import "@/lib/models/Bank";
import "@/lib/models/ChannelPartner";
import "@/lib/models/Corporate";
import "@/lib/models/User";

export class LeadRepository {
  async create(data: Partial<ILead>): Promise<ILead> {
    return await Lead.create(data);
  }

  async findById(id: string): Promise<ILead | null> {
    return await Lead.findOne({ _id: id, isDeleted: false })
      .populate("bankId", "bankName branch")
      .populate("channelPartnerId", "name companyName")
      .populate("corporateId", "corporateName")
      .populate("assignedUserId", "name email");
  }

  async findOne(filter: any): Promise<ILead | null> {
    return await Lead.findOne({ ...filter, isDeleted: false })
      .populate("bankId", "bankName branch")
      .populate("channelPartnerId", "name companyName")
      .populate("corporateId", "corporateName")
      .populate("assignedUserId", "name email");
  }

  async update(id: string, data: any): Promise<ILead | null> {
    return await Lead.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string, updatedBy: string): Promise<ILead | null> {
    return await Lead.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, updatedBy },
      { new: true }
    );
  }

  async findAll(params: {
    search?: string;
    status?: string;
    bankId?: string;
    channelPartnerId?: string;
    corporateId?: string;
    loanType?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: ILead[]; total: number }> {
    const {
      search,
      status,
      bankId,
      channelPartnerId,
      corporateId,
      loanType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortField = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (bankId) filter.bankId = bankId;
    if (channelPartnerId) filter.channelPartnerId = channelPartnerId;
    if (corporateId) filter.corporateId = corporateId;
    if (loanType) filter.loanType = loanType;

    // Date range filter based on createdAt
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: "i" } },
        { applicantName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === "desc" ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Lead.find(filter)
        .populate("bankId", "bankName branch")
        .populate("channelPartnerId", "name companyName")
        .populate("corporateId", "corporateName")
        .populate("assignedUserId", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filter),
    ]);

    return { data, total };
  }

  async count(filter: any): Promise<number> {
    return await Lead.countDocuments({ ...filter, isDeleted: false });
  }

  async findByEntityId(entityType: "Bank" | "ChannelPartner", id: string): Promise<ILead[]> {
    const filter = entityType === "Bank" ? { bankId: id } : { channelPartnerId: id };
    return await Lead.find({ ...filter, isDeleted: false })
      .populate("bankId", "bankName branch")
      .populate("channelPartnerId", "name companyName")
      .populate("assignedUserId", "name email")
      .sort({ createdAt: -1 });
  }
}
