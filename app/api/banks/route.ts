import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { BankValidationSchema } from "@/lib/validations/bank.validation";
import { BankService } from "@/lib/services/bank.service";
import { BankRepository } from "@/lib/repositories/bank.repository";
import Bank from "@/lib/models/Bank";
import Lead from "@/lib/models/Lead";

const bankService = new BankService();
const bankRepo = new BankRepository();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const state = searchParams.get("state") || undefined;
    const city = searchParams.get("city") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // 1. Fetch banks list
    const result = await bankRepo.findAll({
      search,
      status,
      state,
      city,
      page,
      limit,
      sortField,
      sortOrder,
    });

    // 2. Fetch global bank stats
    const totalBanks = await Bank.countDocuments({ isDeleted: false });
    const activeBanks = await Bank.countDocuments({ isDeleted: false, status: "Active" });

    // Current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLeadsStats = await Lead.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          leadsCount: { $sum: 1 },
          loanAmount: { $sum: "$loanAmount" },
        },
      },
    ]);

    const allTimeCommissions = await Lead.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          paidCommission: { $sum: "$bankPaidCommission" },
          pendingCommission: { $sum: "$bankPendingCommission" },
        },
      },
    ]);

    // Enrich data
    const enrichedData = await Promise.all(
      result.data.map(async (bank) => {
        const bankStats = await Lead.aggregate([
          { $match: { bankId: bank._id, isDeleted: false } },
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              loanAmount: { $sum: "$loanAmount" },
              commissionExpected: { $sum: "$bankExpectedCommission" },
              commissionPaid: { $sum: "$bankPaidCommission" },
              commissionPending: { $sum: "$bankPendingCommission" },
            },
          },
        ]);

        const stats = bankStats[0] || {
          totalLeads: 0,
          loanAmount: 0,
          commissionExpected: 0,
          commissionPaid: 0,
          commissionPending: 0,
        };

        return {
          ...bank.toObject(),
          stats,
        };
      })
    );

    const stats = {
      total: totalBanks,
      active: activeBanks,
      monthLeads: monthLeadsStats[0]?.leadsCount || 0,
      monthLoanAmount: monthLeadsStats[0]?.loanAmount || 0,
      paidCommission: allTimeCommissions[0]?.paidCommission || 0,
      pendingCommission: allTimeCommissions[0]?.pendingCommission || 0,
    };

    return NextResponse.json({
      data: enrichedData,
      total: result.total,
      stats,
    });
  } catch (error: any) {
    console.error("Error listing banks with stats:", error);
    return NextResponse.json({ error: "Failed to load banks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = BankValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check duplicate
    const duplicate = await bankRepo.findOne({ bankName: data.bankName, branch: data.branch });
    if (duplicate) {
      return NextResponse.json(
        { error: "A bank with this name at the specified branch already exists" },
        { status: 409 }
      );
    }

    const bank = await bankService.createBank(data, user.name);
    return NextResponse.json(bank, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bank:", error);
    return NextResponse.json({ error: "Failed to create bank" }, { status: 500 });
  }
}
