import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { PLAN_LIMITS } from "@/lib/constants";
import { requireMerchant } from "@/lib/merchant";
import { Marketing } from "@/components/dashboard/Sections";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const limits = PLAN_LIMITS[user.merchant.plan];
  const data = await rls(user.id, async (tx) => {
    const d = await tx.execute(sql`
      select id, code, type, value, uses, max_uses, active from discounts
      where merchant_id = ${user.id} order by created_at desc limit 100`);
    const c = await tx.execute(sql`
      select id, name, channel, status, open_rate from campaigns
      where merchant_id = ${user.id} order by created_at desc limit 50`);
    return { discounts: d.rows as unknown as never[], campaigns: c.rows as unknown as never[] };
  });
  return (
    <Marketing
      plan={user.merchant.plan}
      discounts={data.discounts}
      campaigns={data.campaigns}
      canDiscounts={limits.discounts}
      canCampaigns={limits.campaigns}
    />
  );
}
