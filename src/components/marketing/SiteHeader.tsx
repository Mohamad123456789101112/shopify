"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, MoonStar, Sun, ArrowRight, Languages, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/Providers";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/features", key: "nav.features" },
  { href: "/templates", key: "nav.templates" },
  { href: "/pricing", key: "nav.pricing" },
  { href: "/about", key: "nav.about" },
];

export function SiteHeader({ authed = false }: { authed?: boolean }) {
  const { t, dark, toggleDark, lang, setLang } = useI18n();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--bg)]/85 backdrop-blur-md" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[13.5px] font-medium transition hover:opacity-100 ${
                path === l.href ? "opacity-100 underline decoration-[#e0704a] decoration-2 underline-offset-8" : "opacity-70"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="btn btn-ghost !px-3 !py-2" aria-label="Language">
            <Languages size={16} />
            <span className="text-xs font-bold">{lang === "en" ? "ع" : "EN"}</span>
          </button>
          <button onClick={toggleDark} className="btn btn-ghost !px-3 !py-2" aria-label="Theme">
            {dark ? <Sun size={16} /> : <MoonStar size={16} />}
          </button>
          {authed ? (
            <Link href="/dashboard" className="btn btn-primary hidden sm:inline-flex">
              {t("cta.dashboard")} <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden text-[13.5px] font-semibold sm:block">
                {t("cta.login")}
              </Link>
              <Link href="/signup" className="btn btn-primary hidden sm:inline-flex">
                {t("cta.create")} <ArrowRight size={15} />
              </Link>
            </>
          )}
          <button className="btn btn-ghost !px-3 !py-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t md:hidden" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-2 py-2 text-sm font-medium hover:bg-[var(--panel2)]">
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="btn btn-ghost flex-1">{t("cta.login")}</Link>
              <Link href="/signup" className="btn btn-primary flex-1">{t("cta.create")}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
