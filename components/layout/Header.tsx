"use client";
import { Bell, Search, Menu } from "lucide-react";
import { notifications } from "@/lib/data";
import { useSession } from "@/components/providers/SessionProvider";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
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
      style={{ height: "var(--header-height)" }}
      className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] bg-white border-b border-[#E5E7EB] flex items-center px-4 sm:px-6 gap-3 z-20"
    >
      {/* Hamburger menu (mobile only) */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-1 rounded-lg hover:bg-[#F7F8FA] transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[#475569]" />
      </button>

      {/* Page title (mobile only — search takes this spot on desktop) */}
      <h2 className="flex-1 min-w-0 text-base font-bold text-[#111827] truncate md:hidden">{title}</h2>

      <div className="hidden md:block flex-1 max-w-sm">
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
        {/* <button className="relative p-2 rounded-lg hover:bg-[#F7F8FA] transition-colors">
          <Bell className="w-5 h-5 text-[#475569]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button> */}
        <div
          title={`${user?.name} (${user?.role})`}
          className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold cursor-pointer"
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111827] truncate">{user?.name || "User"}</p>
          <p className="text-xs text-[#9CA3AF] truncate">{user?.role || "Team"}</p>
        </div>
      </div>
    </header>
  );
}
