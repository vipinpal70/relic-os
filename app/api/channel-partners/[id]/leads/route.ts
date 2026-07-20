import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import { LeadRepository } from "@/lib/repositories/lead.repository";

const leadRepo = new LeadRepository();

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
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const loanType = searchParams.get("loanType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = await leadRepo.findAll({
      search,
      status,
      loanType,
      startDate,
      endDate,
      channelPartnerId: id,
      page,
      limit,
      sortField,
      sortOrder,
    });

    // Return raw lead documents: the Cases tab renders model fields
    // (_id, applicantName, partnerExpectedCommission, ...) that formatLead strips.
    // Bank-side commission (Relic's earnings) is never exposed to partner users.
    const data = scope
      ? result.data.map((lead: any) => {
          const obj = typeof lead.toObject === "function" ? lead.toObject() : { ...lead };
          delete obj.bankExpectedCommission;
          delete obj.bankPaidCommission;
          delete obj.bankPendingCommission;
          return obj;
        })
      : result.data;

    return NextResponse.json({
      data,
      total: result.total,
    });
  } catch (error: any) {
    console.error(`Error loading leads for partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to load partner leads" }, { status: 500 });
  }
}
