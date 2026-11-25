import { isDatabaseConfigured } from "@/db";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await getSessionUser();
  if (user) redirect(user.isOwner ? "/admin" : user.merchant?.onboarded ? "/dashboard" : "/setup");
  return <AuthForm mode="login" databaseAvailable={isDatabaseConfigured()} />;
}
