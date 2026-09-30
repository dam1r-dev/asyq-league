"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useIsClient } from "@/lib/useIsClient";
import { useT } from "@/i18n/provider";
import { sideName } from "@/i18n/game";
import { useAccount } from "@/components/AccountProvider";
import GameCanvas from "@/components/game/GameCanvas";
import GameToolbar from "@/components/game/GameToolbar";
import { DUEL_THROWS_EACH, duelThrow, initDuel, type DuelState } from "@/game/duel";
import type { ThrowInput } from "@/game/types";
import { useLocal } from "@/lib/local";
import { sfx } from "@/lib/sound";

const KEY = "asyq:duel";

interface Saved {
  names: [string, string];
  inputs: ThrowInput[];
}

function replay(saved: Saved) {
  return saved.inputs.reduce((d, i) => duelThrow(d, i), initDuel(saved.names));
}

function restoreDuel(): { duel: DuelState; inputs: ThrowInput[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    const duel = replay(saved);
    return duel.status === "playing" ? { duel, inputs: saved.inputs } : null;
  } catch {
    return null;
  }
}

export default function DuelPage() {
  const isClient = useIsClient();
  if (!isClient) return null;
  return <Duel />;
}

function Duel() {
  const { saqaSkin, fieldSkin, me } = useAccount();
  const local = useLocal();
  const t = useT();
  // Незаконченная дуэль восстанавливается после перезагрузки.
  const [restored] = useState(restoreDuel);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [duel, setDuel] = useState<DuelState | null>(restored?.duel ?? null);
  const [inputs, setInputs] = useState<ThrowInput[]>(restored?.inputs ?? []);
  const [runId, setRunId] = useState(0);
  const moveControl = local.settings.moveControl ?? "buttons";

  /** Начать эту же дуэль заново с теми же игроками. */
  const restartDuel = () => {
    if (!duel) return;
    setRunId((n) => n + 1);
    setDuel(initDuel(duel.names));
    setInputs([]);
    try {
      localStorage.setItem(KEY, JSON.stringify({ names: duel.names, inputs: [] }));
    } catch {}
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const n: [string, string] = [names[0].trim() || me?.displayName || t("duel.p1Default"), names[1].trim() || t("duel.p2Default")];
    setNames(n);
    setDuel(initDuel(n));
    setInputs([]);
    try {
      localStorage.setItem(KEY, JSON.stringify({ names: n, inputs: [] }));
    } catch {}
  };

  const onThrowEnd = useCallback(
    (input: ThrowInput) => {
      if (!duel) return;
      const next = duelThrow(duel, input);
      const nextInputs = [...inputs, input];
      setDuel(next);
      setInputs(nextInputs);
      if (next.last?.result.penalty) sfx.penalty();
      try {
        if (next.status === "finished") {
          localStorage.removeItem(KEY);
          sfx.win();
        } else localStorage.setItem(KEY, JSON.stringify({ names: next.names, inputs: nextInputs }));
      } catch {}
    },
    [duel, inputs],
  );

  const rematch = () => {
    const swapped: [string, string] = [duel!.names[1], duel!.names[0]];
    setDuel(initDuel(swapped));
    setInputs([]);
    try {
      localStorage.setItem(KEY, JSON.stringify({ names: swapped, inputs: [] }));
    } catch {}
  };

  if (!duel) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-8 pb-16">
        <h1 className="font-display text-2xl font-bold">{t("duel.title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("duel.lead", { n: DUEL_THROWS_EACH })}
        </p>
        <form onSubmit={start} className="card mt-6 grid gap-3 p-5">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">{t("duel.p1")}</span>
            <input
              className="input"
              maxLength={16}
              placeholder={me?.displayName ?? t("duel.p1Default")}
              value={names[0]}
              onChange={(e) => setNames([e.target.value, names[1]])}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">{t("duel.p2")}</span>
            <input
              className="input"
              maxLength={16}
              placeholder={t("duel.p2Default")}
              value={names[1]}
              onChange={(e) => setNames([names[0], e.target.value])}
            />
          </label>
          <button className="btn btn-primary mt-2">{t("duel.start")}</button>
        </form>
      </div>
    );
  }

  const last = duel.last;
  const turnName = duel.names[duel.turn];

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px)] w-full max-w-[560px] flex-col px-3 pb-3">
      <div className="flex items-center gap-3 py-2">
        <Link href="/" className="btn btn-ghost h-10 w-10 !p-0" aria-label={t("common.back")}>
          ←
        </Link>
        <div className="flex-1 font-display text-[15px] font-bold">{t("duel.short")}</div>
      </div>

      <GameToolbar onRestart={restartDuel} restartDisabled={inputs.length === 0} />

      <div className="grid grid-cols-2 gap-2 pb-2">
        {[0, 1].map((p) => {
          const active = duel.status === "playing" && duel.turn === p;
          return (
            <div key={p} className={`card px-3 py-2 transition-colors ${active ? "border-gold bg-surface-2" : "opacity-80"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {active && "▶ "}
                  {duel.names[p]}
                </span>
                <span className="font-display text-xl font-bold text-gold">{duel.scores[p]}</span>
              </div>
              <div className="mt-1 flex gap-1">
                {Array.from({ length: DUEL_THROWS_EACH }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < duel.throwsLeft[p] ? "bg-gold/80" : "bg-line"}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1">
        <GameCanvas
          key={runId}
          moveControl={moveControl}
          level={duel.field.level}
          asyks={duel.field.asyks}
          disabled={duel.status !== "playing"}
          saqaSkin={saqaSkin}
          fieldSkin={fieldSkin}
          onThrowEnd={onThrowEnd}
          overlay={
            duel.status === "playing" && (
              <div className="pointer-events-none absolute inset-x-3 top-3">
                <div key={inputs.length} className="pop-in card px-3 py-2 text-center text-sm">
                  {last && (
                    <div className="text-xs text-muted">
                      {duel.names[last.player]}:{" "}
                      {last.result.knockedIds.length
                        ? t("duel.knocked", { n: last.result.knockedIds.length, sides: last.result.sides.map((x) => sideName(x, t)).join(", ") })
                        : t("duel.miss")}
                      {last.result.penalty ? t("duel.penalty") : ""}
                    </div>
                  )}
                  <span className="font-bold text-gold">{turnName}</span>
                  {last?.extraTurn ? t("duel.again") : t("duel.yourTurn")}
                </div>
              </div>
            )
          }
        />
      </div>

      {duel.status === "finished" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 backdrop-blur-sm sm:items-center">
          <div className="pop-in card w-full max-w-[400px] p-6 text-center" role="dialog" aria-modal="true">
            <div className="text-5xl">{duel.winner === "draw" ? "🤝" : "🏆"}</div>
            <h2 className="mt-3 font-display text-2xl font-bold">
              {duel.winner === "draw" ? t("duel.draw") : t("duel.wins", { name: duel.names[duel.winner as 0 | 1] })}
            </h2>
            <p className="mt-2 text-muted">
              {duel.names[0]} {duel.scores[0]} : {duel.scores[1]} {duel.names[1]}
            </p>
            <div className="mt-6 grid gap-2">
              <button className="btn btn-primary" onClick={rematch}>
                {t("duel.rematch", { name: duel.names[1] })}
              </button>
              <button className="btn btn-ghost" onClick={() => setDuel(null)}>
                {t("duel.newPlayers")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
