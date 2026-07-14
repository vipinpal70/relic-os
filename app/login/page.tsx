import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const auth = await getSessionUser();

  if (auth) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
