"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderOpen, TrendingUp, FileText,
  UserCog, User, Settings, Activity, Bell, Shield, LogOut, Landmark, X
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { logout } from "@/app/actions/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lead Management", href: "/leads", icon: Users },
  { label: "Channel Partners", href: "/channel-partners", icon: UserCog },
  { label: "Bank Management", href: "/banks", icon: Landmark },
  { label: "Loan Types", href: "/loan-types", icon: FolderOpen },
  { label: "Billing & Invoices", href: "/billing", icon: FileText },
  { label: "Team Management", href: "/team", icon: UserCog },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
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
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        style={{ width: "var(--sidebar-width)" }}
        className={`fixed top-0 left-0 h-full bg-white border-r border-[#E5E7EB] flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-base font-bold text-[#111827]">Relic OS</span>
            <p className="text-xs text-[#9CA3AF]">Loan Management</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`sidebar-item ${active ? "active" : ""}`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="px-3 py-4 border-t border-[#E5E7EB]">
          <div
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
            title="Click to logout"
          >
            <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate group-hover:text-red-600 transition-colors">{user?.name || "User"}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user?.role || "Team"}</p>
            </div>
            <LogOut className="w-4 h-4 text-[#9CA3AF] group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
}
