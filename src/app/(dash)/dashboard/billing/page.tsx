import { sql } from "drizzle-orm";
import { privileged, rls } from "@/db/rls";
import { requireMerchant } from "@/lib/merchant";
import { Billing } from "@/components/dashboard/Sections";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireMerchant();
  const requests = await rls(user.id, async (tx) => {
    const res = await tx.execute(sql`
      select id, plan, billing, amount, method, ref, status, created_at from plan_payments
      where merchant_id = ${user.id} order by created_at desc limit 50`);
    return res.rows as unknown as never[];
  });
  const settings = await privileged(async (tx) => {
    const res = await tx.execute(sql`select data from platform_settings where id = 1`);
    return (res.rows[0] as { data: Record<string, string> } | undefined)?.data ?? {};
  });
  return (
    <Billing
      plan={user.merchant.plan}
      billing={user.merchant.billing}
      expiresAt={user.merchant.planExpiresAt}
      subStatus={user.merchant.subStatus}
      requests={requests}
      walletNumber={String(settings.walletNumber ?? "01000000000")}
      instapayHandle={String(settings.instapayHandle ?? "brandly@instapay")}
    />
  );
}
