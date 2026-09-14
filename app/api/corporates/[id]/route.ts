import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { CorporateUpdateValidationSchema } from "@/lib/validations/corporate.validation";
import { CorporateService } from "@/lib/services/corporate.service";

const corporateService = new CorporateService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const corporate = await corporateService.getCorporateById(id);
    if (!corporate) {
      return NextResponse.json({ error: "Corporate not found" }, { status: 404 });
    }

    const stats = await corporateService.getCorporateDashboardStats(id);

    return NextResponse.json({
      corporate,
      stats,
    });
  } catch (error: any) {
    console.error(`Error loading corporate details for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load corporate details" }, { status: 500 });
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
    const validationResult = CorporateUpdateValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await corporateService.updateCorporate(id, validationResult.data, user.name);
    if (!updated) {
      return NextResponse.json({ error: "Corporate not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`Error updating corporate ${id}:`, error);
    return NextResponse.json({ error: "Failed to update corporate" }, { status: 500 });
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

    const deleted = await corporateService.deleteCorporate(id, user.name);
    if (!deleted) {
      return NextResponse.json({ error: "Corporate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Corporate deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting corporate ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete corporate" }, { status: 500 });
  }
}
