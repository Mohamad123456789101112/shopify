"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { money, PLAN_PRICES } from "@/lib/constants";
import { PageTitle, UpgradeNote } from "./Shell";

async function post(action: string, data: Record<string, unknown> = {}) {
  const res = await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) });
  return (await res.json()) as { ok: boolean; error?: string };
}

/* ── CUSTOMERS ─────────────────────────────────────────────── */
export function Customers({ rows, currency }: { rows: { name: string; phone: string; city: string; orders: number; spent: string; last: string }[]; currency: string }) {
  return (
    <>
      <PageTitle title="Customers" sub={`${rows.length} customers derived from your orders`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[var(--panel2)] text-[11px] uppercase tracking-wide text-[var(--dim)]">
            <tr><th className="p-3 text-start">Name</th><th className="text-start">Phone</th><th className="text-start">City</th><th className="text-start">Orders</th><th className="text-start">Spent</th><th className="text-start">Last order</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-[12px] text-[var(--dim)]">No customers yet.</td></tr>}
            {rows.map((c) => (
              <tr key={c.phone} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="p-3 font-semibold">{c.name}</td><td>{c.phone}</td><td>{c.city}</td>
                <td>{c.orders}</td><td>{money(c.spent, currency)}</td><td>{new Date(c.last).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── ANALYTICS ─────────────────────────────────────────────── */
export function Analytics({ allowed, plan, data, currency }: {
  allowed: boolean; plan: string; currency: string;
  data: { revenue: string; orders: number; aov: string; byStatus: { status: string; c: number }[]; byCity: { city: string; c: number }[]; byDay: { label: string; value: number }[] };
}) {
  if (!allowed) return (<><PageTitle title="Analytics" /><UpgradeNote plan={plan} need="Growth" feature="Analytics" /></>);
  const max = Math.max(1, ...data.byDay.map((d) => d.value));
  return (
    <>
      <PageTitle title="Analytics" sub="Last 30 days" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Revenue" value={money(data.revenue, currency)} />
        <Kpi label="Orders" value={String(data.orders)} />
        <Kpi label="Average order" value={money(data.aov, currency)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="text-[13px] font-bold">Revenue by day</div>
          <div className="mt-4 flex h-[180px] items-end gap-1">
            {data.byDay.map((d, i) => <div key={i} className="flex-1 rounded-t brand-grad" style={{ height: `${Math.max(3, (d.value / max) * 160)}px` }} title={`${d.label}: ${d.value}`} />)}
          </div>
        </div>
        <div className="grid gap-4">
          <div className="card p-5">
            <div className="text-[13px] font-bold">Orders by status</div>
            {data.byStatus.map((s) => <div key={s.status} className="mt-2 flex justify-between text-[12.5px]"><span>{s.status}</span><span className="font-semibold">{s.c}</span></div>)}
          </div>
          <div className="card p-5">
            <div className="text-[13px] font-bold">Top cities</div>
            {data.byCity.map((s) => <div key={s.city} className="mt-2 flex justify-between text-[12.5px]"><span>{s.city || "—"}</span><span className="font-semibold">{s.c}</span></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11.5px] text-[var(--dim)]">{label}</div>
      <div className="display mt-1 text-[21px] font-extrabold">{value}</div>
    </div>
  );
}

/* ── MARKETING ─────────────────────────────────────────────── */
export function Marketing({ plan, discounts, campaigns, canDiscounts, canCampaigns }: {
  plan: string; canDiscounts: boolean; canCampaigns: boolean;
  discounts: { id: string; code: string; type: string; value: string; uses: number; max_uses: number | null; active: boolean }[];
  campaigns: { id: string; name: string; channel: string; status: string; open_rate: number }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", type: "percent", value: "10", minOrder: "0", maxUses: "", active: true });
  const [camp, setCamp] = useState({ name: "", channel: "email" });
  const [err, setErr] = useState("");

  return (
    <>
      <PageTitle title="Marketing" sub="Discount codes and campaigns" />
      {!canDiscounts ? <UpgradeNote plan={plan} need="Growth" feature="Discount codes" /> : (
        <div className="card p-5">
          <div className="text-[13px] font-bold">Discount codes</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px_110px_110px_auto]">
            <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent</option><option value="fixed">Fixed</option><option value="freeShipping">Free shipping</option>
            </select>
            <input className="input" type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <input className="input" type="number" placeholder="Max uses" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            <button className="btn btn-primary" onClick={async () => {
              const r = await post("discount.save", { ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxUses: form.maxUses ? Number(form.maxUses) : null });
              if (!r.ok) setErr(r.error ?? "Failed"); else { setErr(""); setForm({ ...form, code: "" }); router.refresh(); }
            }}><Plus size={14} /> Add</button>
          </div>
          {err && <div className="mt-2 text-[12px] text-red-600">{err}</div>}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[11px] uppercase text-[var(--dim)]"><tr><th className="py-2 text-start">Code</th><th className="text-start">Type</th><th className="text-start">Value</th><th className="text-start">Used</th><th className="text-start">Active</th><th /></tr></thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 font-semibold">{d.code}</td><td>{d.type}</td><td>{d.value}</td>
                    <td>{d.uses}{d.max_uses ? `/${d.max_uses}` : ""}</td>
                    <td>{d.active ? <Check size={14} className="text-emerald-600" /> : "—"}</td>
                    <td className="text-end"><button className="btn btn-ghost !px-2 !py-1 text-red-500" onClick={async () => { await post("discount.delete", { id: d.id }); router.refresh(); }}><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4">
        {!canCampaigns ? <UpgradeNote plan={plan} need="Pro" feature="Campaigns" /> : (
          <div className="card p-5">
            <div className="text-[13px] font-bold">Campaigns</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className="input max-w-[240px]" placeholder="Campaign name" value={camp.name} onChange={(e) => setCamp({ ...camp, name: e.target.value })} />
              <select className="input max-w-[160px]" value={camp.channel} onChange={(e) => setCamp({ ...camp, channel: e.target.value })}>
                <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
              </select>
              <button className="btn btn-primary" onClick={async () => { await post("campaign.save", camp); setCamp({ ...camp, name: "" }); router.refresh(); }}><Plus size={14} /> Create</button>
            </div>
            <div className="mt-4 grid gap-2">
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--panel2)] px-3 py-2 text-[12.5px]">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-[var(--dim)]">{c.channel} · {c.status} · {c.open_rate}% open</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── SETTINGS ──────────────────────────────────────────────── */
export function Settings({ storeName, slug, plan, settings, payments }: {
  storeName: string; slug: string; plan: string;
  settings: Record<string, unknown>;
  payments: { wallet: { enabled: boolean; number: string }; instapay: { enabled: boolean; number: string }; cod: { enabled: boolean; fee: number } };
}) {
  const router = useRouter();
  const [name, setName] = useState(storeName);
  const [s, setS] = useState({
    currency: String(settings.currency ?? "EGP"),
    shippingFee: Number(settings.shippingFee ?? 60),
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? 1500),
    codFee: Number(settings.codFee ?? 0),
  });
  const [pay, setPay] = useState(payments);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await post("settings.save", {
      storeName: name,
      settings: { ...settings, ...s, paymentsPublic: { cod: pay.cod.enabled, wallet: pay.wallet.enabled && plan !== "free" && !!pay.wallet.number, instapay: pay.instapay.enabled && plan !== "free" && !!pay.instapay.number } },
      payments: {
        cod: { enabled: pay.cod.enabled, fee: Number(pay.cod.fee) || 0, label: "Cash on delivery", note: "Pay the courier when it arrives" },
        wallet: { enabled: pay.wallet.enabled && plan !== "free", number: pay.wallet.number, label: "Vodafone Cash", note: "Send the total then paste the reference" },
        instapay: { enabled: pay.instapay.enabled && plan !== "free", number: pay.instapay.number, label: "InstaPay", note: "Transfer then upload the receipt" },
      },
    });
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 1800); router.refresh();
  }

  return (
    <>
      <PageTitle title="Settings" sub="Store details, payments and danger zone" action={<button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : saved ? <Check size={14} /> : null} Save changes</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="text-[13px] font-bold">Store details</div>
          <div className="mt-3 grid gap-3">
            <div><label className="label">Store name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></div>
            <div>
              <label className="label">Store link</label>
              <div className="flex items-center gap-2">
                <input className="input" value={`/store/${slug}`} readOnly />
                <button className="btn btn-soft" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/store/${slug}`)}><Copy size={14} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Currency</label>
                <select className="input" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
                  {["EGP", "SAR", "AED", "USD", "EUR", "KWD"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Shipping fee</label><input className="input" type="number" value={s.shippingFee} onChange={(e) => setS({ ...s, shippingFee: Number(e.target.value) })} /></div>
              <div><label className="label">Free shipping over</label><input className="input" type="number" value={s.freeShippingThreshold} onChange={(e) => setS({ ...s, freeShippingThreshold: Number(e.target.value) })} /></div>
              <div><label className="label">COD fee</label><input className="input" type="number" value={s.codFee} onChange={(e) => setS({ ...s, codFee: Number(e.target.value) })} /></div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[13px] font-bold">Payment methods</div>
          <div className="mt-3 grid gap-3">
            <Toggle label="Cash on delivery" checked={pay.cod.enabled} onChange={(v) => setPay({ ...pay, cod: { ...pay.cod, enabled: v } })} />
            <div className={plan === "free" ? "opacity-50" : ""}>
              <Toggle label="Vodafone Cash" checked={pay.wallet.enabled} onChange={(v) => setPay({ ...pay, wallet: { ...pay.wallet, enabled: v } })} disabled={plan === "free"} />
              <input className="input mt-2" placeholder="Wallet number" value={pay.wallet.number} onChange={(e) => setPay({ ...pay, wallet: { ...pay.wallet, number: e.target.value } })} disabled={plan === "free"} />
            </div>
            <div className={plan === "free" ? "opacity-50" : ""}>
              <Toggle label="InstaPay" checked={pay.instapay.enabled} onChange={(v) => setPay({ ...pay, instapay: { ...pay.instapay, enabled: v } })} disabled={plan === "free"} />
              <input className="input mt-2" placeholder="InstaPay handle" value={pay.instapay.number} onChange={(e) => setPay({ ...pay, instapay: { ...pay.instapay, number: e.target.value } })} disabled={plan === "free"} />
            </div>
            {plan === "free" && <p className="text-[11.5px] text-[var(--dim)]">Wallet payments require the Growth plan.</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[13px] font-bold">Custom domain</div>
          <p className="mt-1 text-[12px] text-[var(--dim)]">{plan === "pro" ? "Point a CNAME to stores.brandly.app and we verify it automatically." : "Custom domains are available on the Pro plan."}</p>
          <input className="input mt-3" placeholder="shop.yourbrand.com" disabled={plan !== "pro"} />
        </div>

        <div className="card border-red-200 p-5">
          <div className="text-[13px] font-bold text-red-600">Danger zone</div>
          <p className="mt-1 text-[12px] text-[var(--dim)]">Delete all products, orders, discounts and campaigns. This cannot be undone.</p>
          <button className="btn btn-ghost mt-3 text-red-600" onClick={async () => { if (confirm("Reset store data?")) { await post("store.reset"); router.refresh(); } }}>
            <Trash2 size={14} /> Reset store data
          </button>
        </div>
      </div>
    </>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12.5px] font-medium">
      {label}
      <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full transition ${checked ? "bg-[#e0704a]" : "bg-[var(--border)]"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
      </button>
    </label>
  );
}

/* ── BILLING ───────────────────────────────────────────────── */
export function Billing({ plan, billing, expiresAt, subStatus, requests, walletNumber, instapayHandle }: {
  plan: string; billing: string; expiresAt: string | null; subStatus: string;
  requests: { id: string; plan: string; billing: string; amount: string; method: string; ref: string; status: string; created_at: string }[];
  walletNumber: string; instapayHandle: string;
}) {
  const router = useRouter();
  const [yearly, setYearly] = useState(billing === "yearly");
  const [modal, setModal] = useState<null | "growth" | "pro">(null);
  const [step, setStep] = useState(1);
  const [ref, setRef] = useState("");
  const [receipt, setReceipt] = useState("");
  const [method, setMethod] = useState<"wallet" | "instapay">("wallet");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const days = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000) : null;
  const amount = modal ? PLAN_PRICES[modal][yearly ? "yearly" : "monthly"] : 0;

  async function submit() {
    if (!modal) return;
    setBusy(true); setErr("");
    const r = await post("billing.request", { plan: modal, billing: yearly ? "yearly" : "monthly", method, ref, receiptUrl: receipt });
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "Failed"); return; }
    setModal(null); setStep(1); setRef(""); setReceipt("");
    router.refresh();
  }

  async function upload(file: File) {
    const fd = new FormData(); fd.append("file", file); fd.append("kind", "receipt");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
    if (data.ok) setReceipt(data.url ?? ""); else setErr(data.error ?? "Upload failed");
  }

  return (
    <>
      <PageTitle title="Billing" sub="Plan, payments and invoices" />
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11.5px] text-[var(--dim)]">Current plan</div>
            <div className="display text-[22px] font-extrabold capitalize">{plan}</div>
            <div className="text-[12px] text-[var(--dim)]">
              Status: {subStatus}{days !== null ? ` · ${days > 0 ? `${days} days left` : "expired"}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border p-1" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setYearly(false)} className={`btn !py-1.5 !text-[12px] ${!yearly ? "btn-primary" : ""}`}>Monthly</button>
            <button onClick={() => setYearly(true)} className={`btn !py-1.5 !text-[12px] ${yearly ? "btn-primary" : ""}`}>Yearly · save 20%</button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(["growth", "pro"] as const).map((p) => (
          <div key={p} className="card p-5">
            <div className="text-[14px] font-bold capitalize">{p}</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="display text-[26px] font-extrabold">{PLAN_PRICES[p][yearly ? "yearly" : "monthly"].toLocaleString()}</span>
              <span className="mb-1 text-[11.5px] text-[var(--dim)]">EGP {yearly ? "/year" : "/month"}</span>
            </div>
            <ul className="mt-3 grid gap-1.5 text-[12.5px] text-[var(--dim)]">
              {(p === "growth"
                ? ["100 products", "Full site builder", "Discount codes", "Analytics", "No BLY branding"]
                : ["Unlimited products", "Campaigns", "CSV export", "Custom domain", "Custom CSS"]
              ).map((x) => <li key={x} className="flex items-center gap-2"><Check size={13} className="text-[#e0704a]" /> {x}</li>)}
            </ul>
            <button className="btn btn-brand mt-4 w-full" onClick={() => { setModal(p); setStep(1); }}>Upgrade with Vodafone Cash</button>
          </div>
        ))}
      </div>

      <div className="mt-4 card p-5">
        <div className="text-[13px] font-bold">My requests &amp; invoices</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-[11px] uppercase text-[var(--dim)]"><tr><th className="py-2 text-start">Date</th><th className="text-start">Plan</th><th className="text-start">Amount</th><th className="text-start">Method</th><th className="text-start">Ref</th><th className="text-start">Status</th></tr></thead>
            <tbody>
              {requests.length === 0 && <tr><td colSpan={6} className="py-3 text-[12px] text-[var(--dim)]">No payment requests yet.</td></tr>}
              {requests.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="capitalize">{r.plan} · {r.billing}</td>
                  <td>{money(r.amount, "EGP")}</td><td>{r.method}</td><td>{r.ref}</td>
                  <td><span className={`pill ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="card card-lg w-full max-w-[460px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-bold capitalize">Upgrade to {modal}</div>
            <div className="mt-1 text-[12px] text-[var(--dim)]">Step {step} of 3 · {money(amount, "EGP")}</div>
            <div className="mt-4 h-1 w-full rounded bg-[var(--panel2)]"><div className="h-1 rounded brand-grad" style={{ width: `${(step / 3) * 100}%` }} /></div>

            {step === 1 && (
              <div className="mt-4 grid gap-3">
                <div className="flex gap-2">
                  <button className={`btn flex-1 ${method === "wallet" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMethod("wallet")}>Vodafone Cash</button>
                  <button className={`btn flex-1 ${method === "instapay" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMethod("instapay")}>InstaPay</button>
                </div>
                <div className="rounded-xl bg-[var(--panel2)] p-4">
                  <div className="text-[11.5px] text-[var(--dim)]">Send {money(amount, "EGP")} to</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="display text-[18px] font-extrabold">{method === "wallet" ? walletNumber : instapayHandle}</span>
                    <button className="btn btn-soft !py-1.5" onClick={() => navigator.clipboard?.writeText(method === "wallet" ? walletNumber : instapayHandle)}><Copy size={13} /></button>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setStep(2)}>I sent the money</button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-4 grid gap-3">
                <div><label className="label">Transfer reference</label><input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 8829301" /></div>
                {ref.length > 0 && ref.length < 3 && <p className="text-[11.5px] text-red-600">Reference must be at least 3 characters.</p>}
                <div className="flex gap-2">
                  <button className="btn btn-ghost flex-1" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary flex-1" disabled={ref.length < 3} onClick={() => setStep(3)}>Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-4 grid gap-3">
                <label className="btn btn-soft w-full"><Upload size={14} /> Upload receipt (optional)
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
                {receipt && <img src={receipt} alt="" className="h-28 w-full rounded-xl object-cover" />}
                {err && <div className="text-[12px] text-red-600">{err}</div>}
                <div className="flex gap-2">
                  <button className="btn btn-ghost flex-1" onClick={() => setStep(2)}>Back</button>
                  <button className="btn btn-brand flex-1" onClick={submit} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : null} Submit for approval</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
