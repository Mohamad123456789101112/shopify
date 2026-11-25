"use client";

import Link from "next/link";
import { ArrowRight, AtSign, Camera, Music2, ShieldCheck, Users, Video } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useI18n } from "@/components/Providers";

const COLS = [
  { title: "footer.product", links: [["Features", "/features"], ["Templates", "/templates"], ["Pricing", "/pricing"], ["Integrations", "/integrations"]] },
  { title: "footer.company", links: [["About Us", "/about"], ["Blog", "/blog"], ["Careers", "/careers"], ["Contact", "/contact"]] },
  { title: "footer.support", links: [["Help Center", "/help"], ["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"]] },
];

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-white text-[#111]">
              <LogoMark size={26} />
            </span>
            <span className="display text-[16px] font-extrabold tracking-tight">BRANDLY</span>
          </div>
          <p className="mt-3 max-w-[220px] text-[12.5px] text-white/60">{t("footer.tagline")}</p>
          <div className="mt-4 flex gap-3 text-white/60">
            {[Camera, Music2, Video, AtSign, Users].map((I, i) => (
              <span key={i} className="cursor-pointer transition hover:text-white"><I size={16} /></span>
            ))}
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="text-[12.5px] font-bold">{t(c.title)}</div>
            <ul className="mt-3 space-y-2">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-[12.5px] text-white/60 transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <div className="text-[12.5px] font-bold">{t("footer.loop")}</div>
          <p className="mt-2 text-[12px] text-white/55">{t("footer.loopSub")}</p>
          <form className="mt-3 flex overflow-hidden rounded-full border border-white/15 bg-white/5" onSubmit={(e) => e.preventDefault()}>
            <input className="w-full bg-transparent px-4 py-2 text-[12.5px] outline-none placeholder:text-white/40" placeholder={t("footer.email")} />
            <button className="grid w-11 place-items-center bg-white text-[#111]" aria-label="Subscribe"><ArrowRight size={15} /></button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-5 py-5 text-[11.5px] text-white/45 md:flex-row">
          <span>{t("footer.rights")}</span>
          <div className="flex items-center gap-3">
            <span>{t("footer.secure")}</span>
            {["VISA", "MC", "ApplePay", "GPay", "tamara"].map((p) => (
              <span key={p} className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70">{p}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> 100% Secure · SSL</span>
        </div>
      </div>
    </footer>
  );
}
