"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BarChart3, Check, ChevronLeft, ChevronRight, Globe2, Megaphone, Package,
  Play, Shield, Smartphone, Sparkles, Star, Zap,
} from "lucide-react";
import { useI18n } from "@/components/Providers";
import { Kicker } from "./Shell";
import { DashboardMock, HeroMock } from "./Mock";
import { THEMES } from "@/lib/themes";
import { PLAN_PRICES } from "@/lib/constants";

const HOW = [
  { n: "01", icon: Package, k: "how.s1", d: "how.s1d" },
  { n: "02", icon: Sparkles, k: "how.s2", d: "how.s2d" },
  { n: "03", icon: Globe2, k: "how.s3", d: "how.s3d" },
  { n: "04", icon: BarChart3, k: "how.s4", d: "how.s4d" },
];

const FEATURES = [
  { icon: Package, t: "Product Management", d: "Add unlimited products, variants and collections." },
  { icon: Zap, t: "Order Management", d: "Track orders and keep your customers updated." },
  { icon: BarChart3, t: "Analytics", d: "See what is working with real-time insights." },
  { icon: Megaphone, t: "Marketing Tools", d: "Discounts, coupons, email & WhatsApp campaigns." },
  { icon: Shield, t: "Secure by default", d: "Row-level security on every table, always on." },
  { icon: Smartphone, t: "Mobile First", d: "Storefronts pixel-precise from 390px up." },
];

const TESTIMONIALS = [
  { q: "Brandly made it so easy to launch my store. I had no experience, and now I am already getting orders!", n: "Sarah M.", m: "Fashion Brand Owner" },
  { q: "The templates are beautiful and the platform is super simple to use. My new favorite tool!", n: "Omar K.", m: "Lifestyle Brand Owner" },
  { q: "Best investment for my business. The analytics and custom domain options are game changers!", n: "Nour A.", m: "Handmade Store Owner" },
  { q: "Amazing support and features. I have tried other platforms, but Brandly is in another level.", n: "Youssef H.", m: "E-commerce Entrepreneur" },
];

export function HomeSections() {
  const { t } = useI18n();
  const [yearly, setYearly] = useState(false);
  const [slide, setSlide] = useState(0);

  const plans = [
    { id: "free", name: "Free", blurb: "Perfect for getting started", price: 0, items: ["1 store", "Up to 10 products", "Standard templates", "BLY subdomain"] },
    { id: "growth", name: "Growth", blurb: "For growing brands", price: yearly ? PLAN_PRICES.growth.yearly : PLAN_PRICES.growth.monthly, popular: true, items: ["Up to 100 products", "Full site builder", "Discount codes", "Analytics", "Remove BLY branding"] },
    { id: "pro", name: "Pro", blurb: "For serious sellers", price: yearly ? PLAN_PRICES.pro.yearly : PLAN_PRICES.pro.monthly, items: ["Unlimited products", "Campaigns (email/WhatsApp)", "CSV export", "Custom domain", "Custom CSS"] },
  ];

  return (
    <>
      {/* HERO */}
      <section className="bg-[var(--panel2)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--panel)] px-3 py-1.5" style={{ borderColor: "var(--border)" }}>
              <Sparkles size={13} className="text-[#e0704a]" />
              <span className="text-[11.5px] font-semibold">{t("hero.badge")}</span>
              <span className="text-[11px] text-[var(--dim)]">{t("hero.badge2")}</span>
            </div>
            <h1 className="display mt-5 text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[62px]">
              {t("hero.title1")}
              <br />
              {t("hero.title2")} <span className="text-[#9b8c7d]">{t("hero.title3")}</span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-[var(--dim)]">{t("hero.sub")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary !px-6 !py-3">{t("cta.start")} <ArrowRight size={16} /></Link>
              <Link href="/templates" className="btn btn-ghost !px-6 !py-3"><Play size={15} /> {t("cta.demo")}</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[["hero.f1", Package], ["hero.f2", Smartphone], ["hero.f3", Shield], ["hero.f4", BarChart3]].map(([k, I]) => {
                const Ico = I as typeof Package;
                return (
                  <div key={k as string} className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border bg-[var(--panel)]" style={{ borderColor: "var(--border)" }}>
                      <Ico size={14} />
                    </span>
                    <span className="text-[11.5px] font-medium leading-tight text-[var(--dim)]">{t(k as string)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative pb-10"><HeroMock /></div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y bg-[var(--bg)]" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>{t("how.kicker")}</Kicker>
            <h2 className="display mt-3 text-[32px] font-extrabold tracking-tight">{t("how.title")}</h2>
            <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[var(--dim)]">{t("how.sub")}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW.map((s, i) => (
                <div key={s.n} data-reveal data-anim="fade-up" style={{ ["--rev-delay" as string]: `${i * 0.07}s` }} className="border-l ps-4 first:border-none first:ps-0 lg:border-l" >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--panel2)] text-[10.5px] font-bold">{s.n}</span>
                    <s.icon size={14} className="text-[var(--dim)]" />
                  </div>
                  <div className="mt-3 text-[13px] font-bold">{t(s.k)}</div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--dim)]">{t(s.d)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <DashboardMock />
            <div className="script absolute -bottom-6 right-2 hidden text-[22px] leading-tight text-[var(--dim)] lg:block">
              Your Brand<br />Your Rules
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="bg-[var(--panel2)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.5fr]">
          <div>
            <Kicker>{t("tpl.kicker")}</Kicker>
            <h2 className="display mt-3 text-[32px] font-extrabold tracking-tight">{t("tpl.title")}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dim)]">{t("tpl.sub")}</p>
            <Link href="/templates" className="btn btn-primary mt-6 w-fit">{t("cta.browse")} <ArrowRight size={15} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {THEMES.slice(0, 4).map((th, i) => (
              <div key={th.id} data-reveal data-anim="fade-up" style={{ ["--rev-delay" as string]: `${i * 0.06}s` }}>
                <div className="overflow-hidden rounded-xl border shadow-soft" style={{ borderColor: "var(--border)", background: th.bg }}>
                  <div className="flex gap-1 border-b px-2 py-1.5" style={{ borderColor: th.line }}>
                    {["#f87171", "#fbbf24", "#34d399"].map((c) => <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />)}
                  </div>
                  <div className="p-2">
                    <div className="aspect-box h-[92px] rounded-md">
                      <img src={`https://images.unsplash.com/photo-${["1483985988355-763728e1935b", "1539109136881-3be0616acf4b", "1490481651871-ab68de25d43d", "1496747611176-843222e1e57c"][i]}?w=400&q=70`} alt="" />
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {Array.from({ length: 4 }).map((_, k) => <span key={k} className="h-6 rounded" style={{ background: th.surface }} />)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[12px] font-bold">{th.name}</div>
                <div className="text-[10.5px] text-[var(--dim)]">{th.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[var(--bg)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Kicker>{t("feat.kicker")}</Kicker>
            <h2 className="display mt-3 text-[32px] font-extrabold tracking-tight">{t("feat.title")}</h2>
            <p className="mt-3 max-w-[430px] text-[14px] leading-relaxed text-[var(--dim)]">{t("feat.sub")}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <div key={f.t} data-reveal data-anim="fade-up" style={{ ["--rev-delay" as string]: `${i * 0.05}s` }} className="card p-4">
                  <f.icon size={16} />
                  <div className="mt-2.5 text-[12.5px] font-bold">{f.t}</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--dim)]">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative"><DashboardMock /></div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-y bg-[var(--panel2)]" style={{ borderColor: "var(--border)" }} id="pricing">
        <div className="mx-auto max-w-[1200px] px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker>{t("price.kicker")}</Kicker>
              <h2 className="display mt-3 text-[32px] font-extrabold tracking-tight">{t("price.title")}</h2>
              <p className="mt-2 text-[14px] text-[var(--dim)]">{t("price.sub")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-[var(--panel)] p-1" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setYearly(false)} className={`btn !py-1.5 !text-[12px] ${!yearly ? "btn-primary" : ""}`}>{t("price.monthly")}</button>
              <button onClick={() => setYearly(true)} className={`btn !py-1.5 !text-[12px] ${yearly ? "btn-primary" : ""}`}>{t("price.yearly")}</button>
              <span className="pill bg-[#e0704a]/10 text-[#e0704a]">{t("price.save")}</span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className={`card relative p-6 ${p.popular ? "shadow-soft ring-2 ring-[#111] dark:ring-white" : ""}`}>
                {p.popular && <span className="pill absolute right-5 top-5 bg-[#111] text-white dark:bg-white dark:text-[#111]">Most Popular</span>}
                <div className="text-[14px] font-bold">{p.name}</div>
                <div className="text-[11.5px] text-[var(--dim)]">{p.blurb}</div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="display text-[30px] font-extrabold">{p.price === 0 ? "0" : p.price.toLocaleString()}</span>
                  <span className="mb-1.5 text-[11.5px] text-[var(--dim)]">EGP {yearly ? "/year" : t("price.month")}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-[12.5px]"><Check size={14} className="text-[#e0704a]" /> {i}</li>
                  ))}
                </ul>
                <Link href="/signup" className={`btn mt-6 w-full ${p.popular ? "btn-primary" : "btn-ghost"}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[var(--bg)]">
        <div className="mx-auto max-w-[1200px] px-5 py-16">
          <div className="flex items-end justify-between">
            <div>
              <Kicker>{t("test.kicker")}</Kicker>
              <h2 className="display mt-3 text-[32px] font-extrabold tracking-tight">{t("test.title")}</h2>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost !px-3" onClick={() => setSlide((s) => Math.max(0, s - 1))} aria-label="Prev"><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost !px-3" onClick={() => setSlide((s) => Math.min(TESTIMONIALS.length - 1, s + 1))} aria-label="Next"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="mt-8 overflow-hidden">
            <div className="flex gap-4 transition-transform duration-500" style={{ transform: `translateX(-${slide * 25}%)` }}>
              {TESTIMONIALS.map((x) => (
                <div key={x.n} className="card w-full shrink-0 p-5 md:w-[calc(25%-12px)]">
                  <div className="flex items-start gap-3">
                    <span className="h-9 w-9 shrink-0 rounded-full brand-grad opacity-80" />
                    <p className="text-[12px] leading-relaxed text-[var(--dim)]">&ldquo;{x.q}&rdquo;</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold">{x.n}</div>
                      <div className="text-[10.5px] text-[var(--dim)]">{x.m}</div>
                    </div>
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="fill-[#e0704a] text-[#e0704a]" />)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
