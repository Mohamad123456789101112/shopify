"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Download, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { money } from "@/lib/constants";
import { PageTitle } from "./Shell";

export type ProductRow = {
  id: string; name: string; description: string | null; price: string; compare_at: string | null;
  stock: number; image: string | null; category: string | null; collection: string | null;
  colors: string[] | null; sizes: string[] | null; badge: string | null; status: string; sold: number;
};

const SWATCHES = ["#111111", "#ffffff", "#e0704a", "#c9a75a", "#8b5e3c", "#1f4e79", "#d67b8a", "#3a2f2a", "#6f6a64", "#e0ff3c", "#b07a5a", "#f4f1ec"];
const empty = { id: "", name: "", description: "", price: "", compareAt: "", stock: "10", image: "", category: "", collection: "", colors: [] as string[], sizes: [] as string[], badge: "", status: "active" };

export function Products({ rows, plan, limit, currency, canCsv }: { rows: ProductRow[]; plan: string; limit: number; currency: string; canCsv: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof empty | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const list = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const atLimit = rows.length >= limit;

  async function save() {
    if (!form) return;
    setBusy(true); setError("");
    const res = await fetch("/api/merchant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "product.save", data: { ...form, price: Number(form.price) || 0, compareAt: form.compareAt === "" ? null : Number(form.compareAt), stock: Number(form.stock) || 0 } }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setBusy(false);
    if (!data.ok) { setError(data.error ?? "Failed"); return; }
    setForm(null);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "product.delete", data: { id } }) });
    router.refresh();
  }

  async function upload(file: File) {
    setBusy(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "product");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
    setBusy(false);
    if (!data.ok) { setError(data.error ?? "Upload failed"); return; }
    setForm((f) => (f ? { ...f, image: data.url ?? "" } : f));
  }

  function exportCsv() {
    const head = "name,price,compare_at,stock,category,collection,status,sold\n";
    const body = rows.map((r) => [r.name, r.price, r.compare_at ?? "", r.stock, r.category ?? "", r.collection ?? "", r.status, r.sold].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "products.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle
        title="Products"
        sub={`${rows.length} of ${limit === Infinity ? "unlimited" : limit} on the ${plan} plan`}
        action={
          <div className="flex gap-2">
            {canCsv && <button onClick={exportCsv} className="btn btn-ghost"><Download size={14} /> CSV</button>}
            <button className="btn btn-primary" disabled={atLimit} onClick={() => setForm({ ...empty })}><Plus size={15} /> Add product</button>
          </div>
        }
      />

      {atLimit && (
        <div className="card mb-4 flex items-center justify-between gap-3 p-4">
          <span className="text-[12.5px]">You reached the {limit}-product limit of the {plan} plan.</span>
          <a href="/dashboard/billing" className="btn btn-brand !py-2 !text-[12px]">Upgrade</a>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b p-3" style={{ borderColor: "var(--border)" }}>
          <input className="input max-w-[260px]" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--panel2)] text-[11px] uppercase tracking-wide text-[var(--dim)]">
              <tr>
                <th className="p-3 text-start">Product</th><th className="text-start">Price</th><th className="text-start">Stock</th>
                <th className="text-start">Category</th><th className="text-start">Status</th><th className="text-start">Sold</th><th />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-[12px] text-[var(--dim)]">No products yet.</td></tr>}
              {list.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 overflow-hidden rounded-lg bg-[var(--panel2)]">{r.image ? <img src={r.image} alt="" className="h-full w-full object-cover" /> : null}</span>
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        {r.badge && <span className="pill bg-[#e0704a]/10 text-[#e0704a]">{r.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td>{money(r.price, currency)}</td>
                  <td><span className={`pill ${r.stock === 0 ? "bg-red-100 text-red-600" : r.stock <= 3 ? "bg-amber-100 text-amber-700" : "bg-[var(--panel2)]"}`}>{r.stock}</span></td>
                  <td>{r.category ?? "—"}</td>
                  <td><span className="pill bg-[var(--panel2)] capitalize">{r.status}</span></td>
                  <td>{r.sold}</td>
                  <td className="pe-3 text-end">
                    <button className="btn btn-ghost !px-2 !py-1.5" onClick={() => setForm({
                      id: r.id, name: r.name, description: r.description ?? "", price: r.price, compareAt: r.compare_at ?? "",
                      stock: String(r.stock), image: r.image ?? "", category: r.category ?? "", collection: r.collection ?? "",
                      colors: r.colors ?? [], sizes: r.sizes ?? [], badge: r.badge ?? "", status: r.status,
                    })}><Pencil size={13} /></button>
                    <button className="btn btn-ghost !px-2 !py-1.5 ms-1 text-red-500" onClick={() => remove(r.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="card card-lg max-h-[90vh] w-full max-w-[620px] overflow-y-auto p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="display text-[17px] font-bold">{form.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setForm(null)}><X size={17} /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></div>
              <div><label className="label">Price</label><input className="input" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label className="label">Compare at</label><input className="input" type="number" min={0} step="0.01" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} /></div>
              <div><label className="label">Stock</label><input className="input" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><label className="label">Badge</label><input className="input" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} maxLength={24} /></div>
              <div><label className="label">Category</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="label">Collection</label><input className="input" value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <label className="label">Image</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="https:// or upload" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  <button className="btn btn-soft" onClick={() => fileRef.current?.click()}><Upload size={14} /></button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </div>
                {form.image && <img src={form.image} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover" />}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Colour swatches</label>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, colors: form.colors.includes(c) ? form.colors.filter((x) => x !== c) : [...form.colors, c] })}
                      className={`h-7 w-7 rounded-full border-2 ${form.colors.includes(c) ? "border-[#e0704a]" : "border-[var(--border)]"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="draft">Draft</option>
                </select>
              </div>
            </div>
            {error && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : null} Save product</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
