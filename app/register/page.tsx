import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const auth = await getSessionUser();

  if (auth) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
