import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Wizard } from "@/components/setup/Wizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.merchant) redirect("/login");
  if (user.merchant.onboarded) redirect("/dashboard");
  return <Wizard storeName={user.merchant.storeName} slug={user.merchant.storeSlug} plan={user.merchant.plan} />;
}
