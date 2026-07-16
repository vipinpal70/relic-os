import { dbConnect } from "./mongodb";
import Integration from "./models/Integration";
import Lead from "./models/Lead";
import Bank from "./models/Bank";
import ChannelPartner from "./models/ChannelPartner";
import User from "./models/User";
import ActivityLog from "./models/ActivityLog";

// Helper to extract Spreadsheet ID and GID
function extractSheetInfo(url: string) {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/gid=([0-9]+)/);
  return {
    id: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : "0",
  };
}

// State-machine CSV parser
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
        i++;
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

// Lock to prevent concurrent in-memory runs during the same server process lifetime
let isSyncingInProgress = false;

export async function runBackgroundSyncIfNeeded() {
  if (isSyncingInProgress) return;

  try {
    await dbConnect();

    const config = await Integration.findOne();
    if (!config || !config.isActive || !config.googleSheetUrl) {
      return;
    }

    // Determine the interval duration in milliseconds
    let intervalMs = 2 * 60 * 60 * 1000; // default 2 hours
    switch (config.syncInterval) {
      case "every_hour":
        intervalMs = 1 * 60 * 60 * 1000;
        break;
      case "every_2_hours":
        intervalMs = 2 * 60 * 60 * 1000;
        break;
      case "every_4_hours":
        intervalMs = 4 * 60 * 60 * 1000;
        break;
      case "every_12_hours":
        intervalMs = 12 * 60 * 60 * 1000;
        break;
      case "every_24_hours":
        intervalMs = 24 * 60 * 60 * 1000;
        break;
    }

    const now = new Date();
    const lastSync = config.lastSyncTime ? new Date(config.lastSyncTime) : new Date(0);
    const elapsed = now.getTime() - lastSync.getTime();

    // If interval has not passed, skip sync
    if (elapsed < intervalMs) {
      return;
    }

    // Acquire lock
    isSyncingInProgress = true;
    console.log("[Background Sync] Starting automatic sheet synchronization...");

    const { id, gid } = extractSheetInfo(config.googleSheetUrl);
    if (!id) {
      throw new Error("Invalid Google Sheets URL.");
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    const res = await fetch(exportUrl, { method: "GET", cache: "no-store" });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      config.lastSyncStatus = "success";
      config.lastSyncTime = new Date();
      config.recordsImportedInLastRun = 0;
      config.lastSyncError = "";
      await config.save();
      return;
    }

    // Map headers dynamically
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

      // 4. Find or update Lead
      const leadDoc = await Lead.findOneAndUpdate(
        { applicationNumber: application_number },
        {
          $set: {
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

      // Create an activity log if this was newly imported
      await ActivityLog.create({
        entityType: "Lead",
        entityId: leadDoc._id,
        action: "Google Sheet Import",
        details: `Imported applicant details for ${applicant_name} via Sync.`,
        performedBy: "Google Sheets Sync",
      });

      importedCount++;
    }

    config.lastSyncStatus = "success";
    config.lastSyncTime = new Date();
    config.recordsImportedInLastRun = importedCount;
    config.lastSyncError = "";
    await config.save();
    console.log(`[Background Sync] Sheet sync success. Synced ${importedCount} records.`);
  } catch (error: any) {
    console.error("[Background Sync] Error during background synchronization:", error);
    try {
      const config = await Integration.findOne();
      if (config) {
        config.lastSyncStatus = "failed";
        config.lastSyncError = error.message || "Unknown error during sync.";
        config.recordsImportedInLastRun = 0;
        await config.save();
      }
    } catch (e) {
      console.error("[Background Sync] Failed to update integration model with errors:", e);
    }
  } finally {
    isSyncingInProgress = false;
  }
}
