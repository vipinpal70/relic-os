"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, UserPlus, FileText, CheckCircle, Upload, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifications } from "@/lib/data";

const iconMap: Record<string, React.ElementType> = {
  "Lead Assigned": UserPlus,
  "Invoice Paid": CheckCircle,
  "Document Uploaded": Upload,
  "Commission Updated": ArrowRight,
  "Lead Status Changed": ArrowRight,
  "Google Form Sync": Bell,
  "Invoice Generated": FileText,
  "Lead Rejected": ArrowRight,
};

const iconColors: Record<string, string> = {
  "Lead Assigned": "#2563EB",
  "Invoice Paid": "#15803D",
  "Document Uploaded": "#4F46E5",
  "Commission Updated": "#B45309",
  "Lead Status Changed": "#047857",
  "Google Form Sync": "#06B6D4",
  "Invoice Generated": "#4F46E5",
  "Lead Rejected": "#B91C1C",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));

  const unread = notifs.filter((n) => !n.is_read);
  const today = notifs.filter((n) => new Date(n.created_at).toDateString() === new Date("2024-06-28").toDateString());
  const earlier = notifs.filter((n) => new Date(n.created_at).toDateString() !== new Date("2024-06-28").toDateString());

  function NotifGroup({ title, items }: { title: string; items: typeof notifs }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2 px-1">{title}</p>
        <div className="card overflow-hidden">
          {items.map((n, i) => {
            const Icon = iconMap[n.title] ?? Bell;
            const color = iconColors[n.title] ?? "#2563EB";
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-[#F3F4F6] last:border-0 ${
                  n.is_read ? "bg-white hover:bg-[#F9FAFB]" : "bg-[#EFF6FF] hover:bg-[#DBEAFE]"
                }`}
              >
                <div
                  style={{ backgroundColor: color + "20", color }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? "text-[#374151]" : "text-[#111827]"}`}>{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Notifications">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Notifications"
          subtitle={`${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`}
          actions={
            unread.length > 0 ? (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 border border-[#D1D5DB] bg-white rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                <CheckCheck size={15} />
                Mark all as read
              </button>
            ) : null
          }
        />

        <NotifGroup title="Today" items={today} />
        <NotifGroup title="Earlier" items={earlier} />

        {notifs.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-3">
              <Bell size={24} className="text-[#2563EB]" />
            </div>
            <p className="text-sm font-medium text-[#374151]">All caught up!</p>
            <p className="text-xs text-[#9CA3AF] mt-1">No notifications to show</p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
