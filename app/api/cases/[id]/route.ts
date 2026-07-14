import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { CaseValidationSchema } from "@/lib/validations/case.validation";
import { CaseRepository } from "@/lib/repositories/case.repository";
import { CommissionService } from "@/lib/services/commission.service";
import ActivityLog from "@/lib/models/ActivityLog";

const caseRepo = new CaseRepository();
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

    const loanCase = await caseRepo.findById(id);
    if (!loanCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(loanCase);
  } catch (error: any) {
    console.error(`Error loading case details for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load case details" }, { status: 500 });
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

    const originalCase = await caseRepo.findById(id);
    if (!originalCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = CaseValidationSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Track fields that change and trigger recalculation if they do
    const needsRecalc =
      (data.loanAmount !== undefined && data.loanAmount !== originalCase.loanAmount) ||
      (data.loanType !== undefined && data.loanType !== originalCase.loanType) ||
      (data.bankId !== undefined && data.bankId !== originalCase.bankId?.toString()) ||
      (data.channelPartnerId !== undefined && data.channelPartnerId !== originalCase.channelPartnerId?.toString());

    // Update fields
    const updates: any = {
      ...data,
      updatedBy: user.name,
    };

    if (data.status && data.status !== originalCase.status) {
      if (data.status === "Disbursed") {
        updates.disbursedDate = new Date().toISOString().split("T")[0];
        if (updates.disbursedAmount === undefined || updates.disbursedAmount === 0) {
          updates.disbursedAmount = data.loanAmount ?? originalCase.loanAmount;
        }
      } else if (data.status === "Approved") {
        updates.approvedDate = new Date().toISOString().split("T")[0];
      }
    }

    const updatedCase = await caseRepo.update(id, updates);
    if (!updatedCase) {
      return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
    }

    // Trigger recalculation of commission if required
    if (needsRecalc) {
      await commissionService.calculateCaseCommissions(id, user.name);
    }

    // Populate and fetch
    const finalCase = await caseRepo.findById(id);

    await ActivityLog.create({
      entityType: "Case",
      entityId: finalCase!._id,
      action: "Updated",
      details: `Case updated. Status: ${finalCase!.status}. Recalculation: ${needsRecalc ? "Yes" : "No"}.`,
      performedBy: user.name,
    });

    return NextResponse.json(finalCase);
  } catch (error: any) {
    console.error(`Error updating case ${id}:`, error);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
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

    const deleted = await caseRepo.softDelete(id, user.name);
    if (!deleted) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await ActivityLog.create({
      entityType: "Case",
      entityId: deleted._id,
      action: "Deleted",
      details: `Case with app number ${deleted.applicationNumber} was soft-deleted.`,
      performedBy: user.name,
    });

    return NextResponse.json({ success: true, message: "Case deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting case ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }
}
