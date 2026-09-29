"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LANG_COOKIE, THEME_COOKIE, type Lang } from "./config";
import { makeT, type T } from "./translate";

interface I18nCtx {
  lang: Lang;
  t: T;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);
  const t = useMemo(() => makeT(lang), [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      setCookie(LANG_COOKIE, l);
      document.documentElement.lang = l;
      setLangState(l);
      // Серверные части (метаданные, правила) тоже перерисуются на новом языке.
      router.refresh();
    },
    [router],
  );

  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n вне I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

/** Переключение темы: атрибут на <html> + cookie, чтобы сервер отрисовал так же. */
export function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  setCookie(THEME_COOKIE, theme);
}

export function currentTheme(): "light" | "dark" {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
