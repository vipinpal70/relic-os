import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { formatLead } from "@/lib/utils";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import { LeadValidationSchema } from "@/lib/validations/lead.validation";
import { LeadRepository } from "@/lib/repositories/lead.repository";
import { CommissionService } from "@/lib/services/commission.service";
import Lead from "@/lib/models/Lead";
import ActivityLog from "@/lib/models/ActivityLog";

const leadRepo = new LeadRepository();
const commissionService = new CommissionService();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    // Channel Partner users only ever see their own leads, regardless of query params
    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const bankId = searchParams.get("bankId") || undefined;
    const channelPartnerId = scope || searchParams.get("channelPartnerId") || undefined;
    const loanType = searchParams.get("loanType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = await leadRepo.findAll({
      search,
      status,
      bankId,
      channelPartnerId,
      loanType,
      startDate,
      endDate,
      page,
      limit,
      sortField,
      sortOrder,
    });

    const formattedData = result.data.map(formatLead);
    return NextResponse.json({
      data: formattedData,
      total: result.total,
    });
  } catch (error: any) {
    console.error("Error listing leads:", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = LeadValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Ensure applicationNumber is set (auto-generate unique number if not provided)
    let appNumber = data.applicationNumber;
    if (!appNumber) {
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        appNumber = `APP-${new Date().getFullYear()}-${rand}`;
        const duplicate = await Lead.findOne({ applicationNumber: appNumber });
        if (!duplicate) isUnique = true;
      }
    } else {
      const exists = await Lead.findOne({ applicationNumber: appNumber });
      if (exists) {
        return NextResponse.json(
          { error: "A lead with this application number already exists" },
          { status: 409 }
        );
      }
    }

    // Set approved/disbursed dates automatically based on initial status if applicable
    const leadData: any = {
      ...data,
      applicationNumber: appNumber,
      createdBy: user.name,
      updatedBy: user.name,
    };

    if (data.status === "Disbursed") {
      leadData.disbursedDate = new Date().toISOString().split("T")[0];
      if (data.disbursedAmount === 0) {
        leadData.disbursedAmount = data.loanAmount;
      }
    } else if (data.status === "Approved" || data.status === "Sanctioned") {
      leadData.approvedDate = new Date().toISOString().split("T")[0];
    }

    const newLead = await leadRepo.create(leadData);

    // Automatically calculate commission for this new lead!
    await commissionService.calculateLeadCommissions(newLead._id.toString(), user.name);

    // Fetch populated lead
    const populatedLead = await leadRepo.findById(newLead._id.toString());

    await ActivityLog.create({
      entityType: "Lead",
      entityId: newLead._id,
      action: "Created",
      details: `Lead for "${newLead.applicantName}" (Amount: ₹${newLead.loanAmount.toLocaleString("en-IN")}) created under app number ${newLead.applicationNumber}.`,
      performedBy: user.name,
    });

    return NextResponse.json(formatLead(populatedLead), { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
