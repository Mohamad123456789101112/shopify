"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Database, Loader2, RefreshCw, Shield, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { money } from "@/lib/constants";

export type MerchantRow = {
  id: string; email: string; store_name: string; store_slug: string; plan: string; billing: string;
  sub_status: string; suspended: boolean; plan_expires_at: string | null; created_at: string;
  orders: number; revenue: string; products: number;
};
export type PaymentRow = {
  id: string; merchant_id: string; store_name: string; plan: string; billing: string; amount: string;
  method: string; ref: string; receipt_url: string | null; status: string; created_at: string; note: string | null;
};
export type LogRow = { id: string; at: string; actor: string | null; action?: string; type?: string; target_type?: string | null; target_id?: string | null; metadata?: unknown; meta?: unknown };

const TABS = ["Merchants", "Plan payments", "Subscriptions", "Settings", "SQL", "Security"] as const;

async function post(action: string, data: Record<string, unknown>) {
  const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) });
  return (await res.json()) as { ok: boolean; error?: string; result?: unknown };
}

export function AdminApp({ merchants, payments, audit, security, settings, sqlRef, email }: {
  merchants: MerchantRow[]; payments: PaymentRow[]; audit: LogRow[]; security: LogRow[];
  settings: Record<string, unknown>; sqlRef: string; email: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Merchants");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [cfg, setCfg] = useState({
    walletNumber: String(settings.walletNumber ?? ""),
    instapayHandle: String(settings.instapayHandle ?? ""),
    graceDays: Number(settings.graceDays ?? 5),
  });
  const [sweep, setSweep] = useState<string>("");

  const pending = payments.filter((p) => p.status === "pending");
  const mrr = merchants.filter((m) => m.plan !== "free" && m.sub_status === "active").length;

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    await post("payment.decide", { id, approve, note });
    setBusy(""); setNote("");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--panel2)]">
      <header className="flex h-16 items-center justify-between border-b bg-[var(--panel)] px-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Logo href="/admin" />
          <span className="pill bg-[#111] text-white">PLATFORM OWNER</span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--dim)]">
          <Shield size={14} /> {email}
          <button className="btn btn-ghost !py-2 !text-[12px]" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}>Sign out</button>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 border-b bg-[var(--panel)] px-5" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-3 text-[12.5px] font-semibold ${tab === t ? "border-b-2 border-[#e0704a]" : "text-[var(--dim)]"}`}>
            {t}{t === "Plan payments" && pending.length > 0 ? ` (${pending.length})` : ""}
          </button>
        ))}
      </div>

      <main className="p-5">
        {tab === "Merchants" && (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-4">
              <Kpi label="Merchants" value={String(merchants.length)} />
              <Kpi label="Paying" value={String(mrr)} />
              <Kpi label="Suspended" value={String(merchants.filter((m) => m.suspended).length)} />
              <Kpi label="Pending payments" value={String(pending.length)} />
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-[var(--panel2)] text-[11px] uppercase text-[var(--dim)]">
                  <tr><th className="p-3 text-start">Store</th><th className="text-start">Plan</th><th className="text-start">Status</th><th className="text-start">Products</th><th className="text-start">Orders</th><th className="text-start">Revenue</th><th /></tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3">
                        <div className="font-semibold">{m.store_name}</div>
                        <a className="text-[11px] text-[var(--dim)]" href={`/store/${m.store_slug}`} target="_blank" rel="noreferrer">/store/{m.store_slug}</a>
                      </td>
                      <td>
                        <select className="input !py-1 !text-[11.5px]" value={m.plan} onChange={async (e) => { await post("merchant.plan", { id: m.id, plan: e.target.value, months: 1 }); router.refresh(); }}>
                          {["free", "growth", "pro"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td><span className={`pill ${m.suspended ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>{m.suspended ? "suspended" : m.sub_status}</span></td>
                      <td>{m.products}</td><td>{m.orders}</td><td>{money(m.revenue, "EGP")}</td>
                      <td className="pe-3 text-end">
                        <button className="btn btn-ghost !py-1 !text-[11px]" onClick={async () => { await post("merchant.suspend", { id: m.id, suspended: !m.suspended, reason: "Policy review" }); router.refresh(); }}>
                          {m.suspended ? "Restore" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "Plan payments" && (
          <div className="grid gap-3">
            {payments.length === 0 && <div className="card p-5 text-[12.5px] text-[var(--dim)]">No payment requests yet.</div>}
            {payments.map((p) => (
              <div key={p.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-[13px] font-bold">{p.store_name} · {p.plan} ({p.billing})</div>
                  <div className="text-[12px] text-[var(--dim)]">{money(p.amount, "EGP")} · {p.method} · ref {p.ref} · {new Date(p.created_at).toLocaleString()}</div>
                  {p.note && <div className="text-[11.5px] text-[var(--dim)]">Note: {p.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noreferrer" className="btn btn-ghost !py-1.5 !text-[11.5px]">Receipt</a>}
                  {p.status === "pending" ? (
                    <>
                      <input className="input max-w-[170px] !py-1.5 !text-[11.5px]" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                      <button className="btn btn-primary !py-1.5 !text-[11.5px]" disabled={busy === p.id} onClick={() => decide(p.id, true)}>
                        {busy === p.id ? <Loader2 size={12} className="spin" /> : <Check size={12} />} Approve
                      </button>
                      <button className="btn btn-ghost !py-1.5 !text-[11.5px] text-red-600" onClick={() => decide(p.id, false)}><X size={12} /> Reject</button>
                    </>
                  ) : (
                    <span className={`pill ${p.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{p.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Subscriptions" && (
          <div className="grid gap-4">
            <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="text-[13px] font-bold">Subscription sweep</div>
                <div className="text-[12px] text-[var(--dim)]">Runs daily at 03:00 via pg_cron. Warn → grace → expire based on the grace window.</div>
              </div>
              <button className="btn btn-primary" onClick={async () => { const r = await post("sweep.run", {}); setSweep(JSON.stringify(r.result)); router.refresh(); }}>
                <RefreshCw size={14} /> Run now
              </button>
            </div>
            {sweep && <div className="card p-4 font-mono text-[11.5px]">{sweep}</div>}
            <div className="card overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-[var(--panel2)] text-[11px] uppercase text-[var(--dim)]">
                  <tr><th className="p-3 text-start">Store</th><th className="text-start">Plan</th><th className="text-start">Status</th><th className="text-start">Expires</th></tr>
                </thead>
                <tbody>
                  {merchants.filter((m) => m.plan !== "free").map((m) => (
                    <tr key={m.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3">{m.store_name}</td><td className="capitalize">{m.plan} · {m.billing}</td>
                      <td>{m.sub_status}</td><td>{m.plan_expires_at ? new Date(m.plan_expires_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Settings" && (
          <div className="card max-w-[520px] p-5">
            <div className="text-[13px] font-bold">Platform settings</div>
            <div className="mt-3 grid gap-3">
              <div><label className="label">Vodafone Cash number</label><input className="input" value={cfg.walletNumber} onChange={(e) => setCfg({ ...cfg, walletNumber: e.target.value })} /></div>
              <div><label className="label">InstaPay handle</label><input className="input" value={cfg.instapayHandle} onChange={(e) => setCfg({ ...cfg, instapayHandle: e.target.value })} /></div>
              <div><label className="label">Grace days</label><input className="input" type="number" value={cfg.graceDays} onChange={(e) => setCfg({ ...cfg, graceDays: Number(e.target.value) })} /></div>
              <button className="btn btn-primary" onClick={async () => { await post("settings.save", { data: cfg }); router.refresh(); }}>Save settings</button>
            </div>
          </div>
        )}

        {tab === "SQL" && (
          <div className="card p-5">
            <div className="flex items-center gap-2 text-[13px] font-bold"><Database size={15} /> Security layer (applied automatically)</div>
            <p className="mt-1 text-[12px] text-[var(--dim)]">RLS policies, guard triggers, SECURITY DEFINER RPCs and the public views that power storefronts.</p>
            <pre className="mt-3 max-h-[60vh] overflow-auto rounded-xl bg-[#0f0f10] p-4 text-[11px] leading-relaxed text-[#d6d3cd]">{sqlRef}</pre>
          </div>
        )}

        {tab === "Security" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="text-[13px] font-bold">Security logs</div>
              <div className="mt-3 grid gap-2 max-h-[60vh] overflow-y-auto">
                {security.map((l) => (
                  <div key={l.id} className="rounded-xl bg-[var(--panel2)] p-2 text-[11.5px]">
                    <div className="font-semibold">{l.type}</div>
                    <div className="text-[var(--dim)]">{new Date(l.at).toLocaleString()} · {JSON.stringify(l.meta)}</div>
                  </div>
                ))}
                {security.length === 0 && <p className="text-[12px] text-[var(--dim)]">No events.</p>}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-[13px] font-bold">Audit logs (append-only)</div>
              <div className="mt-3 grid gap-2 max-h-[60vh] overflow-y-auto">
                {audit.map((l) => (
                  <div key={l.id} className="rounded-xl bg-[var(--panel2)] p-2 text-[11.5px]">
                    <div className="font-semibold">{l.action}</div>
                    <div className="text-[var(--dim)]">{new Date(l.at).toLocaleString()} · {l.target_type} {l.target_id?.slice(0, 8)}</div>
                  </div>
                ))}
                {audit.length === 0 && <p className="text-[12px] text-[var(--dim)]">No events.</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
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
