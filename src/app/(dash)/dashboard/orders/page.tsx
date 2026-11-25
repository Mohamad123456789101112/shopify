import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { getStore, requireMerchant } from "@/lib/merchant";
import { Orders, type OrderRow } from "@/components/dashboard/Orders";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const [rows, store] = await Promise.all([
    rls(user.id, async (tx) => {
      const res = await tx.execute(sql`
        select id, tracking_code, customer, items, subtotal, discount, shipping, total, status, payment,
               payment_status, payment_ref, receipt_url, carrier, carrier_tracking, note, history, created_at
        from orders where merchant_id = ${user.id} order by created_at desc limit 300`);
      return res.rows as unknown as OrderRow[];
    }),
    getStore(user.id),
  ]);
  return <Orders rows={rows} currency={String((store.settings as { currency?: string }).currency ?? "EGP")} />;
}
