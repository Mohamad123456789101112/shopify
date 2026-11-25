"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { THEMES } from "@/lib/themes";
import { CURRENCIES } from "@/lib/constants";

const CATEGORIES = ["Fashion", "Accessories", "Jewellery", "Abayas", "Bags", "Shoes", "Beauty", "Other"];

export function Wizard({ storeName, slug, plan }: { storeName: string; slug: string; plan: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [d, setD] = useState({
    storeName, slug, category: "Fashion", theme: "atelier", currency: "EGP",
    wallet: false, walletNumber: "", instapay: false, instapayNumber: "",
    product: { name: "", price: "", stock: "10", image: "" },
  });

  async function finish() {
    setBusy(true); setError("");
    const res = await fetch("/api/merchant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup.complete", data: { ...d, product: { ...d.product, price: Number(d.product.price) || 0, stock: Number(d.product.stock) || 0 } } }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setBusy(false);
    if (!data.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const steps = ["Brand", "Category", "Theme", "Payments", "First product"];

  return (
    <main className="min-h-screen bg-[var(--panel2)] px-5 py-10">
      <div className="mx-auto max-w-[720px]">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="pill bg-[var(--panel)] uppercase">{plan} plan</span>
        </div>

        <div className="mt-8 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i + 1 <= step ? "brand-grad" : "bg-[var(--border)]"}`} />
              <div className={`mt-2 text-[10.5px] ${i + 1 === step ? "font-bold" : "text-[var(--dim)]"}`}>{s}</div>
            </div>
          ))}
        </div>

        <div className="card card-lg mt-6 p-7 shadow-soft">
          {step === 1 && (
            <>
              <h1 className="display text-[22px] font-extrabold">Name your store</h1>
              <p className="mt-1 text-[13px] text-[var(--dim)]">This is what customers see at the top of your storefront.</p>
              <div className="mt-5 grid gap-3">
                <div><label className="label">Store name</label><input className="input" value={d.storeName} maxLength={40} onChange={(e) => setD({ ...d, storeName: e.target.value })} /></div>
                <div>
                  <label className="label">Store link</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] text-[var(--dim)]">/store/</span>
                    <input className="input" value={d.slug} maxLength={40} onChange={(e) => setD({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--dim)]">2–40 characters, lowercase letters, numbers and dashes. Reserved names get a suffix.</p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="display text-[22px] font-extrabold">What do you sell?</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setD({ ...d, category: c })} className={`btn ${d.category === c ? "btn-primary" : "btn-ghost"}`}>{c}</button>
                ))}
              </div>
              <div className="mt-5">
                <label className="label">Currency</label>
                <select className="input max-w-[160px]" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="display text-[22px] font-extrabold">Pick a theme</h1>
              <p className="mt-1 text-[13px] text-[var(--dim)]">You can change or customise it any time in the builder.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {THEMES.map((t) => (
                  <button key={t.id} onClick={() => setD({ ...d, theme: t.id })} className={`overflow-hidden rounded-2xl border text-start ${d.theme === t.id ? "ring-2 ring-[#e0704a]" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <div style={{ background: t.bg, color: t.text }} className="p-4">
                      <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: t.muted }}>{t.tag}</div>
                      <div className="mt-1.5 text-[18px] font-bold">{t.name} <span style={{ color: t.muted }}>{t.nameAr}</span></div>
                      <div className="mt-3 flex gap-1.5">
                        {[t.accent, t.surface, t.line].map((c) => <span key={c} className="h-5 w-5 rounded-full" style={{ background: c }} />)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="display text-[22px] font-extrabold">How will you get paid?</h1>
              <p className="mt-1 text-[13px] text-[var(--dim)]">Cash on delivery is always on. Wallets need the Growth plan.</p>
              <div className="mt-5 grid gap-3">
                <div className="card flex items-center justify-between p-4">
                  <div><div className="text-[13px] font-bold">Cash on delivery</div><div className="text-[11.5px] text-[var(--dim)]">Always enabled</div></div>
                  <Check size={16} className="text-emerald-600" />
                </div>
                <div className={`card p-4 ${plan === "free" ? "opacity-60" : ""}`}>
                  <label className="flex items-center justify-between text-[13px] font-bold">
                    Vodafone Cash
                    <input type="checkbox" disabled={plan === "free"} checked={d.wallet} onChange={(e) => setD({ ...d, wallet: e.target.checked })} />
                  </label>
                  <input className="input mt-2" placeholder="01xxxxxxxxx" disabled={plan === "free" || !d.wallet} value={d.walletNumber} onChange={(e) => setD({ ...d, walletNumber: e.target.value })} />
                </div>
                <div className={`card p-4 ${plan === "free" ? "opacity-60" : ""}`}>
                  <label className="flex items-center justify-between text-[13px] font-bold">
                    InstaPay
                    <input type="checkbox" disabled={plan === "free"} checked={d.instapay} onChange={(e) => setD({ ...d, instapay: e.target.checked })} />
                  </label>
                  <input className="input mt-2" placeholder="name@instapay" disabled={plan === "free" || !d.instapay} value={d.instapayNumber} onChange={(e) => setD({ ...d, instapayNumber: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="display text-[22px] font-extrabold">Add your first product</h1>
              <p className="mt-1 text-[13px] text-[var(--dim)]">Optional — you can skip and add products later.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className="label">Product name</label><input className="input" value={d.product.name} onChange={(e) => setD({ ...d, product: { ...d.product, name: e.target.value } })} /></div>
                <div><label className="label">Price</label><input className="input" type="number" value={d.product.price} onChange={(e) => setD({ ...d, product: { ...d.product, price: e.target.value } })} /></div>
                <div><label className="label">Stock</label><input className="input" type="number" value={d.product.stock} onChange={(e) => setD({ ...d, product: { ...d.product, stock: e.target.value } })} /></div>
                <div className="sm:col-span-2"><label className="label">Image URL</label><input className="input" placeholder="https://images.unsplash.com/…" value={d.product.image} onChange={(e) => setD({ ...d, product: { ...d.product, image: e.target.value } })} /></div>
              </div>
            </>
          )}

          {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

          <div className="mt-7 flex justify-between">
            <button className="btn btn-ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ArrowLeft size={14} /> Back</button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight size={14} /></button>
            ) : (
              <button className="btn btn-brand" onClick={finish} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : <Store size={14} />} Launch my store</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
