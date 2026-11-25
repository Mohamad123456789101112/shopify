"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { RevealScript } from "@/components/Reveal";

export function MarketingShell({ authed, children }: { authed: boolean; children: ReactNode }) {
  return (
    <div className="marketing-workspace">
      <SiteHeader authed={authed} />
      <main>{children}</main>
      <SiteFooter />
      <RevealScript />
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">{children}</div>;
}

export function PageHero({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <section className="border-b bg-[var(--panel2)]" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Kicker>{kicker}</Kicker>
        <h1 className="display mt-3 max-w-[760px] text-[38px] font-extrabold leading-[1.06] tracking-tight md:text-[52px]">{title}</h1>
        {sub && <p className="mt-4 max-w-[620px] text-[15px] leading-relaxed text-[var(--dim)]">{sub}</p>}
      </div>
    </section>
  );
}

export function Prose({ blocks }: { blocks: { h: string; p: string }[] }) {
  return (
    <section className="mx-auto max-w-[820px] px-5 py-14">
      {blocks.map((b, i) => (
        <div key={b.h} data-reveal data-anim="fade-up" style={{ ["--rev-delay" as string]: `${i * 0.05}s` }} className="mb-8">
          <h2 className="display text-[20px] font-bold">{b.h}</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--dim)]">{b.p}</p>
        </div>
      ))}
    </section>
  );
}
