"use client";

import Link from "next/link";
import { decodeChallenge } from "@/game/custom";
import {
  DEFAULT_DUEL_CONFIG,
  DUEL_MODES,
  MAX_PER_TURN,
  MAX_ROUNDS,
  THROWS_BY_MODE,
  normalizeDuelConfig,
  type DuelConfig,
} from "@/game/duel";
import { useT } from "@/i18n/provider";

const KEY = "asyq:duelOpts";

/** Последние выбранные настройки дуэли хранятся в браузере. */
export function loadDuelOpts(): DuelConfig {
  try {
    return normalizeDuelConfig(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return DEFAULT_DUEL_CONFIG;
  }
}

export function saveDuelOpts(opts: DuelConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(opts));
  } catch {}
}

/** Добавить построенное в редакторе поле раундом дуэли. */
export function addRoundFromEditor(code: string): DuelConfig {
  const opts = loadDuelOpts();
  // Нетронутый список из одного стандартного раунда заменяем, иначе добавляем в конец.
  const untouched = opts.rounds.length === 1 && opts.rounds[0] === null;
  const rounds = untouched ? [code] : [...opts.rounds, code].slice(0, MAX_ROUNDS);
  const next = { ...opts, rounds };
  saveDuelOpts(next);
  return next;
}

/** Настройки дуэли: режим, броски за ход и раунды (стандартные или построенные в редакторе). */
export default function DuelOptions({ value, onChange }: { value: DuelConfig; onChange: (v: DuelConfig) => void }) {
  const t = useT();

  const set = (next: DuelConfig) => {
    const fixed = normalizeDuelConfig(next);
    saveDuelOpts(fixed);
    onChange(fixed);
  };
  const setRounds = (rounds: (string | null)[]) => set({ ...value, rounds: rounds.length ? rounds : [null] });

  return (
    <div className="card mt-4 grid gap-5 p-4">
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
        <div className="text-sm font-semibold">{t("duel.optPerTurn")}</div>
        <div className="mt-1 text-xs text-muted">{t("duel.perTurnHint")}</div>
        <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t("duel.optPerTurn")}>
          {Array.from({ length: MAX_PER_TURN }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value.perTurn === n}
              onClick={() => set({ ...value, perTurn: n })}
              className={`h-11 rounded-xl border font-display text-lg font-bold transition-colors ${
                value.perTurn === n ? "border-gold bg-gold/15 text-text" : "border-line bg-surface-2 text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">{t("duel.optRounds")}</div>
          <div className="text-xs text-muted">
            {value.rounds.length}/{MAX_ROUNDS}
          </div>
        </div>
        <div className="mt-1 text-xs text-muted">{t("duel.roundsHint")}</div>
        <ol className="mt-2 grid gap-1.5">
          {value.rounds.map((code, i) => {
            const c = code ? decodeChallenge(code) : null;
            return (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm">
                <span className="font-display font-bold text-gold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {c ? `${t("duel.fieldCustom")} · ${t("duel.fieldCounts", { a: c.a.length, s: c.s.length })}` : t("duel.fieldStd")}
                </span>
                {value.rounds.length > 1 && (
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg text-muted hover:text-text"
                    aria-label={t("duel.roundRemove")}
                    onClick={() => setRounds(value.rounds.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ol>
        {value.rounds.length < MAX_ROUNDS && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <button type="button" className="btn btn-ghost !px-3 !py-2" onClick={() => setRounds([...value.rounds, null])}>
              ➕ {t("duel.roundAddStd")}
            </button>
            <Link href="/editor" className="btn btn-ghost !px-3 !py-2">
              🛠 {t("duel.roundBuild")}
            </Link>
          </div>
        )}
        {(value.rounds.length > 1 || value.rounds[0] !== null) && (
          <button type="button" className="mt-2 text-xs text-muted underline" onClick={() => setRounds([null])}>
            {t("duel.fieldReset")}
          </button>
        )}
      </div>
    </div>
  );
}
