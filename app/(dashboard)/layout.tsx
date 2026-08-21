import { getSessionUser, getRoleDomainRedirectUrl } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { runBackgroundSyncIfNeeded } from "@/lib/sync-scheduler";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getSessionUser();

  if (!auth) {
    const cookieStore = await cookies();
    if (cookieStore.has("refreshToken")) {
      redirect("/api/auth/refresh");
    }
    redirect("/login");
  }

  // Domain guard: Ensure user is on the correct subdomain for their role
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "";
  const domainRedirect = getRoleDomainRedirectUrl(auth.user.role, host);
  if (domainRedirect) {
    redirect(domainRedirect);
  }

  // Fire background spreadsheet sync asynchronously if interval is due
  runBackgroundSyncIfNeeded().catch((err) => {
    console.error("Dashboard layout background sync error:", err);
  });

  return (
    <SessionProvider value={auth}>
      {children}
    </SessionProvider>
  );
}

