"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, Circle, Copy, ExternalLink, Globe, HelpCircle, MoreHorizontal, Package, Plus, ShoppingBag, ShoppingCart, Sparkles, TriangleAlert, Users } from "lucide-react";
import { money } from "@/lib/constants";
import { useI18n } from "@/components/Providers";

type Props = {
  name: string; slug: string; plan: string; suspended: boolean; suspendedReason: string | null;
  kpis: Record<string, string | number>; chart: { label: string; value: number }[];
  top: { name: string; sold: number; price: string; image: string | null }[];
  low: { id: string; name: string; stock: number }[]; recent: Record<string, unknown>[];
  productCount: number; currency: string; publishedAt?: string | null; days?: number; demo?: boolean;
};
const pct = (now: number, prev: number) => prev <= 0 ? (now > 0 ? 100 : 0) : Math.round((now - prev) / prev * 100);

export function Overview(p: Props) {
  const router = useRouter();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const days = p.days ?? 30;
  const revenue = Number(p.kpis.revenue30 ?? 0), revenuePrev = Number(p.kpis.revenue_prev ?? 0);
  const orders = Number(p.kpis.orders30 ?? 0), ordersPrev = Number(p.kpis.orders_prev ?? 0);
  const ordersTotal = Number(p.kpis.orders_total ?? 0);
  const max = Math.max(1, ...p.chart.map(c => c.value));
  const coords = p.chart.map((c, i) => `${(i / Math.max(1, p.chart.length - 1) * 600).toFixed(1)},${(140 - c.value / max * 120).toFixed(1)}`);
  const line = coords.length ? `M${coords.join(" L")}` : "M0,140 L600,140";
  const href = (url: string) => p.demo ? "/signup" : url;
  const steps = [
    { label: ar ? "أضف أول منتج" : "Add your first product", sub: ar ? "المنتج المناسب هو بداية كل حكاية." : "Great businesses start with a great product.", done: p.productCount > 0, href: "/dashboard/products", icon: Package },
    { label: ar ? "خصص متجرك وانشره" : "Make your store your own", sub: ar ? "اختر تصميمًا يعبر عن علامتك وانشره." : "Find your look, customize your theme, and publish.", done: Boolean(p.publishedAt), href: "/dashboard/builder", icon: Globe },
    { label: ar ? "استقبل أول طلب" : "Make your first sale", sub: ar ? "شارك رابطك مع أول عميل." : "Share your store. Your next customer is out there.", done: ordersTotal > 0, href: `/store/${p.slug}`, icon: ShoppingBag },
  ];
  const completed = steps.filter(s => s.done).length;
  const kpis = [
    { label: ar ? "إجمالي المبيعات" : "Total sales", value: money(revenue, p.currency), delta: pct(revenue, revenuePrev), icon: ShoppingBag },
    { label: ar ? "الطلبات" : "Orders", value: orders.toLocaleString(), delta: pct(orders, ordersPrev), icon: ShoppingCart },
    { label: ar ? "العملاء · كل الوقت" : "Customers · all time", value: Number(p.kpis.customers ?? 0).toLocaleString(), delta: null, icon: Users },
    { label: ar ? "المنتجات" : "Products in your store", value: p.productCount.toLocaleString(), delta: null, icon: Package },
  ];
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/store/${p.slug}`); setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 1800); }
    catch { setCopyError(true); }
  }

  return <div className="space-y-6">
    {p.suspended && <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"><TriangleAlert size={20} /><div><p className="font-bold">{ar ? "متجرك موقوف مؤقتًا" : "Your store is suspended"}</p><p className="text-xs">{p.suspendedReason ?? "Contact support to restore your store."}</p></div></div>}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[var(--dim)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{ar ? "مساحة عملك، كل يوم أفضل" : "YOUR BUSINESS, AT A GLANCE"}</div><h1 className="text-[26px] font-bold tracking-[-.04em]">{ar ? "أهلًا بعودتك،" : "Welcome back,"} {p.name.split(" ")[0]} <span className="text-[22px]">☀</span></h1><p className="mt-1 text-[12px] text-[var(--dim)]">{ar ? "لنحوّل فكرتك الكبيرة إلى شيء أكبر." : "Let’s turn your next big idea into your next big thing."}</p></div>
      <Link href={p.demo ? "/templates" : `/store/${p.slug}`} className="btn btn-soft"><ExternalLink size={14} />{ar ? "عرض المتجر" : "View your store"}</Link>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><label className="admin-period"><CalendarDays size={14} /><select aria-label={ar ? "فترة المبيعات" : "Sales reporting period"} className="cursor-pointer bg-transparent outline-none" value={days} disabled={p.demo} onChange={e => router.push(`/dashboard?days=${e.target.value}`)}>{[7,30,90].map(d => <option key={d} value={d}>{ar ? `آخر ${d} يوم` : `Last ${d} days`}</option>)}</select></label><span className="hidden text-[11px] text-[var(--dim)] sm:inline">{ar ? "المبيعات والطلبات مقارنة بالفترة السابقة" : "Sales & orders vs. previous period"}</span></div><Link href={href("/dashboard/analytics")} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--dim)]">{ar ? "عرض التقارير" : "View reports"}<ArrowUpRight size={13} /></Link></div>

    <section aria-label="Store metrics" className="card grid grid-cols-2 overflow-hidden md:grid-cols-4">{kpis.map(k => <div key={k.label} className="admin-kpi"><div className="flex items-center justify-between gap-2"><span className="admin-metric-title">{k.label}</span><k.icon size={14} className="text-[var(--dim)] opacity-60" /></div><div className="mt-3 text-[clamp(18px,2vw,25px)] font-bold tracking-tight">{k.value}</div><div className="mt-2 flex min-h-4 items-center gap-1.5 text-[10px]">{k.delta !== null ? <><span className={`flex items-center gap-0.5 font-semibold ${k.delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>{k.delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(k.delta)}%</span><span className="text-[var(--dim)]">{ar ? "عن الفترة السابقة" : "vs previous period"}</span></> : <span className="text-[var(--dim)]">{ar ? "في مساحة عملك" : "Across your workspace"}</span>}</div></div>)}</section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <div className="space-y-5">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-[13px] font-bold">{ar ? "دليل إعداد المتجر" : "Your store, ready for its next chapter"}</h2><p className="mt-1 text-[11px] text-[var(--dim)]">{ar ? "خطوات بسيطة، بداية قوية." : "A few small steps. A whole new business."}</p></div><button aria-label="Toggle setup guide" aria-expanded={guideOpen} onClick={() => setGuideOpen(!guideOpen)} className="rounded p-1 hover:bg-[var(--panel2)]"><ChevronDown size={16} className={guideOpen ? "rotate-180" : ""} /></button></div>
          <div className="flex items-center gap-3 px-5 py-3"><span className="text-[10px] text-[var(--dim)]">{completed} {ar ? "من" : "of"} 3 {ar ? "مكتمل" : "completed"}</span><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--panel2)]"><div className="h-full rounded-full bg-[#008060]" style={{ width: `${completed / 3 * 100}%` }} /></div></div>
          {guideOpen && <div className="grid gap-1 px-3 pb-3">{steps.map(s => <Link href={href(s.href)} key={s.label} className="group flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-[var(--panel2)]"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? "bg-emerald-100 text-emerald-700" : "border-2 border-dashed border-[#b1b6bb] text-transparent"}`}><Check size={13} /></span><div className="flex-1"><h3 className="text-[12px] font-semibold">{s.label}</h3><p className="mt-0.5 text-[11px] text-[var(--dim)]">{s.sub}</p></div><ArrowRight size={14} className="text-[var(--dim)] opacity-0 group-hover:opacity-100" /></Link>)}</div>}
        </section>

        <section className="card p-5"><div className="flex items-start justify-between"><div><h2 className="text-[13px] font-bold">{ar ? "المبيعات عبر الوقت" : "Sales over time"}</h2><div className="mt-1.5 text-[21px] font-bold tracking-tight">{money(p.chart.reduce((sum, c) => sum + Number(c.value), 0), p.currency)}</div></div><span className="flex items-center gap-1.5 text-[10px] text-[var(--dim)]"><span className="h-2 w-2 rounded-full bg-[#239b80]" />{ar ? `آخر ${p.chart.length} يوم` : `Last ${p.chart.length} days`}</span></div>
          <div className="relative mt-6" onMouseLeave={() => setHover(null)}>
            <div className="mb-2 flex justify-between text-[9px] text-[var(--dim)]"><span>{money(max, p.currency)}</span><span>{hover !== null && p.chart[hover] ? `${p.chart[hover].label} · ${money(p.chart[hover].value, p.currency)}` : (ar ? "حرّك المؤشر لاستكشاف المبيعات" : "Hover to explore sales")}</span></div>
            <svg role="img" aria-label="Sales over time" viewBox="0 0 600 160" className="h-[170px] w-full overflow-visible" preserveAspectRatio="none"><defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#239b80" stopOpacity=".15" /><stop offset="100%" stopColor="#239b80" stopOpacity="0" /></linearGradient></defs>{[20,60,100,140].map(y => <line key={y} x1="0" x2="600" y1={y} y2={y} className="admin-chart-grid" />)}<path d={`${line} L600,155 L0,155 Z`} fill="url(#sales-fill)" /><path d={line} fill="none" stroke="#239b80" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />{p.chart.map((c, i) => <rect key={i} x={i / Math.max(1,p.chart.length) * 600} y="0" width={600 / Math.max(1,p.chart.length)} height="160" fill="transparent" onMouseEnter={() => setHover(i)}><title>{`${c.label}: ${money(c.value,p.currency)}`}</title></rect>)}</svg>
            <div className="mt-2 flex justify-between text-[9px] text-[var(--dim)]"><span>{p.chart[0]?.label}</span><span>{p.chart[Math.floor(p.chart.length / 2)]?.label}</span><span>{p.chart.at(-1)?.label}</span></div>
          </div>
        </section>
      </div>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[13px] bg-[#163c32] p-5 text-white"><div className="absolute -end-6 -top-8 h-32 w-32 rounded-full border-[20px] border-white/5" /><div className="relative"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[9px] text-[#b4ed82]"><Sparkles size={11} />{ar ? "مساحة لإبداعك" : "MADE FOR YOUR AMBITION"}</span><h2 className="mt-4 whitespace-pre-line text-[21px] font-bold leading-snug tracking-tight">{ar ? "علامتك التجارية.\nبطريقتك." : "Your brand.\nYour rules."}</h2><p className="mt-2 text-[11px] leading-relaxed text-white/65">{ar ? "اصنع تجربة يتذكرها عملاؤك. ابدأ بمتجر يعبر عنك." : "Make a first impression that lasts. Build a storefront that feels like you."}</p><Link href={href("/dashboard/builder")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#c6efb6] px-3 py-2 text-[11px] font-bold text-[#153e2b]">{ar ? "تخصيص المتجر" : "Customize your store"}<ArrowUpRight size={13} /></Link></div></section>
        <section className="card p-4"><h2 className="text-xs font-bold">{ar ? "رابطك للعالم" : "Your little corner of the internet"}</h2><p className="mt-2 text-[11px] leading-relaxed text-[var(--dim)]">{ar ? "شارك متجرك مع عملائك أينما كانوا." : "Share your store with your customers, wherever they are."}</p><div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-2.5"><span className="truncate text-[10px]">/store/{p.slug}</span><button disabled={p.demo} aria-label="Copy store link" onClick={copyLink} className="shrink-0 text-emerald-700 disabled:opacity-40">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>{copyError && <p role="alert" className="mt-1 text-[10px] text-red-600">{ar ? "انسخ الرابط يدويًا من شريط العنوان." : "Open your store and copy the URL manually."}</p>}</section>
        <Link href="/help" className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border)] p-4"><HelpCircle size={20} className="text-[var(--dim)]" /><div><h2 className="text-xs font-semibold">{ar ? "محتاج مساعدة في البداية؟" : "A hand getting started?"}</h2><p className="mt-1 text-[11px] text-[var(--dim)]">{ar ? "مركز المساعدة معك خطوة بخطوة." : "Explore the help center. We’ve got you."}</p></div><ArrowUpRight size={13} className="ms-auto shrink-0" /></Link>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="card min-w-0 overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="text-[13px] font-bold">{ar ? "أحدث الطلبات" : "Recent orders"}</h2><Link href={href("/dashboard/orders")} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{ar ? "عرض الكل" : "View all orders"}</Link></div><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-xs"><thead><tr><th className="ps-5 text-start">{ar ? "الطلب" : "Order"}</th><th className="text-start">{ar ? "العميل" : "Customer"}</th><th className="text-start">{ar ? "الحالة" : "Fulfillment"}</th><th className="pe-5 text-end">{ar ? "الإجمالي" : "Total"}</th></tr></thead><tbody>{p.recent.map(o => <tr key={String(o.id)} className="border-t border-[var(--border)]"><td className="ps-5 font-semibold">{String(o.tracking_code)}</td><td>{(o.customer as { name?: string })?.name ?? "—"}</td><td><span className={`admin-status ${o.status === "Delivered" ? "complete" : o.status === "Cancelled" || o.status === "Refunded" ? "inactive" : ""}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />{String(o.status)}</span></td><td className="pe-5 text-end font-semibold">{money(String(o.total),p.currency)}</td></tr>)}{p.recent.length === 0 && <tr><td colSpan={4}><div className="grid justify-items-center gap-2 p-8 text-[var(--dim)]"><ShoppingCart size={28} strokeWidth={1.3} /><p className="font-semibold">{ar ? "أول طلب في الطريق" : "Your first order is on the horizon"}</p><p className="text-[11px]">{ar ? "انشر متجرك وشارك رابطه للبدء." : "Publish your store and share your link to get started."}</p></div></td></tr>}</tbody></table></div></section>
      <section className="card p-5"><div className="flex items-center justify-between"><h2 className="text-[13px] font-bold">{ar ? "المنتجات الأكثر مبيعًا" : "Bestselling products"}</h2><Package size={15} className="text-[var(--dim)]" /></div><div className="mt-4 space-y-4">{p.top.length === 0 && <p className="py-5 text-center text-xs text-[var(--dim)]">{ar ? "أضف منتجاتك لبدء الحكاية." : "Add your products. Start your story."}</p>}{p.top.slice(0,4).map((t,i) => <div key={`${t.name}-${i}`} className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel2)]">{t.image ? <img src={t.image} alt="" className="h-full w-full object-cover" /> : <Package size={18} className="text-[var(--dim)]" />}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{t.name}</p><p className="mt-0.5 text-[10px] text-[var(--dim)]">{t.sold} {ar ? "مباع" : "sold"}</p></div><span className="text-[10px] font-semibold">{money(t.price,p.currency)}</span></div>)}</div>{p.low.length > 0 && <Link href={href("/dashboard/products")} className="mt-5 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-[11px] text-amber-700"><TriangleAlert size={13} />{p.low.length} {ar ? "منتجات بمخزون منخفض" : "products running low"}<ArrowUpRight size={12} className="ms-auto" /></Link>}</section>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Plus size={19} /></span><div><p className="text-xs font-semibold">{ar ? "المنتج الكبير القادم يبدأ هنا" : "Your next bestseller starts here"}</p><p className="mt-0.5 text-[11px] text-[var(--dim)]">{ar ? "أضف شيئًا جديدًا إلى مجموعتك." : "Keep your collection fresh. Give your customers something new."}</p></div></div><Link className="btn btn-primary" href={href("/dashboard/products")}><Plus size={13} />{ar ? "إضافة منتج" : "Add product"}</Link></div>
  </div>;
}
