import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <Header title={title} />
      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          paddingTop: "var(--header-height)",
        }}
        className="min-h-screen"
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
