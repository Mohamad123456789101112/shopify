"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DICT, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dark: boolean;
  toggleDark: () => void;
  rtl: boolean;
};

const LangCtx = createContext<Ctx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try {
      const stored = localStorage.getItem("bly_lang") as Lang | null;
      const device = (navigator.language || "en").toLowerCase().startsWith("ar") ? "ar" : "en";
      const next = stored ?? (device as Lang);
      setLangState(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      setDark(localStorage.getItem("bly_theme") === "dark");
    } catch {
      /* ignore */
    }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("bly_lang", l);
      document.cookie = `bly_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("bly_theme", next ? "dark" : "light");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      dark,
      toggleDark,
      rtl: lang === "ar",
      t: (key: string) => DICT[key]?.[lang] ?? key,
    }),
    [lang, dark, setLang, toggleDark],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) {
    return { lang: "en", setLang: () => {}, t: (k) => DICT[k]?.en ?? k, dark: false, toggleDark: () => {}, rtl: false };
  }
  return ctx;
}
