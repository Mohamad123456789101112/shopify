"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ExternalLink, Search, Truck, X } from "lucide-react";
import { money, ORDER_STATUSES } from "@/lib/constants";
import { PageTitle } from "./Shell";

export type OrderRow = {
  id: number; tracking_code: string; customer: { name?: string; phone?: string; city?: string; email?: string; address?: string };
  items: { name: string; qty: number; price: number; image?: string | null }[];
  subtotal: string; discount: string; shipping: string; total: string; status: string;
  payment: string; payment_status: string; payment_ref: string | null; receipt_url: string | null;
  carrier: string | null; carrier_tracking: string | null; note: string | null; created_at: string;
  history: { at: string; label: string }[];
};

export function Orders({ rows, currency }: { rows: OrderRow[]; currency: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<OrderRow | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  const list = rows.filter((r) => (filter === "All" || r.status === filter) &&
    (q === "" || r.tracking_code.toLowerCase().includes(q.toLowerCase()) || (r.customer?.name ?? "").toLowerCase().includes(q.toLowerCase())));

  async function update(id: number, data: Record<string, unknown>) {
    await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "order.update", data: { id, ...data } }) });
    setOpen(null);
    router.refresh();
  }

  return (
    <>
      <PageTitle title="Orders" sub={`${rows.length} orders`} />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: "var(--border)" }}>
          <div className="relative">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--dim)]" />
            <input className="input ps-8 max-w-[240px]" placeholder="Search code or customer" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", ...ORDER_STATUSES].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`btn !py-1.5 !text-[11.5px] ${filter === s ? "btn-primary" : "btn-ghost"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--panel2)] text-[11px] uppercase tracking-wide text-[var(--dim)]">
              <tr><th className="p-3 text-start">Code</th><th className="text-start">Customer</th><th className="text-start">Items</th><th className="text-start">Total</th><th className="text-start">Payment</th><th className="text-start">Status</th><th /></tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-[12px] text-[var(--dim)]">No orders found.</td></tr>}
              {list.map((o) => (
                <tr key={o.id} className="cursor-pointer border-t hover:bg-[var(--panel2)]" style={{ borderColor: "var(--border)" }} onClick={() => { setOpen(o); setCarrier(o.carrier ?? ""); setTracking(o.carrier_tracking ?? ""); }}>
                  <td className="p-3 font-semibold">{o.tracking_code}</td>
                  <td>{o.customer?.name ?? "—"}<div className="text-[11px] text-[var(--dim)]">{o.customer?.city}</div></td>
                  <td>{o.items?.length ?? 0}</td>
                  <td>{money(o.total, currency)}</td>
                  <td>
                    <span className="pill bg-[var(--panel2)] uppercase">{o.payment}</span>
                    <div className={`text-[10.5px] ${o.payment_status === "paid" ? "text-emerald-600" : o.payment_status === "pending_review" ? "text-amber-600" : "text-[var(--dim)]"}`}>{o.payment_status}</div>
                  </td>
                  <td><span className="pill bg-[var(--panel2)]">{o.status}</span></td>
                  <td className="pe-3 text-end text-[var(--dim)]"><ExternalLink size={13} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(null)}>
          <aside className="h-full w-[min(460px,94vw)] overflow-y-auto bg-[var(--panel)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="display text-[18px] font-extrabold">{open.tracking_code}</div>
                <div className="text-[11.5px] text-[var(--dim)]">{new Date(open.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => setOpen(null)}><X size={18} /></button>
            </div>

            <div className="card mt-4 p-4">
              <div className="text-[12px] font-bold">Customer</div>
              <div className="mt-2 grid gap-1 text-[12.5px] text-[var(--dim)]">
                <span>{open.customer?.name}</span><span>{open.customer?.phone}</span>
                <span>{open.customer?.email}</span><span>{open.customer?.city} {open.customer?.address}</span>
              </div>
            </div>

            <div className="card mt-3 p-4">
              <div className="text-[12px] font-bold">Items</div>
              <div className="mt-2 grid gap-2">
                {open.items?.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-[12.5px]">
                    <span>{it.name} × {it.qty}</span><span>{money(Number(it.price) * it.qty, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-1 border-t pt-3 text-[12.5px]" style={{ borderColor: "var(--border)" }}>
                <Row l="Subtotal" v={money(open.subtotal, currency)} />
                <Row l="Discount" v={`-${money(open.discount, currency)}`} />
                <Row l="Shipping" v={money(open.shipping, currency)} />
                <div className="flex justify-between text-[14px] font-bold"><span>Total</span><span>{money(open.total, currency)}</span></div>
              </div>
            </div>

            <div className="card mt-3 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-bold">Payment · {open.payment}</div>
                <span className="pill bg-[var(--panel2)]">{open.payment_status}</span>
              </div>
              {open.payment_ref && <div className="mt-2 text-[12px]">Ref: <strong>{open.payment_ref}</strong></div>}
              {open.receipt_url && (
                <img src={open.receipt_url} alt="receipt" className="mt-2 h-28 w-full cursor-zoom-in rounded-lg object-cover" onClick={() => setLightbox(open.receipt_url)} />
              )}
              {open.payment !== "cod" && (
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-primary !py-2 !text-[12px]" onClick={() => update(open.id, { paymentStatus: "paid" })}><Check size={13} /> Confirm payment</button>
                  <button className="btn btn-ghost !py-2 !text-[12px]" onClick={() => update(open.id, { paymentStatus: "unpaid" })}>Reject</button>
                </div>
              )}
            </div>

            <div className="card mt-3 p-4">
              <div className="text-[12px] font-bold">Fulfilment</div>
              <div className="mt-2 grid gap-2">
                <select className="input" value={open.status} onChange={(e) => update(open.id, { status: e.target.value })}>
                  {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className="input" placeholder="Carrier (Bosta, Aramex…)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                <input className="input" placeholder="Carrier tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                <button className="btn btn-soft !text-[12px]" onClick={() => update(open.id, { carrier, carrierTracking: tracking })}>
                  <Truck size={13} /> Save shipping (auto-marks Shipped)
                </button>
              </div>
            </div>

            <div className="card mt-3 p-4">
              <div className="text-[12px] font-bold">Timeline</div>
              <div className="mt-2 grid gap-2">
                {(open.history ?? []).map((h, i) => (
                  <div key={i} className="flex gap-2 text-[11.5px] text-[var(--dim)]">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#e0704a]" />
                    <span>{h.label} — {new Date(h.at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          {lightbox && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
              <img src={lightbox} alt="receipt" className="max-h-[86vh] max-w-[90vw] rounded-xl object-contain" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between text-[var(--dim)]"><span>{l}</span><span>{v}</span></div>;
}
