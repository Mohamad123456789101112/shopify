"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight, Bell, ChartNoAxesColumn, Check, ChevronDown, CreditCard, HelpCircle, Home, LogOut,
  Megaphone, Menu, MoonStar, Package, PanelsTopLeft, Search, Settings, ShoppingBag, ShoppingCart,
  Sparkles, Sun, Users, X,
} from "lucide-react";
import { useI18n } from "@/components/Providers";

const NAV = [
  { href: "/dashboard", label: "dash.overview", en: "Home", ar: "الرئيسية", icon: Home },
  { href: "/dashboard/orders", label: "dash.orders", en: "Orders", ar: "الطلبات", icon: ShoppingCart },
  { href: "/dashboard/products", label: "dash.products", en: "Products", ar: "المنتجات", icon: Package },
  { href: "/dashboard/customers", label: "dash.customers", en: "Customers", ar: "العملاء", icon: Users },
  { href: "/dashboard/analytics", label: "dash.analytics", en: "Analytics", ar: "التحليلات", icon: ChartNoAxesColumn },
  { href: "/dashboard/marketing", label: "dash.marketing", en: "Marketing & discounts", ar: "التسويق والخصومات", icon: Megaphone },
  { href: "/dashboard/billing", label: "dash.billing", en: "Billing", ar: "الفواتير", icon: CreditCard },
];
const DESTINATIONS = [...NAV, { href: "/dashboard/builder", label: "dash.builder", en: "Online store · Theme editor", ar: "المتجر · محرر التصميم", icon: PanelsTopLeft }, { href: "/dashboard/settings", label: "dash.settings", en: "Settings", ar: "الإعدادات", icon: Settings }];

export type Notif = { id: string; kind: string; title: string; text: string | null; read: boolean; created_at: string };
export function DashboardShell({ children, name, storeSlug, plan, unread, notifications, isOwner, demo = false }: {
  children: ReactNode; name: string; storeSlug: string; plan: string; unread: number; notifications: Notif[]; isOwner: boolean; demo?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { dark, toggleDark, lang, setLang } = useI18n();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const search = useRef<HTMLDialogElement>(null);
  const href = (url: string) => demo ? (url === "/dashboard" ? "/demo" : "/signup") : url;
  const results = DESTINATIONS.filter(n => `${n.en} ${n.ar}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.current?.showModal(); }
      if (e.key === "Escape") { setOpen(false); setBell(false); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  async function logout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/login"); router.refresh();
    } catch { setError(ar ? "تعذر تسجيل الخروج. حاول مجددًا." : "Could not sign out. Please try again."); }
  }
  async function markRead() {
    try {
      const res = await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "notifications.read" }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      router.refresh(); setBell(false);
    } catch { setError(ar ? "تعذر تحديث الإشعارات." : "Could not update notifications."); }
  }

  return (
    <div className="commerce-admin min-h-screen">
      <header className="admin-topbar">
        <div className="flex min-w-0 items-center gap-3 md:w-[220px]">
          <button aria-label={ar ? "القائمة" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)} className="admin-icon md:hidden"><Menu size={20} /></button>
          <Link href={href("/dashboard")} className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#b4ed82] text-[#1c3320]"><ShoppingBag size={21} strokeWidth={2.5} /></span>bly<span className="hidden text-[11px] font-medium tracking-normal text-white/40 lg:inline">commerce</span></Link>
        </div>
        <button onClick={() => search.current?.showModal()} className="admin-search"><Search size={17} /><span className="flex-1 text-start">{ar ? "ابحث عن صفحة أو أداة..." : "Search your workspace"}</span><kbd className="hidden rounded border border-white/20 px-1.5 text-[10px] sm:block">⌘ K</kbd></button>
        <div className="flex items-center gap-1.5">
          <button aria-label={ar ? "تغيير اللغة" : "Change language"} onClick={() => setLang(ar ? "en" : "ar")} className="admin-icon text-xs font-semibold">{ar ? "EN" : "ع"}</button>
          <button aria-label={ar ? "تغيير المظهر" : "Toggle color theme"} onClick={toggleDark} className="admin-icon hidden sm:grid">{dark ? <Sun size={17} /> : <MoonStar size={17} />}</button>
          <div className="relative">
            <button aria-label={ar ? "الإشعارات" : "Notifications"} aria-expanded={bell} onClick={() => setBell(!bell)} className="admin-icon relative"><Bell size={18} />{unread > 0 && <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-[#b4ed82]" />}</button>
            {bell && <div className="admin-popover absolute end-0 top-12 w-[min(340px,90vw)] p-4">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{ar ? "الإشعارات" : "Notifications"}</h2>{notifications.some(n => !n.read) && !demo && <button onClick={markRead} className="text-xs text-emerald-700">{ar ? "قراءة الكل" : "Mark all read"}</button>}</div>
              {notifications.length === 0 && <div className="grid justify-items-center gap-2 py-8 text-[var(--dim)]"><Check size={28} /><p className="text-sm">{ar ? "أنت متابع كل جديد" : "You’re all caught up"}</p></div>}
              <div className="max-h-80 space-y-2 overflow-y-auto">{notifications.map(n => <div key={n.id} className={`rounded-lg p-3 ${n.read ? "" : "bg-[var(--panel2)]"}`}><p className="text-[13px] font-semibold">{n.title}</p><p className="mt-1 text-xs text-[var(--dim)]">{n.text}</p></div>)}</div>
            </div>}
          </div>
          <details className="relative ms-2 hidden sm:block">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-white/5 p-1 pe-2 text-xs"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#c4badb] font-bold text-[#332c47]">{name.slice(0, 2).toUpperCase()}</span><span className="max-w-24 truncate">{name}</span><ChevronDown size={12} /></summary>
            <div className="admin-popover absolute end-0 top-12 grid w-56 gap-1 p-2"><Link className="admin-menu-item" href={href("/dashboard/settings")}><Settings size={15} />{ar ? "إعدادات المتجر" : "Store settings"}</Link><Link className="admin-menu-item" href="/help"><HelpCircle size={15} />{ar ? "مركز المساعدة" : "Help center"}</Link>{!demo && <button className="admin-menu-item" onClick={logout}><LogOut size={15} />{ar ? "تسجيل الخروج" : "Sign out"}</button>}</div>
          </details>
        </div>
      </header>

      {open && <button className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="mb-5 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-emerald-700"><ShoppingBag size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold">{name}</p><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--dim)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{demo ? (ar ? "عرض تجريبي" : "Demo workspace") : (ar ? "مساحة العمل" : "Your workspace")}</p></div><button aria-label="Close navigation" onClick={() => setOpen(false)} className="md:hidden"><X size={17} /></button></div>
        <nav aria-label="Main navigation" className="grid gap-1">
          {NAV.map(n => <Link key={n.href} href={href(n.href)} onClick={() => setOpen(false)} aria-current={(path === n.href || demo && n.href === "/dashboard") ? "page" : undefined} className={`admin-nav-item ${path === n.href || demo && n.href === "/dashboard" ? "is-active" : ""}`}><n.icon size={17} strokeWidth={1.8} /><span>{ar ? n.ar : n.en}</span></Link>)}
        </nav>
        <div className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--dim)]">{ar ? "قنوات البيع" : "Sales channels"}</div>
        <Link href={href("/dashboard/builder")} className={`admin-nav-item mt-2 ${path === "/dashboard/builder" ? "is-active" : ""}`}><PanelsTopLeft size={17} /><span>{ar ? "المتجر الإلكتروني" : "Online Store"}</span><ArrowUpRight size={13} className="ms-auto opacity-40" /></Link>
        <div className="mt-auto pt-8">
          <div className="admin-plan-card"><Sparkles size={17} /><p className="mt-2 text-xs font-semibold">{ar ? "خطوتك الجاية تبدأ هنا" : "A little ambition. A lot of possibility."}</p><p className="mt-1 text-[11px] leading-relaxed text-[var(--dim)]">{ar ? "ابنِ علامتك التجارية بأدوات مصممة للنمو." : "Build your next chapter with tools that grow with you."}</p><Link href={href("/dashboard/billing")} className="btn btn-primary mt-3 w-full !text-xs">{demo ? (ar ? "ابدأ مجانًا" : "Start your business") : `${plan.charAt(0).toUpperCase() + plan.slice(1)} · ${ar ? "إدارة الخطة" : "Manage plan"}`}</Link></div>
          <Link href={href("/dashboard/settings")} className="admin-nav-item mt-3"><Settings size={17} />{ar ? "الإعدادات" : "Settings"}</Link>
          {isOwner && <Link href="/admin" className="admin-nav-item"><Users size={17} />Platform admin</Link>}
          {!demo && <button onClick={logout} className="admin-nav-item w-full sm:hidden"><LogOut size={17} />{ar ? "تسجيل الخروج" : "Sign out"}</button>}
        </div>
      </aside>
      <div className="admin-content">
        {demo && <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950"><span>{ar ? "عرض تجريبي ببيانات توضيحية، وليس مبيعات حقيقية." : "Demo workspace · Sample data, not real sales. Create an account to manage your own store."}</span><Link href="/signup" className="font-bold underline">{ar ? "إنشاء متجر" : "Create your store"} →</Link></div>}
        {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}<button aria-label="Dismiss" className="float-end" onClick={() => setError("")}><X size={16} /></button></div>}
        {children}
        <footer className="mt-10 flex items-center justify-center gap-2 pb-2 text-[11px] text-[var(--dim)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{ar ? "كل فكرة كبيرة تبدأ بخطوة صغيرة." : "Every big business starts with a small idea."}<Link href="/help" className="underline">{ar ? "نحن هنا للمساعدة" : "We’re here to help"}</Link></footer>
      </div>
      <dialog ref={search} className="admin-command" onClick={e => { if (e.target === e.currentTarget) search.current?.close(); }}>
        <div className="flex items-center gap-3 border-b border-[var(--border)] p-4"><Search size={19} /><input aria-label={ar ? "البحث السريع" : "Quick navigation"} autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={ar ? "إلى أين تريد الذهاب؟" : "Where would you like to go?"} className="w-full bg-transparent text-sm outline-none" /><button aria-label="Close search" onClick={() => search.current?.close()}><X size={17} /></button></div>
        <p className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-widest text-[var(--dim)]">{ar ? "الانتقال السريع" : "Quick navigation"}</p><div className="grid gap-1 p-2">{results.map(n => <Link key={n.href} href={href(n.href)} onClick={() => { search.current?.close(); setQuery(""); }} className="admin-menu-item"><n.icon size={17} />{ar ? n.ar : n.en}<ArrowUpRight size={13} className="ms-auto" /></Link>)}{results.length === 0 && <p className="p-5 text-sm text-[var(--dim)]">{ar ? "لا توجد نتائج" : "No matching pages"}</p>}</div>
      </dialog>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="display text-[24px] font-bold tracking-tight">{title}</h1>{sub && <p className="mt-1.5 text-[13px] text-[var(--dim)]">{sub}</p>}</div>{action}</div>;
}
export function UpgradeNote({ plan, need, feature }: { plan: string; need: string; feature: string }) {
  return <div className="card flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="text-[13px] font-bold">{feature} is a {need} feature</div><div className="text-xs text-[var(--dim)]">You are on the {plan} plan. Upgrade to unlock it.</div></div><Link href="/dashboard/billing" className="btn btn-brand">Upgrade</Link></div>;
}
