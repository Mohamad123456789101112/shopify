import { getSessionUser } from "@/lib/auth";
import { dashboardData, getStore } from "@/lib/merchant";
import { Overview } from "@/components/dashboard/Overview";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user?.merchant) redirect("/login");
  const [data, store] = await Promise.all([dashboardData(user.id), getStore(user.id)]);
  const currency = (store.settings as { currency?: string }).currency ?? "EGP";

  return (
    <Overview
      name={user.name || user.merchant.storeName}
      slug={user.merchant.storeSlug}
      plan={user.merchant.plan}
      suspended={user.merchant.suspended}
      suspendedReason={user.merchant.suspendedReason}
      kpis={data.kpis}
      chart={data.chart}
      top={data.top}
      low={data.low}
      recent={data.recent}
      productCount={data.productCount}
      currency={currency}
    />
  );
}
