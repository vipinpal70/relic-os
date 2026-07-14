"use client";
import { motion } from "framer-motion";
import { recentActivity } from "@/lib/data";
import { UserPlus, Upload, FileText, CheckCircle, Users, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  UserPlus, Upload, FileText, CheckCircle, Users, ArrowRight,
};

interface RecentActivityProps {
  data?: any[];
}

export function RecentActivity({ data }: RecentActivityProps) {
  const items = data || recentActivity;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {items.map((item: any, i: number) => {
          const Icon = iconMap[item.icon] ?? ArrowRight;
          return (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                style={{ backgroundColor: (item.color || "#6366F1") + "15", color: item.color || "#6366F1" }}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#374151] leading-snug">{item.message}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
