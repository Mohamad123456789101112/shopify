import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import { logSecurity, rls } from "@/db/rls";
import { BOOTSTRAP_SQL } from "@/db/sql";
import { getSessionUser, isOwnerDb } from "@/lib/auth";
import { AdminApp, type LogRow, type MerchantRow, type PaymentRow } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  // Anonymous → login. Hiding the route is not security: the DB check below is the real gate.
  if (!user) redirect("/login");

  const owner = await isOwnerDb(user.id);
  if (!owner) {
    await logSecurity("admin.denied", { path: "/admin" }, user.id);
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--panel2)] px-5">
        <div className="card card-lg max-w-[420px] p-10 text-center shadow-soft">
          <ShieldAlert size={28} className="mx-auto text-[#e0704a]" />
          <h1 className="display mt-4 text-[20px] font-extrabold">Access denied</h1>
          <p className="mt-2 text-[13px] text-[var(--dim)]">This area is reserved for platform owners. The attempt has been logged.</p>
          <Link href="/dashboard" className="btn btn-primary mt-5">Back to my dashboard</Link>
        </div>
      </main>
    );
  }

  const data = await rls(user.id, async (tx) => {
    const merchants = await tx.execute(sql`
      select m.id, m.email, m.store_name, m.store_slug, m.plan, m.billing, m.sub_status, m.suspended,
             m.plan_expires_at, m.created_at,
             (select count(*)::int from orders o where o.merchant_id = m.id) as orders,
             (select coalesce(sum(o.total), 0) from orders o where o.merchant_id = m.id) as revenue,
             (select count(*)::int from products p where p.merchant_id = m.id) as products
      from merchants m order by m.created_at desc limit 200`);
    const payments = await tx.execute(sql`
      select pp.id, pp.merchant_id, m.store_name, pp.plan, pp.billing, pp.amount, pp.method, pp.ref,
             pp.receipt_url, pp.status, pp.created_at, pp.note
      from plan_payments pp join merchants m on m.id = pp.merchant_id
      order by (pp.status = 'pending') desc, pp.created_at desc limit 100`);
    const audit = await tx.execute(sql`select id, at, actor, action, target_type, target_id, metadata from audit_logs order by at desc limit 60`);
    const security = await tx.execute(sql`select id, at, actor, type, meta from security_logs order by at desc limit 60`);
    const settings = await tx.execute(sql`select data from platform_settings where id = 1`);
    return {
      merchants: merchants.rows as unknown as MerchantRow[],
      payments: payments.rows as unknown as PaymentRow[],
      audit: audit.rows as unknown as LogRow[],
      security: security.rows as unknown as LogRow[],
      settings: ((settings.rows[0] as { data: Record<string, unknown> } | undefined)?.data ?? {}),
    };
  });

  return (
    <AdminApp
      merchants={data.merchants}
      payments={data.payments}
      audit={data.audit}
      security={data.security}
      settings={data.settings}
      sqlRef={BOOTSTRAP_SQL.trim()}
      email={user.email}
    />
  );
}
