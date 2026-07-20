import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { BankUpdateValidationSchema } from "@/lib/validations/bank.validation";
import { BankService } from "@/lib/services/bank.service";

const bankService = new BankService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const bank = await bankService.getBankById(id);
    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const stats = await bankService.getBankDashboardStats(id);

    return NextResponse.json({
      bank,
      stats,
    });
  } catch (error: any) {
    console.error(`Error loading bank details for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load bank details" }, { status: 500 });
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
    const validationResult = BankUpdateValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await bankService.updateBank(id, validationResult.data, user.name);
    if (!updated) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`Error updating bank ${id}:`, error);
    return NextResponse.json({ error: "Failed to update bank" }, { status: 500 });
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

    const deleted = await bankService.deleteBank(id, user.name);
    if (!deleted) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Bank deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting bank ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete bank" }, { status: 500 });
  }
}
