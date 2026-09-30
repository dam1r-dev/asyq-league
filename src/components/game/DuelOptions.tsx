"use client";

import Link from "next/link";
import { decodeChallenge } from "@/game/custom";
import { DEFAULT_DUEL_CONFIG, DUEL_MODES, THROWS_BY_MODE, type DuelConfig, type DuelMode } from "@/game/duel";
import { useT } from "@/i18n/provider";

const KEY = "asyq:duelOpts";

/** Последние выбранные режим и поле хранятся в браузере. */
export function loadDuelOpts(): DuelConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<DuelConfig> | null;
    const mode: DuelMode = raw?.mode && DUEL_MODES.includes(raw.mode) ? raw.mode : "classic";
    const field = typeof raw?.field === "string" && decodeChallenge(raw.field) ? raw.field : null;
    return { mode, field };
  } catch {
    return DEFAULT_DUEL_CONFIG;
  }
}

export function saveDuelOpts(opts: DuelConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(opts));
  } catch {}
}

/** Выбор режима дуэли и поля (стандартное или своё из редактора). */
export default function DuelOptions({ value, onChange }: { value: DuelConfig; onChange: (v: DuelConfig) => void }) {
  const t = useT();
  const custom = value.field ? decodeChallenge(value.field) : null;

  const set = (next: DuelConfig) => {
    saveDuelOpts(next);
    onChange(next);
  };

  return (
    <div className="card mt-4 grid gap-4 p-4">
      <div>
        <div className="text-sm font-semibold">{t("duel.optMode")}</div>
        <div className="mt-2 grid gap-2" role="radiogroup" aria-label={t("duel.optMode")}>
          {DUEL_MODES.map((m) => {
            const on = value.mode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ ...value, mode: m })}
                className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                  on ? "border-gold bg-gold/10" : "border-line bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <span>{m === "classic" ? t("duel.modeClassic") : t("duel.modeFive")}</span>
                  <span className="chip">×{THROWS_BY_MODE[m]}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted">{m === "classic" ? t("duel.modeClassicText") : t("duel.modeFiveText")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold">{t("duel.optField")}</div>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("duel.optField")}>
          <button
            type="button"
            role="radio"
            aria-checked={!custom}
            onClick={() => set({ ...value, field: null })}
            className={`rounded-2xl border px-3 py-2.5 text-left ${!custom ? "border-gold bg-gold/10" : "border-line bg-surface-2"}`}
          >
            <div className="text-sm font-semibold">{t("duel.fieldStd")}</div>
            <div className="text-xs text-muted">{t("duel.fieldStdText")}</div>
          </button>
          <div
            className={`rounded-2xl border px-3 py-2.5 ${custom ? "border-gold bg-gold/10" : "border-line bg-surface-2"}`}
            role="radio"
            aria-checked={!!custom}
          >
            <div className="text-sm font-semibold">{t("duel.fieldCustom")}</div>
            <div className="text-xs text-muted">
              {custom ? t("duel.fieldCounts", { a: custom.a.length, s: custom.s.length }) : t("duel.fieldHint")}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <Link href="/editor" className="btn btn-ghost !px-3 !py-2">
            🛠 {custom ? t("duel.fieldEdit") : t("duel.fieldMake")}
          </Link>
          {custom && (
            <button type="button" className="text-muted underline" onClick={() => set({ ...value, field: null })}>
              {t("duel.fieldReset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
