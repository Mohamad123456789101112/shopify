import { getSessionUser } from "@/lib/auth";
import { MarketingShell } from "@/components/marketing/Shell";
import { HomeSections } from "@/components/marketing/HomeSections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  return (
    <MarketingShell authed={Boolean(user)}>
      <HomeSections />
    </MarketingShell>
  );
}
