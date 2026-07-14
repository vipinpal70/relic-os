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
  Open: { bg: "#EEF2FF", text: "#4F46E5" },
  Processing: { bg: "#FEF3C7", text: "#B45309" },
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
