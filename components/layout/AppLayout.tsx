"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSession } from "@/components/providers/SessionProvider";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

// Pages a Channel Partner user may open. Real enforcement lives in the API
// routes (scoped/staff-only); this guard is UX so partners never see admin
// pages erroring out.
const PARTNER_ALLOWED_PATHS = ["/dashboard", "/leads", "/my-company", "/profile"];

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isPartner = user?.role === "Channel Partner";
  const blocked = isPartner && !PARTNER_ALLOWED_PATHS.includes(pathname);

  useEffect(() => {
    if (blocked) router.replace("/dashboard");
  }, [blocked, router]);

  if (blocked) return null;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-screen lg:ml-[var(--sidebar-width)]"
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
