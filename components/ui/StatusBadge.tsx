"use client";
import { statusColors } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = statusColors[status] ?? { bg: "#F3F4F6", text: "#4B5563" };
  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text }}
      className={`inline-flex items-center rounded-full font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}
    >
      {status}
    </span>
  );
}
