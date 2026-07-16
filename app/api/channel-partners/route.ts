import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { ChannelPartnerValidationSchema } from "@/lib/validations/channel-partner.validation";
import { ChannelPartnerService } from "@/lib/services/channel-partner.service";
import { ChannelPartnerRepository } from "@/lib/repositories/channel-partner.repository";
import ChannelPartner from "@/lib/models/ChannelPartner";
import Lead from "@/lib/models/Lead";

const partnerService = new ChannelPartnerService();
const partnerRepo = new ChannelPartnerRepository();

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

    // 1. Fetch channel partners list
    const result = await partnerRepo.findAll({
      search,
      status,
      state,
      city,
      page,
      limit,
      sortField,
      sortOrder,
    });

    // 2. Fetch partner list stats
    const totalPartners = await ChannelPartner.countDocuments({ isDeleted: false });
    const activePartners = await ChannelPartner.countDocuments({ isDeleted: false, status: "Active" });
    const inactivePartners = await ChannelPartner.countDocuments({ isDeleted: false, status: "Inactive" });

    // Current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLeadsStats = await Lead.aggregate([
      {
        $match: {
          channelPartnerId: { $ne: null },
          isDeleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          leadsCount: { $sum: 1 },
          loanAmount: { $sum: "$loanAmount" },
          commissionEarned: { $sum: "$partnerExpectedCommission" },
        },
      },
    ]);

    const allTimeCommissions = await Lead.aggregate([
      {
        $match: {
          channelPartnerId: { $ne: null },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          paidCommission: { $sum: "$partnerPaidCommission" },
          pendingCommission: { $sum: "$partnerPendingCommission" },
        },
      },
    ]);

    // Calculate aggregated leads and amounts per partner to enrich the list
    const enrichedData = await Promise.all(
      result.data.map(async (partner) => {
        const partnerStats = await Lead.aggregate([
          { $match: { channelPartnerId: partner._id, isDeleted: false } },
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              loanAmount: { $sum: "$loanAmount" },
              commissionEarned: { $sum: "$partnerExpectedCommission" },
              commissionPaid: { $sum: "$partnerPaidCommission" },
              commissionPending: { $sum: "$partnerPendingCommission" },
            },
          },
        ]);

        const stats = partnerStats[0] || {
          totalLeads: 0,
          loanAmount: 0,
          commissionEarned: 0,
          commissionPaid: 0,
          commissionPending: 0,
        };

        return {
          ...partner.toObject(),
          stats,
        };
      })
    );

    const stats = {
      total: totalPartners,
      active: activePartners,
      inactive: inactivePartners,
      monthLeads: monthLeadsStats[0]?.leadsCount || 0,
      monthLoanAmount: monthLeadsStats[0]?.loanAmount || 0,
      monthCommission: monthLeadsStats[0]?.commissionEarned || 0,
      paidCommission: allTimeCommissions[0]?.paidCommission || 0,
      pendingCommission: allTimeCommissions[0]?.pendingCommission || 0,
    };

    return NextResponse.json({
      data: enrichedData,
      total: result.total,
      stats,
    });
  } catch (error: any) {
    console.error("Error listing channel partners with stats:", error);
    return NextResponse.json({ error: "Failed to load channel partners" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = ChannelPartnerValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check duplicate email
    const duplicateEmail = await partnerRepo.findOne({ email: data.email });
    if (duplicateEmail) {
      return NextResponse.json({ error: "A channel partner with this email already exists" }, { status: 409 });
    }

    // Check duplicate phone
    const duplicatePhone = await partnerRepo.findOne({ phone: data.phone });
    if (duplicatePhone) {
      return NextResponse.json({ error: "A channel partner with this phone number already exists" }, { status: 409 });
    }

    const partner = await partnerService.createPartner(data, user.name);
    return NextResponse.json(partner, { status: 201 });
  } catch (error: any) {
    console.error("Error creating channel partner:", error);
    return NextResponse.json({ error: "Failed to create channel partner" }, { status: 500 });
  }
}
