import ChannelPartner, { IChannelPartner } from "@/lib/models/ChannelPartner";

export class ChannelPartnerRepository {
  async create(data: Partial<IChannelPartner>): Promise<IChannelPartner> {
    return await ChannelPartner.create(data);
  }

  async findById(id: string): Promise<IChannelPartner | null> {
    return await ChannelPartner.findOne({ _id: id, isDeleted: false });
  }

  async findOne(filter: any): Promise<IChannelPartner | null> {
    return await ChannelPartner.findOne({ ...filter, isDeleted: false });
  }

  async update(id: string, data: any): Promise<IChannelPartner | null> {
    return await ChannelPartner.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string, updatedBy: string): Promise<IChannelPartner | null> {
    return await ChannelPartner.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, status: "Inactive", updatedBy },
      { new: true }
    );
  }

  async findAll(params: {
    search?: string;
    status?: string;
    state?: string;
    city?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: IChannelPartner[]; total: number }> {
    const {
      search,
      status,
      state,
      city,
      page = 1,
      limit = 10,
      sortField = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (state) filter.state = state;
    if (city) filter.city = city;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === "desc" ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ChannelPartner.find(filter).sort(sort).skip(skip).limit(limit),
      ChannelPartner.countDocuments(filter),
    ]);

    return { data, total };
  }

  async count(filter: any): Promise<number> {
    return await ChannelPartner.countDocuments({ ...filter, isDeleted: false });
  }
}
