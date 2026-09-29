"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LANG_LABEL, LANGS } from "@/i18n/config";
import { applyTheme, currentTheme, useI18n } from "@/i18n/provider";
import { useAccount } from "./AccountProvider";
import AsyqMark from "./AsyqMark";

export default function Header() {
  const pathname = usePathname();
  const { me, loading } = useAccount();
  const { t } = useI18n();

  const NAV = [
    { href: "/levels", label: t("nav.levels"), icon: "🎯" },
    { href: "/leaderboard", label: t("nav.league"), icon: "🏆" },
    { href: "/shop", label: t("nav.shop"), icon: "🛍️" },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-1 px-2 sm:gap-2 sm:px-3">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 pr-1" aria-label={`Asyq League — ${t("common.home")}`}>
          <AsyqMark className="h-6 w-6 shrink-0 min-[400px]:h-7 min-[400px]:w-7" />
          <span className="hidden font-display text-[13px] font-extrabold tracking-tight whitespace-nowrap min-[360px]:inline min-[400px]:text-[15px]">
            Asyq<span className="text-gold"> League</span>
          </span>
        </Link>
        <nav className="ml-auto flex shrink-0 items-center gap-0.5">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-label={n.label}
                className={`flex items-center gap-1.5 rounded-xl px-1.5 py-2 text-sm font-semibold transition-colors sm:px-2 ${
                  active ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                }`}
              >
                <span aria-hidden>{n.icon}</span>
                <span className="hidden md:inline">{n.label}</span>
              </Link>
            );
          })}
          <ThemeToggle />
          <LangMenu />
          <Link
            href={me ? "/profile" : "/auth"}
            className={`ml-0.5 flex h-9 items-center rounded-xl border border-line px-2 text-sm font-semibold sm:px-2.5 ${
              pathname.startsWith("/profile") || pathname.startsWith("/auth") ? "bg-surface-2" : "bg-surface"
            }`}
          >
            {loading ? "…" : me ? <span className="max-w-[64px] truncate sm:max-w-[120px]">{me.displayName}</span> : t("nav.login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

const noop = () => () => {};

function ThemeToggle() {
  const { t } = useI18n();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const theme = override ?? (mounted ? currentTheme() : "dark");
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="flex h-9 w-8 items-center justify-center rounded-xl text-base text-muted hover:text-text"
      aria-label={next === "light" ? t("common.themeLight") : t("common.themeDark")}
      title={next === "light" ? t("common.themeLight") : t("common.themeDark")}
      onClick={() => {
        applyTheme(next);
        setOverride(next);
      }}
    >
      {mounted ? (theme === "dark" ? "☀️" : "🌙") : "◐"}
    </button>
  );
}

function LangMenu() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-9 items-center rounded-xl px-1.5 text-xs font-bold text-muted hover:text-text"
        aria-label={t("common.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {LANG_LABEL[lang]}
      </button>
      {open && (
        <div role="menu" className="pop-in card absolute right-0 top-11 z-50 grid min-w-[110px] p-1 shadow-xl">
          {LANGS.map((l) => (
            <button
              key={l}
              role="menuitemradio"
              aria-checked={l === lang}
              className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${l === lang ? "bg-surface-2 text-gold" : "hover:bg-surface-2"}`}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
            >
              {{ ru: "Русский", kk: "Қазақша", en: "English" }[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
