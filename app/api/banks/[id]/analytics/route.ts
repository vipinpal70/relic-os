import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { AnalyticsService } from "@/lib/services/analytics.service";

const analyticsService = new AnalyticsService();

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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter = { bankId: id, startDate, endDate };

    const [monthlyTrends, loanTypes, statusBreakdown, states] = await Promise.all([
      analyticsService.getMonthlyTrends(filter),
      analyticsService.getLoanTypeBreakdown(filter),
      analyticsService.getStatusBreakdown(filter),
      analyticsService.getStateBreakdown({ bankId: id }),
    ]);

    return NextResponse.json({
      monthlyTrends,
      loanTypes,
      statusBreakdown,
      states,
    });
  } catch (error: any) {
    console.error(`Error loading analytics for bank ${id}:`, error);
    return NextResponse.json({ error: "Failed to load analytics details" }, { status: 500 });
  }
}
