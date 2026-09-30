"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { roundStats } from "@/game/coach";
import { encodeChallenge, levelToChallenge } from "@/game/custom";
import type { RoundState } from "@/game/types";
import type { SubmitState } from "./PlayScreen";
import { useT } from "@/i18n/provider";
import { tipText } from "@/i18n/game";
import { LEVELS } from "@/game/levels";

interface Props {
  round: RoundState;
  mode: "level" | "daily" | "custom";
  submit: SubmitState;
  isRecord: boolean;
  challenge?: { by?: string; sc?: number; th?: number; code: string };
  nextHref?: string;
  backHref: string;
  onRetry: () => void;
}

export default function ResultModal({ round, mode, submit, isRecord, challenge, nextHref, backHref, onRetry }: Props) {
  const { me } = useAccount();
  const t = useT();
  const stats = roundStats(round);
  // У уровней второй главы свой исторический факт, у остальных — общие по кругу.
  const levelIndex = Math.max(0, LEVELS.findIndex((l) => l.id === round.level.id));
  const fact = t.maybe(`lvl.${round.level.id}.fact`) ?? t(`facts.f${(levelIndex % 6) + 1}`);
  const won = round.status === "won";
  const [shared, setShared] = useState<string | null>(null);

  const combos = round.history.reduce((s, r) => s + r.comboBonus, 0);
  const penalties = round.history.reduce((s, r) => s + r.penalty, 0);

  const shareChallenge = async () => {
    // В ссылку кладём расстановку и свой результат, чтобы другу было с чем сравнить.
    const code = encodeChallenge(
      levelToChallenge(round.level, { by: me?.displayName ?? challenge?.by, sc: round.score, th: round.throwsUsed }),
    );
    const url = `${window.location.origin}/c/${code}`;
    const text = t("result.shareText", { knocked: round.knocked, score: round.score });
    try {
      if (navigator.share) {
        await navigator.share({ title: "Asyq League", text, url });
        setShared(t("result.shared"));
        return;
      }
    } catch {
      // пользователь закрыл диалог — просто копируем
    }
    await navigator.clipboard?.writeText(`${text} ${url}`);
    setShared(t("result.copied"));
  };

  let versus: string | null = null;
  if (mode === "custom" && challenge?.sc !== undefined) {
    const name = challenge.by || t("common.author");
    versus =
      round.score > challenge.sc
        ? t("result.vsWin", { name, score: challenge.sc })
        : round.score === challenge.sc
          ? t("result.vsDraw", { name, score: challenge.sc })
          : t("result.vsLose", { name, score: challenge.sc });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 backdrop-blur-sm sm:items-center">
      <div className="pop-in card w-full max-w-[420px] p-5" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="text-center">
          <div className="flex justify-center gap-1 text-4xl" aria-label={t("result.starsAria", { n: round.stars })}>
            {[1, 2, 3].map((i) => (
              <span key={i} className={i <= round.stars ? "drop-shadow-[0_0_12px_rgba(242,180,65,0.6)]" : "opacity-20 grayscale"}>
                ⭐
              </span>
            ))}
          </div>
          <h2 id="result-title" className="mt-2 font-display text-2xl font-bold">
            {won ? (round.stars === 3 ? t("result.perfect") : t("result.win")) : t("result.lose")}
          </h2>
          <p className="text-sm text-muted">
            {won
              ? t("result.clearedIn", { throws: t("common.throwsN", { n: round.throwsUsed }) })
              : t("result.left", { n: round.asyks.length })}
          </p>
          <div className="mt-3 font-display text-5xl font-extrabold text-gold">{round.score}</div>
          <div className="text-xs text-muted">{t("result.points")} {isRecord && mode !== "custom" && <span className="text-good">· {t("result.newRecord")}</span>}</div>
          {versus && <div className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">{versus}</div>}
        </div>

        <div className="ornament-divider my-4" />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <Row k={t("result.knocked")} v={`+${round.knocked}`} />
          <Row k={t("result.combo")} v={`+${combos}`} />
          <Row k={t("result.penalty")} v={penalties ? `−${penalties}` : "0"} />
          <Row k={t("result.finish")} v={`+${round.finishBonus}`} />
          <Row k={t("result.accuracy")} v={`${Math.round(stats.hitRate * 100)}%`} />
          <Row k={t("result.power")} v={`${Math.round(stats.avgPower * 100)}%`} />
        </dl>

        <div className="mt-4 rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-sm leading-snug">
          <span className="font-bold text-sky">{t("result.advice")} </span>
          {tipText(stats.advice, t)}
        </div>

        {won && fact && (
          <div className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm leading-snug">
            <span className="font-bold text-gold">{t("result.factTitle")} </span>
            {fact}
          </div>
        )}

        {mode !== "custom" && (
          <div className="mt-3 text-center text-xs text-muted">
            {submit.status === "saving" && t("result.saving")}
            {submit.status === "saved" &&
              `${t("result.saved")}${submit.rank ? t("result.rank", { n: submit.rank }) : ""}`}
            {submit.status === "saved" && !!submit.earned && (
              <div className="mt-1 font-display text-sm font-bold text-gold">{t("coins.earned", { n: submit.earned })}</div>
            )}
            {submit.status === "error" && <span className="text-bad">{submit.message}</span>}
            {submit.status === "guest" && (
              <>
                {t("result.guest1")}{" "}
                <Link href="/auth" className="text-gold underline">
                  {t("result.guestLogin")}
                </Link>
                {t("result.guest2")}
              </>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {nextHref && (
            <Link href={nextHref} className="btn btn-primary">
              {t("result.next")}
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className={`btn ${nextHref ? "btn-ghost" : "btn-primary"}`} onClick={onRetry}>
              {t("result.retry")}
            </button>
            <Link href={backHref} className="btn btn-ghost">
              {t("common.menu")}
            </Link>
          </div>
          <button className="btn btn-ghost" onClick={shareChallenge}>
            {shared ?? t("result.challenge")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </>
  );
}

