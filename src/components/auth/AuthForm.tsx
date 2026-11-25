"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, Eye, EyeOff, Globe, Loader2, LockKeyhole, Package, ShieldCheck, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { useI18n } from "@/components/Providers";

type Mode = "login" | "signup" | "forgot" | "reset";
export function AuthForm({ mode, databaseAvailable, resetEmailAvailable = true, token = "" }: { mode: Mode; databaseAvailable: boolean; resetEmailAvailable?: boolean; token?: string }) {
  const { lang, setLang } = useI18n();
  const ar = lang === "ar";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", storeName: "", email: "", password: "", confirmPassword: "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  const canSubmit = databaseAvailable && (mode !== "forgot" || resetEmailAvailable) && (mode !== "reset" || Boolean(token));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    if ((mode === "signup" || mode === "reset") && form.password !== form.confirmPassword) { setError(ar ? "كلمتا المرور غير متطابقتين." : "Your passwords don’t match."); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      const action = mode === "forgot" ? "reset" : mode === "reset" ? "reset-password" : mode;
      const res = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, token }) });
      const data = await res.json() as { ok: boolean; error?: string; redirect?: string; message?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? (ar ? "حدث خطأ. حاول مجددًا." : "Something went wrong. Please try again.")); return; }
      if (data.message) setInfo(data.message);
      if (data.redirect) { router.push(data.redirect); router.refresh(); }
    } catch { setError(ar ? "تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا." : "We couldn’t connect. Check your connection and try again."); }
    finally { setLoading(false); }
  }
  const signup = mode === "signup", login = mode === "login";
  const title = signup ? (ar ? "فكرتك تستحق متجرًا." : "Big ideas start here.") : login ? (ar ? "أهلًا بعودتك." : "Welcome back.") : mode === "reset" ? (ar ? "بداية آمنة جديدة." : "A fresh, secure start.") : (ar ? "نسيت كلمة المرور؟" : "Forgot your password?");
  const subtitle = signup ? (ar ? "أنشئ متجرك وابدأ فصلًا جديدًا لعلامتك التجارية." : "Create your store. Start your brand’s next chapter.") : login ? (ar ? "سجّل دخولك، عملك الكبير القادم في انتظارك." : "Log in to your store. Your next big thing is waiting.") : mode === "reset" ? (ar ? "اختر كلمة مرور جديدة لحماية حسابك." : "Choose a new password to keep your account safe.") : (ar ? "أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة الحساب." : "Enter your email and we’ll help you get back in.");

  return <main className="auth-workspace">
    <section className="auth-main">
      <header className="flex items-center justify-between"><Link href="/" className="auth-logo"><span><ShoppingBag size={21} /></span>bly<span className="!bg-transparent !text-[11px] !font-medium !text-[var(--dim)]">commerce</span></Link><button onClick={() => setLang(ar ? "en" : "ar")} className="flex items-center gap-1.5 text-xs text-[var(--dim)]"><Globe size={14} />{ar ? "English" : "العربية"}</button></header>
      <div className="auth-form-wrap">
        {!signup && !login && <Link href="/login" className="mb-7 inline-flex items-center gap-1 text-xs text-[var(--dim)]"><ChevronLeft size={14} />{ar ? "العودة لتسجيل الدخول" : "Back to log in"}</Link>}
        <span className="auth-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-[#008060]" />{signup ? (ar ? "مشروعك يبدأ بخطوة" : "THE FIRST STEP TO YOUR NEXT CHAPTER") : (ar ? "مساحتك للإنجاز" : "YOUR SPACE TO MAKE THINGS HAPPEN")}</span>
        <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-[-.045em] sm:text-[38px]">{title}</h1><p className="mt-3 text-[13px] leading-relaxed text-[var(--dim)]">{subtitle}</p>
        {!canSubmit && <div role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">{!databaseAvailable ? (ar ? "حسابات المتاجر ستتاح بعد إضافة DATABASE_URL في إعدادات Vercel وإعادة النشر. يمكنك استكشاف الواجهة التجريبية الآن." : "Accounts become available once DATABASE_URL is added in Vercel and the site is redeployed. You can explore the demo in the meantime.") : mode === "reset" ? (ar ? "رابط الاستعادة غير صالح." : "This reset link is missing its token. Request a new link.") : (ar ? "إرسال بريد الاستعادة لم يتم إعداده بعد. تواصل مع مسؤول الموقع." : "Password reset emails haven’t been configured yet. Contact the site administrator.")}<Link href="/demo" className="mt-2 block font-semibold underline">{ar ? "استكشاف لوحة التحكم" : "Explore the dashboard"} →</Link></div>}
        <form onSubmit={submit} className="mt-7 space-y-4" aria-busy={loading}>
          {signup && <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="name" className="label">{ar ? "اسمك" : "Full name"}</label><input id="name" name="name" className="input" autoComplete="name" placeholder={ar ? "محمد أحمد" : "Alex Morgan"} value={form.name} onChange={set("name")} minLength={2} maxLength={60} required /></div><div><label htmlFor="store-name" className="label">{ar ? "اسم المتجر" : "Store name"}</label><input id="store-name" name="storeName" className="input" autoComplete="organization" placeholder={ar ? "اسم علامتك" : "Your brand"} value={form.storeName} onChange={set("storeName")} minLength={2} maxLength={40} required /></div></div>}
          {mode !== "reset" && <div><label htmlFor="email" className="label">{ar ? "البريد الإلكتروني" : "Email address"}</label><input id="email" name="email" className="input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} maxLength={200} required /></div>}
          {mode !== "forgot" && <div><div className="mb-1 flex items-center justify-between"><label htmlFor="password" className="label !mb-0">{ar ? "كلمة المرور" : "Password"}</label>{login && <Link href="/forgot-password" className="text-[11px] font-medium text-[#008060]">{ar ? "نسيت كلمة المرور؟" : "Forgot password?"}</Link>}</div><div className="relative"><input id="password" name="password" className="input !pe-12" type={showPassword ? "text" : "password"} autoComplete={login ? "current-password" : "new-password"} placeholder={login ? "••••••••••" : (ar ? "كلمة مرور قوية" : "Create a strong password")} value={form.password} onChange={set("password")} minLength={8} maxLength={128} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-3 text-[var(--dim)]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{!login && <p className="mt-1.5 text-[10px] text-[var(--dim)]">{ar ? "8 أحرف على الأقل، تشمل حروفًا وأرقامًا." : "At least 8 characters, including letters and numbers."}</p>}</div>}
          {(signup || mode === "reset") && <div><label htmlFor="confirm-password" className="label">{ar ? "تأكيد كلمة المرور" : "Confirm password"}</label><input id="confirm-password" name="confirmPassword" className="input" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} minLength={8} maxLength={128} required /></div>}
          {signup && <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-[var(--dim)]"><input type="checkbox" required className="mt-0.5 accent-[#008060]" /><span>{ar ? "أوافق على" : "I agree to the"} <Link href="/terms" className="text-[var(--fg)] underline">{ar ? "شروط الاستخدام" : "Terms of Service"}</Link> {ar ? "و" : "and"} <Link href="/privacy" className="text-[var(--fg)] underline">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.</span></label>}
          {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</div>}{info && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">{info}</div>}
          <button className="auth-submit" disabled={loading || !canSubmit}>{loading ? <Loader2 size={16} className="spin" /> : null}{signup ? (ar ? "إنشاء متجري" : "Create your store") : login ? (ar ? "تسجيل الدخول" : "Log in") : mode === "reset" ? (ar ? "حفظ كلمة المرور" : "Update password") : (ar ? "إرسال رابط الاستعادة" : "Send reset link")}{!loading && <ArrowRight size={15} />}</button>
        </form>
        {(login || signup) && <p className="mt-6 text-center text-xs text-[var(--dim)]">{signup ? (ar ? "عندك متجر بالفعل؟" : "Already have a store?") : (ar ? "لسه بتبدأ حكايتك؟" : "New here? Your next chapter starts now.")} <Link href={signup ? "/login" : "/signup"} className="font-bold text-[#008060]">{signup ? (ar ? "سجّل دخولك" : "Log in") : (ar ? "ابدأ مجانًا" : "Get started free")}</Link></p>}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-[var(--dim)]"><ShieldCheck size={13} />{ar ? "كلمات مرور مشفرة • جلسات آمنة" : "Hashed passwords · Secure, private sessions"}</div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-[var(--dim)]"><span>© {new Date().getFullYear()} BLY Commerce</span><div className="flex gap-4"><Link href="/help">{ar ? "محتاج مساعدة؟" : "Need a hand?"}</Link><Link href="/demo" className="flex items-center gap-1">{ar ? "جرب الواجهة" : "Take a look around"}<ArrowUpRight size={11} /></Link></div></footer>
    </section>
    <aside className="auth-story" aria-label="Build your business with BLY"><div className="auth-story-orbit" /><div className="relative z-10"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] text-[#c0d8cd]"><Sparkles size={12} />{ar ? "لأفكارك الكبيرة" : "FOR THE ONES WHO MAKE THINGS HAPPEN"}</span><h2 className="mt-7 max-w-lg text-[44px] font-semibold leading-[1.14] tracking-[-.045em] xl:text-[55px]">{ar ? "فكرة صغيرة.\nإمكانيات بلا حدود." : "A small idea.\nAn unlimited\npossibility."}</h2><p className="mt-5 max-w-sm text-[13px] leading-7 text-white/55">{ar ? "كل علامة تجارية عظيمة بدأت بفكرة. أدواتك، متجرك، وفصلك الجديد — كلهم هنا." : "Every great brand starts with an idea. Your tools, your storefront, your next chapter — all in one place."}</p></div>
      <div className="auth-store-preview"><div className="flex items-center justify-between border-b border-[#e5e8e2] px-5 py-3"><span className="text-[11px] font-bold tracking-widest text-[#263f32]">ATELIER STUDIO</span><span className="flex items-center gap-2 text-[8px] text-[#758177]">SHOP · ABOUT <ShoppingBag size={12} /></span></div><div className="flex items-center gap-5 p-5"><div className="flex-1"><span className="text-[8px] font-bold tracking-widest text-[#899184]">THE EVERYDAY COLLECTION</span><p className="mt-3 font-serif text-[29px] leading-tight text-[#263f32]">Made for<br />your everyday.</p><span className="mt-4 inline-block rounded bg-[#263f32] px-3 py-1.5 text-[8px] text-white">Discover the collection →</span></div><div className="auth-product-art"><ShoppingBag size={65} strokeWidth={1} /></div></div><div className="border-t border-[#e5e8e2] px-5 py-2 text-center text-[8px] text-[#758177]">THOUGHTFULLY MADE. BEAUTIFULLY SIMPLE.</div><div className="auth-sale-toast"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7f4e9] text-[#008060]"><Check size={18} /></span><div><p className="text-[10px] font-bold text-[#303437]">Your next chapter</p><p className="mt-0.5 text-[9px] text-[#73787d]">Starts with your first product.</p></div><TrendingUp size={16} className="ms-3 text-[#008060]" /></div></div>
      <div className="relative z-10 mt-auto flex flex-wrap gap-6 pt-14 text-[11px] text-white/65"><span className="flex items-center gap-2"><Check size={13} className="text-[#b4ed82]" />{ar ? "بدون كود" : "No code needed"}</span><span className="flex items-center gap-2"><Check size={13} className="text-[#b4ed82]" />{ar ? "مصمم للنمو" : "Built to grow"}</span><span className="flex items-center gap-2"><Check size={13} className="text-[#b4ed82]" />{ar ? "عربي وإنجليزي" : "Arabic & English"}</span></div>
    </aside>
  </main>;
}
