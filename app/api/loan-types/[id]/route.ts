import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import LoanType from "@/lib/models/LoanType";
import ActivityLog from "@/lib/models/ActivityLog";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { name, status } = body;

    const loanType = await LoanType.findOne({ _id: id, isDeleted: false });
    if (!loanType) {
      return NextResponse.json({ error: "Loan type not found" }, { status: 404 });
    }

    const updates: any = { updatedBy: user.name };
    const logDetails: string[] = [];

    if (name !== undefined && name.trim() !== loanType.name) {
      const cleanName = name.trim();
      const exists = await LoanType.findOne({
        name: { $regex: new RegExp(`^${cleanName}$`, "i") },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        return NextResponse.json({ error: "Another loan type with this name already exists" }, { status: 409 });
      }

      updates.name = cleanName;
      logDetails.push(`renamed from "${loanType.name}" to "${cleanName}"`);
    }

    if (status !== undefined && status !== loanType.status) {
      if (status !== "Active" && status !== "Inactive") {
        return NextResponse.json({ error: "Status must be Active or Inactive" }, { status: 400 });
      }
      updates.status = status;
      logDetails.push(`status changed from "${loanType.status}" to "${status}"`);
    }

    if (logDetails.length === 0) {
      return NextResponse.json(loanType);
    }

    const updated = await LoanType.findByIdAndUpdate(id, { $set: updates }, { new: true });

    await ActivityLog.create({
      entityType: "LoanType",
      entityId: updated._id,
      action: "Updated",
      details: `Loan type updated: ${logDetails.join(", ")}.`,
      performedBy: user.name,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`Error updating loan type ${id}:`, error);
    return NextResponse.json({ error: "Failed to update loan type" }, { status: 500 });
  }
}
