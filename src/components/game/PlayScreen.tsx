"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import GameCanvas from "./GameCanvas";
import ResultModal from "./ResultModal";
import { useAccount } from "@/components/AccountProvider";
import { applyThrow, initRound, replayRound } from "@/game/round";
import { throwTip } from "@/game/coach";
import { TUTORIAL_ID } from "@/game/levels";
import type { LevelDef, RoundState, ThrowInput, ThrowResult } from "@/game/types";
import { getLocal, loadRoundInputs, recordResult, saveRoundInputs, updateLocal, useLocal } from "@/lib/local";
import { sfx } from "@/lib/sound";
import { useIsClient } from "@/lib/useIsClient";
import { toggleSound } from "@/components/AccountProvider";

export interface PlayScreenProps {
  level: LevelDef;
  mode: "level" | "daily" | "custom";
  /** Ключ для сохранения незаконченного раунда. */
  roundKey: string;
  dayKey?: string;
  backHref: string;
  nextHref?: string;
  challenge?: { by?: string; sc?: number; th?: number; code: string };
}

export type SubmitState =
  | { status: "idle" | "saving" | "guest" }
  | { status: "saved"; best: number; rank?: number }
  | { status: "error"; message: string };

/** Раунд читает сохранение из localStorage, поэтому рендерится только в браузере. */
export default function PlayScreen(props: PlayScreenProps) {
  const isClient = useIsClient();
  if (!isClient) return <div className="h-[calc(100dvh-56px)]" />;
  return <PlayScreenInner key={props.roundKey} {...props} />;
}

function restoreRound(level: LevelDef, roundKey: string) {
  const saved = loadRoundInputs(roundKey);
  if (saved.length) {
    try {
      const state = replayRound(level, saved);
      if (state.status === "playing") return { state, inputs: saved };
    } catch {}
    saveRoundInputs(roundKey, []);
  }
  return null;
}

function PlayScreenInner(props: PlayScreenProps) {
  const { level, mode, roundKey, dayKey, backHref } = props;
  const { me, saqaSkin, fieldSkin } = useAccount();
  const local = useLocal();
  // Незаконченный раунд восстанавливается из браузера (после перезагрузки).
  const [restored] = useState(() => restoreRound(level, roundKey));
  const [round, setRound] = useState<RoundState>(() => restored?.state ?? initRound(level));
  const [inputs, setInputs] = useState<ThrowInput[]>(() => restored?.inputs ?? []);
  const [tip, setTip] = useState<ReturnType<typeof throwTip> & { key: number } | null>(null);
  const [last, setLast] = useState<ThrowResult | null>(null);
  const [resumed, setResumed] = useState(!!restored);
  const [showResult, setShowResult] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [isRecord, setIsRecord] = useState(false);

  const tutorial = level.id === TUTORIAL_ID && !local.settings.tutorialDone;

  const finish = useCallback(
    async (state: RoundState, allInputs: ThrowInput[]) => {
      saveRoundInputs(roundKey, []);
      if (state.status === "won") sfx.win();
      else sfx.lose();
      if (level.id === TUTORIAL_ID) updateLocal((d) => ({ ...d, settings: { ...d.settings, tutorialDone: true } }));

      if (mode !== "custom") {
        const bucket = mode === "daily" ? "daily" : "levels";
        const id = mode === "daily" ? dayKey! : level.id;
        setIsRecord(
          recordResult(bucket, id, level.title, {
            score: state.score,
            stars: state.stars,
            won: state.status === "won",
            inputs: allInputs,
          }),
        );
      }
      setTimeout(() => setShowResult(true), 350);

      if (mode === "custom") return;
      if (!me) {
        setSubmit({ status: "guest" });
        return;
      }
      setSubmit({ status: "saving" });
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: mode, levelId: level.id, dayKey, inputs: allInputs }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        setSubmit({ status: "saved", best: data.best, rank: data.rank });
      } catch (e) {
        setSubmit({ status: "error", message: e instanceof Error ? e.message : "Ошибка сети" });
      }
    },
    [dayKey, level, me, mode, roundKey],
  );

  const onThrowEnd = useCallback(
    (input: ThrowInput) => {
      const { state, result } = applyThrow(round, input);
      const nextInputs = [...inputs, input];
      setRound(state);
      setInputs(nextInputs);
      setLast(result);
      setTip({ ...throwTip(result), key: nextInputs.length });
      setResumed(false);
      if (result.penalty) sfx.penalty();
      if (state.status === "playing") saveRoundInputs(roundKey, nextInputs);
      else void finish(state, nextInputs);
    },
    [finish, inputs, round, roundKey],
  );

  const restart = () => {
    saveRoundInputs(roundKey, []);
    setRound(initRound(level));
    setInputs([]);
    setTip(null);
    setLast(null);
    setShowResult(false);
    setSubmit({ status: "idle" });
    setResumed(false);
  };

  const throwsLeft = level.throws - round.throwsUsed;
  const remaining = round.asyks.length;

  const coach = useMemo(() => {
    if (!tutorial) return null;
    if (round.throwsUsed === 0)
      return "Выбей асыки за меловой круг. Потяни поле назад, как рогатку, и отпусти — чем дальше, тем сильнее.";
    if (round.throwsUsed === 1)
      return "Асык за линией — +1. Сақа осталась в коне — −1. Кнопки ◀ ▶ двигают место броска.";
    return null;
  }, [round.throwsUsed, tutorial]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px)] w-full max-w-[560px] flex-col px-3 pb-3">
      {/* Верхняя панель раунда */}
      <div className="flex items-center gap-3 py-2">
        <Link href={backHref} className="btn btn-ghost h-10 w-10 !p-0" aria-label="Назад">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-bold leading-tight">{level.title}</div>
          <div className="truncate text-xs text-muted">{level.subtitle}</div>
        </div>
        <button
          className="btn btn-ghost h-10 w-10 !p-0"
          onClick={toggleSound}
          aria-label={local.settings.sound ? "Выключить звук" : "Включить звук"}
        >
          {local.settings.sound ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 pb-2 text-center">
        <Stat label="Очки" value={round.score} accent />
        <Stat label="Асыков в коне" value={remaining} />
        <div className="card flex flex-col items-center justify-center px-2 py-1.5">
          <div className="flex flex-wrap justify-center gap-1" aria-label={`Осталось бросков: ${throwsLeft}`}>
            {Array.from({ length: level.throws }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < throwsLeft ? "bg-gold" : "bg-line"}`}
              />
            ))}
          </div>
          <div className="mt-1 text-[11px] text-muted">бросков: {throwsLeft}</div>
        </div>
      </div>

      {/* Лента подсказок: над полем, чтобы не закрывать кон. */}
      <div className="mb-2 flex min-h-[44px] flex-col justify-center gap-1.5" aria-live="polite">
        {tip && round.status === "playing" ? (
          <Message key={tip.key} tone={tip.tone}>
            {last && last.knockedIds.length > 0 && (
              <b className="mr-1 text-gold">
                +{last.knockedIds.length + last.comboBonus}
                {last.sides.length > 0 && ` · ${last.sides.join(", ")}`}
              </b>
            )}
            {tip.text}
          </Message>
        ) : resumed ? (
          <Message>Раунд восстановлен — продолжаем с {round.throwsUsed + 1}-го броска.</Message>
        ) : !coach && round.throwsUsed === 0 && level.hint ? (
          <Message muted>💡 {level.hint}</Message>
        ) : null}
        {coach && (
          <Message tone="warn">
            <b className="text-gold">Как играть. </b>
            {coach}
          </Message>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <GameCanvas
          level={level}
          asyks={round.asyks}
          disabled={round.status !== "playing"}
          saqaSkin={saqaSkin}
          fieldSkin={fieldSkin}
          showHint={round.throwsUsed === 0 && (tutorial || getLocal().history.length === 0)}
          onThrowStart={() => setTip(null)}
          onThrowEnd={onThrowEnd}
        />
      </div>

      {showResult && (
        <ResultModal
          round={round}
          mode={mode}
          submit={submit}
          isRecord={isRecord}
          challenge={props.challenge}
          nextHref={round.status === "won" ? props.nextHref : undefined}
          backHref={backHref}
          onRetry={restart}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card px-2 py-1.5">
      <div className={`font-display text-lg font-bold leading-tight ${accent ? "text-gold" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function Message({
  children,
  tone,
  muted,
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "bad";
  muted?: boolean;
}) {
  const border = tone === "good" ? "border-good/50" : tone === "bad" ? "border-bad/50" : tone === "warn" ? "border-gold/40" : "";
  return (
    <div className={`pop-in card px-3 py-2 text-[13px] leading-snug ${border} ${muted ? "text-muted" : ""}`}>{children}</div>
  );
}
