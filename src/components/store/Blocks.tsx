"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Minus, Plus, Star } from "lucide-react";
import { Icon } from "@/components/Icon";
import { money, safeImageUrl, safeLink } from "@/lib/constants";
import type { Block, SiteDoc } from "@/lib/site";
import {
  buttonStyle, cardStyle, containerStyle, contrast, headingStyle, ratioPad, sectionStyle, youtubeEmbed,
  type StoreProduct,
} from "@/lib/site-style";

export type StoreCtx = {
  site: SiteDoc;
  products: StoreProduct[];
  slug: string;
  preview: boolean;
  onAdd: (p: StoreProduct) => void;
  go: (href: string) => void;
};

const P = (b: Block, k: string, def: unknown = "") => (b.props?.[k] ?? def) as never;
const asStr = (v: unknown, def = "") => (typeof v === "string" ? v : def);
const asNum = (v: unknown, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function Shape({ style }: { style?: Block["style"] }) {
  const s = style?.shape;
  if (!s || s === "none") return null;
  const color = style?.shapeColor || "rgba(0,0,0,.05)";
  const pos = style?.shapePos || "right";
  const base: CSSProperties = {
    position: "absolute", width: 420, height: 420, pointerEvents: "none", opacity: 0.55,
    top: pos === "bottom" ? "auto" : -80, bottom: pos === "bottom" ? -120 : "auto",
    left: pos === "left" ? -120 : pos === "center" ? "50%" : "auto",
    right: pos === "right" ? -120 : "auto",
    transform: pos === "center" ? "translateX(-50%)" : undefined,
  };
  if (s === "blob") return <div style={{ ...base, background: color, borderRadius: "60% 40% 55% 45% / 45% 55% 40% 60%" }} />;
  if (s === "circle") return <div style={{ ...base, background: color, borderRadius: "50%" }} />;
  if (s === "ring") return <div style={{ ...base, border: `28px solid ${color}`, borderRadius: "50%", background: "transparent" }} />;
  if (s === "grid") return <div style={{ ...base, backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />;
  if (s === "dots") return <div style={{ ...base, backgroundImage: `radial-gradient(${color} 2px, transparent 2px)`, backgroundSize: "18px 18px" }} />;
  if (s === "lines") return <div style={{ ...base, backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 14px)` }} />;
  if (s === "waves") return <div style={{ ...base, backgroundImage: `repeating-radial-gradient(circle at 0 0, transparent 0 18px, ${color} 18px 20px)` }} />;
  if (s === "arc") return <div style={{ ...base, borderTop: `40px solid ${color}`, borderRadius: "50% 50% 0 0", height: 210 }} />;
  if (s === "stars") return <div style={{ ...base, backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`, backgroundSize: "34px 34px" }} />;
  return null;
}

export function Section({ block, ctx, children }: { block: Block; ctx: StoreCtx; children: ReactNode }) {
  const v = ctx.site.vars;
  const st = block.style ?? {};
  const loop = st.loop && st.loop !== "none" ? `loop-${st.loop}` : "";
  return (
    <section
      style={sectionStyle(st, v)}
      className={loop}
      data-reveal={ctx.preview ? undefined : ""}
      data-anim={st.anim && st.anim !== "none" ? st.anim : "fade-up"}
    >
      {st.bgImage && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(st.overlay ?? 0) / 100})` }} />}
      <Shape style={st} />
      <div style={containerStyle(v)}>{children}</div>
    </section>
  );
}

function Title({ text, ctx, size = 30, sub }: { text: string; ctx: StoreCtx; size?: number; sub?: string }) {
  if (!text && !sub) return null;
  return (
    <div style={{ marginBottom: 26 }}>
      {text && <h2 style={{ ...headingStyle(ctx.site.vars, size), margin: 0 }}>{text}</h2>}
      {sub && <p style={{ color: ctx.site.vars.muted, marginTop: 8, fontSize: 13.5 }}>{sub}</p>}
    </div>
  );
}

function Btn({ ctx, label, href, variant = "primary" }: { ctx: StoreCtx; label: string; href?: string; variant?: "primary" | "ghost" }) {
  if (!label) return null;
  return (
    <button type="button" style={buttonStyle(ctx.site.vars, variant)} onClick={() => ctx.go(safeLink(href))}>
      {label}
    </button>
  );
}

export function ProductCard({ p, ctx, ratio = "3/4", badges = true, swatches = true }: { p: StoreProduct; ctx: StoreCtx; ratio?: string; badges?: boolean; swatches?: boolean }) {
  const v = ctx.site.vars;
  const price = Number(p.price) || 0;
  const compare = p.compare_at ? Number(p.compare_at) : 0;
  return (
    <div style={cardStyle(v)} className={`group ${v.imageFilter !== "none" ? `filter-${v.imageFilter}` : ""}`}>
      <div style={{ position: "relative", paddingBottom: ratioPad(ratio), overflow: "hidden", cursor: "pointer" }} onClick={() => ctx.go(`/store/${ctx.slug}/p/${p.id}`)}>
        {p.image ? (
          <img src={safeImageUrl(p.image)} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s ease" }} className="group-hover:scale-105" />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: v.surface }} />
        )}
        {badges && p.badge ? (
          <span style={{ position: "absolute", top: 10, insetInlineStart: 10, background: v.accent, color: contrast(v.accent), fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 999 }}>{p.badge}</span>
        ) : null}
        {badges && compare > price ? (
          <span style={{ position: "absolute", top: 10, insetInlineEnd: 10, background: v.text, color: v.bg, fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 999 }}>
            -{Math.round(((compare - price) / compare) * 100)}%
          </span>
        ) : null}
        {p.stock <= 0 && (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: 12, fontWeight: 700 }}>SOLD OUT</span>
        )}
      </div>
      <div style={{ padding: v.card === "plain" ? "12px 0" : 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, cursor: "pointer" }} onClick={() => ctx.go(`/store/${ctx.slug}/p/${p.id}`)}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{money(price, ctx.site.brand.currency)}</span>
          {compare > price && <span style={{ fontSize: 12, color: v.muted, textDecoration: "line-through" }}>{money(compare, ctx.site.brand.currency)}</span>}
        </div>
        {swatches && p.colors && p.colors.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {p.colors.slice(0, 6).map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, border: `1px solid ${v.line}` }} />)}
          </div>
        )}
        <button type="button" onClick={() => ctx.onAdd(p)} disabled={p.stock <= 0}
          style={{ ...buttonStyle(v), width: "100%", justifyContent: "center", marginTop: 10, opacity: p.stock <= 0 ? 0.45 : 1, fontSize: 12 }}>
          {ctx.site.product.addText || "Add to cart"}
        </button>
      </div>
    </div>
  );
}

function selectProducts(b: Block, ctx: StoreCtx) {
  const source = asStr(P(b, "source", "all"), "all");
  const value = asStr(P(b, "value", ""));
  const limit = asNum(P(b, "limit", 8), 8);
  let list = [...ctx.products];
  if (source === "category" && value) list = list.filter((p) => (p.category ?? "").toLowerCase() === value.toLowerCase());
  if (source === "collection" && value) list = list.filter((p) => (p.collection ?? "").toLowerCase() === value.toLowerCase());
  if (source === "sale") list = list.filter((p) => Number(p.compare_at ?? 0) > Number(p.price));
  if (source === "new") list = list.slice(0, limit);
  return list.slice(0, limit);
}

function Marquee({ children, speed = 22 }: { children: ReactNode; speed?: number }) {
  return (
    <div className="marquee-wrap" style={{ overflow: "hidden" }}>
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        <div style={{ display: "flex" }}>{children}</div>
        <div style={{ display: "flex" }} aria-hidden>{children}</div>
      </div>
    </div>
  );
}

export function BlockView({ block, ctx }: { block: Block; ctx: StoreCtx }) {
  const v = ctx.site.vars;
  const b = block;

  switch (b.type) {
    case "announcement": {
      const text = asStr(P(b, "text"));
      const inner = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", fontSize: 12, fontWeight: 600 }}>
          <Icon name={asStr(P(b, "icon", "truck"), "truck")} size={14} /> {text}
        </span>
      );
      return (
        <div style={{ background: v.accent, color: contrast(v.accent), textAlign: "center" }}>
          {P(b, "scrolling", false) ? <Marquee speed={24}>{[0, 1, 2, 3].map((i) => <span key={i}>{inner}</span>)}</Marquee> : inner}
        </div>
      );
    }

    case "hero": {
      const h = asStr(P(b, "height", "large"));
      const heights: Record<string, number> = { small: 340, medium: 460, large: 580, full: 720 };
      const align = asStr(P(b, "align", "left"));
      const sizes: Record<string, number> = { md: 34, lg: 44, xl: 56, "2xl": 68 };
      const image = safeImageUrl(asStr(P(b, "image")));
      return (
        <section
          data-reveal={ctx.preview ? undefined : ""} data-anim={b.style?.anim ?? "fade"}
          style={{ position: "relative", minHeight: heights[h] ?? 520, display: "flex", alignItems: asStr(P(b, "vAlign", "center")) === "top" ? "flex-start" : asStr(P(b, "vAlign")) === "bottom" ? "flex-end" : "center", overflow: "hidden", background: v.surface }}
        >
          {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${asNum(P(b, "overlay", 25), 25) / 100})` }} />
          <div style={{ ...containerStyle(v), padding: "64px 20px", textAlign: align as CSSProperties["textAlign"] }}>
            <div style={{ maxWidth: 620, marginInline: align === "center" ? "auto" : undefined, marginLeft: align === "right" ? "auto" : undefined, color: image ? "#fff" : v.text }}>
              {asStr(P(b, "eyebrow")) && <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.85 }}>{asStr(P(b, "eyebrow"))}</div>}
              <h1 style={{ ...headingStyle(v, sizes[asStr(P(b, "size", "xl"))] ?? 56), margin: "12px 0 0", whiteSpace: "pre-line" }}>{asStr(P(b, "title"))}</h1>
              {asStr(P(b, "subtitle")) && <p style={{ marginTop: 14, fontSize: 15, opacity: 0.9, whiteSpace: "pre-line" }}>{asStr(P(b, "subtitle"))}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", flexWrap: "wrap" }}>
                <Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} />
                <Btn ctx={ctx} label={asStr(P(b, "cta2"))} href={asStr(P(b, "cta2Link"))} variant="ghost" />
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "heroSplit": {
      const side = asStr(P(b, "side", "right"));
      const image = safeImageUrl(asStr(P(b, "image")));
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "center", direction: side === "left" ? "rtl" : "ltr" }}>
            <div style={{ direction: "ltr" }}>
              <h2 style={{ ...headingStyle(v, 40), margin: 0, whiteSpace: "pre-line" }}>{asStr(P(b, "title"))}</h2>
              <p style={{ color: v.muted, marginTop: 12, fontSize: 14.5 }}>{asStr(P(b, "text"))}</p>
              <div style={{ marginTop: 18 }}><Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} /></div>
            </div>
            {image && <div style={{ direction: "ltr", position: "relative", paddingBottom: "72%", overflow: "hidden", borderRadius: v.card === "plain" ? 0 : 18 }}>
              <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>}
          </div>
        </Section>
      );
    }

    case "marquee": {
      const outline = Boolean(P(b, "outline", false));
      return (
        <div style={{ background: b.style?.bg || v.surface, paddingBlock: 18 }}>
          <Marquee speed={asNum(P(b, "speed", 22), 22)}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "0 22px", ...headingStyle(v, 26), color: outline ? "transparent" : v.text, WebkitTextStroke: outline ? `1px ${v.text}` : undefined }}>
                {asStr(P(b, "text"))} <Icon name={asStr(P(b, "icon", "sparkles"), "sparkles")} size={16} />
              </span>
            ))}
          </Marquee>
        </div>
      );
    }

    case "countdown":
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ textAlign: "center" }}>
            <Title text={asStr(P(b, "title"))} ctx={ctx} />
            <Countdown target={asStr(P(b, "datetime"))} ctx={ctx} />
            <p style={{ color: v.muted, marginTop: 10, fontSize: 13 }}>{asStr(P(b, "text"))}</p>
            <div style={{ marginTop: 16 }}><Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} /></div>
          </div>
        </Section>
      );

    case "products": {
      const list = selectProducts(b, ctx);
      const cols = asNum(P(b, "columns", 4), 4);
      const rail = asStr(P(b, "layout", "grid")) === "rail";
      return (
        <Section block={b} ctx={ctx}>
          <div id="products" />
          <Title text={asStr(P(b, "title"))} sub={asStr(P(b, "subtitle"))} ctx={ctx} />
          {list.length === 0 ? (
            <div style={{ color: v.muted, fontSize: 13 }}>No products yet.</div>
          ) : rail ? (
            <div className="hide-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory" }}>
              {list.map((p) => (
                <div key={p.id} style={{ minWidth: 230, maxWidth: 260, flex: "0 0 auto", scrollSnapAlign: "start" }}>
                  <ProductCard p={p} ctx={ctx} ratio={asStr(P(b, "ratio", "3/4"), "3/4")} badges={Boolean(P(b, "badges", true))} swatches={Boolean(P(b, "swatches", true))} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 18, gridTemplateColumns: `repeat(auto-fill, minmax(${cols >= 5 ? 180 : cols === 4 ? 210 : 250}px, 1fr))` }}>
              {list.map((p) => (
                <ProductCard key={p.id} p={p} ctx={ctx} ratio={asStr(P(b, "ratio", "3/4"), "3/4")} badges={Boolean(P(b, "badges", true))} swatches={Boolean(P(b, "swatches", true))} />
              ))}
            </div>
          )}
        </Section>
      );
    }

    case "categories": {
      const items = asArr<{ label: string; image: string; link: string }>(P(b, "items", []));
      const label = asStr(P(b, "labelStyle", "center"));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: `repeat(auto-fit, minmax(${220}px, 1fr))` }}>
            {items.map((it, i) => (
              <div key={i} style={{ cursor: "pointer", ...cardStyle(v) }} onClick={() => ctx.go(safeLink(it.link))}>
                <div style={{ position: "relative", paddingBottom: ratioPad(asStr(P(b, "ratio", "4/5"), "4/5")), overflow: "hidden" }}>
                  {it.image && <img src={safeImageUrl(it.image)} alt={it.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                  {label !== "under" && (
                    <span style={{ position: "absolute", inset: label === "center" ? 0 : "auto auto 12px 12px", display: label === "center" ? "grid" : "inline-flex", placeItems: "center", color: "#fff", background: label === "center" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.6)", padding: label === "tag" ? "6px 12px" : 0, borderRadius: label === "tag" ? 999 : 0, fontSize: 13, fontWeight: 700 }}>
                      {it.label}
                    </span>
                  )}
                </div>
                {label === "under" && <div style={{ padding: "10px 4px", fontSize: 13, fontWeight: 600 }}>{it.label}</div>}
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "lookbook": {
      const items = asArr<{ kind: string; image: string; caption: string; title: string; text: string; cta: string; link: string }>(P(b, "items", []));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {items.map((it, i) =>
              it.kind === "card" ? (
                <div key={i} style={{ ...cardStyle(v), background: v.surface, padding: 26, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h3 style={{ ...headingStyle(v, 24), margin: 0 }}>{it.title}</h3>
                  <p style={{ color: v.muted, fontSize: 13.5, marginTop: 10 }}>{it.text}</p>
                  <div style={{ marginTop: 14 }}><Btn ctx={ctx} label={it.cta} href={it.link} /></div>
                </div>
              ) : (
                <div key={i} style={{ ...cardStyle(v) }}>
                  <div style={{ position: "relative", paddingBottom: "120%", overflow: "hidden" }}>
                    {it.image && <img src={safeImageUrl(it.image)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  {it.caption && <div style={{ padding: "10px 4px", fontSize: 12, color: v.muted }}>{it.caption}</div>}
                </div>
              ),
            )}
          </div>
        </Section>
      );
    }

    case "cta":
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ textAlign: asStr(P(b, "align", "center")) as CSSProperties["textAlign"] }}>
            <h2 style={{ ...headingStyle(v, 32), margin: 0 }}>{asStr(P(b, "title"))}</h2>
            <p style={{ color: v.muted, marginTop: 10, fontSize: 14 }}>{asStr(P(b, "text"))}</p>
            <div style={{ marginTop: 18 }}><Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} /></div>
          </div>
        </Section>
      );

    case "gallery": {
      const items = asArr<{ image: string; caption: string; link: string; span: number }>(P(b, "items", []));
      const cols = asNum(P(b, "columns", 4), 4);
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ display: "grid", gap: asNum(P(b, "gap", 8), 8), gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {items.map((it, i) => (
              <figure key={i} style={{ gridColumn: `span ${Math.min(2, Math.max(1, Number(it.span) || 1))}`, margin: 0, cursor: it.link ? "pointer" : "default", overflow: "hidden" }} onClick={() => it.link && ctx.go(safeLink(it.link))}>
                <div style={{ position: "relative", paddingBottom: ratioPad(asStr(P(b, "ratio", "1/1"), "1/1")), overflow: "hidden" }}>
                  {it.image && <img src={safeImageUrl(it.image)} alt="" className={P(b, "hoverZoom", true) ? "transition-transform duration-700 hover:scale-110" : ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                {it.caption && <figcaption style={{ fontSize: 11.5, color: v.muted, marginTop: 6 }}>{it.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      );
    }

    case "banner": {
      const image = safeImageUrl(asStr(P(b, "image")));
      return (
        <section data-reveal={ctx.preview ? undefined : ""} data-anim={b.style?.anim ?? "zoom-in"} style={{ position: "relative", minHeight: asNum(P(b, "height", 320), 320), display: "grid", placeItems: "center", overflow: "hidden" }}>
          {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)" }} />
          <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
            <h2 style={{ ...headingStyle(v, 36), margin: 0 }}>{asStr(P(b, "title"))}</h2>
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>{asStr(P(b, "text"))}</p>
            <div style={{ marginTop: 16 }}><Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} /></div>
          </div>
        </section>
      );
    }

    case "imageText": {
      const image = safeImageUrl(asStr(P(b, "image")));
      const left = asStr(P(b, "side", "left")) === "left";
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: "grid", gap: 30, gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", alignItems: "center" }}>
            <div style={{ order: left ? 0 : 1, position: "relative", paddingBottom: ratioPad(asStr(P(b, "ratio", "4/3"), "4/3")), overflow: "hidden", borderRadius: v.card === "plain" ? 0 : 16 }}>
              {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div>
              <Icon name={asStr(P(b, "icon", "leaf"), "leaf")} size={20} />
              <h2 style={{ ...headingStyle(v, 30), margin: "12px 0 0" }}>{asStr(P(b, "title"))}</h2>
              <p style={{ color: v.muted, marginTop: 12, fontSize: 14.5, lineHeight: 1.7 }}>{asStr(P(b, "text"))}</p>
              <div style={{ marginTop: 16 }}><Btn ctx={ctx} label={asStr(P(b, "cta"))} href={asStr(P(b, "ctaLink"))} /></div>
            </div>
          </div>
        </Section>
      );
    }

    case "splitText":
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <h2 style={{ ...headingStyle(v, 26), margin: 0 }}>{asStr(P(b, "left"))}</h2>
            <p style={{ color: v.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>{asStr(P(b, "right"))}</p>
          </div>
        </Section>
      );

    case "richText":
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ textAlign: asStr(P(b, "align", "center")) as CSSProperties["textAlign"], maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ ...headingStyle(v, 28), margin: 0 }}>{asStr(P(b, "title"))}</h2>
            <p style={{ color: v.muted, marginTop: 12, fontSize: 14.5, lineHeight: 1.8, whiteSpace: "pre-line" }}>{asStr(P(b, "body"))}</p>
          </div>
        </Section>
      );

    case "instagram": {
      const imgs = asArr<string | { value: string }>(P(b, "images", [])).map((x) => (typeof x === "string" ? x : x.value));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "handle", "@yourbrand"), "@yourbrand")} ctx={ctx} size={22} />
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${asNum(P(b, "columns", 4), 4)}, minmax(0,1fr))` }}>
            {imgs.map((src, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: "100%", overflow: "hidden" }}>
                <img src={safeImageUrl(src)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "video": {
      const embed = youtubeEmbed(asStr(P(b, "url")));
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ position: "relative", paddingBottom: "56.25%", overflow: "hidden", borderRadius: v.card === "plain" ? 0 : 16, background: v.surface }}>
            {embed && (
              <iframe
                src={`${embed}?rel=0${P(b, "autoplay", false) ? "&autoplay=1" : ""}${P(b, "muted", true) ? "&mute=1" : ""}${P(b, "loop", false) ? "&loop=1" : ""}`}
                title="video" allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            )}
          </div>
          {asStr(P(b, "caption")) && <p style={{ color: v.muted, fontSize: 12.5, marginTop: 10, textAlign: "center" }}>{asStr(P(b, "caption"))}</p>}
        </Section>
      );
    }

    case "newsletter": {
      const inline = asStr(P(b, "layout", "center")) === "inline";
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: inline ? "grid" : "block", gridTemplateColumns: inline ? "1fr 1fr" : undefined, gap: 24, textAlign: inline ? "start" : "center", maxWidth: inline ? undefined : 560, margin: inline ? undefined : "0 auto" }}>
            <div>
              <h2 style={{ ...headingStyle(v, 26), margin: 0 }}>{asStr(P(b, "title"))}</h2>
              <p style={{ color: v.muted, marginTop: 8, fontSize: 13.5 }}>{asStr(P(b, "text"))}</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 8, marginTop: inline ? 0 : 16, alignItems: "center" }}>
              <input placeholder="you@email.com" style={{ flex: 1, padding: "11px 14px", border: `1px solid ${v.line}`, background: v.bg, color: v.text, borderRadius: v.buttonRadius, fontSize: 13 }} />
              <button type="submit" style={buttonStyle(v)}>{asStr(P(b, "button", "Subscribe"), "Subscribe")}</button>
            </form>
          </div>
        </Section>
      );
    }

    case "features": {
      const items = asArr<{ icon: string; title: string; text: string }>(P(b, "items", []));
      const layout = asStr(P(b, "layout", "row"));
      const iconStyle = asStr(P(b, "iconStyle", "circle"));
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: `repeat(auto-fit, minmax(${layout === "row" ? 200 : 240}px, 1fr))` }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: layout === "row" ? "flex" : "block", gap: 12, alignItems: "center", padding: layout === "cards" ? 18 : 0, background: layout === "cards" ? v.surface : "transparent", borderRadius: layout === "cards" ? 16 : 0 }}>
                <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: iconStyle === "circle" ? 999 : iconStyle === "square" ? 10 : 0, background: iconStyle === "plain" ? "transparent" : v.surface, color: v.accent, flex: "0 0 auto" }}>
                  <Icon name={it.icon} size={17} />
                </span>
                <div style={{ marginTop: layout === "row" ? 0 : 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{it.title}</div>
                  <div style={{ fontSize: 12, color: v.muted, marginTop: 2 }}>{it.text}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "testimonials": {
      const items = asArr<{ quote: string; name: string; meta: string; rating: number; avatar: string }>(P(b, "items", []));
      const layout = asStr(P(b, "layout", "marquee"));
      const showStars = Boolean(P(b, "stars", true));
      const showAvatars = Boolean(P(b, "avatars", true));
      const cardKind = asStr(P(b, "card", "card"));
      const renderCard = (it: { quote: string; name: string; meta: string; rating: number; avatar: string }, key = 0) => (
        <div key={key} style={{ width: layout === "marquee" ? 320 : undefined, marginInlineEnd: layout === "marquee" ? 16 : 0, padding: cardKind === "flat" ? 0 : 20, background: cardKind === "card" ? v.surface : "transparent", border: cardKind === "quote" ? `1px solid ${v.line}` : undefined, borderRadius: cardKind === "flat" ? 0 : 16 }}>
          {showStars && (
            <div style={{ display: "flex", gap: 2, color: v.accent, marginBottom: 8 }}>
              {Array.from({ length: Math.max(1, Math.min(5, Number(it.rating) || 5)) }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
            </div>
          )}
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>&ldquo;{it.quote}&rdquo;</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            {showAvatars && (
              it.avatar
                ? <img src={safeImageUrl(it.avatar)} alt="" style={{ width: 30, height: 30, borderRadius: 99, objectFit: "cover" }} />
                : <span style={{ width: 30, height: 30, borderRadius: 99, background: v.accent, opacity: 0.25, display: "inline-block" }} />
            )}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{it.name}</div>
              <div style={{ fontSize: 11, color: v.muted }}>{it.meta}</div>
            </div>
          </div>
        </div>
      );
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} sub={asStr(P(b, "subtitle"))} ctx={ctx} />
          {layout === "marquee" ? (
            <Marquee speed={34}>{items.map((it, i) => renderCard(it, i))}</Marquee>
          ) : layout === "single" ? (
            <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>{items[0] && renderCard(items[0])}</div>
          ) : (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))" }}>
              {items.map((it, i) => renderCard(it, i))}
            </div>
          )}
        </Section>
      );
    }

    case "stats": {
      const items = asArr<{ value: string; label: string }>(P(b, "items", []));
      return (
        <Section block={b} ctx={ctx}>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", textAlign: "center" }}>
            {items.map((it, i) => (
              <div key={i}>
                <div style={{ ...headingStyle(v, 34) }}>{it.value}</div>
                <div style={{ fontSize: 12, color: v.muted, marginTop: 6 }}>{it.label}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "logos": {
      const items = asArr<{ label: string; image?: string }>(P(b, "items", []));
      const row = items.map((it, i) => (
        <span key={i} style={{ padding: "0 26px", fontSize: 15, fontWeight: 700, letterSpacing: ".12em", opacity: P(b, "grayscale", true) ? 0.45 : 1 }}>
          {it.image ? <img src={safeImageUrl(it.image)} alt={it.label} style={{ height: 22, objectFit: "contain" }} /> : it.label}
        </span>
      ));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} size={18} />
          {P(b, "scrolling", true) ? <Marquee speed={26}>{row}</Marquee> : <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>{row}</div>}
        </Section>
      );
    }

    case "steps": {
      const items = asArr<{ title: string; text: string }>(P(b, "items", []));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" }}>
            {items.map((it, i) => (
              <div key={i}>
                <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 999, border: `1px solid ${v.line}`, fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 10 }}>{it.title}</div>
                <div style={{ fontSize: 12.5, color: v.muted, marginTop: 4 }}>{it.text}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "team": {
      const items = asArr<{ name: string; role: string; image: string }>(P(b, "items", []));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
            {items.map((it, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ position: "relative", paddingBottom: "100%", borderRadius: 999, overflow: "hidden", background: v.surface }}>
                  {it.image && <img src={safeImageUrl(it.image)} alt={it.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10 }}>{it.name}</div>
                <div style={{ fontSize: 11.5, color: v.muted }}>{it.role}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "faq": {
      const items = asArr<{ q: string; a: string }>(P(b, "items", []));
      return (
        <Section block={b} ctx={ctx}>
          <Title text={asStr(P(b, "title"))} ctx={ctx} />
          <div style={{ maxWidth: 720 }}>
            {items.map((it, i) => <Accordion key={i} q={it.q} a={it.a} v={v} />)}
          </div>
        </Section>
      );
    }

    case "divider": {
      const style = asStr(P(b, "style", "line"));
      return (
        <div style={{ ...containerStyle(v), paddingBlock: 28 }}>
          {style === "line" && <hr style={{ border: 0, borderTop: `1px solid ${v.line}` }} />}
          {style === "dots" && <div style={{ textAlign: "center", letterSpacing: 8, color: v.muted }}>•••</div>}
          {style === "wave" && <div style={{ height: 14, backgroundImage: `repeating-radial-gradient(circle at 10px -6px, transparent 0 8px, ${v.line} 8px 9px)` }} />}
          {style === "space" && <div style={{ height: 8 }} />}
        </div>
      );
    }

    case "spacer":
      return <div style={{ height: asNum(P(b, "height", 48), 48) }} />;

    default:
      return null;
  }
}

function Accordion({ q, a, v }: { q: string; a: string; v: SiteDoc["vars"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${v.line}` }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", fontSize: 14, fontWeight: 600, background: "transparent", color: "inherit", cursor: "pointer" }}>
        {q} {open ? <Minus size={15} /> : <Plus size={15} />}
      </button>
      {open && <p style={{ fontSize: 13.5, color: v.muted, paddingBottom: 16, margin: 0, lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

function Countdown({ target, ctx }: { target: string; ctx: StoreCtx }) {
  const [fallbackEnd] = useState(() => Date.now() + 86400000 * 2);
  const end = useMemo(() => (target ? new Date(target).getTime() : fallbackEnd), [target, fallbackEnd]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, end - now);
  const parts = [
    ["Days", Math.floor(diff / 86400000)],
    ["Hours", Math.floor(diff / 3600000) % 24],
    ["Min", Math.floor(diff / 60000) % 60],
    ["Sec", Math.floor(diff / 1000) % 60],
  ] as const;
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {parts.map(([l, n2]) => (
        <div key={l} style={{ minWidth: 68, padding: "12px 8px", background: ctx.site.vars.surface, borderRadius: 12 }}>
          <div style={{ ...headingStyle(ctx.site.vars, 26) }}>{String(n2).padStart(2, "0")}</div>
          <div style={{ fontSize: 10.5, color: ctx.site.vars.muted, marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export { ArrowRight };
