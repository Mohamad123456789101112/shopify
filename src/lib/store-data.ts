import "server-only";
import { isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { defaultSite, type SiteDoc } from "@/lib/site";
import { publishedSite, type StoreProduct } from "@/lib/site-style";

export type PublicStore = {
  slug: string;
  storeName: string;
  suspended: boolean;
  site: SiteDoc;
  products: StoreProduct[];
};

/** Anonymous storefront read — only the safe public view and active products are reachable. */
export async function getPublicStore(slug: string): Promise<PublicStore | null> {
  if (!isDatabaseConfigured() || !/^[a-z0-9-]{2,40}$/.test(slug)) return null;
  return rls(null, async (tx) => {
    const st = await tx.execute(sql`
      select slug, store_name, suspended, plan, site_published from public_stores where slug = ${slug} limit 1`);
    const row = st.rows[0] as { slug: string; store_name: string; suspended: boolean; site_published: unknown } | undefined;
    if (!row) return null;
    const products = await tx.execute(sql`
      select id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge, sold, created_at
      from public_products where slug = ${slug} order by created_at desc limit 200`);
    return {
      slug: row.slug,
      storeName: row.store_name,
      suspended: row.suspended,
      site: publishedSite(row.site_published) ?? defaultSite(row.store_name),
      products: products.rows as unknown as StoreProduct[],
    };
  });
}

export async function getPublicProduct(slug: string, id: string): Promise<StoreProduct | null> {
  if (!isDatabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return rls(null, async (tx) => {
    const res = await tx.execute(sql`
      select id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge, sold, created_at
      from public_products where slug = ${slug} and id = ${id} limit 1`);
    return (res.rows[0] as unknown as StoreProduct) ?? null;
  });
}
