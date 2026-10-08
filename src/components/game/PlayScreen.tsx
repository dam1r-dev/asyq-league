"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import GameCanvas from "./GameCanvas";
import GameToolbar from "./GameToolbar";
import ResultModal from "./ResultModal";
import { useAccount } from "@/components/AccountProvider";
import { applyThrow, initRound, replayRound } from "@/game/round";
import { throwTip } from "@/game/coach";
import { TUTORIAL_ID } from "@/game/levels";
import type { LevelDef, RoundState, ThrowInput, ThrowResult } from "@/game/types";
import { getLocal, loadRoundInputs, recordResult, saveRoundInputs, updateLocal, useLocal } from "@/lib/local";
import { sfx } from "@/lib/sound";
import { useIsClient } from "@/lib/useIsClient";
import { useT } from "@/i18n/provider";
import { errorText, levelHint, levelSubtitle, levelTitle, sideName, tipText } from "@/i18n/game";

export interface PlayScreenProps {
  level: LevelDef;
  mode: "level" | "daily" | "custom";
  /** Ключ для сохранения незаконченного раунда. */
  roundKey: string;
  dayKey?: string;
  backHref: string;
  nextHref?: string;
  challenge?: { by?: string; sc?: number; th?: number; code: string };
  /** Подсказка перед первым броском (если не задана — берётся из словаря уровня). */
  hint?: string;
}

export type SubmitState =
  | { status: "idle" | "saving" | "guest" }
  | { status: "saved"; best: number; rank?: number; earned?: number; streak?: number; streakBonus?: number }
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
  const { me, saqaSkin, fieldSkin, refresh } = useAccount();
  const local = useLocal();
  // Незаконченный раунд восстанавливается из браузера (после перезагрузки).
  const [restored] = useState(() => restoreRound(level, roundKey));
  const [round, setRound] = useState<RoundState>(() => restored?.state ?? initRound(level));
  const [inputs, setInputs] = useState<ThrowInput[]>(() => restored?.inputs ?? []);
  const t = useT();
  const [tip, setTip] = useState<(ReturnType<typeof throwTip> & { id: number }) | null>(null);
  const [last, setLast] = useState<ThrowResult | null>(null);
  const [resumed, setResumed] = useState(!!restored);
  const [showResult, setShowResult] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [isRecord, setIsRecord] = useState(false);
  const [runId, setRunId] = useState(0);
  const moveControl = local.settings.moveControl ?? "buttons";

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
        if (!res.ok) throw new Error(errorText(data.error, t, t("play.saveError")));
        setSubmit({ status: "saved", best: data.best, rank: data.rank, earned: data.earned, streak: data.streak, streakBonus: data.streakBonus });
        if (data.earned || data.streak) void refresh();
      } catch (e) {
        setSubmit({ status: "error", message: e instanceof Error ? e.message : t("play.netError") });
      }
    },
    [dayKey, level, me, mode, roundKey, t, refresh],
  );

  const onThrowEnd = useCallback(
    (input: ThrowInput) => {
      const { state, result } = applyThrow(round, input);
      const nextInputs = [...inputs, input];
      setRound(state);
      setInputs(nextInputs);
      setLast(result);
      setTip({ ...throwTip(result), id: nextInputs.length });
      setResumed(false);
      if (result.penalty) sfx.penalty();
      if (state.status === "playing") saveRoundInputs(roundKey, nextInputs);
      else void finish(state, nextInputs);
    },
    [finish, inputs, round, roundKey],
  );

  const restart = () => {
    // Новый ключ пересоздаёт поле — даже если сақа ещё летит.
    setRunId((n) => n + 1);
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
    if (round.throwsUsed === 0) return t("play.coach1");
    if (round.throwsUsed === 1) return t("play.coach2");
    return null;
  }, [round.throwsUsed, tutorial, t]);
  const hint = props.hint ?? levelHint(level, t);

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px)] w-full max-w-[560px] flex-col px-3 pb-3 lg:max-w-6xl lg:flex-row-reverse lg:gap-6 lg:pt-3">
      {/* Панель раунда: на телефоне — над полем, на ПК — справа от большого поля */}
      <aside className="flex flex-col lg:w-[340px] lg:shrink-0">
      <div className="flex items-center gap-3 py-2">
        <Link href={backHref} className="btn btn-ghost h-10 w-10 !p-0" aria-label={t("common.back")}>
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-bold leading-tight">{levelTitle(level, t)}</div>
          <div className="truncate text-xs text-muted">{levelSubtitle(level, t, { day: dayKey, by: props.challenge?.by })}</div>
        </div>
      </div>

      <GameToolbar onRestart={restart} restartDisabled={round.throwsUsed === 0 && !showResult} />

      <div className="grid grid-cols-3 gap-2 pb-2 text-center">
        <Stat label={t("play.score")} value={round.score} accent />
        <Stat label={t("play.inKon")} value={remaining} />
        <div className="card flex flex-col items-center justify-center px-2 py-1.5">
          <div className="flex flex-wrap justify-center gap-1" aria-label={t("play.throwsLeftAria", { n: throwsLeft })}>
            {Array.from({ length: level.throws }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < throwsLeft ? "bg-gold" : "bg-line"}`}
              />
            ))}
          </div>
          <div className="mt-1 text-[11px] text-muted">{t("play.throwsLeft", { n: throwsLeft })}</div>
        </div>
      </div>

      {/* Лента подсказок: над полем, чтобы не закрывать кон. */}
      <div className="mb-2 flex min-h-[44px] flex-col justify-center gap-1.5" aria-live="polite">
        {tip && round.status === "playing" ? (
          <Message key={tip.id} tone={tip.tone}>
            {last && last.knockedIds.length > 0 && (
              <b className="mr-1 text-gold">
                +{last.knockedIds.length + last.comboBonus}
                {last.sides.length > 0 && ` · ${last.sides.map((x) => sideName(x, t)).join(", ")}`}
              </b>
            )}
            {tipText(tip, t)}
          </Message>
        ) : resumed ? (
          <Message>{t("play.resumed", { n: round.throwsUsed + 1 })}</Message>
        ) : !coach && round.throwsUsed === 0 && hint ? (
          <Message muted>💡 {hint}</Message>
        ) : null}
        {coach && (
          <Message tone="warn">
            <b className="text-gold">{t("play.howTo")} </b>
            {coach}
          </Message>
        )}
      </div>
      </aside>

      <div className="relative min-h-0 flex-1">
        <GameCanvas
          key={runId}
          moveControl={moveControl}
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
