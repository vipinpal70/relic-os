import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
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

    // Staff can view any partner; a Channel Partner user can only access their own record
    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;
    if (scope && scope !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter = { channelPartnerId: id, startDate, endDate };

    const [monthlyTrends, loanTypes, statusBreakdown, states] = await Promise.all([
      analyticsService.getMonthlyTrends(filter),
      analyticsService.getLoanTypeBreakdown(filter),
      analyticsService.getStatusBreakdown(filter),
      analyticsService.getStateBreakdown({ channelPartnerId: id }),
    ]);

    // Bank-side commission (Relic's earnings) is never exposed to partner users
    const trends = scope
      ? (monthlyTrends as any[]).map(({ bankCommission, ...rest }) => rest)
      : monthlyTrends;

    return NextResponse.json({
      monthlyTrends: trends,
      loanTypes,
      statusBreakdown,
      states,
    });
  } catch (error: any) {
    console.error(`Error loading analytics for partner ${id}:`, error);
    return NextResponse.json({ error: "Failed to load analytics details" }, { status: 500 });
  }
}
