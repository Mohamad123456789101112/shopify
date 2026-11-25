import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { rls, logAudit } from "@/db/rls";
import { getSessionUser, uniqueSlug } from "@/lib/auth";
import { PLAN_LIMITS, PLAN_PRICES, safeImageUrl } from "@/lib/constants";
import { defaultSite, sanitizeSite, type SiteDoc } from "@/lib/site";

export const dynamic = "force-dynamic";

type Body = { action?: string; data?: Record<string, unknown> };
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const n = (v: unknown, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => s(x, 40)).filter(Boolean).slice(0, 12) : []);

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailableResponse();
  const user = await getSessionUser();
  if (!user?.merchant) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const uid = user.id;
  const plan = user.merchant.plan;
  const limits = PLAN_LIMITS[plan];
  const body = (await req.json().catch(() => ({}))) as Body;
  const action = body.action ?? "";
  const d = body.data ?? {};

  try {
    switch (action) {
      case "product.save": {
        const id = s(d.id, 40);
        const name = s(d.name, 120);
        if (name.length < 1) return bad("Product name is required.");
        const payload = {
          name,
          description: s(d.description, 4000),
          price: Math.max(0, n(d.price)),
          compareAt: d.compareAt === null || d.compareAt === "" ? null : Math.max(0, n(d.compareAt)),
          stock: Math.max(0, Math.round(n(d.stock))),
          image: safeImageUrl(s(d.image, 500)),
          category: s(d.category, 60),
          collection: s(d.collection, 60),
          colors: arr(d.colors),
          sizes: arr(d.sizes),
          badge: s(d.badge, 24),
          status: s(d.status) === "draft" ? "draft" : "active",
        };
        return await rls(uid, async (tx) => {
          if (!id) {
            const count = await tx.execute(sql`select count(*)::int as c from products where merchant_id = ${uid}`);
            const c = (count.rows[0] as { c: number }).c;
            if (c >= limits.products) return bad(`Your ${plan} plan allows ${limits.products} products. Upgrade to add more.`);
            const res = await tx.execute(sql`
              insert into products(merchant_id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge, status)
              values (${uid}, ${payload.name}, ${payload.description}, ${payload.price}, ${payload.compareAt}, ${payload.stock},
                ${payload.image}, ${payload.category}, ${payload.collection}, ${payload.colors}, ${payload.sizes}, ${payload.badge}, ${payload.status})
              returning id`);
            return NextResponse.json({ ok: true, id: (res.rows[0] as { id: string }).id });
          }
          await tx.execute(sql`
            update products set name = ${payload.name}, description = ${payload.description}, price = ${payload.price},
              compare_at = ${payload.compareAt}, stock = ${payload.stock}, image = ${payload.image}, category = ${payload.category},
              collection = ${payload.collection}, colors = ${payload.colors}, sizes = ${payload.sizes}, badge = ${payload.badge},
              status = ${payload.status}
            where id = ${id} and merchant_id = ${uid}`);
          return NextResponse.json({ ok: true, id });
        });
      }

      case "product.delete": {
        const id = s(d.id, 40);
        await rls(uid, async (tx) => {
          await tx.execute(sql`delete from products where id = ${id} and merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true });
      }

      case "order.update": {
        const id = Math.round(n(d.id));
        const status = s(d.status, 20);
        const carrier = s(d.carrier, 60);
        const tracking = s(d.carrierTracking, 60);
        const paymentStatus = s(d.paymentStatus, 20);
        await rls(uid, async (tx) => {
          const allowedStatus = ["New", "Processing", "Shipped", "Delivered", "Refunded", "Cancelled"];
          const nextStatus = allowedStatus.includes(status) ? status : null;
          const nextPay = ["paid", "unpaid", "pending_review", "refunded"].includes(paymentStatus) ? paymentStatus : null;
          await tx.execute(sql`
            update orders set
              status = coalesce(${nextStatus}, case when ${tracking} <> '' and status = 'New' then 'Shipped' else status end),
              carrier = coalesce(nullif(${carrier}, ''), carrier),
              carrier_tracking = coalesce(nullif(${tracking}, ''), carrier_tracking),
              payment_status = coalesce(${nextPay}, payment_status),
              paid_at = case when ${nextPay} = 'paid' then now() else paid_at end,
              history = history || jsonb_build_object('at', now(), 'label',
                coalesce(${nextStatus}, case when ${nextPay} is not null then 'Payment ' || ${nextPay} else 'Updated' end))
            where id = ${id} and merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true });
      }

      case "discount.save": {
        if (!limits.discounts) return bad("Discount codes require the Growth plan.");
        const id = s(d.id, 40);
        const code = s(d.code, 24).toUpperCase().replace(/[^A-Z0-9-]/g, "");
        if (code.length < 3) return bad("Code must be 3-24 characters (A-Z, 0-9, -).");
        const type = ["percent", "fixed", "freeShipping"].includes(s(d.type)) ? s(d.type) : "percent";
        await rls(uid, async (tx) => {
          if (id) {
            await tx.execute(sql`
              update discounts set code = ${code}, type = ${type}, value = ${Math.max(0, n(d.value))},
                max_uses = ${d.maxUses ? Math.round(n(d.maxUses)) : null}, active = ${Boolean(d.active)},
                min_order = ${Math.max(0, n(d.minOrder))}, max_discount = ${d.maxDiscount ? Math.max(0, n(d.maxDiscount)) : null},
                expires_at = ${s(d.expiresAt, 40) || null}, once_per_customer = ${Boolean(d.oncePerCustomer)},
                description = ${s(d.description, 200)}
              where id = ${id} and merchant_id = ${uid}`);
          } else {
            await tx.execute(sql`
              insert into discounts(merchant_id, code, type, value, max_uses, active, min_order, max_discount, expires_at, once_per_customer, description)
              values (${uid}, ${code}, ${type}, ${Math.max(0, n(d.value))}, ${d.maxUses ? Math.round(n(d.maxUses)) : null},
                ${d.active !== false}, ${Math.max(0, n(d.minOrder))}, ${d.maxDiscount ? Math.max(0, n(d.maxDiscount)) : null},
                ${s(d.expiresAt, 40) || null}, ${Boolean(d.oncePerCustomer)}, ${s(d.description, 200)})
              on conflict (merchant_id, code) do nothing`);
          }
        });
        return NextResponse.json({ ok: true });
      }

      case "discount.delete": {
        await rls(uid, async (tx) => {
          await tx.execute(sql`delete from discounts where id = ${s(d.id, 40)} and merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true });
      }

      case "campaign.save": {
        if (!limits.campaigns) return bad("Campaigns require the Pro plan.");
        await rls(uid, async (tx) => {
          await tx.execute(sql`
            insert into campaigns(merchant_id, name, channel, audience, status, sent_at, open_rate)
            values (${uid}, ${s(d.name, 80)}, ${s(d.channel) === "whatsapp" ? "whatsapp" : "email"},
              ${s(d.audience, 40) || "all"}, ${s(d.status) === "sent" ? "sent" : "draft"},
              ${s(d.status) === "sent" ? new Date().toISOString() : null}, ${Math.round(n(d.openRate))})`);
        });
        return NextResponse.json({ ok: true });
      }

      case "campaign.delete": {
        await rls(uid, async (tx) => {
          await tx.execute(sql`delete from campaigns where id = ${s(d.id, 40)} and merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true });
      }

      case "settings.save": {
        const settings = (d.settings ?? {}) as Record<string, unknown>;
        const storeName = s(d.storeName, 40);
        const payments = d.payments ? JSON.stringify(d.payments) : null;
        await rls(uid, async (tx) => {
          await tx.execute(sql`update stores set settings = ${JSON.stringify(settings)}::jsonb where merchant_id = ${uid}`);
          if (payments) {
            await tx.execute(sql`
              update stores set
                site = jsonb_set(site, '{checkout,payments}', coalesce(site->'checkout'->'payments', '{}'::jsonb) || ${payments}::jsonb, true),
                site_published = case when site_published is null then null
                  else jsonb_set(site_published, '{checkout,payments}', coalesce(site_published->'checkout'->'payments', '{}'::jsonb) || ${payments}::jsonb, true) end
              where merchant_id = ${uid} and site ? 'checkout'`);
          }
          if (storeName.length >= 2) {
            await tx.execute(sql`update merchants set store_name = ${storeName} where id = ${uid}`);
          }
        });
        return NextResponse.json({ ok: true });
      }

      case "site.save": {
        const site = d.site as SiteDoc;
        if (!site || typeof site !== "object") return bad("Invalid site document.");
        await rls(uid, async (tx) => {
          await tx.execute(sql`update stores set site = ${JSON.stringify(site)}::jsonb where merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
      }

      case "site.publish": {
        const incoming = (d.site ?? null) as SiteDoc | null;
        const clean = sanitizeSite(incoming ?? defaultSite(user.merchant.storeName), plan);
        const settingsPatch = {
          currency: clean.brand.currency,
          shippingFee: clean.brand.shippingFee,
          freeShippingThreshold: clean.brand.freeShippingThreshold,
          codFee: clean.checkout.payments.cod.fee,
          paymentsPublic: {
            cod: clean.checkout.payments.cod.enabled,
            wallet: clean.checkout.payments.wallet.enabled && plan !== "free" && Boolean(clean.checkout.payments.wallet.number),
            instapay: clean.checkout.payments.instapay.enabled && plan !== "free" && Boolean(clean.checkout.payments.instapay.number),
          },
        };
        await rls(uid, async (tx) => {
          await tx.execute(sql`
            update stores set site = ${JSON.stringify(clean)}::jsonb, site_published = ${JSON.stringify(clean)}::jsonb,
              published_at = now(), settings = coalesce(settings, '{}'::jsonb) || ${JSON.stringify(settingsPatch)}::jsonb
            where merchant_id = ${uid}`);
          await tx.execute(sql`update media set is_public = true where merchant_id = ${uid} and kind in ('logo','favicon','product')`);
        });
        await logAudit(uid, "site.publish", "store", uid, { plan });
        return NextResponse.json({ ok: true, publishedAt: new Date().toISOString() });
      }

      case "notifications.read": {
        await rls(uid, async (tx) => {
          await tx.execute(sql`update notifications set read = true where merchant_id = ${uid}`);
        });
        return NextResponse.json({ ok: true });
      }

      case "billing.request": {
        const planWanted = s(d.plan) === "pro" ? "pro" : "growth";
        const billing = s(d.billing) === "yearly" ? "yearly" : "monthly";
        const method = s(d.method) === "instapay" ? "instapay" : "wallet";
        const ref = s(d.ref, 64);
        if (ref.length < 3) return bad("Enter the transfer reference (at least 3 characters).");
        const amount = PLAN_PRICES[planWanted][billing];
        await rls(uid, async (tx) => {
          await tx.execute(sql`
            insert into plan_payments(merchant_id, plan, billing, amount, method, ref, receipt_url, status)
            values (${uid}, ${planWanted}, ${billing}, ${amount}, ${method}, ${ref}, ${safeImageUrl(s(d.receiptUrl, 500)) || null}, 'pending')`);
        });
        await logAudit(uid, "plan_payment.submit", "merchant", uid, { plan: planWanted, billing, amount });
        return NextResponse.json({ ok: true });
      }

      case "setup.complete": {
        const storeName = s(d.storeName, 40) || user.merchant.storeName;
        const theme = s(d.theme, 20) || "atelier";
        const wantSlug = s(d.slug, 40);
        const site = defaultSite(storeName, theme);
        site.brand.currency = s(d.currency, 5) || "EGP";
        site.brand.whatsappFloat = true;
        site.checkout.payments.wallet.number = s(d.walletNumber, 20);
        site.checkout.payments.wallet.enabled = Boolean(d.wallet) && plan !== "free" && Boolean(s(d.walletNumber, 20));
        site.checkout.payments.instapay.number = s(d.instapayNumber, 40);
        site.checkout.payments.instapay.enabled = Boolean(d.instapay) && plan !== "free" && Boolean(s(d.instapayNumber, 40));
        const clean = sanitizeSite(site, plan);
        const slug = wantSlug && wantSlug !== user.merchant.storeSlug ? await uniqueSlug(wantSlug) : user.merchant.storeSlug;
        const settings = {
          currency: clean.brand.currency,
          shippingFee: clean.brand.shippingFee,
          freeShippingThreshold: clean.brand.freeShippingThreshold,
          codFee: 0,
          category: s(d.category, 40),
          paymentsPublic: {
            cod: true,
            wallet: clean.checkout.payments.wallet.enabled,
            instapay: clean.checkout.payments.instapay.enabled,
          },
        };
        const firstProduct = d.product as Record<string, unknown> | undefined;
        await rls(uid, async (tx) => {
          await tx.execute(sql`update merchants set store_name = ${storeName}, store_slug = ${slug}, onboarded = true where id = ${uid}`);
          await tx.execute(sql`
            update stores set site = ${JSON.stringify(clean)}::jsonb, site_published = ${JSON.stringify(clean)}::jsonb,
              published_at = now(), settings = ${JSON.stringify(settings)}::jsonb where merchant_id = ${uid}`);
          if (firstProduct && s(firstProduct.name, 120)) {
            await tx.execute(sql`
              insert into products(merchant_id, name, price, stock, image, category, status)
              values (${uid}, ${s(firstProduct.name, 120)}, ${Math.max(0, n(firstProduct.price))},
                ${Math.max(0, Math.round(n(firstProduct.stock, 10)))}, ${safeImageUrl(s(firstProduct.image, 500))},
                ${s(d.category, 40)}, 'active')`);
          }
        });
        await logAudit(uid, "merchant.onboarded", "merchant", uid, { slug, theme });
        return NextResponse.json({ ok: true, slug });
      }

      case "store.reset": {
        await rls(uid, async (tx) => {
          await tx.execute(sql`delete from orders where merchant_id = ${uid}`);
          await tx.execute(sql`delete from products where merchant_id = ${uid}`);
          await tx.execute(sql`delete from discounts where merchant_id = ${uid}`);
          await tx.execute(sql`delete from campaigns where merchant_id = ${uid}`);
        });
        await logAudit(uid, "store.reset", "merchant", uid, {});
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ ok: false, error: message.slice(0, 200) }, { status: 400 });
  }
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
