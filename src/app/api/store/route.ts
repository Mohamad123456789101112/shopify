import { isDatabaseConfigured, databaseUnavailableResponse, databaseServiceErrorResponse } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { rls, rateLimit } from "@/db/rls";
import { clientIp } from "@/lib/auth";

export const dynamic = "force-dynamic";

const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Storefront gateway — anonymous. Every privileged step happens inside a SECURITY DEFINER RPC. */
async function handlePost(req: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailableResponse();
  const body = (await req.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const d = body.data ?? {};
  const ip = await clientIp();
  const slug = s(d.slug, 40);

  try {
    if (!(await rateLimit(`store-api:${ip}:${slug}`, 30, 600, 600))) return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
    if (body.action === "order.place") {
      const items = Array.isArray(d.items)
        ? (d.items as Record<string, unknown>[]).slice(0, 30).map((i) => ({ productId: s(i.productId, 40), qty: Number(i.qty) || 1 }))
        : [];
      const customer = (d.customer ?? {}) as Record<string, unknown>;
      const res = await rls(null, async (tx) =>
        tx.execute(sql`select place_order(${slug}, ${JSON.stringify(customer)}::jsonb, ${JSON.stringify(items)}::jsonb,
          ${s(d.payment, 12) || "cod"}, ${s(d.note, 500)}, ${s(d.code, 24)}, ${s(d.ref, 64)}, ${s(d.receiptUrl, 500)}, ${ip}) as r`),
      );
      return NextResponse.json({ ok: true, order: (res.rows[0] as { r: unknown }).r });
    }

    if (body.action === "order.track") {
      const res = await rls(null, async (tx) =>
        tx.execute(sql`select track_order(${slug}, ${s(d.code, 24)}, ${s(d.phone, 20)}, ${ip}) as r`),
      );
      return NextResponse.json({ ok: true, order: (res.rows[0] as { r: unknown }).r });
    }

    if (body.action === "discount.check") {
      const subtotal = Number(d.subtotal) || 0;
      const code = s(d.code, 24).toUpperCase();
      const res = await rls(null, async (tx) =>
        tx.execute(sql`select check_discount(${slug}, ${code}, ${subtotal}) as r`),
      );
      return NextResponse.json((res.rows[0] as { r: unknown }).r);
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "failed";
    const map: Record<string, string> = {
      rate_limited: "Too many attempts. Please wait a few minutes.",
      store_not_found: "Store not found.",
      store_suspended: "This store is temporarily unavailable.",
      empty_cart: "Your cart is empty.",
      missing_customer: "Name and phone are required.",
      no_available_items: "Those items are out of stock.",
      not_found: "No order matches that code and phone number.",
      payment_not_supported: "That payment method is not available.",
    };
    const key = Object.keys(map).find((k) => raw.includes(k));
    return NextResponse.json({ ok: false, error: key ? map[key] : "Request failed" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try { return await handlePost(req); } catch { return databaseServiceErrorResponse(); }
}
