import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Bank from "@/lib/models/Bank";
import ChannelPartner from "@/lib/models/ChannelPartner";
import User from "@/lib/models/User";
import ActivityLog from "@/lib/models/ActivityLog";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();

    // Ensure models are registered
    await Bank.findOne();
    await ChannelPartner.findOne();
    await User.findOne();

    let c = null;

    // 1. Try by Mongoose ID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false })
        .populate("bankId", "bankName")
        .populate("channelPartnerId", "name companyName")
        .populate("assignedUserId", "name");
    }

    // 2. Try by application number
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false })
        .populate("bankId", "bankName")
        .populate("channelPartnerId", "name companyName")
        .populate("assignedUserId", "name");
    }

    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const obj = c.toObject();
    const formatted = {
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
      status: obj.status === "Pending" ? "Processing" : obj.status,
      disbursed_amount: obj.disbursedAmount || 0,
      approved_date: obj.approvedDate || "",
      disbursed_date: obj.disbursedDate || "",
      remarks: obj.remarks || "",
      created_at: obj.createdAt,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error(`Error loading lead details for ${id}:`, error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const body = await request.json();

    let c = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false });
    }
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false });
    }

    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const session = await getSessionUser();
    const userName = session?.user?.name || "System";

    // Track old values for activity log
    const oldName = c.applicantName;
    const oldEmail = c.email;
    const oldPhone = c.phone;
    const oldLoanAmount = c.loanAmount;
    const oldLoanType = c.loanType;
    const oldStatus = c.status;
    const oldRemarks = c.remarks;
    const oldDisbursedAmount = c.disbursedAmount;

    let hasChanges = false;

    // Map fields
    if (body.applicant_name !== undefined && body.applicant_name !== c.applicantName) {
      c.applicantName = body.applicant_name;
      hasChanges = true;
    }
    if (body.email !== undefined && body.email !== c.email) {
      c.email = body.email;
      hasChanges = true;
    }
    if (body.phone !== undefined && body.phone !== c.phone) {
      c.phone = body.phone;
      hasChanges = true;
    }
    if (body.loan_amount !== undefined && body.loan_amount !== c.loanAmount) {
      c.loanAmount = body.loan_amount;
      hasChanges = true;
    }
    if (body.loan_type !== undefined && body.loan_type !== c.loanType) {
      c.loanType = body.loan_type;
      hasChanges = true;
    }
    if (body.remarks !== undefined && body.remarks !== c.remarks) {
      c.remarks = body.remarks;
      hasChanges = true;
    }
    if (body.disbursed_amount !== undefined && body.disbursed_amount !== c.disbursedAmount) {
      c.disbursedAmount = body.disbursed_amount;
      hasChanges = true;
    }
    if (body.approved_date !== undefined && body.approved_date !== c.approvedDate) {
      c.approvedDate = body.approved_date;
      hasChanges = true;
    }
    if (body.disbursed_date !== undefined && body.disbursed_date !== c.disbursedDate) {
      c.disbursedDate = body.disbursed_date;
      hasChanges = true;
    }

    // Map status (Processing -> Pending)
    if (body.status !== undefined) {
      let statusToSet = body.status;
      if (statusToSet === "Processing") {
        statusToSet = "Pending";
      }
      if (statusToSet !== c.status) {
        c.status = statusToSet;
        hasChanges = true;

        if (statusToSet === "Disbursed") {
          if (!c.disbursedDate) {
            c.disbursedDate = new Date().toISOString().split("T")[0];
          }
          if (c.disbursedAmount === 0) {
            c.disbursedAmount = c.loanAmount;
          }
        } else if (statusToSet === "Approved" && !c.approvedDate) {
          c.approvedDate = new Date().toISOString().split("T")[0];
        }
      }
    }

    // Dynamic relational resolutions
    if (body.bank !== undefined) {
      const bankNameClean = body.bank.trim();
      if (bankNameClean) {
        let bankDoc = await Bank.findOne({
          bankName: new RegExp("^" + bankNameClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i"),
        });
        if (!bankDoc) {
          bankDoc = await Bank.create({
            bankName: bankNameClean,
            branch: "Main Branch",
            ifsc: "UTIB0000000",
            status: "Active",
          });
        }
        if (bankDoc._id.toString() !== c.bankId?.toString()) {
          c.bankId = bankDoc._id;
          hasChanges = true;

          await ActivityLog.create({
            entityType: "Case",
            entityId: c._id,
            action: "Bank Updated",
            details: `Associated with bank: "${bankNameClean}".`,
            performedBy: userName,
          });
        }
      }
    }

    if (body.channel_partner !== undefined) {
      const partnerClean = body.channel_partner.trim();
      if (partnerClean) {
        let cpDoc = await ChannelPartner.findOne({
          $or: [
            { name: new RegExp("^" + partnerClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
            { companyName: new RegExp("^" + partnerClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
          ],
        });
        if (!cpDoc) {
          cpDoc = await ChannelPartner.create({
            name: partnerClean,
            companyName: partnerClean,
            email: `info@${partnerClean.toLowerCase().replace(/[^a-z0-9]/g, "") || "partner"}.com`,
            phone: "1800-000-0000",
            pan: "DEFAULTPAN",
            gst: "DEFAULTGST",
            status: "Active",
          });
        }
        if (cpDoc._id.toString() !== c.channelPartnerId?.toString()) {
          c.channelPartnerId = cpDoc._id;
          hasChanges = true;

          await ActivityLog.create({
            entityType: "Case",
            entityId: c._id,
            action: "Channel Partner Updated",
            details: `Associated with channel partner: "${partnerClean}".`,
            performedBy: userName,
          });
        }
      }
    }

    if (body.assigned_user !== undefined) {
      const userClean = body.assigned_user.trim();
      if (userClean) {
        const userDoc = await User.findOne({
          name: new RegExp("^" + userClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i"),
        });
        if (userDoc && userDoc._id.toString() !== c.assignedUserId?.toString()) {
          c.assignedUserId = userDoc._id;
          hasChanges = true;

          await ActivityLog.create({
            entityType: "Case",
            entityId: c._id,
            action: "RM Assigned",
            details: `Case assigned to RM: "${userClean}".`,
            performedBy: userName,
          });
        }
      }
    }

    if (!hasChanges) {
      return NextResponse.json({ success: true, message: "No fields modified.", lead: c });
    }

    await c.save();

    // Log timeline logs in ActivityLog
    if (body.status && body.status !== oldStatus) {
      await ActivityLog.create({
        entityType: "Case",
        entityId: c._id,
        action: "Status Updated",
        details: `Status transitioned from ${oldStatus} to ${body.status}.`,
        performedBy: userName,
      });
    }

    if (body.loan_amount !== undefined && body.loan_amount !== oldLoanAmount) {
      await ActivityLog.create({
        entityType: "Case",
        entityId: c._id,
        action: "Loan Amount Updated",
        details: `Requested amount updated from ₹${oldLoanAmount.toLocaleString("en-IN")} to ₹${body.loan_amount.toLocaleString("en-IN")}.`,
        performedBy: userName,
      });
    }

    if (body.loan_type !== undefined && body.loan_type !== oldLoanType) {
      await ActivityLog.create({
        entityType: "Case",
        entityId: c._id,
        action: "Loan Type Updated",
        details: `Loan type changed from "${oldLoanType}" to "${body.loan_type}".`,
        performedBy: userName,
      });
    }

    if (body.remarks !== undefined && body.remarks !== oldRemarks) {
      await ActivityLog.create({
        entityType: "Case",
        entityId: c._id,
        action: "Remarks Added",
        details: body.remarks,
        performedBy: userName,
      });
    }

    const contactChanges = [];
    if (body.applicant_name !== undefined && body.applicant_name !== oldName) {
      contactChanges.push(`Name: "${oldName}" -> "${body.applicant_name}"`);
    }
    if (body.email !== undefined && body.email !== oldEmail) {
      contactChanges.push(`Email: "${oldEmail}" -> "${body.email}"`);
    }
    if (body.phone !== undefined && body.phone !== oldPhone) {
      contactChanges.push(`Phone: "${oldPhone}" -> "${body.phone}"`);
    }
    if (contactChanges.length > 0) {
      await ActivityLog.create({
        entityType: "Case",
        entityId: c._id,
        action: "Lead Details Updated",
        details: `Contact profile modified: ${contactChanges.join(" · ")}`,
        performedBy: userName,
      });
    }

    return NextResponse.json({ success: true, lead: c });
  } catch (error: any) {
    console.error("Error updating lead details:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}
