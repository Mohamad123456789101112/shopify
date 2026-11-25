import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { getSessionUser } from "@/lib/auth";
import { DashboardShell, type Notif } from "@/components/dashboard/Shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.merchant) redirect("/login");
  if (!user.merchant.onboarded) redirect("/setup");

  const notifications = await rls(user.id, async (tx) => {
    const res = await tx.execute(sql`
      select id, kind, title, text, read, created_at from notifications
      where merchant_id = ${user.id} order by created_at desc limit 15`);
    return res.rows as unknown as Notif[];
  });

  return (
    <DashboardShell
      name={user.merchant.storeName}
      storeSlug={user.merchant.storeSlug}
      plan={user.merchant.plan}
      unread={notifications.filter((n) => !n.read).length}
      notifications={notifications}
      isOwner={user.isOwner}
    >
      {children}
    </DashboardShell>
  );
}
