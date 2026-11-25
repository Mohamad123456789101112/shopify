import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { PLAN_LIMITS } from "@/lib/constants";
import { getStore, requireMerchant } from "@/lib/merchant";
import { Products, type ProductRow } from "@/components/dashboard/Products";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const [rows, store] = await Promise.all([
    rls(user.id, async (tx) => {
      const res = await tx.execute(sql`
        select id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge, status, sold
        from products where merchant_id = ${user.id} order by created_at desc`);
      return res.rows as unknown as ProductRow[];
    }),
    getStore(user.id),
  ]);
  const limits = PLAN_LIMITS[user.merchant.plan];
  return (
    <Products
      rows={rows}
      plan={user.merchant.plan}
      limit={limits.products}
      canCsv={limits.csv}
      currency={String((store.settings as { currency?: string }).currency ?? "EGP")}
    />
  );
}
