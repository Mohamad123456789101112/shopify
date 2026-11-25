"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, ChevronDown, Copy, Eye, EyeOff, GripVertical, Loader2, Lock, Monitor,
  Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, Upload,
} from "lucide-react";
import { Icon } from "@/components/Icon";
import { StoreView, type StoreRoute } from "@/components/store/StoreView";
import { PALETTES, FONTS, ANIMATIONS, LOOP_ANIMATIONS, IMAGE_FILTERS, CURRENCIES, PLAN_LIMITS } from "@/lib/constants";
import { THEMES } from "@/lib/themes";
import { BLOCKS, BLOCK_TYPES, newBlock, themeLayout, themeVars, type Block, type BlockType, type Field, type SiteDoc } from "@/lib/site";
import type { StoreProduct } from "@/lib/site-style";

type Tab = "sections" | "pages" | "theme" | "brand";
const DEVICES = { desktop: 1200, tablet: 834, mobile: 390 } as const;

export function Builder({ initialSite, products, slug, plan }: { initialSite: SiteDoc; products: StoreProduct[]; slug: string; plan: "free" | "growth" | "pro" }) {
  const limits = PLAN_LIMITS[plan];
  const [site, setSite] = useState<SiteDoc>(initialSite);
  const [tab, setTab] = useState<Tab>(limits.builder ? "sections" : "brand");
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [route, setRoute] = useState<StoreRoute>("home");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
  const [adding, setAdding] = useState(false);
  const undo = useRef<SiteDoc[]>([]);
  const redo = useRef<SiteDoc[]>([]);
  const timer = useRef<number | null>(null);

  const commit = useCallback((next: SiteDoc) => {
    undo.current = [...undo.current.slice(-59), site];
    redo.current = [];
    setSite(next);
  }, [site]);

  const save = useCallback(async (doc: SiteDoc) => {
    setSaving("saving");
    await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "site.save", data: { site: doc } }) });
    setSaving("saved");
    window.setTimeout(() => setSaving("idle"), 1400);
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(site), 1200);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [site, save]);

  const publish = useCallback(async () => {
    setPublishing(true);
    await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "site.publish", data: { site } }) });
    setPublishing(false);
    setSaving("saved");
  }, [site]);

  const doUndo = useCallback(() => {
    const prev = undo.current.pop();
    if (!prev) return;
    redo.current = [...redo.current.slice(-59), site];
    setSite(prev);
  }, [site]);

  const doRedo = useCallback(() => {
    const next = redo.current.pop();
    if (!next) return;
    undo.current = [...undo.current.slice(-59), site];
    setSite(next);
  }, [site]);

  const removeBlock = useCallback((id: string) => {
    commit({ ...site, blocks: site.blocks.filter((b) => b.id !== id) });
    setSelected(null);
  }, [commit, site]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); void publish(); }
      else if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); doUndo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); doRedo(); }
      else if (e.key === "Delete" && selected && site.blocks.some((b) => b.id === selected)) { removeBlock(selected); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doUndo, doRedo, publish, removeBlock, selected, site.blocks]);

  const block = useMemo(() => site.blocks.find((b) => b.id === selected) ?? null, [site.blocks, selected]);

  const patchBlock = (id: string, patch: Partial<Block>) =>
    commit({ ...site, blocks: site.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });

  const move = (id: string, dir: -1 | 1) => {
    const i = site.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= site.blocks.length) return;
    const copy = [...site.blocks];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    commit({ ...site, blocks: copy });
  };

  const locked = (t: Tab) => !limits.builder && t !== "brand";

  return (
    <div className="flex h-screen flex-col bg-[var(--panel2)]">
      {/* toolbar */}
      <header className="flex h-14 items-center justify-between gap-3 border-b bg-[var(--panel)] px-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn btn-ghost !px-2.5 !py-2"><ArrowLeft size={15} /></Link>
          <span className="display text-[13px] font-extrabold">Site builder</span>
          <span className="pill bg-[var(--panel2)] uppercase">{plan}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full border p-1" style={{ borderColor: "var(--border)" }}>
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button key={d} onClick={() => setDevice(d)} className={`btn !px-2.5 !py-1.5 ${device === d ? "btn-primary" : ""}`} title={`${DEVICES[d]}px`}>
              {d === "desktop" ? <Monitor size={14} /> : d === "tablet" ? <Tablet size={14} /> : <Smartphone size={14} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={doUndo} className="btn btn-ghost !px-2.5 !py-2" title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
          <button onClick={doRedo} className="btn btn-ghost !px-2.5 !py-2" title="Redo (Ctrl+Y)"><Redo2 size={14} /></button>
          <span className="text-[11.5px] text-[var(--dim)]">
            {saving === "saving" ? "Saving…" : saving === "saved" ? "All changes saved" : "Autosave on"}
          </span>
          <a href={`/store/${slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost !text-[12px]">Open store</a>
          <button onClick={publish} className="btn btn-brand !text-[12px]" disabled={publishing}>
            {publishing ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Publish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left */}
        <aside className="hidden w-[290px] shrink-0 flex-col border-e bg-[var(--panel)] lg:flex" style={{ borderColor: "var(--border)" }}>
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["sections", "pages", "theme", "brand"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-[11.5px] font-semibold capitalize ${tab === t ? "border-b-2 border-[#e0704a]" : "text-[var(--dim)]"}`}>
                {t}{locked(t) && <Lock size={10} className="ms-1 inline" />}
              </button>
            ))}
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto p-3">
            {locked(tab) && (
              <div className="lock-overlay absolute inset-0 z-10 grid place-items-center p-6 text-center">
                <div>
                  <Lock size={20} className="mx-auto" />
                  <div className="mt-2 text-[13px] font-bold">Upgrade to edit {tab}</div>
                  <p className="mt-1 text-[11.5px] text-[var(--dim)]">The Free plan can edit brand settings only.</p>
                  <Link href="/dashboard/billing" className="btn btn-brand mt-3 !text-[12px]">Upgrade</Link>
                </div>
              </div>
            )}

            {tab === "sections" && (
              <>
                <button onClick={() => setAdding((a) => !a)} className="btn btn-soft mb-2 w-full !text-[12px]"><Plus size={14} /> Add section</button>
                {adding && (
                  <div className="mb-3 grid max-h-[240px] grid-cols-2 gap-1.5 overflow-y-auto rounded-xl bg-[var(--panel2)] p-2">
                    {BLOCK_TYPES.map((t) => (
                      <button key={t} className="flex items-center gap-1.5 rounded-lg bg-[var(--panel)] px-2 py-1.5 text-[11px] hover:ring-1 hover:ring-[#e0704a]"
                        onClick={() => { const nb = newBlock(t); commit({ ...site, blocks: [...site.blocks, nb] }); setSelected(nb.id); setAdding(false); }}>
                        <Icon name={BLOCKS[t].icon} size={12} /> {BLOCKS[t].label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid gap-1">
                  {site.blocks.map((b, i) => (
                    <div key={b.id} className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-[12px] ${selected === b.id ? "bg-[#111] text-white dark:bg-white dark:text-[#111]" : "hover:bg-[var(--panel2)]"}`}>
                      <GripVertical size={12} className="opacity-40" />
                      <button className="flex flex-1 items-center gap-2 text-start" onClick={() => setSelected(b.id)}>
                        <Icon name={BLOCKS[b.type].icon} size={12} /> {BLOCKS[b.type].label}
                      </button>
                      <button onClick={() => move(b.id, -1)} disabled={i === 0} className="opacity-60 disabled:opacity-20"><ChevronDown size={12} className="rotate-180" /></button>
                      <button onClick={() => move(b.id, 1)} disabled={i === site.blocks.length - 1} className="opacity-60 disabled:opacity-20"><ChevronDown size={12} /></button>
                      <button onClick={() => patchBlock(b.id, { hidden: !b.hidden })} className="opacity-60">{b.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                      <button onClick={() => commit({ ...site, blocks: [...site.blocks.slice(0, i + 1), { ...structuredClone(b), id: Math.random().toString(36).slice(2, 10) }, ...site.blocks.slice(i + 1)] })} className="opacity-60"><Copy size={11} /></button>
                      <button onClick={() => removeBlock(b.id)} className="text-red-500 opacity-80"><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "pages" && (
              <div className="grid gap-2">
                {site.pages.map((p, i) => (
                  <div key={p.slug + i} className="card p-3">
                    <input className="input !py-1.5 !text-[12px]" value={p.title} onChange={(e) => commit({ ...site, pages: site.pages.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                    <textarea className="input mt-2 min-h-[70px] !text-[11.5px]" value={p.body} onChange={(e) => commit({ ...site, pages: site.pages.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={p.enabled} onChange={(e) => commit({ ...site, pages: site.pages.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)) })} /> Enabled</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={p.inFooter} onChange={(e) => commit({ ...site, pages: site.pages.map((x, j) => (j === i ? { ...x, inFooter: e.target.checked } : x)) })} /> In footer</label>
                      <span className="text-[var(--dim)]">/{p.slug}</span>
                    </div>
                  </div>
                ))}
                <button className="btn btn-soft !text-[12px]" onClick={() => commit({ ...site, pages: [...site.pages, { slug: `page-${site.pages.length + 1}`, title: "New page", body: "", enabled: true, inFooter: false }] })}>
                  <Plus size={13} /> Add page
                </button>
              </div>
            )}

            {tab === "theme" && (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  {THEMES.map((th) => (
                    <div key={th.id} className={`flex items-center gap-2 rounded-xl border p-2 ${site.theme === th.id ? "ring-2 ring-[#e0704a]" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <span className="h-7 w-7 rounded-lg" style={{ background: th.bg, border: `1px solid ${th.line}` }} />
                      <div className="flex-1">
                        <div className="text-[12px] font-bold">{th.name} <span className="text-[var(--dim)]">{th.nameAr}</span></div>
                        <div className="text-[10.5px] text-[var(--dim)]">{th.tag}</div>
                      </div>
                      <button className="btn btn-ghost !px-2 !py-1 !text-[10.5px]" onClick={() => commit({ ...site, theme: th.id, vars: { ...themeVars(th.id), gap: site.vars.gap, container: site.vars.container } })}>Recolor</button>
                      <button className="btn btn-soft !px-2 !py-1 !text-[10.5px]" onClick={() => commit({ ...site, theme: th.id, vars: themeVars(th.id), blocks: themeLayout(th.id).map((t) => newBlock(t)) })}>Layout</button>
                    </div>
                  ))}
                </div>

                <Divider label="Palette" />
                <div className="grid grid-cols-4 gap-1.5">
                  {PALETTES.map((p) => (
                    <button key={p.id} title={p.label} className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}
                      onClick={() => commit({ ...site, vars: { ...site.vars, bg: p.colors[0], text: p.colors[1], muted: p.colors[2], accent: p.colors[3], surface: p.colors[4], line: p.colors[5] } })}>
                      {p.colors.slice(0, 4).map((c) => <span key={c} className="h-6 flex-1" style={{ background: c }} />)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["bg", "text", "muted", "accent", "surface", "line"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-[11px]">
                      <input type="color" value={site.vars[k]} onChange={(e) => commit({ ...site, vars: { ...site.vars, [k]: e.target.value } })} className="h-7 w-7 rounded" />
                      {k}
                    </label>
                  ))}
                </div>

                <Divider label="Typography" />
                <Select label="Heading font" value={site.vars.headingFont} options={FONTS.map((f) => f.id)} onChange={(v) => commit({ ...site, vars: { ...site.vars, headingFont: v } })} />
                <Select label="Body font" value={site.vars.bodyFont} options={FONTS.map((f) => f.id)} onChange={(v) => commit({ ...site, vars: { ...site.vars, bodyFont: v } })} />
                <Range label="Heading weight" min={300} max={800} step={100} value={site.vars.headingWeight} onChange={(v) => commit({ ...site, vars: { ...site.vars, headingWeight: v } })} />
                <Text label="Letter spacing" value={site.vars.letterSpacing} onChange={(v) => commit({ ...site, vars: { ...site.vars, letterSpacing: v } })} />
                <Check2 label="Uppercase headings" value={site.vars.uppercase} onChange={(v) => commit({ ...site, vars: { ...site.vars, uppercase: v } })} />
                <Range label="Base size" min={12} max={18} value={site.vars.baseSize} onChange={(v) => commit({ ...site, vars: { ...site.vars, baseSize: v } })} />

                <Divider label="Layout" />
                <Select label="Button style" value={site.vars.buttonStyle} options={["solid", "outline", "underline"]} onChange={(v) => commit({ ...site, vars: { ...site.vars, buttonStyle: v as SiteDoc["vars"]["buttonStyle"] } })} />
                <Range label="Button radius" min={0} max={999} value={site.vars.buttonRadius} onChange={(v) => commit({ ...site, vars: { ...site.vars, buttonRadius: v } })} />
                <Check2 label="Uppercase buttons" value={site.vars.buttonUppercase} onChange={(v) => commit({ ...site, vars: { ...site.vars, buttonUppercase: v } })} />
                <Select label="Card style" value={site.vars.card} options={["plain", "rounded", "framed"]} onChange={(v) => commit({ ...site, vars: { ...site.vars, card: v as SiteDoc["vars"]["card"] } })} />
                <Select label="Nav layout" value={site.vars.nav} options={["center", "left", "split"]} onChange={(v) => commit({ ...site, vars: { ...site.vars, nav: v as SiteDoc["vars"]["nav"] } })} />
                <Range label="Section gap" min={16} max={140} value={site.vars.gap} onChange={(v) => commit({ ...site, vars: { ...site.vars, gap: v } })} />
                <Range label="Container" min={900} max={1600} step={20} value={site.vars.container} onChange={(v) => commit({ ...site, vars: { ...site.vars, container: v } })} />
                <Select label="Image filter" value={site.vars.imageFilter} options={[...IMAGE_FILTERS]} onChange={(v) => commit({ ...site, vars: { ...site.vars, imageFilter: v as SiteDoc["vars"]["imageFilter"] } })} />
                <Select label="Page animation" value={site.vars.pageAnim} options={[...ANIMATIONS]} onChange={(v) => commit({ ...site, vars: { ...site.vars, pageAnim: v } })} />
                {limits.customCss ? (
                  <>
                    <Divider label="Custom CSS (Pro)" />
                    <textarea className="input min-h-[90px] font-mono !text-[11px]" value={site.customCss} onChange={(e) => commit({ ...site, customCss: e.target.value })} />
                  </>
                ) : null}
              </div>
            )}

            {tab === "brand" && (
              <div className="grid gap-3">
                <LogoField site={site} commit={commit} />
                <Range label="Logo height" min={16} max={96} value={site.brand.logoHeight} onChange={(v) => commit({ ...site, brand: { ...site.brand, logoHeight: v } })} />
                <Text label="Store name" value={site.brand.name} onChange={(v) => commit({ ...site, brand: { ...site.brand, name: v } })} />
                <Text label="Tagline" value={site.brand.tagline} onChange={(v) => commit({ ...site, brand: { ...site.brand, tagline: v } })} />
                <Select label="Currency" value={site.brand.currency} options={[...CURRENCIES]} onChange={(v) => commit({ ...site, brand: { ...site.brand, currency: v } })} />
                <Range label="Free shipping over" min={0} max={5000} step={50} value={site.brand.freeShippingThreshold} onChange={(v) => commit({ ...site, brand: { ...site.brand, freeShippingThreshold: v } })} />
                <Range label="Shipping fee" min={0} max={300} step={5} value={site.brand.shippingFee} onChange={(v) => commit({ ...site, brand: { ...site.brand, shippingFee: v } })} />
                <Text label="WhatsApp link" value={site.brand.socials.whatsapp} onChange={(v) => commit({ ...site, brand: { ...site.brand, socials: { ...site.brand.socials, whatsapp: v } } })} />
                <Text label="Instagram" value={site.brand.socials.instagram} onChange={(v) => commit({ ...site, brand: { ...site.brand, socials: { ...site.brand.socials, instagram: v } } })} />
                <Check2 label="Sticky header" value={site.brand.stickyHeader} onChange={(v) => commit({ ...site, brand: { ...site.brand, stickyHeader: v } })} />
                <Check2 label="Transparent header" value={site.brand.transparentHeader} onChange={(v) => commit({ ...site, brand: { ...site.brand, transparentHeader: v } })} />
                <Check2 label="WhatsApp float" value={site.brand.whatsappFloat} onChange={(v) => commit({ ...site, brand: { ...site.brand, whatsappFloat: v } })} />
                <Divider label="Navigation (max 7)" />
                {site.brand.nav.map((l, i) => (
                  <div key={i} className="flex gap-1">
                    <input className="input !py-1.5 !text-[11.5px]" value={l.label} onChange={(e) => commit({ ...site, brand: { ...site.brand, nav: site.brand.nav.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) } })} />
                    <input className="input !py-1.5 !text-[11.5px]" value={l.href} onChange={(e) => commit({ ...site, brand: { ...site.brand, nav: site.brand.nav.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) } })} />
                    <button className="btn btn-ghost !px-2 text-red-500" onClick={() => commit({ ...site, brand: { ...site.brand, nav: site.brand.nav.filter((_, j) => j !== i) } })}><Trash2 size={12} /></button>
                  </div>
                ))}
                {site.brand.nav.length < 7 && (
                  <button className="btn btn-soft !text-[12px]" onClick={() => commit({ ...site, brand: { ...site.brand, nav: [...site.brand.nav, { label: "Link", href: "#products" }] } })}><Plus size={13} /> Add link</button>
                )}
                <Divider label="Footer" />
                <Select label="Footer style" value={site.brand.footer.style} options={["editorial", "minimal", "columns"]} onChange={(v) => commit({ ...site, brand: { ...site.brand, footer: { ...site.brand.footer, style: v as SiteDoc["brand"]["footer"]["style"] } } })} />
                <Text label="Footer about" value={site.brand.footer.about} onChange={(v) => commit({ ...site, brand: { ...site.brand, footer: { ...site.brand.footer, about: v } } })} />
                <Check2 label="Footer newsletter" value={site.brand.footer.newsletter} onChange={(v) => commit({ ...site, brand: { ...site.brand, footer: { ...site.brand.footer, newsletter: v } } })} />
                <Check2 label={limits.branding ? "BLY branding (Free plan)" : "Show BLY branding"} value={site.showBranding} onChange={(v) => !limits.branding && commit({ ...site, showBranding: v })} />
                <Divider label="Mobile bottom bar" />
                <Check2 label="Enabled" value={site.brand.mobileBar.enabled} onChange={(v) => commit({ ...site, brand: { ...site.brand, mobileBar: { ...site.brand.mobileBar, enabled: v } } })} />
                <div className="flex flex-wrap gap-1">
                  {["home", "shop", "cart", "track", "whatsapp", "search"].map((it) => {
                    const on = site.brand.mobileBar.items.includes(it);
                    return (
                      <button key={it} className={`pill border ${on ? "bg-[#111] text-white" : ""}`} style={{ borderColor: "var(--border)" }}
                        onClick={() => commit({ ...site, brand: { ...site.brand, mobileBar: { ...site.brand.mobileBar, items: on ? site.brand.mobileBar.items.filter((x) => x !== it) : [...site.brand.mobileBar.items, it].slice(0, 5) } } })}>
                        {it}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* center */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b bg-[var(--panel)] px-3 py-2" style={{ borderColor: "var(--border)" }}>
            {(["home", "product", "checkout", "page", "404"] as StoreRoute[]).map((r) => (
              <button key={r} onClick={() => setRoute(r)} className={`btn !py-1.5 !text-[11.5px] capitalize ${route === r ? "btn-primary" : "btn-ghost"}`}>{r}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mx-auto overflow-hidden rounded-2xl border bg-white shadow-soft" style={{ width: DEVICES[device], maxWidth: "100%", borderColor: "var(--border)" }}>
              <StoreView site={site} products={products} slug={slug} route={route} preview onSelect={setSelected} selected={selected} pageSlug={site.pages[0]?.slug} />
            </div>
          </div>
        </div>

        {/* right inspector */}
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-s bg-[var(--panel)] p-3 xl:block" style={{ borderColor: "var(--border)" }}>
          {!block && <p className="p-3 text-[12px] text-[var(--dim)]">Click any part of the preview to edit it.</p>}
          {block && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12.5px] font-bold">{BLOCKS[block.type].label}</span>
                <button className="btn btn-ghost !px-2 !py-1 text-red-500" onClick={() => removeBlock(block.id)}><Trash2 size={12} /></button>
              </div>
              <div className="grid gap-2.5">
                {BLOCKS[block.type].fields.map((f) => (
                  <FieldInput key={f.k} field={f} value={(block.props as Record<string, unknown>)[f.k]}
                    onChange={(v) => patchBlock(block.id, { props: { ...block.props, [f.k]: v } })} />
                ))}
                <Divider label="Style & animation" />
                <Select label="Entrance" value={block.style?.anim ?? "fade-up"} options={[...ANIMATIONS]} onChange={(v) => patchBlock(block.id, { style: { ...block.style, anim: v } })} />
                <Select label="Loop" value={block.style?.loop ?? "none"} options={[...LOOP_ANIMATIONS]} onChange={(v) => patchBlock(block.id, { style: { ...block.style, loop: v } })} />
                <Range label="Padding Y" min={0} max={160} value={block.style?.paddingY ?? 64} onChange={(v) => patchBlock(block.id, { style: { ...block.style, paddingY: v } })} />
                <label className="flex items-center gap-2 text-[11.5px]">
                  <input type="color" value={block.style?.bg ?? "#ffffff"} onChange={(e) => patchBlock(block.id, { style: { ...block.style, bg: e.target.value } })} className="h-7 w-7 rounded" /> Background
                </label>
                <Select label="Shape" value={block.style?.shape ?? "none"} options={["none", "blob", "circle", "ring", "grid", "dots", "lines", "waves", "arc", "stars"]} onChange={(v) => patchBlock(block.id, { style: { ...block.style, shape: v } })} />
                <Select label="Shape position" value={block.style?.shapePos ?? "right"} options={["left", "right", "center", "bottom"]} onChange={(v) => patchBlock(block.id, { style: { ...block.style, shapePos: v } })} />
                <Check2 label="Rounded" value={Boolean(block.style?.rounded)} onChange={(v) => patchBlock(block.id, { style: { ...block.style, rounded: v } })} />
                <Check2 label="Border" value={Boolean(block.style?.border)} onChange={(v) => patchBlock(block.id, { style: { ...block.style, border: v } })} />
                <Check2 label="Shadow" value={Boolean(block.style?.shadow)} onChange={(v) => patchBlock(block.id, { style: { ...block.style, shadow: v } })} />
              </div>
            </>
          )}
          {selected === "product" && <p className="p-2 text-[11.5px] text-[var(--dim)]">Product template: edit layout, toggles and trust badges from the Sections tab of a future release — defaults are applied.</p>}
        </aside>
      </div>
    </div>
  );
}

/* ── field widgets ───────────────────────────────────────── */
function Divider({ label }: { label: string }) {
  return <div className="mt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--dim)]">{label}</div>;
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block text-[11.5px]"><span className="label">{label}</span><input className="input !py-1.5 !text-[12px]" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block text-[11.5px]"><span className="label">{label}</span>
      <select className="input !py-1.5 !text-[12px]" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Range({ label, min, max, step = 1, value, onChange }: { label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[11.5px]">
      <span className="label">{label} · {value}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#e0704a]" />
    </label>
  );
}
function Check2({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center justify-between text-[11.5px] font-medium">{label}<input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /></label>;
}

function LogoField({ site, commit }: { site: SiteDoc; commit: (s: SiteDoc) => void }) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData(); fd.append("file", file); fd.append("kind", "logo");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { ok: boolean; url?: string };
    setBusy(false);
    if (data.ok && data.url) commit({ ...site, brand: { ...site.brand, logo: data.url, favicon: data.url } });
  }
  return (
    <div>
      <span className="label">Logo (background auto-trimmed, favicon generated)</span>
      <div className="flex items-center gap-2">
        {site.brand.logo && <img src={site.brand.logo} alt="" className="h-8 rounded bg-[var(--panel2)] object-contain p-1" />}
        <label className="btn btn-soft !text-[11.5px]">{busy ? <Loader2 size={12} className="spin" /> : <Upload size={12} />} Upload
          <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {site.brand.logo && <button className="btn btn-ghost !px-2 !text-[11px]" onClick={() => commit({ ...site, brand: { ...site.brand, logo: "", favicon: "" } })}>Clear</button>}
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === "toggle") return <Check2 label={field.label} value={Boolean(value)} onChange={onChange} />;
  if (field.type === "select") return <Select label={field.label} value={String(value ?? field.options[0])} options={field.options} onChange={onChange} />;
  if (field.type === "range") return <Range label={field.label} min={field.min} max={field.max} step={field.step ?? 1} value={Number(value ?? field.min)} onChange={onChange} />;
  if (field.type === "textarea") {
    return <label className="block text-[11.5px]"><span className="label">{field.label}</span>
      <textarea className="input min-h-[70px] !text-[12px]" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
  }
  if (field.type === "number") {
    return <label className="block text-[11.5px]"><span className="label">{field.label}</span>
      <input type="number" className="input !py-1.5 !text-[12px]" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} /></label>;
  }
  if (field.type === "image" || field.type === "link" || field.type === "text" || field.type === "color") {
    return <Text label={field.label} value={String(value ?? "")} onChange={onChange} />;
  }
  if (field.type === "list") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    return (
      <div className="rounded-xl bg-[var(--panel2)] p-2">
        <div className="mb-1 text-[11px] font-bold">{field.label}</div>
        <div className="grid gap-2">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg bg-[var(--panel)] p-2">
              {field.itemFields.map((f) => (
                <FieldInput key={f.k} field={f} value={typeof it === "string" ? it : it[f.k]}
                  onChange={(v) => onChange(items.map((x, j) => (j === i ? (typeof x === "string" ? v : { ...x, [f.k]: v }) : x)))} />
              ))}
              <button className="mt-1 text-[10.5px] text-red-500" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button className="btn btn-soft !py-1 !text-[11px]" onClick={() => onChange([...items, Object.fromEntries(field.itemFields.map((f) => [f.k, ""]))])}>
            <Plus size={11} /> Add item
          </button>
        </div>
      </div>
    );
  }
  return null;
}
