import { notFound } from "next/navigation";
import { getPublicProduct, getPublicStore } from "@/lib/store-data";
import { StoreView } from "@/components/store/StoreView";
import { Suspended } from "@/components/store/Suspended";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();
  if (store.suspended) return <Suspended name={store.storeName} />;
  const product = await getPublicProduct(slug, id);
  return (
    <StoreView
      site={store.site}
      products={store.products}
      slug={slug}
      route={product ? "product" : "404"}
      product={product}
    />
  );
}
