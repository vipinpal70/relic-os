import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Bank from "@/lib/models/Bank";
import ChannelPartner from "@/lib/models/ChannelPartner";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Ensure models are registered for populated fields
    await Bank.findOne();
    await ChannelPartner.findOne();
    await User.findOne();

    const cases = await Case.find({ isDeleted: false })
      .populate("bankId", "bankName")
      .populate("channelPartnerId", "name companyName")
      .populate("assignedUserId", "name")
      .sort({ createdAt: -1 });

    const formatted = cases.map((c) => {
      const obj = c.toObject();
      return {
        id: obj._id.toString(),
        google_form_id: "",
        applicant_name: obj.applicantName,
        email: obj.email,
        phone: obj.phone,
        loan_amount: obj.loanAmount,
        loan_type: obj.loanType,
        bank: obj.bankId?.bankName || "",
        channel_partner: obj.channelPartnerId?.companyName || obj.channelPartnerId?.name || "",
        assigned_user: obj.assignedUserId?.name || "",
        lead_source: "Manual",
        application_number: obj.applicationNumber,
        status: obj.status === "Pending" ? "Processing" : obj.status, // map Pending to Processing for frontend
        disbursed_amount: obj.disbursedAmount || 0,
        approved_date: obj.approvedDate || "",
        disbursed_date: obj.disbursedDate || "",
        remarks: obj.remarks || "",
        created_at: obj.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching leads from Case collection:", error);
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 });
  }
}
