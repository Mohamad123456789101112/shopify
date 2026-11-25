import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-data";
import { StoreView } from "@/components/store/StoreView";
import { Suspended } from "@/components/store/Suspended";

export const dynamic = "force-dynamic";

export default async function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();
  if (store.suspended) return <Suspended name={store.storeName} />;
  return <StoreView site={store.site} products={store.products} slug={slug} route="home" />;
}
