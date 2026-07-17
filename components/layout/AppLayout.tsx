"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
