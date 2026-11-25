import "server-only";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { rls } from "@/db/rls";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { PLAN_LIMITS, type Plan } from "@/lib/constants";
import { defaultSite, type SiteDoc } from "@/lib/site";

export type StoreRow = { settings: Record<string, unknown>; site: SiteDoc | Record<string, never>; site_published: SiteDoc | null; published_at: string | null };

export async function requireMerchant(): Promise<SessionUser & { merchant: NonNullable<SessionUser["merchant"]> }> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.merchant) redirect("/login");
  return user as SessionUser & { merchant: NonNullable<SessionUser["merchant"]> };
}

export function planLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/** Store row for the signed-in merchant — read through RLS. */
export async function getStore(userId: string): Promise<StoreRow> {
  return rls(userId, async (tx) => {
    const res = await tx.execute(sql`select settings, site, site_published, published_at from stores where merchant_id = ${userId}`);
    const row = res.rows[0] as StoreRow | undefined;
    return row ?? { settings: {}, site: {}, site_published: null, published_at: null };
  });
}

export function siteOf(store: StoreRow, storeName: string): SiteDoc {
  const doc = store.site as SiteDoc;
  if (doc && typeof doc === "object" && Array.isArray((doc as SiteDoc).blocks)) return doc;
  return defaultSite(storeName);
}

export async function dashboardData(userId: string, days: 7 | 30 | 90 = 30) {
  return rls(userId, async (tx) => {
    const [kpis, chart, top, low, recent, notif, products] = await Promise.all([
      tx.execute(sql`
        select
          coalesce(sum(total) filter (where created_at > now() - make_interval(days => ${days}::int) and status not in ('Cancelled', 'Refunded')), 0) as revenue30,
          coalesce(sum(total) filter (where created_at between now() - make_interval(days => ${days * 2}::int) and now() - make_interval(days => ${days}::int) and status not in ('Cancelled', 'Refunded')), 0) as revenue_prev,
          count(*) filter (where created_at > now() - make_interval(days => ${days}::int)) as orders30,
          count(*) filter (where created_at between now() - make_interval(days => ${days * 2}::int) and now() - make_interval(days => ${days}::int)) as orders_prev,
          count(*) as orders_total,
          count(distinct customer->>'phone') as customers
        from orders where merchant_id = ${userId}`),
      tx.execute(sql`
        select to_char(d.day, 'Mon DD') as label, coalesce(sum(o.total), 0)::float as value
        from generate_series(current_date - make_interval(days => ${Math.min(days, 30) - 1}::int), current_date, interval '1 day') d(day)
        left join orders o on o.merchant_id = ${userId} and o.status not in ('Cancelled', 'Refunded') and date_trunc('day', o.created_at) = d.day
        group by d.day order by d.day`),
      tx.execute(sql`select name, sold, price, image from products where merchant_id = ${userId} order by sold desc limit 5`),
      tx.execute(sql`select id, name, stock from products where merchant_id = ${userId} and stock <= 3 order by stock asc limit 5`),
      tx.execute(sql`select id, tracking_code, customer, total, status, payment, payment_status, created_at from orders where merchant_id = ${userId} order by created_at desc limit 6`),
      tx.execute(sql`select id, kind, title, text, read, created_at from notifications where merchant_id = ${userId} order by created_at desc limit 12`),
      tx.execute(sql`select count(*)::int as c from products where merchant_id = ${userId}`),
    ]);
    return {
      kpis: kpis.rows[0] as Record<string, string | number>,
      chart: chart.rows as { label: string; value: number }[],
      top: top.rows as { name: string; sold: number; price: string; image: string | null }[],
      low: low.rows as { id: string; name: string; stock: number }[],
      recent: recent.rows as Record<string, unknown>[],
      notifications: notif.rows as Record<string, unknown>[],
      productCount: (products.rows[0] as { c: number }).c,
    };
  });
}
