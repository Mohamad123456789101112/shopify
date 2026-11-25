"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, Copy, ExternalLink, Package, Plus, TriangleAlert } from "lucide-react";
import { money } from "@/lib/constants";

type Props = {
  name: string;
  slug: string;
  plan: string;
  suspended: boolean;
  suspendedReason: string | null;
  kpis: Record<string, string | number>;
  chart: { label: string; value: number }[];
  top: { name: string; sold: number; price: string; image: string | null }[];
  low: { id: string; name: string; stock: number }[];
  recent: Record<string, unknown>[];
  productCount: number;
  currency: string;
};

const pct = (now: number, prev: number) => (prev <= 0 ? (now > 0 ? 100 : 0) : Math.round(((now - prev) / prev) * 100));

export function Overview(p: Props) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/store/${p.slug}` : `/store/${p.slug}`;
  const revenue = Number(p.kpis.revenue30 ?? 0);
  const revenuePrev = Number(p.kpis.revenue_prev ?? 0);
  const orders = Number(p.kpis.orders30 ?? 0);
  const ordersPrev = Number(p.kpis.orders_prev ?? 0);
  const ordersTotal = Number(p.kpis.orders_total ?? 0);
  const customers = Number(p.kpis.customers ?? 0);
  const max = Math.max(1, ...p.chart.map((c) => c.value));
  const [hover, setHover] = useState<number | null>(null);

  const kpis = [
    { label: "Revenue (30d)", value: money(revenue, p.currency), delta: pct(revenue, revenuePrev) },
    { label: "Orders (30d)", value: String(orders), delta: pct(orders, ordersPrev) },
    { label: "Customers", value: String(customers), delta: 0 },
    { label: "Products", value: String(p.productCount), delta: 0 },
  ];

  const steps = [
    { label: "Add your first product", done: p.productCount > 0, href: "/dashboard/products" },
    { label: "Design your storefront", done: true, href: "/dashboard/builder" },
    { label: "Share your store link", done: ordersTotal > 0, href: `/store/${p.slug}` },
  ];

  return (
    <div className="grid gap-5">
      {p.suspended && (
        <div className="card flex items-center gap-3 border-red-300 bg-red-50 p-4 text-red-700 dark:bg-red-500/10">
          <TriangleAlert size={18} />
          <div>
            <div className="text-[13px] font-bold">Your store is suspended</div>
            <div className="text-[12px]">{p.suspendedReason ?? "Contact support to restore your store."}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[24px] font-extrabold tracking-tight">Good day, {p.name} 👋</h1>
          <p className="mt-1 text-[12.5px] text-[var(--dim)]">Here is what is happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border bg-[var(--panel)] px-3 py-2 text-[12px]" style={{ borderColor: "var(--border)" }}>
            <span className="text-[var(--dim)]">/store/{p.slug}</span>
            <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); }} className="text-[#e0704a]">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <a href={`/store/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn-primary"><ExternalLink size={14} /> Open store</a>
        </div>
      </div>

      {ordersTotal < 3 && (
        <div className="card grid gap-3 p-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--panel2)]">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ${s.done ? "bg-emerald-500 text-white" : "bg-[var(--panel2)]"}`}>
                {s.done ? <Check size={14} /> : i + 1}
              </span>
              <span className="text-[12.5px] font-semibold">{s.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-[11.5px] text-[var(--dim)]">{k.label}</div>
            <div className="display mt-1 text-[21px] font-extrabold">{k.value}</div>
            {k.delta !== 0 && (
              <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${k.delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                <ArrowUpRight size={12} className={k.delta >= 0 ? "" : "rotate-90"} /> {k.delta}% vs prev 30d
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold">Sales overview</div>
            <div className="text-[11.5px] text-[var(--dim)]">Last 14 days</div>
          </div>
          <div className="relative mt-5 flex h-[180px] items-end gap-1.5">
            {p.chart.map((c, i) => (
              <div key={c.label + i} className="group relative flex-1" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="w-full rounded-t-md brand-grad transition-all" style={{ height: `${Math.max(3, (c.value / max) * 160)}px`, opacity: hover === null || hover === i ? 1 : 0.45 }} />
                {hover === i && (
                  <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111] px-2 py-1 text-[10.5px] text-white">
                    {c.label}: {money(c.value, p.currency)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[13px] font-bold">Top products</div>
          <div className="mt-3 grid gap-2.5">
            {p.top.length === 0 && <p className="text-[12px] text-[var(--dim)]">No sales yet.</p>}
            {p.top.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="h-9 w-9 overflow-hidden rounded-lg bg-[var(--panel2)]">
                  {t.image ? <img src={t.image} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold">{t.name}</div>
                  <div className="text-[11px] text-[var(--dim)]">{t.sold} sold</div>
                </div>
                <span className="text-[12px] font-bold">{money(t.price, p.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold">Recent orders</div>
            <Link href="/dashboard/orders" className="text-[11.5px] font-semibold text-[#e0704a]">View all</Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-wide text-[var(--dim)]">
                <tr><th className="py-2 text-start">Code</th><th className="text-start">Customer</th><th className="text-start">Total</th><th className="text-start">Status</th></tr>
              </thead>
              <tbody>
                {p.recent.length === 0 && <tr><td colSpan={4} className="py-3 text-[12px] text-[var(--dim)]">No orders yet.</td></tr>}
                {p.recent.map((o) => {
                  const cust = o.customer as { name?: string };
                  return (
                    <tr key={String(o.id)} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="py-2 font-semibold">{String(o.tracking_code)}</td>
                      <td>{cust?.name ?? "—"}</td>
                      <td>{money(String(o.total), p.currency)}</td>
                      <td><span className="pill bg-[var(--panel2)]">{String(o.status)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-[13px] font-bold"><AlertTriangle size={14} className="text-amber-500" /> Low stock</div>
            <div className="mt-3 grid gap-2">
              {p.low.length === 0 && <p className="text-[12px] text-[var(--dim)]">Everything is well stocked.</p>}
              {p.low.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-[12.5px]">
                  <span>{l.name}</span>
                  <span className={`pill ${l.stock === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{l.stock} left</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-[13px] font-bold">Quick actions</div>
            <div className="mt-3 grid gap-2">
              <Link href="/dashboard/products" className="btn btn-soft w-full justify-start !text-[12px]"><Plus size={14} /> Add product</Link>
              <Link href="/dashboard/builder" className="btn btn-soft w-full justify-start !text-[12px]"><Package size={14} /> Edit storefront</Link>
              <Link href="/dashboard/marketing" className="btn btn-soft w-full justify-start !text-[12px]">Create a discount</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
