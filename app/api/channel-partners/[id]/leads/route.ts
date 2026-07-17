import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
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
    return NextResponse.json({
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    console.error(`Error loading leads for partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to load partner leads" }, { status: 500 });
  }
}
