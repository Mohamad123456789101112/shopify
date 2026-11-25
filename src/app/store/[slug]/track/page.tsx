import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-data";
import { StoreView } from "@/components/store/StoreView";
import { Suspended } from "@/components/store/Suspended";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug } = await params;
  const { code } = await searchParams;
  const store = await getPublicStore(slug);
  if (!store) notFound();
  if (store.suspended) return <Suspended name={store.storeName} />;
  return (
    <StoreView
      site={store.site}
      products={store.products}
      slug={slug}
      route="track"
      trackCode={(code ?? "").slice(0, 24)}
    />
  );
}
