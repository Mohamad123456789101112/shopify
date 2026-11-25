import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { PLAN_LIMITS } from "@/lib/constants";
import { getStore, requireMerchant } from "@/lib/merchant";
import { Analytics } from "@/components/dashboard/Sections";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const allowed = PLAN_LIMITS[user.merchant.plan].analytics;
  const store = await getStore(user.id);
  const currency = String((store.settings as { currency?: string }).currency ?? "EGP");
  const empty = { revenue: "0", orders: 0, aov: "0", byStatus: [], byCity: [], byDay: [] };
  if (!allowed) {
    return <Analytics allowed={false} plan={user.merchant.plan} data={empty} currency={currency} />;
  }
  const data = await rls(user.id, async (tx) => {
    const totals = await tx.execute(sql`
      select coalesce(sum(total), 0) as revenue, count(*)::int as orders,
             coalesce(avg(total), 0) as aov
      from orders where merchant_id = ${user.id} and created_at > now() - interval '30 days'`);
    const byStatus = await tx.execute(sql`
      select status, count(*)::int as c from orders where merchant_id = ${user.id} group by status order by c desc`);
    const byCity = await tx.execute(sql`
      select coalesce(customer->>'city', '') as city, count(*)::int as c from orders
      where merchant_id = ${user.id} group by 1 order by c desc limit 6`);
    const byDay = await tx.execute(sql`
      select to_char(d.day, 'MM-DD') as label, coalesce(sum(o.total), 0)::float as value
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') d(day)
      left join orders o on o.merchant_id = ${user.id} and date_trunc('day', o.created_at) = d.day
      group by d.day order by d.day`);
    const t = totals.rows[0] as { revenue: string; orders: number; aov: string };
    return {
      revenue: String(t.revenue),
      orders: t.orders,
      aov: String(t.aov),
      byStatus: byStatus.rows as unknown as { status: string; c: number }[],
      byCity: byCity.rows as unknown as { city: string; c: number }[],
      byDay: byDay.rows as unknown as { label: string; value: number }[],
    };
  });
  return <Analytics allowed plan={user.merchant.plan} data={data} currency={currency} />;
}
