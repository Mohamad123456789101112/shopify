import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { logAudit, logSecurity, rls } from "@/db/rls";
import { getSessionUser, isOwnerDb } from "@/lib/auth";

export const dynamic = "force-dynamic";

const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailableResponse();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  // Server-side owner check backed by is_platform_owner() — never trusts the client.
  const owner = await isOwnerDb(user.id);
  if (!owner) {
    await logSecurity("admin.denied", { path: "/api/admin" }, user.id);
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const d = body.data ?? {};

  try {
    switch (body.action) {
      case "payment.decide": {
        await rls(user.id, async (tx) => {
          await tx.execute(sql`select approve_plan_payment(${s(d.id, 40)}::uuid, ${Boolean(d.approve)}, ${s(d.note, 200)})`);
        });
        return NextResponse.json({ ok: true });
      }
      case "merchant.suspend": {
        const id = s(d.id, 40);
        const suspended = Boolean(d.suspended);
        await rls(user.id, async (tx) => {
          await tx.execute(sql`
            update merchants set suspended = ${suspended}, suspended_reason = ${suspended ? s(d.reason, 200) || "Policy review" : null}
            where id = ${id}::uuid`);
          await tx.execute(sql`
            insert into notifications(merchant_id, kind, title, text) values (${id}::uuid,
              ${suspended ? "danger" : "info"}, ${suspended ? "Store suspended" : "Store restored"},
              ${suspended ? s(d.reason, 200) || "Contact support." : "Your store is live again."})`);
        });
        await logAudit(user.id, suspended ? "merchant.suspend" : "merchant.restore", "merchant", id, {});
        return NextResponse.json({ ok: true });
      }
      case "merchant.plan": {
        const id = s(d.id, 40);
        const plan = ["free", "growth", "pro"].includes(s(d.plan)) ? s(d.plan) : "free";
        const months = Number(d.months) || 1;
        await rls(user.id, async (tx) => {
          await tx.execute(sql`
            update merchants set plan = ${plan}, sub_status = 'active',
              plan_started_at = coalesce(plan_started_at, now()),
              plan_expires_at = case when ${plan} = 'free' then null
                else greatest(coalesce(plan_expires_at, now()), now()) + make_interval(months => ${months}) end
            where id = ${id}::uuid`);
        });
        await logAudit(user.id, "merchant.plan", "merchant", id, { plan, months });
        return NextResponse.json({ ok: true });
      }
      case "settings.save": {
        const data = (d.data ?? {}) as Record<string, unknown>;
        await rls(user.id, async (tx) => {
          await tx.execute(sql`
            update platform_settings set data = coalesce(data, '{}'::jsonb) || ${JSON.stringify(data)}::jsonb where id = 1`);
        });
        await logAudit(user.id, "platform.settings", "platform", "1", {});
        return NextResponse.json({ ok: true });
      }
      case "sweep.run": {
        const res = await rls(user.id, async (tx) => tx.execute(sql`select subscription_sweep() as r`));
        return NextResponse.json({ ok: true, result: (res.rows[0] as { r: unknown }).r });
      }
      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err instanceof Error ? err.message : "failed").slice(0, 200) }, { status: 400 });
  }
}
