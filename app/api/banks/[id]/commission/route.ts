import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { CommissionRepository } from "@/lib/repositories/commission.repository";

const commissionRepo = new CommissionRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await commissionRepo.findAll({
      entityType: "Bank",
      entityId: id,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error loading commission logs for bank ${id}:`, error);
    return NextResponse.json({ error: "Failed to load commission logs" }, { status: 500 });
  }
}
