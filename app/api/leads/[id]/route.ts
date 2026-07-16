import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { formatLead } from "@/lib/utils";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { LeadValidationSchema } from "@/lib/validations/lead.validation";
import { LeadRepository } from "@/lib/repositories/lead.repository";
import { CommissionService } from "@/lib/services/commission.service";
import ActivityLog from "@/lib/models/ActivityLog";

const leadRepo = new LeadRepository();
const commissionService = new CommissionService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const lead = await leadRepo.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(formatLead(lead));
  } catch (error: any) {
    console.error(`Error loading lead details for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load lead details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const originalLead = await leadRepo.findById(id);
    if (!originalLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = LeadValidationSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Track fields that change and trigger recalculation if they do
    const needsRecalc =
      (data.loanAmount !== undefined && data.loanAmount !== originalLead.loanAmount) ||
      (data.loanType !== undefined && data.loanType !== originalLead.loanType) ||
      (data.bankId !== undefined && data.bankId !== originalLead.bankId?.toString()) ||
      (data.channelPartnerId !== undefined && data.channelPartnerId !== originalLead.channelPartnerId?.toString());

    // Update fields
    const updates: any = {
      ...data,
      updatedBy: user.name,
    };

    if (data.status && data.status !== originalLead.status) {
      if (data.status === "Disbursed") {
        updates.disbursedDate = new Date().toISOString().split("T")[0];
        if (updates.disbursedAmount === undefined || updates.disbursedAmount === 0) {
          updates.disbursedAmount = data.loanAmount ?? originalLead.loanAmount;
        }
      } else if (data.status === "Approved") {
        updates.approvedDate = new Date().toISOString().split("T")[0];
      }
    }

    const updatedLead = await leadRepo.update(id, updates);
    if (!updatedLead) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
    }

    // Trigger recalculation of commission if required
    if (needsRecalc) {
      await commissionService.calculateLeadCommissions(id, user.name);
    }

    // Populate and fetch
    const finalLead = await leadRepo.findById(id);

    await ActivityLog.create({
      entityType: "Lead",
      entityId: finalLead!._id,
      action: "Updated",
      details: `Lead updated. Status: ${finalLead!.status}. Recalculation: ${needsRecalc ? "Yes" : "No"}.`,
      performedBy: user.name,
    });

    return NextResponse.json(formatLead(finalLead));
  } catch (error: any) {
    console.error(`Error updating lead ${id}:`, error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const deleted = await leadRepo.softDelete(id, user.name);
    if (!deleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await ActivityLog.create({
      entityType: "Lead",
      entityId: deleted._id,
      action: "Deleted",
      details: `Lead with app number ${deleted.applicationNumber} was soft-deleted.`,
      performedBy: user.name,
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting lead ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
