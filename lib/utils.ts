import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const statusColors: Record<string, { bg: string; text: string }> = {
  New: { bg: "#EFF6FF", text: "#2563EB" },
  Assigned: { bg: "#EEF2FF", text: "#4F46E5" },
  "Not Connected": { bg: "#FEF9C3", text: "#92400E" },
  "Not Interested": { bg: "#FEE2E2", text: "#991B1B" },
  "Document Pending": { bg: "#FFF7ED", text: "#C2410C" },
  Processing: { bg: "#FEF3C7", text: "#B45309" },
  Open: { bg: "#EEF2FF", text: "#4F46E5" },
  Approved: { bg: "#DCFCE7", text: "#15803D" },
  Disbursed: { bg: "#D1FAE5", text: "#047857" },
  Rejected: { bg: "#FEE2E2", text: "#B91C1C" },
  Closed: { bg: "#F3F4F6", text: "#4B5563" },
  Draft: { bg: "#F3F4F6", text: "#4B5563" },
  Generated: { bg: "#EEF2FF", text: "#4F46E5" },
  Sent: { bg: "#EFF6FF", text: "#2563EB" },
  Paid: { bg: "#DCFCE7", text: "#15803D" },
  Pending: { bg: "#FEF3C7", text: "#B45309" },
  Active: { bg: "#DCFCE7", text: "#15803D" },
  Inactive: { bg: "#F3F4F6", text: "#4B5563" },
  Admin: { bg: "#EFF6FF", text: "#2563EB" },
  Team: { bg: "#EEF2FF", text: "#4F46E5" },
  "Channel Partner": { bg: "#FEF3C7", text: "#B45309" },
  "Invoice Generated": { bg: "#EEF2FF", text: "#4F46E5" },
};

export function formatLead(c: any): any {
  if (!c) return null;
  const obj = typeof c.toObject === "function" ? c.toObject() : c;
  return {
    id: obj._id ? obj._id.toString() : (obj.id || "").toString(),
    google_form_id: obj.googleFormId || "",
    applicant_name: obj.applicantName || "",
    email: obj.email || "",
    phone: obj.phone || "",
    loan_amount: obj.loanAmount || 0,
    loan_type: obj.loanType || "",
    bank: obj.bankId?.bankName || "",
    bank_id: obj.bankId?._id?.toString() || (obj.bankId && !obj.bankId.bankName ? obj.bankId.toString() : ""),
    channel_partner: obj.channelPartnerId?.companyName || obj.channelPartnerId?.name || "",
    channel_partner_id: obj.channelPartnerId?._id?.toString() || (obj.channelPartnerId && !obj.channelPartnerId.name ? obj.channelPartnerId.toString() : ""),
    assigned_user: obj.assignedUserId?.name || "",
    assigned_user_id: obj.assignedUserId?._id?.toString() || (obj.assignedUserId && !obj.assignedUserId.name ? obj.assignedUserId.toString() : ""),
    lead_source: obj.createdBy === "System" ? "Sync" : "Manual",
    application_number: obj.applicationNumber || "",
    status: obj.status === "Pending" ? "Processing" : (obj.status || "New"),
    disbursed_amount: obj.disbursedAmount || 0,
    approved_date: obj.approvedDate || "",
    disbursed_date: obj.disbursedDate || "",
    remarks: obj.remarks || "",
    created_at: obj.createdAt ? new Date(obj.createdAt).toISOString() : "",
  };
}
