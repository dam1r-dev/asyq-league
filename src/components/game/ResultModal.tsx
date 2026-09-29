"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { roundStats } from "@/game/coach";
import { encodeChallenge, levelToChallenge } from "@/game/custom";
import type { RoundState } from "@/game/types";
import type { SubmitState } from "./PlayScreen";

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
  const stats = roundStats(round);
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
    const text = `Я выбил ${round.knocked} асыков и набрал ${round.score} очков в Asyq League. Сможешь лучше?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Asyq League", text, url });
        setShared("Отправлено!");
        return;
      }
    } catch {
      // пользователь закрыл диалог — просто копируем
    }
    await navigator.clipboard?.writeText(`${text} ${url}`);
    setShared("Ссылка скопирована");
  };

  let versus: string | null = null;
  if (mode === "custom" && challenge?.sc !== undefined) {
    const name = challenge.by || "Автор";
    versus =
      round.score > challenge.sc
        ? `Ты обошёл: ${name} набрал ${challenge.sc}.`
        : round.score === challenge.sc
          ? `Ничья с ${name}: у обоих ${challenge.sc}.`
          : `${name} набрал ${challenge.sc}. Попробуй ещё раз!`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center">
      <div className="pop-in card w-full max-w-[420px] p-5" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="text-center">
          <div className="flex justify-center gap-1 text-4xl" aria-label={`Звёзд: ${round.stars} из 3`}>
            {[1, 2, 3].map((i) => (
              <span key={i} className={i <= round.stars ? "drop-shadow-[0_0_12px_rgba(242,180,65,0.6)]" : "opacity-20 grayscale"}>
                ⭐
              </span>
            ))}
          </div>
          <h2 id="result-title" className="mt-2 font-display text-2xl font-bold">
            {won ? (round.stars === 3 ? "Керемет!" : "Жеңіс!") : "Броски закончились"}
          </h2>
          <p className="text-sm text-muted">
            {won
              ? `Кон пуст за ${round.throwsUsed} ${plural(round.throwsUsed, "бросок", "броска", "бросков")}`
              : `В коне осталось асыков: ${round.asyks.length}`}
          </p>
          <div className="mt-3 font-display text-5xl font-extrabold text-gold">{round.score}</div>
          <div className="text-xs text-muted">очков {isRecord && mode !== "custom" && <span className="text-good">· новый рекорд!</span>}</div>
          {versus && <div className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">{versus}</div>}
        </div>

        <div className="ornament-divider my-4" />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <Row k="Выбито асыков" v={`+${round.knocked}`} />
          <Row k="Бонус за комбо" v={`+${combos}`} />
          <Row k="Штраф за сақа в коне" v={penalties ? `−${penalties}` : "0"} />
          <Row k="Бонус за броски" v={`+${round.finishBonus}`} />
          <Row k="Точность" v={`${Math.round(stats.hitRate * 100)}%`} />
          <Row k="Средняя сила" v={`${Math.round(stats.avgPower * 100)}%`} />
        </dl>

        <div className="mt-4 rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-sm leading-snug">
          <span className="font-bold text-sky">Совет: </span>
          {stats.advice}
        </div>

        {mode !== "custom" && (
          <div className="mt-3 text-center text-xs text-muted">
            {submit.status === "saving" && "Сохраняем в профиль…"}
            {submit.status === "saved" &&
              `✓ Проверено сервером и сохранено${submit.rank ? ` · место в рейтинге дня: ${submit.rank}` : ""}`}
            {submit.status === "error" && <span className="text-bad">{submit.message}</span>}
            {submit.status === "guest" && (
              <>
                Результат сохранён в этом браузере.{" "}
                <Link href="/auth" className="text-gold underline">
                  Войди
                </Link>
                , чтобы попасть в рейтинг и играть с любого устройства.
              </>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {nextHref && (
            <Link href={nextHref} className="btn btn-primary">
              Следующее испытание →
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className={`btn ${nextHref ? "btn-ghost" : "btn-primary"}`} onClick={onRetry}>
              Ещё раз
            </button>
            <Link href={backHref} className="btn btn-ghost">
              Меню
            </Link>
          </div>
          <button className="btn btn-ghost" onClick={shareChallenge}>
            {shared ?? "🤝 Бросить вызов другу"}
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

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

