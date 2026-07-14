"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  gradientClass: string;
  prefix?: string;
  suffix?: string;
}

export function StatsCard({ title, value, change, icon: Icon, gradientClass, prefix, suffix }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card card-hover p-5 flex items-center gap-4"
    >
      <div className={`${gradientClass} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide truncate">{title}</p>
        <p className="text-xl font-bold text-[#111827] mt-0.5">
          {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}{suffix}
        </p>
        {change !== undefined && (
          <p className={`text-xs mt-0.5 font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last month
          </p>
        )}
      </div>
    </motion.div>
  );
}
