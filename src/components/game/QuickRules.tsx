"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/i18n/provider";

/**
 * Шпаргалка «как играть и за что очки» — открывается кнопкой «?» прямо
 * во время игры, чтобы не приходилось уходить на страницу правил.
 */
export default function QuickRules({ onClose }: { onClose: () => void }) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="pop-in card max-h-[92dvh] w-full max-w-[460px] overflow-y-auto p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="quick-title" className="font-display text-xl font-bold">
          {t("quick.title")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("quick.goal")}</p>

        <ol className="mt-4 grid gap-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-on-gold">
                {n}
              </span>
              <div>
                <div className="font-semibold">{t(`quick.s${n}t`)}</div>
                <div className="text-sm leading-snug text-muted">{t(`quick.s${n}`)}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="ornament-divider my-4" />

        <h3 className="font-display text-base font-bold">{t("quick.scoreTitle")}</h3>
        <ul className="mt-2 grid gap-1.5 text-sm">
          <Row v="+1" tone="good" text={t("quick.p1")} />
          <Row v="+1" tone="good" text={t("quick.p2")} />
          <Row v="−1" tone="bad" text={t("quick.p3")} />
          <Row v="+2" tone="good" text={t("quick.p4")} />
        </ul>
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm leading-snug">⭐ {t("quick.stars")}</p>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Link href="/rules" className="btn btn-ghost !py-2.5 text-sm">
            {t("quick.more")}
          </Link>
          <button className="btn btn-primary !py-2.5" onClick={onClose} autoFocus>
            {t("quick.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ v, tone, text }: { v: string; tone: "good" | "bad"; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`w-9 shrink-0 rounded-lg py-0.5 text-center font-display text-sm font-bold ${
          tone === "good" ? "bg-good/20 text-good" : "bg-bad/20 text-bad"
        }`}
      >
        {v}
      </span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}
