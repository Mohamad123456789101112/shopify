"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MessageCircle, Minus, Plus, Search, ShoppingBag, Truck, X } from "lucide-react";
import { Icon } from "@/components/Icon";
import { RevealScript } from "@/components/Reveal";
import { money, safeImageUrl, safeLink } from "@/lib/constants";
import type { SiteDoc } from "@/lib/site";
import { buttonStyle, containerStyle, contrast, headingStyle, ratioPad, rootVars, type StoreProduct } from "@/lib/site-style";
import { BlockView, ProductCard, type StoreCtx } from "./Blocks";

export type StoreRoute = "home" | "product" | "checkout" | "track" | "page" | "404";
type CartLine = { id: string; name: string; price: number; image: string | null; qty: number; stock: number };

export function StoreView(props: {
  site: SiteDoc;
  products: StoreProduct[];
  slug: string;
  route: StoreRoute;
  product?: StoreProduct | null;
  pageSlug?: string;
  preview?: boolean;
  onSelect?: (target: string) => void;
  selected?: string | null;
  trackCode?: string;
}) {
  const { site, products, slug, route, preview = false, onSelect, selected } = props;
  const router = useRouter();
  const v = site.vars;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (preview) return;
    const frame = requestAnimationFrame(() => {
    try {
      const raw = localStorage.getItem(`bly_cart_${slug}`);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
    } catch { /* ignore */ }
    });
    return () => cancelAnimationFrame(frame);
  }, [slug, preview]);

  const persist = useCallback((next: CartLine[]) => {
    setCart(next);
    if (!preview) {
      try { localStorage.setItem(`bly_cart_${slug}`, JSON.stringify(next)); } catch { /* ignore */ }
    }
  }, [slug, preview]);

  const go = useCallback((href: string) => {
    if (preview) return;
    const link = safeLink(href);
    if (link.startsWith("#")) {
      document.querySelector(link)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (link.startsWith("/store/")) router.push(link);
    else if (link.startsWith("/")) router.push(`/store/${slug}${link}`);
    else if (link.startsWith("http")) window.open(link, "_blank", "noopener");
  }, [preview, router, slug]);

  const onAdd = useCallback((p: StoreProduct) => {
    const line: CartLine = { id: p.id, name: p.name, price: Number(p.price) || 0, image: p.image, qty: 1, stock: p.stock };
    const existing = cart.find((c) => c.id === p.id);
    const next = existing
      ? cart.map((c) => (c.id === p.id ? { ...c, qty: Math.min(c.qty + 1, Math.max(1, c.stock)) } : c))
      : [...cart, line];
    persist(next);
    setCartOpen(true);
  }, [cart, persist]);

  const ctx: StoreCtx = useMemo(() => ({ site, products, slug, preview, onAdd, go }), [site, products, slug, preview, onAdd, go]);
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const pick = (target: string) => (e: React.MouseEvent) => {
    if (!onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(target);
  };

  return (
    <div style={rootVars(v)} className={preview ? "no-anim" : ""}>
      {site.customCss ? <style dangerouslySetInnerHTML={{ __html: site.customCss }} /> : null}
      {!preview && <RevealScript />}

      <Header site={site} slug={slug} count={count} onCart={() => setCartOpen(true)} go={go} onSelect={onSelect} selected={selected} />

      <main>
        {route === "home" && site.blocks.filter((b) => !b.hidden).map((b) => (
          <div
            key={b.id}
            onClick={onSelect ? pick(b.id) : undefined}
            style={onSelect ? { outline: selected === b.id ? "2px solid #e0704a" : "none", outlineOffset: -2, cursor: "pointer" } : undefined}
          >
            <BlockView block={b} ctx={ctx} />
          </div>
        ))}

        {route === "product" && (
          <div onClick={onSelect ? pick("product") : undefined} style={onSelect ? { outline: selected === "product" ? "2px solid #e0704a" : "none", cursor: "pointer" } : undefined}>
            <ProductView ctx={ctx} product={props.product ?? products[0] ?? null} />
          </div>
        )}

        {route === "checkout" && (
          <div onClick={onSelect ? pick("checkout") : undefined} style={onSelect ? { outline: selected === "checkout" ? "2px solid #e0704a" : "none", cursor: "pointer" } : undefined}>
            <CheckoutView ctx={ctx} cart={cart} setCart={persist} />
          </div>
        )}

        {route === "track" && <TrackView ctx={ctx} initialCode={props.trackCode ?? ""} />}
        {route === "page" && <PageView ctx={ctx} pageSlug={props.pageSlug ?? "about"} />}
        {route === "404" && (
          <div onClick={onSelect ? pick("notFound") : undefined}>
            <NotFoundView ctx={ctx} />
          </div>
        )}
      </main>

      <Footer site={site} go={go} onSelect={onSelect} selected={selected} />

      {cartOpen && (
        <CartDrawer ctx={ctx} cart={cart} setCart={persist} subtotal={subtotal} onClose={() => setCartOpen(false)} />
      )}

      {site.brand.whatsappFloat && site.brand.socials.whatsapp && (
        <a href={safeLink(site.brand.socials.whatsapp)} target="_blank" rel="noopener noreferrer"
          style={{ position: "fixed", insetInlineEnd: 18, bottom: site.brand.mobileBar.enabled ? 78 : 18, width: 48, height: 48, borderRadius: 999, background: "#25D366", color: "#fff", display: "grid", placeItems: "center", zIndex: 40 }}>
          <MessageCircle size={22} />
        </a>
      )}

      {site.brand.mobileBar.enabled && (
        <nav className="md:hidden" style={{ position: "fixed", insetInline: 0, bottom: 0, background: v.bg, borderTop: `1px solid ${v.line}`, display: "flex", zIndex: 39 }}>
          {site.brand.mobileBar.items.map((it) => (
            <button key={it} type="button" onClick={() => (it === "cart" ? setCartOpen(true) : go(it === "home" ? "/" : it === "shop" ? "#products" : it === "track" ? "/track" : it === "whatsapp" ? site.brand.socials.whatsapp : "#products"))}
              style={{ flex: 1, padding: "10px 0", display: "grid", placeItems: "center", gap: 2, fontSize: 10, color: v.text, background: "transparent" }}>
              {it === "cart" ? <ShoppingBag size={17} /> : it === "track" ? <Truck size={17} /> : it === "whatsapp" ? <MessageCircle size={17} /> : it === "search" ? <Search size={17} /> : <Icon name={it === "home" ? "sparkles" : "tag"} size={17} />}
              <span style={{ textTransform: "capitalize" }}>{it}</span>
            </button>
          ))}
        </nav>
      )}
      {site.showBranding && (
        <div style={{ textAlign: "center", padding: "14px 0 26px", fontSize: 11, color: v.muted }}>
          Powered by <strong>BRANDLY</strong>
        </div>
      )}
    </div>
  );
}

function Header({ site, slug, count, onCart, go, onSelect, selected }: { site: SiteDoc; slug: string; count: number; onCart: () => void; go: (h: string) => void; onSelect?: (t: string) => void; selected?: string | null }) {
  const v = site.vars;
  const b = site.brand;
  const nav = (
    <nav style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      {b.nav.map((l) => (
        <button key={l.label} type="button" onClick={() => go(l.href)} style={{ fontSize: 12.5, fontWeight: 500, color: v.text, background: "transparent", cursor: "pointer", textTransform: v.uppercase ? "uppercase" : "none", letterSpacing: v.uppercase ? ".1em" : undefined }}>
          {l.label}
        </button>
      ))}
    </nav>
  );
  const logo = (
    <button type="button" onClick={() => go("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", cursor: "pointer" }}>
      {b.logo ? <img src={safeImageUrl(b.logo)} alt={b.name} style={{ height: b.logoHeight, objectFit: "contain" }} /> : <span style={{ ...headingStyle(v, 20), color: v.text }}>{b.name}</span>}
    </button>
  );
  return (
    <header
      onClick={onSelect ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect("brand"); } : undefined}
      style={{
        position: b.stickyHeader ? "sticky" : "relative", top: 0, zIndex: 30,
        background: b.transparentHeader ? "transparent" : v.bg,
        borderBottom: `1px solid ${v.line}`, backdropFilter: "blur(8px)",
        outline: selected === "brand" ? "2px solid #e0704a" : undefined, cursor: onSelect ? "pointer" : undefined,
      }}
    >
      <div style={{ ...containerStyle(v), display: "flex", alignItems: "center", justifyContent: v.nav === "center" ? "center" : "space-between", gap: 16, padding: "14px 20px", flexWrap: "wrap" }}>
        {v.nav === "center" ? (
          <div style={{ display: "grid", justifyItems: "center", gap: 10, width: "100%" }}>
            {logo}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {nav}
              <CartBtn v={v} count={count} onCart={onCart} />
            </div>
          </div>
        ) : v.nav === "split" ? (
          <>
            <div className="hidden md:block">{nav}</div>
            {logo}
            <CartBtn v={v} count={count} onCart={onCart} />
          </>
        ) : (
          <>
            {logo}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }} className="max-md:hidden">{nav}</div>
            <CartBtn v={v} count={count} onCart={onCart} />
          </>
        )}
      </div>
      {slug && false && <span>{slug}</span>}
    </header>
  );
}

function CartBtn({ v, count, onCart }: { v: SiteDoc["vars"]; count: number; onCart: () => void }) {
  return (
    <button type="button" onClick={onCart} style={{ position: "relative", background: "transparent", color: v.text, cursor: "pointer" }} aria-label="Cart">
      <ShoppingBag size={19} />
      {count > 0 && (
        <span style={{ position: "absolute", top: -6, insetInlineEnd: -8, background: v.accent, color: contrast(v.accent), fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 5px" }}>{count}</span>
      )}
    </button>
  );
}

function Footer({ site, go, onSelect, selected }: { site: SiteDoc; go: (h: string) => void; onSelect?: (t: string) => void; selected?: string | null }) {
  const v = site.vars;
  const f = site.brand.footer;
  return (
    <footer
      onClick={onSelect ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect("footer"); } : undefined}
      style={{ background: v.surface, borderTop: `1px solid ${v.line}`, marginTop: 40, outline: selected === "footer" ? "2px solid #e0704a" : undefined, cursor: onSelect ? "pointer" : undefined }}
    >
      <div style={{ ...containerStyle(v), padding: "48px 20px 28px" }}>
        {f.style === "columns" ? (
          <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
            <div>
              <div style={{ ...headingStyle(v, 19) }}>{site.brand.name}</div>
              <p style={{ fontSize: 12.5, color: v.muted, marginTop: 8, maxWidth: 240 }}>{f.about}</p>
            </div>
            {f.columns.map((c) => (
              <div key={c.title}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{c.title}</div>
                <ul style={{ marginTop: 10, display: "grid", gap: 7, listStyle: "none", padding: 0 }}>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <button type="button" onClick={() => go(l.href)} style={{ fontSize: 12, color: v.muted, background: "transparent", cursor: "pointer" }}>{l.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {f.newsletter && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{f.newsletterTitle}</div>
                <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <input placeholder="you@email.com" style={{ flex: 1, padding: "9px 12px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 12 }} />
                  <button style={{ ...buttonStyle(v), padding: "9px 14px", fontSize: 12 }}>→</button>
                </form>
              </div>
            )}
          </div>
        ) : f.style === "minimal" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ ...headingStyle(v, 20) }}>{site.brand.name}</div>
            <p style={{ fontSize: 12.5, color: v.muted, marginTop: 8 }}>{f.about}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ ...headingStyle(v, 34) }}>{site.brand.name}</div>
            <p style={{ fontSize: 13.5, color: v.muted, maxWidth: 520 }}>{f.about}</p>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 30, paddingTop: 16, borderTop: `1px solid ${v.line}`, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: v.muted }}>{f.bottom}</span>
          {f.payments && (
            <div style={{ display: "flex", gap: 6 }}>
              {["COD", "Vodafone Cash", "InstaPay"].map((p) => (
                <span key={p} style={{ fontSize: 10, color: v.muted, border: `1px solid ${v.line}`, padding: "3px 8px", borderRadius: 999 }}>{p}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

function CartDrawer({ ctx, cart, setCart, subtotal, onClose }: { ctx: StoreCtx; cart: CartLine[]; setCart: (c: CartLine[]) => void; subtotal: number; onClose: () => void }) {
  const v = ctx.site.vars;
  const threshold = ctx.site.brand.freeShippingThreshold;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />
      <aside style={{ position: "absolute", top: 0, bottom: 0, insetInlineEnd: 0, width: "min(400px, 92vw)", background: v.bg, color: v.text, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottom: `1px solid ${v.line}` }}>
          <strong style={{ fontSize: 14 }}>Your cart ({cart.length})</strong>
          <button onClick={onClose} style={{ background: "transparent", color: v.text, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "grid", gap: 14, alignContent: "start" }}>
          {cart.length === 0 && <p style={{ color: v.muted, fontSize: 13 }}>Your cart is empty.</p>}
          {cart.map((c) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative", paddingBottom: "84%", background: v.surface, overflow: "hidden", borderRadius: 8 }}>
                {c.image && <img src={safeImageUrl(c.image)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: v.muted }}>{money(c.price, ctx.site.brand.currency)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <button onClick={() => setCart(cart.map((x) => (x.id === c.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))} style={{ border: `1px solid ${v.line}`, borderRadius: 6, padding: 3, background: "transparent", color: v.text }}><Minus size={12} /></button>
                  <span style={{ fontSize: 12.5 }}>{c.qty}</span>
                  <button onClick={() => setCart(cart.map((x) => (x.id === c.id ? { ...x, qty: Math.min(x.qty + 1, Math.max(1, x.stock)) } : x)))} style={{ border: `1px solid ${v.line}`, borderRadius: 6, padding: 3, background: "transparent", color: v.text }}><Plus size={12} /></button>
                </div>
              </div>
              <button onClick={() => setCart(cart.filter((x) => x.id !== c.id))} style={{ background: "transparent", color: v.muted, cursor: "pointer" }}><X size={15} /></button>
            </div>
          ))}
        </div>
        <div style={{ padding: 18, borderTop: `1px solid ${v.line}` }}>
          {threshold > 0 && subtotal < threshold && (
            <div style={{ fontSize: 11.5, color: v.muted, marginBottom: 8 }}>
              {money(threshold - subtotal, ctx.site.brand.currency)} away from free shipping
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
            <span>Subtotal</span><span>{money(subtotal, ctx.site.brand.currency)}</span>
          </div>
          <button type="button" disabled={cart.length === 0} onClick={() => { onClose(); ctx.go(`/store/${ctx.slug}/checkout`); }}
            style={{ ...buttonStyle(v), width: "100%", justifyContent: "center", marginTop: 12, opacity: cart.length ? 1 : 0.5 }}>
            Checkout
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProductView({ ctx, product }: { ctx: StoreCtx; product: StoreProduct | null }) {
  const v = ctx.site.vars;
  const tpl = ctx.site.product;
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  if (!product) return <div style={{ ...containerStyle(v), padding: "60px 20px" }}>No products yet.</div>;
  const price = Number(product.price) || 0;
  const compare = product.compare_at ? Number(product.compare_at) : 0;
  const related = ctx.products.filter((p) => p.id !== product.id).slice(0, tpl.relatedLimit);

  return (
    <div style={{ ...containerStyle(v), padding: "34px 20px 60px" }}>
      {tpl.breadcrumb && (
        <div style={{ fontSize: 11.5, color: v.muted, marginBottom: 18 }}>
          <button onClick={() => ctx.go("/")} style={{ background: "transparent", color: "inherit" }}>Home</button> / {product.category || "Shop"} / {product.name}
        </div>
      )}
      <div style={{ display: "grid", gap: 34, gridTemplateColumns: tpl.layout === "stacked" ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div>
          <div style={{ position: "relative", paddingBottom: ratioPad(tpl.ratio), overflow: "hidden", background: v.surface, borderRadius: v.card === "plain" ? 0 : 14 }}>
            {product.image && <img src={safeImageUrl(product.image)} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
        </div>
        <div>
          <h1 style={{ ...headingStyle(v, 30), margin: 0 }}>{product.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{money(price, ctx.site.brand.currency)}</span>
            {compare > price && <span style={{ fontSize: 14, color: v.muted, textDecoration: "line-through" }}>{money(compare, ctx.site.brand.currency)}</span>}
          </div>
          {tpl.stock && <div style={{ fontSize: 12, color: product.stock > 0 ? "#16a34a" : "#dc2626", marginTop: 6 }}>{product.stock > 0 ? `In stock · ${product.stock} left` : "Sold out"}</div>}
          {tpl.sku && <div style={{ fontSize: 11.5, color: v.muted, marginTop: 4 }}>SKU {product.id.slice(0, 8).toUpperCase()}</div>}

          {tpl.colors && product.colors && product.colors.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>Colour</div>
              <div style={{ display: "flex", gap: 8 }}>
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 999, background: c, border: color === c ? `2px solid ${v.accent}` : `1px solid ${v.line}`, cursor: "pointer" }} />
                ))}
              </div>
            </div>
          )}
          {tpl.sizes && tpl.sizeList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>Size</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tpl.sizeList.map((s) => (
                  <button key={s} onClick={() => setSize(s)} style={{ padding: "7px 14px", fontSize: 12, border: `1px solid ${size === s ? v.accent : v.line}`, background: size === s ? v.accent : "transparent", color: size === s ? contrast(v.accent) : v.text, borderRadius: v.buttonRadius, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              {tpl.sizeGuide && <div style={{ fontSize: 11, color: v.muted, marginTop: 8 }}>{tpl.guideText}</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <button type="button" onClick={() => ctx.onAdd(product)} disabled={product.stock <= 0} style={{ ...buttonStyle(v), flex: 1, justifyContent: "center", opacity: product.stock > 0 ? 1 : 0.5 }}>{tpl.addText}</button>
            <button type="button" onClick={() => { ctx.onAdd(product); ctx.go(`/store/${ctx.slug}/checkout`); }} disabled={product.stock <= 0} style={{ ...buttonStyle(v, "ghost"), flex: 1, justifyContent: "center" }}>{tpl.buyText}</button>
          </div>

          {tpl.trust.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 20 }}>
              {tpl.trust.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: v.muted }}>
                  <Icon name={t.icon} size={14} /> {t.text}
                </div>
              ))}
            </div>
          )}

          {(product.description || tpl.description) && (
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: v.muted, marginTop: 20, whiteSpace: "pre-line" }}>{product.description || tpl.description}</p>
          )}
          {tpl.accordions.map((a, i) => (
            <details key={i} style={{ borderTop: `1px solid ${v.line}`, padding: "12px 0" }}>
              <summary style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{a.title}</summary>
              <p style={{ fontSize: 12.5, color: v.muted, marginTop: 8 }}>{a.body}</p>
            </details>
          ))}
        </div>
      </div>

      {tpl.related && related.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ ...headingStyle(v, 22), marginBottom: 18 }}>{tpl.relatedTitle}</h2>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))" }}>
            {related.map((p) => <ProductCard key={p.id} p={p} ctx={ctx} ratio={tpl.ratio} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutView({ ctx, cart, setCart }: { ctx: StoreCtx; cart: CartLine[]; setCart: (c: CartLine[]) => void }) {
  const v = ctx.site.vars;
  const c = ctx.site.checkout;
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: c.cities[0] ?? "", address: "", note: "" });
  const [payment, setPayment] = useState<"cod" | "wallet" | "instapay">("cod");
  const [code, setCode] = useState("");
  const [ref, setRef] = useState("");
  const [discount, setDiscount] = useState<{ amount: number; type: string } | null>(null);
  const [agree, setAgree] = useState(!c.termsRequired);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ tracking_code: string; total: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const freeShip = ctx.site.brand.freeShippingThreshold > 0 && subtotal >= ctx.site.brand.freeShippingThreshold;
  const shipping = (freeShip ? 0 : ctx.site.brand.shippingFee) + (payment === "cod" ? c.payments.cod.fee : 0);
  const discountAmt = discount?.type === "freeShipping" ? 0 : discount?.amount ?? 0;
  const total = Math.max(0, subtotal - discountAmt) + (discount?.type === "freeShipping" ? 0 : shipping);

  async function applyCode() {
    setError("");
    const res = await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "discount.check", data: { slug: ctx.slug, code, subtotal } }) });
    const data = (await res.json()) as { ok: boolean; amount?: number; type?: string; error?: string };
    if (!data.ok) { setDiscount(null); setError(data.error ?? "Invalid code"); return; }
    setDiscount({ amount: data.amount ?? 0, type: data.type ?? "percent" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (ctx.preview) return;
    setBusy(true); setError("");
    const res = await fetch("/api/store", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "order.place",
        data: { slug: ctx.slug, customer: form, items: cart.map((x) => ({ productId: x.id, qty: x.qty })), payment, note: form.note, code, ref },
      }),
    });
    const data = (await res.json()) as { ok: boolean; order?: { tracking_code: string; total: number }; error?: string };
    setBusy(false);
    if (!data.ok || !data.order) { setError(data.error ?? "Could not place the order."); return; }
    setDone(data.order);
    setCart([]);
  }

  if (done) {
    return (
      <div style={{ ...containerStyle(v), padding: "60px 20px", maxWidth: 560, textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: 999, background: v.accent, color: contrast(v.accent), display: "grid", placeItems: "center", margin: "0 auto" }}><Check size={26} /></div>
        <h1 style={{ ...headingStyle(v, 28), marginTop: 18 }}>{c.successTitle}</h1>
        <p style={{ color: v.muted, marginTop: 8, fontSize: 14 }}>{c.successText}</p>
        <div style={{ marginTop: 22, padding: 18, border: `1px dashed ${v.line}`, borderRadius: 14 }}>
          <div style={{ fontSize: 11.5, color: v.muted }}>Tracking code</div>
          <div style={{ ...headingStyle(v, 26), marginTop: 6 }}>{done.tracking_code}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <button onClick={() => { navigator.clipboard?.writeText(done.tracking_code); setCopied(true); }} style={{ ...buttonStyle(v, "ghost") }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => ctx.go(`/store/${ctx.slug}/track?code=${done.tracking_code}`)} style={buttonStyle(v)}>Track order</button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: v.muted, marginTop: 18 }}>Total paid / due: <strong>{money(done.total, ctx.site.brand.currency)}</strong></p>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle(v), padding: "34px 20px 70px" }}>
      <h1 style={{ ...headingStyle(v, 28), margin: 0 }}>{c.title}</h1>
      <p style={{ color: v.muted, fontSize: 13.5, marginTop: 6 }}>{c.subtitle}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 26, gridTemplateColumns: "repeat(auto-fit, minmax(290px,1fr))", marginTop: 26 }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Input v={v} label="Full name" value={form.name} onChange={(x) => setForm({ ...form, name: x })} required />
          {c.fields.email && <Input v={v} label="Email" type="email" value={form.email} onChange={(x) => setForm({ ...form, email: x })} required={c.fields.emailRequired} />}
          <Input v={v} label="Phone" value={form.phone} onChange={(x) => setForm({ ...form, phone: x })} required />
          {c.fields.city && (
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, display: "block", marginBottom: 5 }}>City</label>
              {c.cities.length > 0 ? (
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 13 }}>
                  {c.cities.map((x) => <option key={x}>{x}</option>)}
                </select>
              ) : (
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 13 }} />
              )}
            </div>
          )}
          {c.fields.address && <Input v={v} label="Address" value={form.address} onChange={(x) => setForm({ ...form, address: x })} />}
          {c.fields.notes && <Input v={v} label="Order notes" value={form.note} onChange={(x) => setForm({ ...form, note: x })} />}

          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Payment</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(["cod", "wallet", "instapay"] as const).map((m) => {
                const cfg = c.payments[m];
                const enabled = m === "cod" ? cfg.enabled : cfg.enabled && Boolean((cfg as { number?: string }).number);
                if (!enabled) return null;
                return (
                  <label key={m} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: `1px solid ${payment === m ? v.accent : v.line}`, borderRadius: 12, cursor: "pointer" }}>
                    <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
                    <span>
                      <span style={{ fontSize: 13, fontWeight: 600, display: "block" }}>{cfg.label}</span>
                      <span style={{ fontSize: 11.5, color: v.muted }}>{cfg.note}{m !== "cod" && (cfg as { number?: string }).number ? ` · ${(cfg as { number?: string }).number}` : ""}</span>
                    </span>
                  </label>
                );
              })}
              {c.payments.card.enabled === false && (
                <div style={{ padding: 12, border: `1px dashed ${v.line}`, borderRadius: 12, fontSize: 11.5, color: v.muted }}>{c.payments.card.label} — {c.payments.card.note}</div>
              )}
            </div>
            {payment !== "cod" && (
              <div style={{ marginTop: 10 }}>
                <Input v={v} label="Transfer reference" value={ref} onChange={setRef} />
              </div>
            )}
          </div>
        </div>

        <div style={{ background: v.surface, padding: 20, borderRadius: 16, alignSelf: "start" }}>
          {c.summary && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Order summary</div>
              {cart.length === 0 && <p style={{ fontSize: 12.5, color: v.muted }}>Your cart is empty.</p>}
              {cart.map((x) => (
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 8 }}>
                  <span>{x.name} × {x.qty}</span><span>{money(x.price * x.qty, ctx.site.brand.currency)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${v.line}`, marginTop: 10, paddingTop: 10, display: "grid", gap: 6, fontSize: 12.5 }}>
                <Row label="Subtotal" value={money(subtotal, ctx.site.brand.currency)} />
                {discountAmt > 0 && <Row label="Discount" value={`-${money(discountAmt, ctx.site.brand.currency)}`} />}
                <Row label="Shipping" value={discount?.type === "freeShipping" || freeShip ? "Free" : money(shipping, ctx.site.brand.currency)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                  <span>Total</span><span>{money(total, ctx.site.brand.currency)}</span>
                </div>
              </div>
            </>
          )}
          {c.discount && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code" style={{ flex: 1, padding: "9px 12px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 12.5 }} />
              <button type="button" onClick={applyCode} style={{ ...buttonStyle(v, "ghost"), padding: "9px 14px" }}>Apply</button>
            </div>
          )}
          {c.terms && (
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 11.5, color: v.muted }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> {c.terms}
            </label>
          )}
          {error && <div style={{ marginTop: 12, fontSize: 12, color: "#dc2626" }}>{error}</div>}
          <button type="submit" disabled={busy || cart.length === 0 || (c.termsRequired && !agree)} style={{ ...buttonStyle(v), width: "100%", justifyContent: "center", marginTop: 14, opacity: busy || cart.length === 0 || (c.termsRequired && !agree) ? 0.55 : 1 }}>
            {busy ? <Loader2 size={15} className="spin" /> : null} {c.button}
          </button>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
            {c.trust.map((t, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 5, alignItems: "center", fontSize: 10.5, color: v.muted }}><Icon name={t.icon} size={12} /> {t.text}</span>
            ))}
          </div>
          <p style={{ fontSize: 10.5, color: v.muted, textAlign: "center", marginTop: 10 }}>{c.policy}</p>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between" }}><span>{label}</span><span>{value}</span></div>;
}

function Input({ v, label, value, onChange, type = "text", required }: { v: SiteDoc["vars"]; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, display: "block", marginBottom: 5 }}>{label}{required ? " *" : ""}</label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 13 }} />
    </div>
  );
}

function TrackView({ ctx, initialCode }: { ctx: StoreCtx; initialCode: string }) {
  const v = ctx.site.vars;
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setOrder(null);
    const res = await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "order.track", data: { slug: ctx.slug, code, phone } }) });
    const data = (await res.json()) as { ok: boolean; order?: Record<string, unknown>; error?: string };
    setBusy(false);
    if (!data.ok) { setError(data.error ?? "Not found"); return; }
    setOrder(data.order ?? null);
  }

  const steps = ["New", "Processing", "Shipped", "Delivered"];
  const current = order ? steps.indexOf(String(order.status)) : -1;

  return (
    <div style={{ ...containerStyle(v), padding: "40px 20px 70px", maxWidth: 640 }}>
      <h1 style={{ ...headingStyle(v, 28), margin: 0 }}>Track your order</h1>
      <p style={{ color: v.muted, fontSize: 13.5, marginTop: 6 }}>Enter your tracking code and the phone number used on the order.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Input v={v} label="Tracking code" value={code} onChange={setCode} required />
        <Input v={v} label="Phone number" value={phone} onChange={setPhone} required />
        <button disabled={busy} style={{ ...buttonStyle(v), justifyContent: "center" }}>{busy ? <Loader2 size={15} className="spin" /> : null} Track</button>
      </form>
      {error && <div style={{ marginTop: 14, fontSize: 12.5, color: "#dc2626" }}>{error}</div>}
      {order && (
        <div style={{ marginTop: 26, background: v.surface, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <strong>{String(order.tracking_code)}</strong>
            <span>{money(Number(order.total), ctx.site.brand.currency)}</span>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 20 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 3, background: i <= current ? v.accent : v.line }} />
                <div style={{ fontSize: 10.5, marginTop: 6, color: i <= current ? v.text : v.muted }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontSize: 12, color: v.muted, display: "grid", gap: 4 }}>
            <span>Payment: {String(order.payment)} · {String(order.payment_status)}</span>
            {order.carrier ? <span>Carrier: {String(order.carrier)} {order.carrier_tracking ? `· ${String(order.carrier_tracking)}` : ""}</span> : null}
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {(order.items as { name: string; qty: number; price: number }[] | undefined)?.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span>{it.name} × {it.qty}</span><span>{money(Number(it.price) * it.qty, ctx.site.brand.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageView({ ctx, pageSlug }: { ctx: StoreCtx; pageSlug: string }) {
  const v = ctx.site.vars;
  const page = ctx.site.pages.find((p) => p.slug === pageSlug && p.enabled);
  if (!page) return <NotFoundView ctx={ctx} />;
  return (
    <div style={{ ...containerStyle(v), padding: "48px 20px 70px", maxWidth: 780 }}>
      <h1 style={{ ...headingStyle(v, 32), margin: 0 }}>{page.title}</h1>
      <p style={{ color: v.muted, marginTop: 16, fontSize: 14.5, lineHeight: 1.9, whiteSpace: "pre-line" }}>{page.body}</p>
    </div>
  );
}

function NotFoundView({ ctx }: { ctx: StoreCtx }) {
  const v = ctx.site.vars;
  const nf = ctx.site.notFound;
  return (
    <div style={{ ...containerStyle(v), padding: "80px 20px", textAlign: "center" }}>
      <Icon name={nf.illustration} size={44} />
      <h1 style={{ ...headingStyle(v, 34), marginTop: 18 }}>{nf.title}</h1>
      <p style={{ color: v.muted, marginTop: 10, fontSize: 14 }}>{nf.text}</p>
      <button onClick={() => ctx.go("/")} style={{ ...buttonStyle(v), marginTop: 20 }}>{nf.button}</button>
    </div>
  );
}
