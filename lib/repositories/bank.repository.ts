import Bank, { IBank } from "@/lib/models/Bank";

export class BankRepository {
  async create(data: Partial<IBank>): Promise<IBank> {
    return await Bank.create(data);
  }

  async findById(id: string): Promise<IBank | null> {
    return await Bank.findOne({ _id: id, isDeleted: false });
  }

  async findOne(filter: any): Promise<IBank | null> {
    return await Bank.findOne({ ...filter, isDeleted: false });
  }

  async update(id: string, data: any): Promise<IBank | null> {
    return await Bank.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string, updatedBy: string): Promise<IBank | null> {
    return await Bank.findOneAndUpdate(
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
  }): Promise<{ data: IBank[]; total: number }> {
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
        { bankName: { $regex: search, $options: "i" } },
        { branch: { $regex: search, $options: "i" } },
        { ifsc: { $regex: search, $options: "i" } },
        { managerName: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === "desc" ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Bank.find(filter).sort(sort).skip(skip).limit(limit),
      Bank.countDocuments(filter),
    ]);

    return { data, total };
  }

  async count(filter: any): Promise<number> {
    return await Bank.countDocuments({ ...filter, isDeleted: false });
  }
}
