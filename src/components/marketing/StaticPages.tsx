"use client";

import Link from "next/link";
import { Check, Star } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { PLAN_PRICES } from "@/lib/constants";
import { PageHero, Prose } from "./Shell";

type Content = { kicker: string; title: string; sub: string; blocks: { h: string; p: string }[] };

export const CONTENT: Record<string, Content> = {
  features: {
    kicker: "POWERFUL FEATURES", title: "Everything you need to sell",
    sub: "Products, orders, customers, marketing and a visual builder — in one Arabic-first platform.",
    blocks: [
      { h: "Product management", p: "Unlimited images, compare-at pricing, stock, categories, collections, colour swatches and badges. CSV export on Pro." },
      { h: "Orders built for COD", p: "Cash on delivery first, with Vodafone Cash and InstaPay receipt review, carrier tracking and a customer-facing timeline." },
      { h: "Visual site builder", p: "26 blocks, 10 fashion themes, device preview at 390 / 834 / desktop, undo-redo and one-click publish." },
      { h: "Marketing", p: "Discount codes validated server-side on every order, plus email and WhatsApp campaigns on Pro." },
    ],
  },
  templates: {
    kicker: "PROFESSIONAL TEMPLATES", title: "Ten themes made for fashion",
    sub: "Every theme ships with a full starter layout, a moving testimonials marquee and a features strip — all editable.",
    blocks: [],
  },
  pricing: {
    kicker: "SIMPLE & TRANSPARENT", title: "Pricing that grows with you",
    sub: "Start free with 10 products. Upgrade any time with Vodafone Cash or InstaPay — approved by our team within hours.",
    blocks: [],
  },
  integrations: {
    kicker: "INTEGRATIONS", title: "Plays well with your stack",
    sub: "The tools Egyptian and Gulf brands actually use.",
    blocks: [
      { h: "Payments", p: "Cash on delivery, Vodafone Cash and InstaPay today. Card gateways are parked until licensing completes." },
      { h: "Messaging", p: "WhatsApp float button, order confirmation links and WhatsApp campaigns on Pro." },
      { h: "Storage & media", p: "Private per-merchant media bucket with magic-byte validation; approved images are copied to the public bucket on publish." },
    ],
  },
  about: {
    kicker: "ABOUT BLY", title: "Your brand. Your store. Our platform.",
    sub: "BLY (BRANDLY) helps small fashion and accessories brands launch in minutes — Egypt first, then the Gulf.",
    blocks: [
      { h: "Why we exist", p: "Talented brands lose sales inside DM threads. BLY turns an Instagram shop into a real storefront with tracking, receipts and analytics." },
      { h: "Arabic first", p: "Full RTL, Arabic display type and device-language detection with a persisted toggle." },
      { h: "Security is not optional", p: "Row-level security on every table, privileged operations behind RPCs, audit and security logs for the platform team." },
    ],
  },
  blog: {
    kicker: "BLOG", title: "Notes from the studio",
    sub: "Playbooks on launching, pricing and shipping a fashion brand in Egypt.",
    blocks: [
      { h: "How to price for COD", p: "Cash on delivery changes your margin maths. Here is the shipping-fee model we recommend." },
      { h: "Photograph your first 10 products", p: "A window, a white sheet and a phone are enough to get started." },
      { h: "From DMs to a storefront", p: "Move your customers to checkout without losing the personal touch." },
    ],
  },
  careers: {
    kicker: "CAREERS", title: "Build the commerce layer for the region",
    sub: "Small team, high ownership, remote-friendly across Egypt.",
    blocks: [
      { h: "Product engineer", p: "Next.js + Postgres. You will own features end-to-end, including the RLS policies behind them." },
      { h: "Merchant success", p: "Onboard brands, review payment receipts and turn feedback into roadmap." },
    ],
  },
  contact: {
    kicker: "CONTACT", title: "Talk to a human",
    sub: "We answer on WhatsApp and email, every day from 10:00 to 20:00 Cairo time.",
    blocks: [
      { h: "Support", p: "support@brandly.store — for anything about your store, orders or payments." },
      { h: "Partnerships", p: "partners@brandly.store — agencies, photographers and fulfilment partners." },
    ],
  },
  help: {
    kicker: "HELP CENTER", title: "Guides and answers",
    sub: "Setup, products, orders, payments, publishing and plans.",
    blocks: [
      { h: "Getting started", p: "Complete the 5-step setup wizard: brand, category, theme, payments and your first product." },
      { h: "Publishing", p: "The builder autosaves a draft. Publishing validates and sanitises your site before it goes live." },
      { h: "Plan payments", p: "Send the amount to the platform wallet, paste the reference and upload the receipt. We approve within hours." },
    ],
  },
  terms: {
    kicker: "LEGAL", title: "Terms of Service",
    sub: "The rules for using BLY as a merchant.",
    blocks: [
      { h: "Accounts", p: "One store per merchant account. You are responsible for the products you list and the orders you fulfil." },
      { h: "Plans and payments", p: "Plan payments are reviewed manually. Approved payments extend your expiry date, grace-aware." },
      { h: "Acceptable use", p: "No counterfeit goods, no illegal items, no scripts injected through custom CSS." },
    ],
  },
  privacy: {
    kicker: "LEGAL", title: "Privacy Policy",
    sub: "What we store, why we store it, and who can read it.",
    blocks: [
      { h: "Merchant data", p: "Your store, products and orders are isolated by row-level security — other merchants can never read them." },
      { h: "Customer data", p: "Order tracking requires both the tracking code and the last six digits of the phone number." },
      { h: "Logs", p: "We keep append-only audit and security logs readable only by the platform owner." },
    ],
  },
};

export function MarketingBody({ slug }: { slug: keyof typeof CONTENT }) {
  const c = CONTENT[slug];
  return (
    <>
      <PageHero kicker={c.kicker} title={c.title} sub={c.sub} />
      {slug === "templates" && <TemplatesGrid />}
      {slug === "pricing" && <PricingTable />}
      {c.blocks.length > 0 && <Prose blocks={c.blocks} />}
    </>
  );
}

function TemplatesGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((th, i) => (
          <div key={th.id} data-reveal data-anim="fade-up" style={{ ["--rev-delay" as string]: `${(i % 3) * 0.06}s` }} className="card overflow-hidden shadow-soft">
            <div style={{ background: th.bg, color: th.text }} className="p-5">
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: th.muted }}>{th.tag}</div>
              <div className="mt-2 text-[24px] leading-tight" style={{ fontFamily: th.headingFont === "playfair" ? "var(--font-playfair)" : th.headingFont === "sora" ? "var(--font-sora)" : th.headingFont === "fredoka" ? "var(--font-fredoka)" : "var(--font-manrope)", fontWeight: th.headingWeight, letterSpacing: th.letterSpacing, textTransform: th.uppercase ? "uppercase" : "none" }}>
                {th.name}
              </div>
              <div className="mt-4 flex gap-2">
                {[th.accent, th.surface, th.line, th.muted].map((c) => <span key={c} className="h-6 w-6 rounded-full border" style={{ background: c, borderColor: th.line }} />)}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-[11.5px] font-semibold"
                style={{
                  background: th.button === "solid" ? th.accent : "transparent",
                  color: th.button === "solid" ? th.bg : th.accent,
                  border: th.button === "outline" ? `1px solid ${th.accent}` : "none",
                  borderBottom: th.button === "underline" ? `2px solid ${th.accent}` : undefined,
                  borderRadius: th.radius,
                }}>
                Shop now
              </div>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="text-[12.5px] font-bold">{th.name} <span className="text-[var(--dim)]">/ {th.nameAr}</span></div>
                <div className="text-[10.5px] text-[var(--dim)]">{th.tag}</div>
              </div>
              <Link href="/signup" className="btn btn-soft !py-1.5 !text-[11px]">Use theme</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingTable() {
  const rows = [
    { name: "Free", price: "0", items: ["1 store", "10 products", "Brand tab in builder", "BLY branding"] },
    { name: "Growth", price: `${PLAN_PRICES.growth.monthly}`, items: ["100 products", "Full builder", "Discounts", "Analytics", "No branding"] },
    { name: "Pro", price: `${PLAN_PRICES.pro.monthly}`, items: ["Unlimited products", "Campaigns", "CSV export", "Custom domain", "Custom CSS"] },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14">
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((p, i) => (
          <div key={p.name} className={`card p-6 ${i === 1 ? "shadow-soft ring-2 ring-[#111] dark:ring-white" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold">{p.name}</span>
              {i === 1 && <Star size={14} className="fill-[#008060] text-[#008060]" />}
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="display text-[30px] font-extrabold">{p.price}</span>
              <span className="mb-1.5 text-[11.5px] text-[var(--dim)]">EGP /month</span>
            </div>
            <ul className="mt-4 space-y-2">
              {p.items.map((x) => <li key={x} className="flex items-center gap-2 text-[12.5px]"><Check size={14} className="text-[#008060]" /> {x}</li>)}
            </ul>
            <Link href="/signup" className={`btn mt-6 w-full ${i === 1 ? "btn-primary" : "btn-ghost"}`}>Get started</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
