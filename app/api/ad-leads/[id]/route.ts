import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import AdLead from "@/lib/models/AdLead";
import ActivityLog from "@/lib/models/ActivityLog";

export async function DELETE(
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

    // Delete record from AdLead collection
    await AdLead.findByIdAndDelete(id);

    await ActivityLog.create({
      entityType: "AdLead",
      entityId: id,
      action: "Deleted",
      details: `Ad Lead "${adLead.applicantName}" (${adLead.applicationNumber}) deleted from ad leads.`,
      performedBy: user.name,
    });

    return NextResponse.json({ success: true, message: "Ad Lead deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting ad lead:", error);
    return NextResponse.json({ error: error.message || "Failed to delete ad lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();

    const adLead = await AdLead.findByIdAndUpdate(
      id,
      { ...body, updatedBy: user.name },
      { new: true }
    );

    if (!adLead) {
      return NextResponse.json({ error: "Ad lead not found" }, { status: 404 });
    }

    return NextResponse.json(adLead);
  } catch (error: any) {
    console.error("Error updating ad lead:", error);
    return NextResponse.json({ error: "Failed to update ad lead" }, { status: 500 });
  }
}
