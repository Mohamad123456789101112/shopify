import { getStore, requireMerchant, siteOf } from "@/lib/merchant";
import { Settings } from "@/components/dashboard/Sections";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const store = await getStore(user.id);
  const site = siteOf(store, user.merchant.storeName);
  return (
    <Settings
      storeName={user.merchant.storeName}
      slug={user.merchant.storeSlug}
      plan={user.merchant.plan}
      settings={store.settings}
      payments={{
        cod: { enabled: site.checkout.payments.cod.enabled, fee: site.checkout.payments.cod.fee },
        wallet: { enabled: site.checkout.payments.wallet.enabled, number: site.checkout.payments.wallet.number },
        instapay: { enabled: site.checkout.payments.instapay.enabled, number: site.checkout.payments.instapay.number },
      }}
    />
  );
}
