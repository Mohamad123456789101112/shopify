"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/Providers";

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ mode, databaseAvailable }: { mode: Mode; databaseAvailable: boolean }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({ name: "", storeName: "", email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!databaseAvailable) return;
    setLoading(true);
    setError("");
    setInfo("");
    const action = mode === "forgot" ? "reset" : mode;
    const res = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; redirect?: string; message?: string };
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    if (data.message) setInfo(data.message);
    if (data.redirect) {
      router.push(data.redirect);
      router.refresh();
    }
  }

  const title = mode === "signup" ? t("auth.signup") : mode === "login" ? t("auth.login") : "Reset your password";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-[400px]">
          <Logo />
          <h1 className="display mt-8 text-[28px] font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-[13px] text-[var(--dim)]">
            {mode === "signup"
              ? "Launch your storefront in minutes. No card required."
              : mode === "login"
                ? "Sign in to manage your store."
                : "Enter your email and we will send reset instructions."}
          </p>

          {!databaseAvailable && (
            <div role="status" className="mt-5 rounded-xl bg-amber-50 px-3 py-3 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              {lang === "ar"
                ? "الموقع متاح للتصفح. تسجيل الحسابات والدخول غير متاحين لحين إعداد قاعدة البيانات."
                : "You can browse the website. Account registration and sign-in are unavailable until the database is configured."}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-3">
            {mode === "signup" && (
              <>
                <div>
                  <label className="label">{t("auth.name")}</label>
                  <input className="input" value={form.name} onChange={set("name")} required minLength={2} maxLength={60} autoComplete="name" />
                </div>
                <div>
                  <label className="label">{t("auth.storeName")}</label>
                  <input className="input" value={form.storeName} onChange={set("storeName")} required minLength={2} maxLength={40} placeholder="Layla Studio" />
                </div>
              </>
            )}
            <div>
              <label className="label">{t("auth.email")}</label>
              <input className="input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="label">{t("auth.password")}</label>
                <input
                  className="input" type="password" value={form.password} onChange={set("password")} required
                  minLength={8} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                {mode === "signup" && <p className="mt-1 text-[11px] text-[var(--dim)]">At least 8 characters, letters and numbers.</p>}
              </div>
            )}

            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 dark:bg-red-500/10">{error}</div>}
            {info && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 dark:bg-emerald-500/10">{info}</div>}

            <button className="btn btn-primary w-full !py-3" disabled={loading || !databaseAvailable}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {mode === "signup" ? t("cta.create") : mode === "login" ? t("cta.login") : "Send reset link"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-[12.5px]">
            {mode === "login" ? (
              <>
                <Link href="/forgot-password" className="text-[var(--dim)] hover:underline">{t("auth.forgot")}</Link>
                <span className="text-[var(--dim)]">{t("auth.noAccount")} <Link href="/signup" className="font-semibold text-[#e0704a]">Sign up</Link></span>
              </>
            ) : (
              <span className="text-[var(--dim)]">{t("auth.hasAccount")} <Link href="/login" className="font-semibold text-[#e0704a]">{t("cta.login")}</Link></span>
            )}
          </div>

          <div className="mt-8 flex items-center gap-2 text-[11.5px] text-[var(--dim)]">
            <ShieldCheck size={14} /> Sessions are httpOnly cookies. Every query is enforced by row-level security.
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[var(--panel2)] lg:block">
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/70 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="display text-[30px] font-extrabold leading-tight">Turn your brand<br />into a store.</div>
          <p className="mt-3 max-w-[380px] text-[13px] text-white/75">Cash on delivery, Vodafone Cash and InstaPay, Arabic-first storefronts, and a builder your team can actually use.</p>
        </div>
      </div>
    </main>
  );
}
