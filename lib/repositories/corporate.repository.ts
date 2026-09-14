import Corporate, { ICorporate } from "@/lib/models/Corporate";

export class CorporateRepository {
  async create(data: Partial<ICorporate>): Promise<ICorporate> {
    return await Corporate.create(data);
  }

  async findById(id: string): Promise<ICorporate | null> {
    return await Corporate.findOne({ _id: id, isDeleted: false });
  }

  async findOne(filter: any): Promise<ICorporate | null> {
    return await Corporate.findOne({ ...filter, isDeleted: false });
  }

  async update(id: string, data: any): Promise<ICorporate | null> {
    return await Corporate.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string, updatedBy: string): Promise<ICorporate | null> {
    return await Corporate.findOneAndUpdate(
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
  }): Promise<{ data: ICorporate[]; total: number }> {
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
        { corporateName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { gst: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === "desc" ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Corporate.find(filter).sort(sort).skip(skip).limit(limit),
      Corporate.countDocuments(filter),
    ]);

    return { data, total };
  }

  async count(filter: any): Promise<number> {
    return await Corporate.countDocuments({ ...filter, isDeleted: false });
  }
}
