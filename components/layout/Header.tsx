"use client";
import { Bell, Search } from "lucide-react";
import { notifications } from "@/lib/data";
import { useSession } from "@/components/providers/SessionProvider";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const unread = notifications.filter((n) => !n.is_read).length;
  const { user } = useSession();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header
      style={{ height: "var(--header-height)", marginLeft: "var(--sidebar-width)" }}
      className="fixed top-0 right-0 left-0 bg-white border-b border-[#E5E7EB] flex items-center px-6 gap-4 z-20"
    >
      <h2 className="text-base font-semibold text-[#111827] min-w-0 truncate">{title}</h2>

      <div className="flex-1 max-w-sm ml-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search leads, invoices..."
            className="w-full pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-[#F7F8FA] transition-colors">
          <Bell className="w-5 h-5 text-[#475569]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
        <div 
          title={`${user?.name} (${user?.role})`}
          className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold cursor-pointer"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

