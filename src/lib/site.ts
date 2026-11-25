import { PLAN_LIMITS, type Plan, safeImageUrl, safeLink } from "./constants";
import { getTheme } from "./themes";

export type BlockType =
  | "announcement" | "hero" | "heroSplit" | "marquee" | "countdown" | "products" | "categories"
  | "lookbook" | "cta" | "gallery" | "banner" | "imageText" | "splitText" | "richText"
  | "instagram" | "video" | "newsletter" | "features" | "testimonials" | "stats" | "logos"
  | "steps" | "team" | "faq" | "divider" | "spacer";

export type BlockStyle = {
  anim?: string; loop?: string; delay?: number; duration?: number;
  bg?: string; bgImage?: string; overlay?: number; color?: string; paddingY?: number;
  shape?: string; shapeColor?: string; shapePos?: string;
  rounded?: boolean; border?: boolean; shadow?: boolean;
};

export type Block = {
  id: string;
  type: BlockType;
  hidden?: boolean;
  style?: BlockStyle;
  props: Record<string, unknown>;
};

export type NavLink = { label: string; href: string };

export type Brand = {
  logo: string; logoHeight: number; favicon: string; name: string; tagline: string;
  nav: NavLink[]; socials: { instagram: string; tiktok: string; facebook: string; whatsapp: string };
  contact: { phone: string; email: string; address: string };
  currency: string; freeShippingThreshold: number; shippingFee: number; codFee: number;
  whatsappFloat: boolean; stickyHeader: boolean; transparentHeader: boolean;
  footer: {
    style: "editorial" | "minimal" | "columns"; about: string; newsletter: boolean; newsletterTitle: string;
    socials: boolean; payments: boolean; columns: { title: string; links: NavLink[] }[]; bottom: string;
  };
  mobileBar: { enabled: boolean; items: string[] };
};

export type ThemeVars = {
  bg: string; text: string; muted: string; accent: string; surface: string; line: string;
  headingFont: string; bodyFont: string; headingWeight: number; letterSpacing: string;
  uppercase: boolean; baseSize: number; buttonStyle: "solid" | "outline" | "underline";
  buttonRadius: number; buttonUppercase: boolean; card: "plain" | "rounded" | "framed";
  nav: "center" | "left" | "split"; gap: number; container: number;
  imageFilter: "none" | "warm" | "cool" | "mono"; pageAnim: string;
};

export type ProductTpl = {
  layout: "split" | "gallery" | "stacked"; ratio: string; breadcrumb: boolean; stock: boolean; sku: boolean;
  share: boolean; sizeGuide: boolean; guideText: string; colors: boolean; sizes: boolean; sizeList: string[];
  addText: string; buyText: string; trust: { icon: string; text: string }[]; description: string;
  accordions: { title: string; body: string }[]; related: boolean; relatedTitle: string; relatedLimit: number;
  stickyBar: boolean; anim: string;
};

export type CheckoutTpl = {
  title: string; subtitle: string;
  fields: { email: boolean; emailRequired: boolean; phone2: boolean; city: boolean; area: boolean; address: boolean; notes: boolean };
  cities: string[];
  payments: {
    cod: { enabled: boolean; label: string; note: string; fee: number };
    card: { enabled: boolean; label: string; note: string };
    wallet: { enabled: boolean; label: string; note: string; number: string };
    instapay: { enabled: boolean; label: string; note: string; number: string };
  };
  discount: boolean; summary: boolean; terms: string; termsRequired: boolean; button: string;
  successTitle: string; successText: string; whatsappConfirm: boolean;
  trust: { icon: string; text: string }[]; policy: string;
};

export type PageDoc = { slug: string; title: string; body: string; enabled: boolean; inFooter: boolean };

export type SiteDoc = {
  version: number; theme: string; vars: ThemeVars; brand: Brand; blocks: Block[];
  product: ProductTpl; checkout: CheckoutTpl; pages: PageDoc[];
  notFound: { title: string; text: string; button: string; illustration: string };
  showBranding: boolean; customCss: string;
};

export type Field =
  | { k: string; label: string; type: "text" | "textarea" | "number" | "toggle" | "color" | "image" | "link" }
  | { k: string; label: string; type: "select"; options: string[] }
  | { k: string; label: string; type: "range"; min: number; max: number; step?: number }
  | { k: string; label: string; type: "list"; itemFields: Field[] };

export type BlockDef = { label: string; icon: string; group: string; defaults: Record<string, unknown>; fields: Field[] };

const txt = (k: string, label: string): Field => ({ k, label, type: "text" });
const area = (k: string, label: string): Field => ({ k, label, type: "textarea" });
const tog = (k: string, label: string): Field => ({ k, label, type: "toggle" });
const img = (k: string, label: string): Field => ({ k, label, type: "image" });
const sel = (k: string, label: string, options: string[]): Field => ({ k, label, type: "select", options });
const rng = (k: string, label: string, min: number, max: number, step = 1): Field => ({ k, label, type: "range", min, max, step });

const RATIOS = ["1/1", "3/4", "4/5", "4/3", "16/9"];

export const BLOCKS: Record<BlockType, BlockDef> = {
  announcement: {
    label: "Announcement", icon: "megaphone", group: "Top",
    defaults: { text: "Free shipping over 1500 EGP · Cash on delivery", scrolling: false, icon: "truck" },
    fields: [txt("text", "Text"), tog("scrolling", "Scrolling"), sel("icon", "Icon", ["truck", "sparkles", "gift", "flame"])],
  },
  hero: {
    label: "Hero", icon: "image", group: "Hero",
    defaults: {
      eyebrow: "New season", title: "Timeless pieces\nmade to be worn", subtitle: "Designed in Cairo. Delivered to your door.",
      cta: "Shop now", ctaLink: "#products", cta2: "Our story", cta2Link: "/page/about",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80", mobileImage: "",
      align: "left", vAlign: "center", overlay: 25, height: "large", size: "xl",
    },
    fields: [
      txt("eyebrow", "Eyebrow"), area("title", "Title (\\n supported)"), area("subtitle", "Subtitle"),
      txt("cta", "Button"), { k: "ctaLink", label: "Button link", type: "link" },
      txt("cta2", "Second button"), { k: "cta2Link", label: "Second link", type: "link" },
      img("image", "Image"), img("mobileImage", "Mobile image"),
      sel("align", "Align", ["left", "center", "right"]), sel("vAlign", "Vertical", ["top", "center", "bottom"]),
      rng("overlay", "Overlay", 0, 80), sel("height", "Height", ["small", "medium", "large", "full"]),
      sel("size", "Headline size", ["md", "lg", "xl", "2xl"]),
    ],
  },
  heroSplit: {
    label: "Hero Split", icon: "columns", group: "Hero",
    defaults: {
      title: "The winter edit", text: "Soft wool, clean lines, everyday luxury.", cta: "Shop the edit", ctaLink: "#products",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80", side: "right",
    },
    fields: [area("title", "Title"), area("text", "Text"), txt("cta", "Button"), { k: "ctaLink", label: "Link", type: "link" }, img("image", "Image"), sel("side", "Image side", ["left", "right"])],
  },
  marquee: {
    label: "Marquee", icon: "move-right", group: "Content",
    defaults: { text: "Handmade · Limited drops · Free returns", speed: 22, icon: "sparkles", outline: false },
    fields: [txt("text", "Text"), rng("speed", "Speed (s)", 6, 60), sel("icon", "Separator icon", ["sparkles", "star", "gem", "flame"]), tog("outline", "Outline style")],
  },
  countdown: {
    label: "Countdown", icon: "timer", group: "Content",
    defaults: { title: "Drop ends in", text: "Limited quantities", datetime: "", cta: "Shop the drop", ctaLink: "#products" },
    fields: [txt("title", "Title"), txt("text", "Text"), txt("datetime", "Ends at (ISO)"), txt("cta", "Button"), { k: "ctaLink", label: "Link", type: "link" }],
  },
  products: {
    label: "Products", icon: "shopping-bag", group: "Commerce",
    defaults: { title: "Featured", subtitle: "", source: "all", value: "", limit: 8, layout: "grid", columns: 4, filters: false, ratio: "3/4", badges: true, swatches: true, cardAnim: "fade-up" },
    fields: [
      txt("title", "Title"), txt("subtitle", "Subtitle"), sel("source", "Source", ["all", "category", "collection", "new", "sale"]),
      txt("value", "Category / collection"), rng("limit", "Limit", 2, 24), sel("layout", "Layout", ["grid", "rail"]),
      sel("columns", "Columns", ["3", "4", "5"]), tog("filters", "Filters"), sel("ratio", "Image ratio", RATIOS),
      tog("badges", "Badges"), tog("swatches", "Colour swatches"),
    ],
  },
  categories: {
    label: "Categories", icon: "layout-grid", group: "Commerce",
    defaults: {
      title: "Shop by category", columns: 3, ratio: "4/5", labelStyle: "center",
      items: [
        { label: "Dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80", link: "#products" },
        { label: "Bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80", link: "#products" },
        { label: "Jewellery", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80", link: "#products" },
      ],
    },
    fields: [txt("title", "Title"), sel("columns", "Columns", ["2", "3", "4"]), sel("ratio", "Ratio", RATIOS), sel("labelStyle", "Label", ["tag", "center", "under"]),
      { k: "items", label: "Items", type: "list", itemFields: [txt("label", "Label"), img("image", "Image"), { k: "link", label: "Link", type: "link" }] }],
  },
  lookbook: {
    label: "Lookbook", icon: "images", group: "Content",
    defaults: {
      title: "Lookbook",
      items: [
        { kind: "image", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=80", caption: "Look 01" },
        { kind: "card", title: "Autumn 26", text: "Wearable layers in warm neutrals.", cta: "Discover", link: "#products" },
        { kind: "image", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80", caption: "Look 02" },
      ],
    },
    fields: [txt("title", "Title"), { k: "items", label: "Cards", type: "list", itemFields: [sel("kind", "Type", ["image", "card"]), img("image", "Image"), txt("caption", "Caption"), txt("title", "Card title"), area("text", "Card text"), txt("cta", "Button"), { k: "link", label: "Link", type: "link" }] }],
  },
  cta: {
    label: "Call to action", icon: "megaphone", group: "Content",
    defaults: { title: "Ready to wear it?", text: "Free delivery on your first order.", cta: "Shop now", ctaLink: "#products", align: "center" },
    fields: [area("title", "Title"), area("text", "Text"), txt("cta", "Button"), { k: "ctaLink", label: "Link", type: "link" }, sel("align", "Align", ["left", "center"])],
  },
  gallery: {
    label: "Gallery", icon: "layout-grid", group: "Content",
    defaults: {
      title: "In the wild", columns: 4, ratio: "1/1", gap: 8, hoverZoom: true,
      items: [
        { image: "https://images.unsplash.com/photo-1467043198406-dc953a3defa0?w=700&q=80", caption: "", link: "", span: 1 },
        { image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=80", caption: "", link: "", span: 1 },
        { image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=80", caption: "", link: "", span: 1 },
        { image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80", caption: "", link: "", span: 1 },
      ],
    },
    fields: [txt("title", "Title"), sel("columns", "Columns", ["2", "3", "4", "5"]), sel("ratio", "Ratio", RATIOS), rng("gap", "Gap", 0, 32), tog("hoverZoom", "Hover zoom"),
      { k: "items", label: "Images", type: "list", itemFields: [img("image", "Image"), txt("caption", "Caption"), { k: "link", label: "Link", type: "link" }, rng("span", "Span", 1, 2)] }],
  },
  banner: {
    label: "Banner", icon: "image", group: "Content",
    defaults: { title: "Up to 30% off", text: "Mid-season sale", cta: "Shop sale", ctaLink: "#products", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80", height: 320 },
    fields: [txt("title", "Title"), txt("text", "Text"), txt("cta", "Button"), { k: "ctaLink", label: "Link", type: "link" }, img("image", "Image"), rng("height", "Height", 160, 600, 10)],
  },
  imageText: {
    label: "Image + Text", icon: "columns", group: "Content",
    defaults: { image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1000&q=80", title: "Made slowly, worn forever", text: "Every piece is cut and sewn in small batches by a team we know by name.", icon: "leaf", cta: "Our story", ctaLink: "/page/about", side: "left", ratio: "4/3" },
    fields: [img("image", "Image"), area("title", "Title"), area("text", "Text"), sel("icon", "Icon", ["leaf", "gem", "heart", "shield"]), txt("cta", "Button"), { k: "ctaLink", label: "Link", type: "link" }, sel("side", "Image side", ["left", "right"]), sel("ratio", "Ratio", RATIOS)],
  },
  splitText: {
    label: "Split text", icon: "columns", group: "Content",
    defaults: { left: "Our promise", right: "Quality you can feel, prices that make sense, and delivery across Egypt in 2–4 days." },
    fields: [txt("left", "Left"), area("right", "Right")],
  },
  richText: {
    label: "Rich text", icon: "type", group: "Content",
    defaults: { title: "About the brand", body: "We started in a small Cairo studio in 2021 with one sewing machine and a plan.", align: "center" },
    fields: [txt("title", "Title"), area("body", "Body"), sel("align", "Align", ["left", "center"])],
  },
  instagram: {
    label: "Instagram", icon: "instagram", group: "Social",
    defaults: {
      handle: "@yourbrand", columns: 4,
      images: [
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
        "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80",
      ],
    },
    fields: [txt("handle", "Handle"), sel("columns", "Columns", ["3", "4", "6"]), { k: "images", label: "Images", type: "list", itemFields: [img("value", "Image")] }],
  },
  video: {
    label: "Video", icon: "play", group: "Content",
    defaults: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", autoplay: false, loop: false, muted: true, caption: "" },
    fields: [txt("url", "YouTube URL"), tog("autoplay", "Autoplay"), tog("loop", "Loop"), tog("muted", "Muted"), txt("caption", "Caption")],
  },
  newsletter: {
    label: "Newsletter", icon: "mail", group: "Content",
    defaults: { title: "Join the list", text: "First access to drops and 10% off your first order.", button: "Subscribe", layout: "center" },
    fields: [txt("title", "Title"), area("text", "Text"), txt("button", "Button"), sel("layout", "Layout", ["center", "inline"])],
  },
  features: {
    label: "Features strip", icon: "sparkles", group: "Trust",
    defaults: {
      layout: "row", iconStyle: "circle",
      items: [
        { icon: "truck", title: "Fast delivery", text: "2–4 days across Egypt" },
        { icon: "refresh", title: "Easy returns", text: "14-day exchanges" },
        { icon: "shield", title: "Secure checkout", text: "Cash on delivery" },
        { icon: "chat", title: "Real support", text: "WhatsApp us anytime" },
      ],
    },
    fields: [sel("layout", "Layout", ["row", "grid", "cards"]), sel("iconStyle", "Icon style", ["circle", "square", "plain"]),
      { k: "items", label: "Items", type: "list", itemFields: [sel("icon", "Icon", ["truck", "refresh", "shield", "chat", "gift", "star", "leaf", "zap"]), txt("title", "Title"), txt("text", "Text")] }],
  },
  testimonials: {
    label: "Testimonials", icon: "quote", group: "Trust",
    defaults: {
      title: "Loved by our customers", subtitle: "", layout: "marquee", stars: true, avatars: true, card: "card",
      items: [
        { quote: "The quality is unreal for the price. My third order already!", name: "Sarah M.", meta: "Cairo", rating: 5, avatar: "" },
        { quote: "Shipping was fast and the packaging felt like a gift.", name: "Omar K.", meta: "Alexandria", rating: 5, avatar: "" },
        { quote: "Finally a local brand that fits properly.", name: "Nour A.", meta: "Giza", rating: 5, avatar: "" },
        { quote: "Customer service replied in 3 minutes on WhatsApp.", name: "Youssef H.", meta: "Mansoura", rating: 5, avatar: "" },
      ],
    },
    fields: [txt("title", "Title"), txt("subtitle", "Subtitle"), sel("layout", "Layout", ["grid", "marquee", "single"]), tog("stars", "Stars"), tog("avatars", "Avatars"), sel("card", "Card style", ["flat", "card", "quote"]),
      { k: "items", label: "Reviews", type: "list", itemFields: [area("quote", "Quote"), txt("name", "Name"), txt("meta", "Meta"), rng("rating", "Rating", 1, 5), img("avatar", "Avatar")] }],
  },
  stats: {
    label: "Stats", icon: "award", group: "Trust",
    defaults: { countUp: true, items: [{ value: "12k", label: "Orders delivered" }, { value: "4.9", label: "Average rating" }, { value: "48h", label: "Dispatch time" }] },
    fields: [tog("countUp", "Count up"), { k: "items", label: "Stats", type: "list", itemFields: [txt("value", "Value"), txt("label", "Label")] }],
  },
  logos: {
    label: "Logos", icon: "award", group: "Trust",
    defaults: { title: "As seen in", scrolling: true, grayscale: true, items: [{ label: "VOGUE" }, { label: "ELLE" }, { label: "CAIRO SCENE" }, { label: "IDENTITY" }] },
    fields: [txt("title", "Title"), tog("scrolling", "Scrolling"), tog("grayscale", "Grayscale"), { k: "items", label: "Logos", type: "list", itemFields: [txt("label", "Label"), img("image", "Image")] }],
  },
  steps: {
    label: "Steps", icon: "list", group: "Content",
    defaults: { title: "How to order", items: [{ title: "Pick your pieces", text: "Browse the collection" }, { title: "Checkout", text: "Cash on delivery or wallet" }, { title: "Track", text: "Follow your order live" }] },
    fields: [txt("title", "Title"), { k: "items", label: "Steps", type: "list", itemFields: [txt("title", "Title"), area("text", "Text")] }],
  },
  team: {
    label: "Team", icon: "users", group: "Content",
    defaults: { title: "The studio", items: [{ name: "Layla", role: "Founder", image: "" }, { name: "Karim", role: "Production", image: "" }] },
    fields: [txt("title", "Title"), { k: "items", label: "People", type: "list", itemFields: [txt("name", "Name"), txt("role", "Role"), img("image", "Photo")] }],
  },
  faq: {
    label: "FAQ", icon: "chat", group: "Content",
    defaults: { title: "Questions", items: [{ q: "How long is delivery?", a: "2–4 working days across Egypt." }, { q: "Can I exchange?", a: "Yes, within 14 days in original condition." }] },
    fields: [txt("title", "Title"), { k: "items", label: "Questions", type: "list", itemFields: [txt("q", "Question"), area("a", "Answer")] }],
  },
  divider: { label: "Divider", icon: "minus", group: "Layout", defaults: { style: "line" }, fields: [sel("style", "Style", ["line", "dots", "wave", "space"])] },
  spacer: { label: "Spacer", icon: "minus", group: "Layout", defaults: { height: 48 }, fields: [rng("height", "Height", 8, 200, 4)] },
};

export const BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[];

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newBlock(type: BlockType): Block {
  return { id: uid(), type, props: structuredClone(BLOCKS[type].defaults), style: { anim: "fade-up", paddingY: 64 } };
}

export function themeVars(themeId: string): ThemeVars {
  const th = getTheme(themeId);
  return {
    bg: th.bg, text: th.text, muted: th.muted, accent: th.accent, surface: th.surface, line: th.line,
    headingFont: th.headingFont, bodyFont: th.bodyFont, headingWeight: th.headingWeight,
    letterSpacing: th.letterSpacing, uppercase: th.uppercase, baseSize: 15,
    buttonStyle: th.button, buttonRadius: th.radius, buttonUppercase: th.uppercase, card: th.card,
    nav: th.nav, gap: 72, container: 1200, imageFilter: "none", pageAnim: "fade",
  };
}

export const DEFAULT_PAGES: PageDoc[] = [
  { slug: "about", title: "About us", body: "We are a small studio making considered pieces in limited runs.", enabled: true, inFooter: true },
  { slug: "shipping", title: "Shipping", body: "Orders are dispatched within 48 hours. Delivery takes 2–4 working days.", enabled: true, inFooter: true },
  { slug: "returns", title: "Returns", body: "Exchanges accepted within 14 days in original condition.", enabled: true, inFooter: true },
  { slug: "privacy", title: "Privacy policy", body: "We only collect the data needed to deliver your order.", enabled: true, inFooter: true },
  { slug: "terms", title: "Terms", body: "By ordering you agree to our standard terms of sale.", enabled: true, inFooter: true },
  { slug: "contact", title: "Contact", body: "WhatsApp us any day from 10:00 to 20:00.", enabled: true, inFooter: true },
  { slug: "faq", title: "FAQ", body: "Answers to the questions we get most.", enabled: true, inFooter: false },
];

export function defaultSite(storeName: string, themeId = "atelier"): SiteDoc {
  const base = ["announcement", "hero", "features", "products", "imageText", "categories", "testimonials", "gallery", "newsletter", "faq"] as BlockType[];
  return {
    version: 1,
    theme: themeId,
    vars: themeVars(themeId),
    brand: {
      logo: "", logoHeight: 32, favicon: "", name: storeName, tagline: "Modern essentials",
      nav: [
        { label: "Shop", href: "#products" },
        { label: "About", href: "/page/about" },
        { label: "Contact", href: "/page/contact" },
      ],
      socials: { instagram: "", tiktok: "", facebook: "", whatsapp: "" },
      contact: { phone: "", email: "", address: "" },
      currency: "EGP", freeShippingThreshold: 1500, shippingFee: 60, codFee: 0,
      whatsappFloat: true, stickyHeader: true, transparentHeader: false,
      footer: {
        style: "columns", about: `${storeName} — made with care.`, newsletter: true, newsletterTitle: "Join the list",
        socials: true, payments: true,
        columns: [
          { title: "Shop", links: [{ label: "All products", href: "#products" }, { label: "New in", href: "#products" }] },
          { title: "Help", links: [{ label: "Shipping", href: "/page/shipping" }, { label: "Returns", href: "/page/returns" }] },
          { title: "Brand", links: [{ label: "About", href: "/page/about" }, { label: "Contact", href: "/page/contact" }] },
        ],
        bottom: `© 2026 ${storeName}`,
      },
      mobileBar: { enabled: true, items: ["home", "shop", "cart", "track"] },
    },
    blocks: base.map((t) => newBlock(t)),
    product: {
      layout: "split", ratio: "3/4", breadcrumb: true, stock: true, sku: false, share: true, sizeGuide: true,
      guideText: "S fits 36–38 · M fits 40–42 · L fits 44–46", colors: true, sizes: true,
      sizeList: ["S", "M", "L", "XL"], addText: "Add to cart", buyText: "Buy now",
      trust: [{ icon: "truck", text: "Delivery in 2–4 days" }, { icon: "refresh", text: "14-day exchange" }, { icon: "shield", text: "Cash on delivery" }],
      description: "", accordions: [{ title: "Materials & care", body: "Machine wash cold, hang to dry." }],
      related: true, relatedTitle: "You may also like", relatedLimit: 4, stickyBar: true, anim: "fade-up",
    },
    checkout: {
      title: "Checkout", subtitle: "Cash on delivery available",
      fields: { email: true, emailRequired: false, phone2: false, city: true, area: false, address: true, notes: true },
      cities: ["Cairo", "Giza", "Alexandria", "Mansoura", "Tanta", "Port Said"],
      payments: {
        cod: { enabled: true, label: "Cash on delivery", note: "Pay the courier when it arrives", fee: 0 },
        card: { enabled: false, label: "Card (coming soon)", note: "Temporarily unavailable" },
        wallet: { enabled: false, label: "Vodafone Cash", note: "Send the total then paste the reference", number: "" },
        instapay: { enabled: false, label: "InstaPay", note: "Transfer then upload the receipt", number: "" },
      },
      discount: true, summary: true, terms: "I agree to the store terms and return policy.", termsRequired: true,
      button: "Place order", successTitle: "Order confirmed", successText: "We will call you to confirm shortly.",
      whatsappConfirm: true,
      trust: [{ icon: "lock", text: "Secure" }, { icon: "truck", text: "Fast delivery" }, { icon: "refresh", text: "Easy returns" }],
      policy: "Your details are only used to deliver this order.",
    },
    pages: structuredClone(DEFAULT_PAGES),
    notFound: { title: "Page not found", text: "The page you are looking for has moved or never existed.", button: "Back to shop", illustration: "shirt" },
    showBranding: true,
    customCss: "",
  };
}

/** Starter block set per theme (used by "load theme layout"). */
export function themeLayout(themeId: string): BlockType[] {
  const map: Record<string, BlockType[]> = {
    atelier: ["announcement", "hero", "features", "products", "splitText", "testimonials", "gallery", "newsletter"],
    noir: ["announcement", "hero", "marquee", "products", "imageText", "features", "testimonials", "stats", "newsletter"],
    maison: ["hero", "features", "categories", "products", "imageText", "testimonials", "faq", "newsletter"],
    street: ["marquee", "hero", "features", "countdown", "products", "lookbook", "testimonials", "instagram"],
    modest: ["announcement", "hero", "categories", "features", "products", "testimonials", "richText", "newsletter"],
    rose: ["announcement", "heroSplit", "features", "products", "gallery", "testimonials", "newsletter"],
    sahara: ["hero", "features", "products", "banner", "lookbook", "testimonials", "faq"],
    monochrome: ["announcement", "hero", "features", "products", "splitText", "testimonials", "logos"],
    riviera: ["hero", "features", "categories", "products", "imageText", "testimonials", "gallery"],
    velvet: ["announcement", "hero", "features", "products", "lookbook", "testimonials", "stats", "newsletter"],
  };
  return map[themeId] ?? map.atelier;
}

const clampStr = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Server-side publish guard: caps text, validates images/links, enforces plan. */
export function sanitizeSite(input: SiteDoc, plan: Plan): SiteDoc {
  const limits = PLAN_LIMITS[plan];
  const doc: SiteDoc = structuredClone(input);
  doc.version = 1;
  doc.customCss = limits.customCss ? clampStr(doc.customCss, 8000).replace(/<\/?script/gi, "").replace(/@import/gi, "").replace(/expression\s*\(/gi, "") : "";
  doc.showBranding = limits.branding ? true : Boolean(doc.showBranding);
  doc.brand.name = clampStr(doc.brand.name, 40);
  doc.brand.tagline = clampStr(doc.brand.tagline, 120);
  doc.brand.logo = safeImageUrl(doc.brand.logo);
  doc.brand.favicon = safeImageUrl(doc.brand.favicon);
  doc.brand.nav = (doc.brand.nav || []).slice(0, 7).map((l) => ({ label: clampStr(l.label, 24), href: safeLink(l.href) }));
  doc.brand.footer.columns = (doc.brand.footer.columns || []).slice(0, 3).map((c) => ({
    title: clampStr(c.title, 24),
    links: (c.links || []).slice(0, 8).map((l) => ({ label: clampStr(l.label, 24), href: safeLink(l.href) })),
  }));
  doc.brand.mobileBar.items = (doc.brand.mobileBar.items || []).filter((i) => ["home", "shop", "cart", "track", "whatsapp", "search"].includes(i)).slice(0, 5);
  doc.blocks = (doc.blocks || []).slice(0, 40).map((b) => {
    const def = BLOCKS[b.type];
    if (!def) return b;
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(b.props || {})) {
      if (typeof v === "string") props[k] = /^(https?:|data:)/i.test(v) ? safeImageUrl(v) || safeLink(v) : v.slice(0, 2000);
      else props[k] = v;
    }
    return { ...b, props };
  });
  doc.pages = (doc.pages || []).slice(0, 14).map((p) => ({
    slug: clampStr(p.slug, 40).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    title: clampStr(p.title, 60),
    body: clampStr(p.body, 8000),
    enabled: Boolean(p.enabled),
    inFooter: Boolean(p.inFooter),
  }));
  return doc;
}
