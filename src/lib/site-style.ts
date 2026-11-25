import type { CSSProperties } from "react";
import { fontCss } from "./constants";
import type { BlockStyle, SiteDoc, ThemeVars } from "./site";

export type StoreProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  compare_at?: string | number | null;
  stock: number;
  image: string | null;
  category?: string | null;
  collection?: string | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  badge?: string | null;
  sold?: number;
  created_at?: string;
};

export function rootVars(v: ThemeVars): CSSProperties {
  return {
    ["--s-bg" as string]: v.bg,
    ["--s-text" as string]: v.text,
    ["--s-muted" as string]: v.muted,
    ["--s-accent" as string]: v.accent,
    ["--s-surface" as string]: v.surface,
    ["--s-line" as string]: v.line,
    ["--s-radius" as string]: `${v.buttonRadius}px`,
    ["--s-gap" as string]: `${v.gap}px`,
    ["--s-container" as string]: `${v.container}px`,
    ["--s-head" as string]: fontCss(v.headingFont),
    ["--s-body" as string]: fontCss(v.bodyFont),
    background: v.bg,
    color: v.text,
    fontFamily: fontCss(v.bodyFont),
    fontSize: `${v.baseSize}px`,
  };
}

export function headingStyle(v: ThemeVars, size?: number): CSSProperties {
  return {
    fontFamily: fontCss(v.headingFont),
    fontWeight: v.headingWeight,
    letterSpacing: v.letterSpacing,
    textTransform: v.uppercase ? "uppercase" : "none",
    fontSize: size ? `${size}px` : undefined,
    lineHeight: 1.1,
  };
}

export function buttonStyle(v: ThemeVars, variant: "primary" | "ghost" = "primary"): CSSProperties {
  const base: CSSProperties = {
    borderRadius: v.buttonRadius,
    textTransform: v.buttonUppercase ? "uppercase" : "none",
    letterSpacing: v.buttonUppercase ? "0.08em" : undefined,
    padding: "11px 22px",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    transition: "transform .18s ease, opacity .18s ease",
  };
  if (variant === "ghost") return { ...base, background: "transparent", color: v.text, border: `1px solid ${v.line}` };
  if (v.buttonStyle === "outline") return { ...base, background: "transparent", color: v.accent, border: `1px solid ${v.accent}` };
  if (v.buttonStyle === "underline") {
    return { ...base, background: "transparent", color: v.text, padding: "6px 2px", borderBottom: `2px solid ${v.accent}`, borderRadius: 0 };
  }
  return { ...base, background: v.accent, color: contrast(v.accent), border: "1px solid transparent" };
}

export function cardStyle(v: ThemeVars): CSSProperties {
  if (v.card === "rounded") return { borderRadius: Math.max(12, v.buttonRadius), overflow: "hidden", background: v.surface };
  if (v.card === "framed") return { border: `1px solid ${v.line}`, borderRadius: v.buttonRadius, overflow: "hidden", background: v.bg };
  return { borderRadius: 0, background: "transparent" };
}

export function contrast(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

export function sectionStyle(style: BlockStyle | undefined, v: ThemeVars): CSSProperties {
  const st = style ?? {};
  return {
    paddingTop: st.paddingY ?? v.gap,
    paddingBottom: st.paddingY ?? v.gap,
    background: st.bgImage ? `url(${st.bgImage}) center/cover` : st.bg || undefined,
    color: st.color || undefined,
    borderRadius: st.rounded ? 24 : undefined,
    border: st.border ? `1px solid ${v.line}` : undefined,
    boxShadow: st.shadow ? "0 30px 60px -40px rgba(0,0,0,.45)" : undefined,
    position: "relative",
    overflow: "hidden",
  };
}

export const containerStyle = (v: ThemeVars): CSSProperties => ({
  maxWidth: v.container,
  margin: "0 auto",
  padding: "0 20px",
  position: "relative",
  zIndex: 1,
});

export function ratioPad(ratio: string) {
  const [w, h] = ratio.split("/").map(Number);
  if (!w || !h) return "125%";
  return `${(h / w) * 100}%`;
}

export function priceOf(p: StoreProduct) {
  return Number(p.price) || 0;
}

export function publishedSite(doc: unknown): SiteDoc | null {
  if (doc && typeof doc === "object" && Array.isArray((doc as SiteDoc).blocks)) return doc as SiteDoc;
  return null;
}

export function youtubeEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,20})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : "";
}
