export const PLAN_LIMITS = {
  free: { products: 10, analytics: false, discounts: false, campaigns: false, csv: false, builder: false, domain: false, branding: true, customCss: false },
  growth: { products: 100, analytics: true, discounts: true, campaigns: false, csv: false, builder: true, domain: false, branding: false, customCss: false },
  pro: { products: Infinity, analytics: true, discounts: true, campaigns: true, csv: true, builder: true, domain: true, branding: false, customCss: true },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export const PLAN_PRICES = {
  growth: { monthly: 299, yearly: 2870 },
  pro: { monthly: 599, yearly: 5750 },
} as const;

export const CURRENCIES = ["EGP", "SAR", "AED", "USD", "EUR", "KWD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const FONTS = [
  { id: "manrope", label: "Manrope", css: "var(--font-manrope)" },
  { id: "sora", label: "Sora", css: "var(--font-sora)" },
  { id: "playfair", label: "Playfair Display", css: "var(--font-playfair)" },
  { id: "fredoka", label: "Fredoka", css: "var(--font-fredoka)" },
  { id: "plexar", label: "IBM Plex Sans Arabic", css: "var(--font-plexar)" },
  { id: "reem", label: "Reem Kufi", css: "var(--font-reem)" },
  { id: "caveat", label: "Caveat", css: "var(--font-caveat)" },
  { id: "system", label: "System UI", css: "system-ui, sans-serif" },
  { id: "serif", label: "Georgia Serif", css: "Georgia, serif" },
] as const;

export const fontCss = (id: string) => FONTS.find((f) => f.id === id)?.css ?? "var(--font-manrope)";

export const ANIMATIONS = [
  "none", "fade", "fade-up", "fade-down", "fade-left", "fade-right", "zoom-in", "zoom-out",
  "flip-up", "blur-in", "slide-up", "rotate-in", "bounce-in", "clip-up", "clip-left",
] as const;

export const LOOP_ANIMATIONS = ["none", "float", "pulse", "breathe", "shimmer", "kenburns", "tilt", "glow", "wiggle"] as const;

export const ICONS = [
  "sparkles", "truck", "refresh", "shield", "chat", "heart", "star", "gift", "leaf", "gem",
  "crown", "zap", "award", "clock", "globe", "lock", "smile", "tag", "package", "creditcard",
  "phone", "mail", "mappin", "check", "flame", "sun", "moon", "scissors", "shirt", "watch",
] as const;
export type IconName = (typeof ICONS)[number];

export const PALETTES: { id: string; label: string; colors: string[] }[] = [
  { id: "cream", label: "Cream", colors: ["#faf8f5", "#111111", "#6f6a64", "#e0704a", "#f4f1ec", "#e6e1da"] },
  { id: "noir", label: "Noir", colors: ["#0b0b0c", "#f4efe6", "#9c948a", "#c9a75a", "#151517", "#26262a"] },
  { id: "blush", label: "Blush", colors: ["#fff7f5", "#3b2a2e", "#a58a90", "#d67b8a", "#fceeee", "#f3dede"] },
  { id: "sand", label: "Sand", colors: ["#f4ecdf", "#3d2f24", "#8f7d6b", "#c8643a", "#ebdfcd", "#ddd0ba"] },
  { id: "mono", label: "Mono", colors: ["#ffffff", "#000000", "#777777", "#000000", "#f4f4f4", "#e5e5e5"] },
  { id: "navy", label: "Riviera", colors: ["#f8f6f0", "#12233d", "#6d7889", "#1f4e79", "#eef0f4", "#dfe3ea"] },
  { id: "plum", label: "Velvet", colors: ["#1a1220", "#f3e9dc", "#a898a8", "#d4b483", "#241a2c", "#32243c"] },
  { id: "neon", label: "Street", colors: ["#111111", "#ffffff", "#a3a3a3", "#e0ff3c", "#1c1c1c", "#2a2a2a"] },
];

export const IMAGE_FILTERS = ["none", "warm", "cool", "mono"] as const;

export const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com", "plus.unsplash.com", "images.pexels.com", "cdn.pixabay.com",
  "res.cloudinary.com", "lh3.googleusercontent.com", "i.imgur.com", "picsum.photos",
];

export function safeImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("/api/media/") || url.startsWith("/uploads/") || url.startsWith("/images/")) return url;
  if (url.startsWith("data:image/")) return url.slice(0, 400000);
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return "";
    if (!ALLOWED_IMAGE_HOSTS.includes(u.hostname)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export function safeLink(url: string | undefined | null): string {
  if (!url) return "#";
  const v = url.trim();
  if (v.startsWith("/") || v.startsWith("#")) return v;
  if (/^https:\/\//i.test(v)) return v;
  if (/^mailto:|^tel:|^https:\/\/wa\.me\//i.test(v)) return v;
  return "#";
}

export const ORDER_STATUSES = ["New", "Processing", "Shipped", "Delivered", "Refunded", "Cancelled"] as const;

export function money(amount: number | string, currency: Currency | string = "EGP") {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}
