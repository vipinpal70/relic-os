import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import ActivityLog from "@/lib/models/ActivityLog";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    let c = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false });
    }
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false });
    }

    if (!c) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const logs = await ActivityLog.find({ entityType: "Case", entityId: c._id }).sort({ createdAt: 1 });
    const formatted = logs.map((l) => ({
      _id: l._id.toString(),
      leadId: c._id.toString(),
      action: l.action,
      new_value: "",
      remarks: l.details,
      user: l.performedBy,
      created_at: l.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error loading lead activities:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { action, remarks } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let c = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false });
    }
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false });
    }

    if (!c) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const session = await getSessionUser();
    const userName = session?.user?.name || "System";

    const log = await ActivityLog.create({
      entityType: "Case",
      entityId: c._id,
      action: action,
      details: remarks || "",
      performedBy: userName,
    });

    const formatted = {
      _id: log._id.toString(),
      leadId: c._id.toString(),
      action: log.action,
      new_value: "",
      remarks: log.details,
      user: log.performedBy,
      created_at: log.createdAt,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error logging timeline event:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}
