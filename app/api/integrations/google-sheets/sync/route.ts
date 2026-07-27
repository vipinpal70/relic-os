import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Integration from "@/lib/models/Integration";
import Lead from "@/lib/models/Lead";
import AdLead from "@/lib/models/AdLead";
import Bank from "@/lib/models/Bank";
import ChannelPartner from "@/lib/models/ChannelPartner";
import User from "@/lib/models/User";
import ActivityLog from "@/lib/models/ActivityLog";

// Helper to extract Spreadsheet ID and GID
function extractSheetInfo(url: string) {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/gid=([0-9]+)/);
  return {
    id: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : "0", // default to first sheet
  };
}

// State-machine CSV parser that correctly handles quoted values and double-quotes
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip next double quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push("");
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      lines.push(row);
      row = [""];
      inQuotes = false;
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

export async function POST() {
  try {
    await dbConnect();

    const config = await Integration.findOne();
    if (!config || !config.googleSheetUrl) {
      return NextResponse.json({ error: "Google Sheets integration is not configured. Please set the Form/Sheet URL in settings." }, { status: 400 });
    }

    const { id, gid } = extractSheetInfo(config.googleSheetUrl);
    if (!id) {
      return NextResponse.json({ error: "Invalid Google Sheets URL. Could not extract Spreadsheet ID." }, { status: 400 });
    }

    // Fetch Google Sheet CSV
    const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    const res = await fetch(exportUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const errorMsg = `Google Sheets returned status ${res.status}. Make sure the sheet sharing permissions are set to 'Anyone with the link can view'.`;
      config.lastSyncStatus = "failed";
      config.lastSyncError = errorMsg;
      config.recordsImportedInLastRun = 0;
      await config.save();
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      config.lastSyncStatus = "success";
      config.lastSyncTime = new Date();
      config.lastSyncError = "";
      config.recordsImportedInLastRun = 0;
      await config.save();
      return NextResponse.json({ message: "Sync complete. Spreadsheet is empty.", count: 0 });
    }

    // Map headers dynamically (case-insensitive and alias matching)
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const headerMap: { [key: string]: number } = {};
    headers.forEach((h, index) => {
      headerMap[h] = index;
    });

    const getIndex = (aliases: string[]) => {
      for (const alias of aliases) {
        if (headerMap[alias] !== undefined) return headerMap[alias];
      }
      return -1;
    };

    const applicantNameIdx = getIndex(["applicant name", "name", "applicant", "full name", "applicant_name"]);
    const emailIdx = getIndex(["email", "email address", "mail", "email_id"]);
    const phoneIdx = getIndex(["phone", "phone number", "mobile", "contact", "phone no", "telephone"]);
    const loanAmountIdx = getIndex(["loan amount", "amount", "requested amount", "value", "loan_amount"]);
    const loanTypeIdx = getIndex(["loan type", "type", "loan category", "category", "loan_type"]);
    const bankIdx = getIndex(["bank", "lender", "bank_name"]);
    const channelPartnerIdx = getIndex(["channel partner", "partner", "source partner", "channel_partner"]);
    const assignedUserIdx = getIndex(["assigned", "assigned to", "assigned user", "agent", "assigned rm", "assigned_user"]);
    const appNoIdx = getIndex(["application number", "app no", "application no", "application id", "app number", "application_number"]);
    const statusIdx = getIndex(["status", "lead status", "application status"]);
    const remarksIdx = getIndex(["remarks", "note", "comment", "remarks/notes"]);
    const disbursedAmountIdx = getIndex(["disbursed amount", "disbursed", "disbursement amount", "disbursed_amount"]);
    const approvedDateIdx = getIndex(["approved date", "approval date", "approved dt", "approved_date"]);
    const disbursedDateIdx = getIndex(["disbursed date", "disbursement date", "disbursed dt", "disbursed_date"]);
    const createdAtIdx = getIndex(["date", "created at", "timestamp", "creation date", "created_at"]);

    let importedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.join("").trim() === "") continue;

      const applicant_name = (applicantNameIdx !== -1 ? row[applicantNameIdx] : "")?.trim();
      const email = (emailIdx !== -1 ? row[emailIdx] : "")?.trim() || "no-email@relicos.com";
      const phone = (phoneIdx !== -1 ? row[phoneIdx] : "")?.trim();

      // Skip row if it doesn't have name and phone
      if (!applicant_name || !phone) continue;

      const rawAmount = loanAmountIdx !== -1 ? row[loanAmountIdx] : "";
      const loan_amount = parseFloat(rawAmount?.replace(/[^0-9.]/g, "") || "0") || 100000;
      const loan_type = (loanTypeIdx !== -1 ? row[loanTypeIdx] : "")?.trim() || "Home Loan";
      const bank = (bankIdx !== -1 ? row[bankIdx] : "")?.trim() || "";
      const channel_partner = (channelPartnerIdx !== -1 ? row[channelPartnerIdx] : "")?.trim() || "";
      const assigned_user = (assignedUserIdx !== -1 ? row[assignedUserIdx] : "")?.trim() || "";
      let status = (statusIdx !== -1 ? row[statusIdx] : "")?.trim() || "New";
      const remarks = (remarksIdx !== -1 ? row[remarksIdx] : "")?.trim() || "";
      const rawDisbursed = disbursedAmountIdx !== -1 ? row[disbursedAmountIdx] : "";
      const disbursed_amount = parseFloat(rawDisbursed?.replace(/[^0-9.]/g, "") || "0") || 0;
      const approved_date = (approvedDateIdx !== -1 ? row[approvedDateIdx] : "")?.trim() || "";
      const disbursed_date = (disbursedDateIdx !== -1 ? row[disbursedDateIdx] : "")?.trim() || "";

      // Map status from Sheet (Processing -> Pending)
      if (status === "Processing") {
        status = "Pending";
      }

      // Stable application number creation to prevent duplicates
      let application_number = (appNoIdx !== -1 ? row[appNoIdx] : "")?.trim() || "";
      if (!application_number) {
        application_number = `APP-GS-${phone.replace(/[^0-9]/g, "").slice(-4)}-${i}`;
      }

      // Import-only sync into AdLead collection:
      // Skip if already present in AdLead collection
      const existingAdLead = await AdLead.findOne({ applicationNumber: application_number });
      if (existingAdLead) continue;

      let created_at = new Date();
      if (createdAtIdx !== -1 && row[createdAtIdx]) {
        const parsedDate = new Date(row[createdAtIdx]);
        if (!isNaN(parsedDate.getTime())) {
          created_at = parsedDate;
        }
      }

      // 1. Resolve Bank relationship
      let bankId = null;
      const bankNameClean = bank.trim() || "Default Bank";
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
      bankId = bankDoc._id;

      // 2. Resolve Channel Partner relationship
      let channelPartnerId = null;
      if (channel_partner.trim()) {
        const cpClean = channel_partner.trim();
        let cpDoc = await ChannelPartner.findOne({
          $or: [
            { name: new RegExp("^" + cpClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
            { companyName: new RegExp("^" + cpClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
          ],
        });
        if (!cpDoc) {
          cpDoc = await ChannelPartner.create({
            name: cpClean,
            companyName: cpClean,
            email: `info@${cpClean.toLowerCase().replace(/[^a-z0-9]/g, "") || "partner"}.com`,
            phone: "1800-000-0000",
            pan: "DEFAULTPAN",
            gst: "DEFAULTGST",
            status: "Active",
          });
        }
        channelPartnerId = cpDoc._id;
      }

      // 3. Resolve Assigned User
      let assignedUserId = null;
      if (assigned_user.trim()) {
        const userClean = assigned_user.trim();
        const userDoc = await User.findOne({
          name: new RegExp("^" + userClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i"),
        });
        if (userDoc) {
          assignedUserId = userDoc._id;
        }
      }

      // 4. Insert into AdLead collection
      const adLeadDoc = await AdLead.findOneAndUpdate(
        { applicationNumber: application_number },
        {
          $setOnInsert: {
            applicantName: applicant_name,
            email,
            phone,
            loanAmount: loan_amount,
            loanType: loan_type,
            bankId,
            channelPartnerId,
            assignedUserId,
            status,
            disbursedAmount: disbursed_amount,
            approvedDate: approved_date,
            disbursedDate: disbursed_date,
            remarks,
            createdAt: created_at,
            isDeleted: false,
          },
        },
        { upsert: true, new: true }
      );

      await ActivityLog.create({
        entityType: "AdLead",
        entityId: adLeadDoc._id,
        action: "Google Sheet Import",
        details: `Imported applicant details for ${applicant_name} to Ad Leads via Sync.`,
        performedBy: "Google Sheets Sync",
      });

      importedCount++;
    }

    config.lastSyncStatus = "success";
    config.lastSyncTime = new Date();
    config.lastSyncError = "";
    config.recordsImportedInLastRun = importedCount;
    await config.save();

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error: any) {
    console.error("Error in sync process:", error);
    try {
      const config = await Integration.findOne();
      if (config) {
        config.lastSyncStatus = "failed";
        config.lastSyncError = error.message || "Unknown error during sync.";
        config.recordsImportedInLastRun = 0;
        await config.save();
      }
    } catch (dbError) {
      console.error("Could not write error to Integration config:", dbError);
    }
    return NextResponse.json({ error: error.message || "An unexpected error occurred during sync." }, { status: 500 });
  }
}
