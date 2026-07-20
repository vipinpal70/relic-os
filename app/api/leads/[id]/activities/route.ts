import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import Lead from "@/lib/models/Lead";
import LeadActivity from "@/lib/models/LeadActivity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;
    if (scope) {
      const lead = await Lead.findOne({ _id: id, channelPartnerId: scope, isDeleted: false }).select("_id");
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const activities = await LeadActivity.find({ leadId: id }).sort({ created_at: -1 });
    return NextResponse.json(activities);
  } catch (error: any) {
    console.error("Error listing lead activities:", error);
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.trim() : "";
    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const activity = await LeadActivity.create({
      leadId: lead._id,
      action,
      new_value: typeof body.new_value === "string" ? body.new_value : "",
      remarks: typeof body.remarks === "string" ? body.remarks : "",
      user: user.name,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead activity:", error);
    return NextResponse.json({ error: "Failed to add activity" }, { status: 500 });
  }
}
