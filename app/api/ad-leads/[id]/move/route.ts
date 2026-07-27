import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { formatLead } from "@/lib/utils";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { CommissionService } from "@/lib/services/commission.service";
import AdLead from "@/lib/models/AdLead";
import Lead from "@/lib/models/Lead";
import ActivityLog from "@/lib/models/ActivityLog";

const commissionService = new CommissionService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const adLead = await AdLead.findById(id);
    if (!adLead || adLead.isDeleted) {
      return NextResponse.json({ error: "Ad Lead not found" }, { status: 404 });
    }

    // Ensure applicationNumber is unique for Lead collection
    let targetAppNo = adLead.applicationNumber;
    const existingLead = await Lead.findOne({ applicationNumber: targetAppNo });
    if (existingLead) {
      targetAppNo = `${adLead.applicationNumber}-M${Date.now().toString().slice(-4)}`;
    }

    // Create main Lead document
    const newLead = await Lead.create({
      applicationNumber: targetAppNo,
      applicantName: adLead.applicantName,
      email: adLead.email,
      phone: adLead.phone,
      loanAmount: adLead.loanAmount,
      loanType: adLead.loanType,
      bankId: adLead.bankId,
      channelPartnerId: adLead.channelPartnerId,
      assignedUserId: adLead.assignedUserId,
      status: adLead.status || "New",
      disbursedAmount: adLead.disbursedAmount || 0,
      approvedDate: adLead.approvedDate,
      disbursedDate: adLead.disbursedDate,
      remarks: adLead.remarks || `Moved from Ad Leads by ${user.name}`,
      createdBy: user.name,
      updatedBy: user.name,
      isDeleted: false,
    });

    // Calculate commission summary if bank/partner available
    try {
      await commissionService.calculateLeadCommissions(newLead._id.toString(), user.name);
    } catch (commErr) {
      console.warn("Commission calculation warning on move:", commErr);
    }

    // Delete from AdLead collection
    await AdLead.findByIdAndDelete(id);

    // Create Activity Logs
    await ActivityLog.create({
      entityType: "Lead",
      entityId: newLead._id,
      action: "Moved from Ad Leads",
      details: `Lead for "${newLead.applicantName}" moved from Ad Leads to main database under app number ${newLead.applicationNumber}.`,
      performedBy: user.name,
    });

    const populatedLead = await Lead.findById(newLead._id.toString())
      .populate("bankId", "bankName branch")
      .populate("channelPartnerId", "name companyName")
      .populate("assignedUserId", "name email");

    return NextResponse.json({
      success: true,
      message: "Lead successfully moved to Leads database",
      lead: formatLead(populatedLead || newLead),
    });
  } catch (error: any) {
    console.error("Error moving ad lead to leads database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to move ad lead to main leads database" },
      { status: 500 }
    );
  }
}
