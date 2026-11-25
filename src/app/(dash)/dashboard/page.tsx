import { getSessionUser } from "@/lib/auth";
import { dashboardData, getStore } from "@/lib/merchant";
import { Overview } from "@/components/dashboard/Overview";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const query = await searchParams;
  const days = query.days === "7" ? 7 : query.days === "90" ? 90 : 30;
  const user = await getSessionUser();
  if (!user?.merchant) redirect("/login");
  const [data, store] = await Promise.all([dashboardData(user.id, days), getStore(user.id)]);
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
      days={days}
      publishedAt={store.published_at ? String(store.published_at) : null}
    />
  );
}
