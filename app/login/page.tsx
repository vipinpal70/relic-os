import { getSessionUser, getRoleDomainRedirectUrl } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const auth = await getSessionUser();

  if (auth) {
    const reqHeaders = await headers();
    const host = reqHeaders.get("host") || "";
    const redirectUrl = getRoleDomainRedirectUrl(auth.user.role, host) || "/dashboard";
    redirect(redirectUrl);
  }

  return <LoginForm />;
}
