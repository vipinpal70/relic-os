import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { CaseValidationSchema } from "@/lib/validations/case.validation";
import { CaseRepository } from "@/lib/repositories/case.repository";
import { CommissionService } from "@/lib/services/commission.service";
import Case from "@/lib/models/Case";
import ActivityLog from "@/lib/models/ActivityLog";

const caseRepo = new CaseRepository();
const commissionService = new CommissionService();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const bankId = searchParams.get("bankId") || undefined;
    const channelPartnerId = searchParams.get("channelPartnerId") || undefined;
    const loanType = searchParams.get("loanType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = await caseRepo.findAll({
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing cases:", error);
    return NextResponse.json({ error: "Failed to load cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = CaseValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check duplicate application number
    const exists = await Case.findOne({ applicationNumber: data.applicationNumber });
    if (exists) {
      return NextResponse.json(
        { error: "A case with this application number already exists" },
        { status: 409 }
      );
    }

    // Set approved/disbursed dates automatically based on initial status if applicable
    const caseData: any = {
      ...data,
      createdBy: user.name,
      updatedBy: user.name,
    };

    if (data.status === "Disbursed") {
      caseData.disbursedDate = new Date().toISOString().split("T")[0];
      if (data.disbursedAmount === 0) {
        caseData.disbursedAmount = data.loanAmount;
      }
    } else if (data.status === "Approved") {
      caseData.approvedDate = new Date().toISOString().split("T")[0];
    }

    const newCase = await caseRepo.create(caseData);

    // Automatically calculate commission for this new case!
    await commissionService.calculateCaseCommissions(newCase._id.toString(), user.name);

    // Fetch populated case
    const populatedCase = await caseRepo.findById(newCase._id.toString());

    await ActivityLog.create({
      entityType: "Case",
      entityId: newCase._id,
      action: "Created",
      details: `Case for "${newCase.applicantName}" (Amount: ₹${newCase.loanAmount.toLocaleString("en-IN")}) created under app number ${newCase.applicationNumber}.`,
      performedBy: user.name,
    });

    return NextResponse.json(populatedCase, { status: 201 });
  } catch (error: any) {
    console.error("Error creating case:", error);
    return NextResponse.json({ error: error.message || "Failed to create case" }, { status: 500 });
  }
}
