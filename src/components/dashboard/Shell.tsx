"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell, ChartNoAxesColumn, CreditCard, LayoutDashboard, LogOut, Megaphone, MoonStar, Package,
  PanelsTopLeft, Settings, ShoppingCart, Sun, Users, ExternalLink, Menu,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/Providers";

const NAV = [
  { href: "/dashboard", label: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "dash.products", icon: Package },
  { href: "/dashboard/orders", label: "dash.orders", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "dash.customers", icon: Users },
  { href: "/dashboard/analytics", label: "dash.analytics", icon: ChartNoAxesColumn },
  { href: "/dashboard/marketing", label: "dash.marketing", icon: Megaphone },
  { href: "/dashboard/billing", label: "dash.billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "dash.settings", icon: Settings },
];

export type Notif = { id: string; kind: string; title: string; text: string | null; read: boolean; created_at: string };

export function DashboardShell({
  children, name, storeSlug, plan, unread, notifications, isOwner,
}: {
  children: ReactNode; name: string; storeSlug: string; plan: string; unread: number;
  notifications: Notif[]; isOwner: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { t, dark, toggleDark, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--panel2)]">
      <aside className={`fixed inset-y-0 z-50 w-[232px] border-e bg-[var(--panel)] p-4 transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}`} style={{ borderColor: "var(--border)" }}>
        <Logo href="/dashboard" />
        <nav className="mt-6 grid gap-1">
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition ${active ? "bg-[#111] text-white dark:bg-white dark:text-[#111]" : "hover:bg-[var(--panel2)]"}`}>
                <n.icon size={15} /> {t(n.label)}
              </Link>
            );
          })}
          <Link href="/dashboard/builder" className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#e0704a] hover:bg-[var(--panel2)]">
            <PanelsTopLeft size={15} /> {t("dash.builder")}
          </Link>
        </nav>
        <div className="absolute inset-x-4 bottom-4 grid gap-2">
          <a href={`/store/${storeSlug}`} target="_blank" rel="noreferrer" className="btn btn-soft w-full !text-[12px]">
            <ExternalLink size={14} /> View store
          </a>
          {isOwner && <Link href="/admin" className="btn btn-ghost w-full !text-[12px]">Platform admin</Link>}
          <button onClick={logout} className="btn btn-ghost w-full !text-[12px]"><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <div className="md:ps-[232px]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-[var(--bg)]/90 px-5 backdrop-blur" style={{ borderColor: "var(--border)" }}>
          <button className="btn btn-ghost !px-2.5 md:hidden" onClick={() => setOpen((v) => !v)}><Menu size={16} /></button>
          <div className="hidden text-[13px] font-semibold sm:block">
            {name} <span className="pill ms-2 bg-[var(--panel2)] uppercase">{plan}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="btn btn-ghost !px-3 !py-2 !text-[12px]">{lang === "en" ? "ع" : "EN"}</button>
            <button onClick={toggleDark} className="btn btn-ghost !px-3 !py-2">{dark ? <Sun size={15} /> : <MoonStar size={15} />}</button>
            <div className="relative">
              <button onClick={() => setBell((b) => !b)} className="btn btn-ghost !px-3 !py-2 relative">
                <Bell size={15} />
                {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#e0704a] px-1.5 text-[9px] font-bold text-white">{unread}</span>}
              </button>
              {bell && (
                <div className="absolute end-0 top-11 z-50 w-[300px] card p-2 shadow-soft">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[12px] font-bold">Notifications</span>
                    <button className="text-[11px] text-[#e0704a]" onClick={async () => { await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "notifications.read" }) }); router.refresh(); setBell(false); }}>
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 && <p className="px-2 py-3 text-[12px] text-[var(--dim)]">Nothing yet.</p>}
                    {notifications.map((n) => (
                      <div key={n.id} className={`rounded-xl px-2 py-2 ${n.read ? "" : "bg-[var(--panel2)]"}`}>
                        <div className="text-[12px] font-semibold">{n.title}</div>
                        <div className="text-[11px] text-[var(--dim)]">{n.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="display text-[22px] font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-[12.5px] text-[var(--dim)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function UpgradeNote({ plan, need, feature }: { plan: string; need: string; feature: string }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <div className="text-[13px] font-bold">{feature} is a {need} feature</div>
        <div className="text-[12px] text-[var(--dim)]">You are on the {plan} plan. Upgrade to unlock it.</div>
      </div>
      <Link href="/dashboard/billing" className="btn btn-brand">Upgrade</Link>
    </div>
  );
}
