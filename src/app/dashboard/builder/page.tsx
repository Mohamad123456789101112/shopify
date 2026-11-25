import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { getSessionUser } from "@/lib/auth";
import { getStore, siteOf } from "@/lib/merchant";
import { Builder } from "@/components/builder/Builder";
import type { StoreProduct } from "@/lib/site-style";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.merchant) redirect("/login");
  if (!user.merchant.onboarded) redirect("/setup");

  const [store, products] = await Promise.all([
    getStore(user.id),
    rls(user.id, async (tx) => {
      const res = await tx.execute(sql`
        select id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge, sold, created_at
        from products where merchant_id = ${user.id} and status = 'active' order by created_at desc limit 60`);
      return res.rows as unknown as StoreProduct[];
    }),
  ]);

  return (
    <Builder
      initialSite={siteOf(store, user.merchant.storeName)}
      products={products}
      slug={user.merchant.storeSlug}
      plan={user.merchant.plan}
    />
  );
}
