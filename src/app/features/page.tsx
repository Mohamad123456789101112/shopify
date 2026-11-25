import { getSessionUser } from "@/lib/auth";
import { MarketingShell } from "@/components/marketing/Shell";
import { MarketingBody } from "@/components/marketing/StaticPages";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  return (
    <MarketingShell authed={Boolean(user)}>
      <MarketingBody slug="features" />
    </MarketingShell>
  );
}
