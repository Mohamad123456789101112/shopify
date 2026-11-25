import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { getStore, requireMerchant } from "@/lib/merchant";
import { Customers } from "@/components/dashboard/Sections";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const [rows, store] = await Promise.all([
    rls(user.id, async (tx) => {
      const res = await tx.execute(sql`
        select coalesce(customer->>'name', 'Guest') as name,
               coalesce(customer->>'phone', '') as phone,
               coalesce(max(customer->>'city'), '') as city,
               count(*)::int as orders, sum(total) as spent, max(created_at) as last
        from orders where merchant_id = ${user.id}
        group by 1, 2 order by max(created_at) desc limit 200`);
      return res.rows as unknown as { name: string; phone: string; city: string; orders: number; spent: string; last: string }[];
    }),
    getStore(user.id),
  ]);
  return <Customers rows={rows} currency={String((store.settings as { currency?: string }).currency ?? "EGP")} />;
}
