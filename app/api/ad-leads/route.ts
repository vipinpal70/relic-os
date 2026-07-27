import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { formatLead } from "@/lib/utils";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import AdLead from "@/lib/models/AdLead";
import ActivityLog from "@/lib/models/ActivityLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const bankId = searchParams.get("bankId") || undefined;
    const loanType = searchParams.get("loanType") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const filter: any = { isDeleted: false };
    if (status && status !== "All") filter.status = status;
    if (bankId && bankId !== "All") filter.bankId = bankId;
    if (loanType && loanType !== "All") filter.loanType = loanType;

    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: "i" } },
        { applicantName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      AdLead.find(filter)
        .populate("bankId", "bankName branch")
        .populate("channelPartnerId", "name companyName")
        .populate("assignedUserId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdLead.countDocuments(filter),
    ]);

    const formattedData = data.map(formatLead);

    return NextResponse.json({
      data: formattedData,
      total,
    });
  } catch (error: any) {
    console.error("Error listing ad-leads:", error);
    return NextResponse.json({ error: "Failed to load ad leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { applicantName, email, phone, loanAmount, loanType, applicationNumber } = body;

    if (!applicantName || !phone || !loanAmount) {
      return NextResponse.json({ error: "Applicant name, phone, and loan amount are required" }, { status: 400 });
    }

    const appNo = applicationNumber || `APP-AD-${Date.now().toString().slice(-6)}`;

    const newAdLead = await AdLead.create({
      applicationNumber: appNo,
      applicantName,
      email: email || "no-email@relicos.com",
      phone,
      loanAmount: parseFloat(loanAmount),
      loanType: loanType || "Home Loan",
      status: "New",
      createdBy: user.name,
      updatedBy: user.name,
    });

    await ActivityLog.create({
      entityType: "AdLead",
      entityId: newAdLead._id,
      action: "Created",
      details: `Ad Lead for "${applicantName}" created under app number ${appNo}.`,
      performedBy: user.name,
    });

    return NextResponse.json(formatLead(newAdLead), { status: 201 });
  } catch (error: any) {
    console.error("Error creating ad lead:", error);
    return NextResponse.json({ error: error.message || "Failed to create ad lead" }, { status: 500 });
  }
}
