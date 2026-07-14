import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Commission from "@/lib/models/Commission";
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

    // Try finding Bank commission first
    let comm = await Commission.findOne({ caseId: c._id, entityType: "Bank", isDeleted: false });
    if (!comm) {
      // Fallback to ChannelPartner commission
      comm = await Commission.findOne({ caseId: c._id, entityType: "ChannelPartner", isDeleted: false });
    }

    if (comm) {
      return NextResponse.json({
        _id: comm._id.toString(),
        leadId: c._id.toString(),
        payoutRate: comm.rate,
        payoutAmount: comm.expectedCommission,
        commissionType: comm.entityType === "Bank" ? "Bank" : "Partner",
        status: comm.status === "Partially Paid" ? "Processing" : comm.status,
        updatedBy: comm.updatedBy || "System",
        updatedAt: comm.updatedAt,
      });
    }

    // Seed lazy default fallback
    const activeAmount = c.disbursedAmount || c.loanAmount || 0;
    const defaultRate = 1.5;
    const defaultAmount = Math.round(activeAmount * (defaultRate / 100));

    return NextResponse.json({
      leadId: c._id.toString(),
      payoutRate: defaultRate,
      payoutAmount: defaultAmount,
      commissionType: "Bank",
      status: "Unpaid",
      updatedBy: "System",
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error("Error loading lead commission:", error);
    return NextResponse.json({ error: error.message || "Failed to load commission" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { payoutRate, commissionType, status } = body;

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

    const rateVal = parseFloat(payoutRate) || 0;
    const baseAmount = c.disbursedAmount || c.loanAmount || 0;
    const expectedCommission = Math.round(baseAmount * (rateVal / 100));

    let entityId = null;
    let entityType: "Bank" | "ChannelPartner" = "Bank";

    if (commissionType === "Bank") {
      entityId = c.bankId;
      entityType = "Bank";
    } else {
      entityId = c.channelPartnerId;
      entityType = "ChannelPartner";
    }

    if (!entityId) {
      return NextResponse.json(
        { error: `No associated ${commissionType} found on this case to attach commission to.` },
        { status: 400 }
      );
    }

    const statusVal = status === "Processing" ? "Partially Paid" : status;

    const commission = await Commission.findOneAndUpdate(
      { caseId: c._id, entityType, isDeleted: false },
      {
        $set: {
          entityId,
          rate: rateVal,
          commissionType: "Percentage",
          expectedCommission,
          pendingCommission: expectedCommission,
          status: statusVal,
          updatedBy: userName,
        },
      },
      { upsert: true, new: true }
    );

    // Save expected and pending commissions back onto Case
    if (entityType === "Bank") {
      c.bankExpectedCommission = expectedCommission;
      c.bankPendingCommission = expectedCommission;
    } else {
      c.partnerExpectedCommission = expectedCommission;
      c.partnerPendingCommission = expectedCommission;
    }
    await c.save();

    // Log event in ActivityLog
    await ActivityLog.create({
      entityType: "Case",
      entityId: c._id,
      action: "Commission Updated",
      details: `Commission rate set to ${rateVal}% (${commissionType}) • Status: ${status}`,
      performedBy: userName,
    });

    const formatted = {
      _id: commission._id.toString(),
      leadId: c._id.toString(),
      payoutRate: commission.rate,
      payoutAmount: commission.expectedCommission,
      commissionType: commissionType,
      status: status,
      updatedBy: commission.updatedBy || "System",
      updatedAt: commission.updatedAt,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error saving lead commission:", error);
    return NextResponse.json({ error: error.message || "Failed to update commission" }, { status: 500 });
  }
}
