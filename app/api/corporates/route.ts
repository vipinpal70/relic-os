import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { CorporateValidationSchema } from "@/lib/validations/corporate.validation";
import { CorporateService } from "@/lib/services/corporate.service";
import { CorporateRepository } from "@/lib/repositories/corporate.repository";
import Corporate from "@/lib/models/Corporate";
import Lead from "@/lib/models/Lead";

const corporateService = new CorporateService();
const corporateRepo = new CorporateRepository();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
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

    // 1. Fetch corporates list
    const result = await corporateRepo.findAll({
      search,
      status,
      state,
      city,
      page,
      limit,
      sortField,
      sortOrder,
    });

    // 2. Fetch global corporate stats
    const totalCorporates = await Corporate.countDocuments({ isDeleted: false });
    const activeCorporates = await Corporate.countDocuments({ isDeleted: false, status: "Active" });

    // Current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLeadsStats = await Lead.aggregate([
      {
        $match: {
          isDeleted: false,
          corporateId: { $ne: null },
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

    // Enrich data with per-corporate lead stats
    const enrichedData = await Promise.all(
      result.data.map(async (corporate) => {
        const corporateStats = await Lead.aggregate([
          { $match: { corporateId: corporate._id, isDeleted: false } },
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              loanAmount: { $sum: "$loanAmount" },
              disbursedAmount: { $sum: "$disbursedAmount" },
            },
          },
        ]);

        const stats = corporateStats[0] || {
          totalLeads: 0,
          loanAmount: 0,
          disbursedAmount: 0,
        };

        return {
          ...corporate.toObject(),
          stats,
        };
      })
    );

    const stats = {
      total: totalCorporates,
      active: activeCorporates,
      monthLeads: monthLeadsStats[0]?.leadsCount || 0,
      monthLoanAmount: monthLeadsStats[0]?.loanAmount || 0,
    };

    return NextResponse.json({
      data: enrichedData,
      total: result.total,
      stats,
    });
  } catch (error: any) {
    console.error("Error listing corporates with stats:", error);
    return NextResponse.json({ error: "Failed to load corporates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = CorporateValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check duplicate
    const duplicate = await corporateRepo.findOne({ corporateName: data.corporateName });
    if (duplicate) {
      return NextResponse.json(
        { error: "A corporate with this name already exists" },
        { status: 409 }
      );
    }

    const corporate = await corporateService.createCorporate(data, user.name);
    return NextResponse.json(corporate, { status: 201 });
  } catch (error: any) {
    console.error("Error creating corporate:", error);
    return NextResponse.json({ error: "Failed to create corporate" }, { status: 500 });
  }
}
