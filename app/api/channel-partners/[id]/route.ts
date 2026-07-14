import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { ChannelPartnerValidationSchema } from "@/lib/validations/channel-partner.validation";
import { ChannelPartnerService } from "@/lib/services/channel-partner.service";

const partnerService = new ChannelPartnerService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const partner = await partnerService.getPartnerById(id);
    if (!partner) {
      return NextResponse.json({ error: "Channel partner not found" }, { status: 404 });
    }

    const stats = await partnerService.getPartnerDashboardStats(id);

    return NextResponse.json({
      partner,
      stats,
    });
  } catch (error: any) {
    console.error(`Error loading channel partner details for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load channel partner details" }, { status: 500 });
  }
}

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
    const validationResult = ChannelPartnerValidationSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await partnerService.updatePartner(id, validationResult.data, user.name);
    if (!updated) {
      return NextResponse.json({ error: "Channel partner not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`Error updating channel partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to update channel partner" }, { status: 500 });
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

    const deleted = await partnerService.deletePartner(id, user.name);
    if (!deleted) {
      return NextResponse.json({ error: "Channel partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Channel partner deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting channel partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete channel partner" }, { status: 500 });
  }
}
