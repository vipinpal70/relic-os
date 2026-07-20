import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import { CommissionRepository } from "@/lib/repositories/commission.repository";

const commissionRepo = new CommissionRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    // Staff can view any partner; a Channel Partner user can only access their own record
    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;
    if (scope && scope !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await commissionRepo.findAll({
      entityType: "ChannelPartner",
      entityId: id,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error loading commission logs for partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to load commission logs" }, { status: 500 });
  }
}
