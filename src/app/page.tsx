"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import AsyqMark from "@/components/AsyqMark";
import { LEVELS } from "@/game/levels";
import { useLocal } from "@/lib/local";

export default function Home() {
  const local = useLocal();
  const { me } = useAccount();

  const stars = (id: string) => Math.max(local.levels[id]?.stars ?? 0, me?.progress[id]?.stars ?? 0);
  const totalStars = LEVELS.reduce((s, l) => s + stars(l.id), 0);
  const nextLevel = LEVELS.find((l) => stars(l.id) === 0) ?? LEVELS[LEVELS.length - 1];
  const firstTime = !local.settings.tutorialDone && totalStars === 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16">
      <section className="relative overflow-hidden pt-10 pb-8 text-center sm:pt-16">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-good" /> Казахская игра на меткость
        </div>
        <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
          Асық ату —<br />
          <span className="text-gold">теперь в браузере</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg">
          Прицелься, выбери силу и выбей асыки из кона сақой. Как летом во дворе, только теперь
          с рекордами, испытанием дня и лигой университетов.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/play/${firstTime ? "l1" : nextLevel.id}`} className="btn btn-primary w-full max-w-xs px-8 py-4 text-lg sm:w-auto">
            {firstTime ? "Играть — обучение за 1 минуту" : `Играть: ${nextLevel.title}`}
          </Link>
          <Link href="/rules" className="btn btn-ghost w-full max-w-xs sm:w-auto">
            Правила игры
          </Link>
        </div>
        <AsyqRow />
      </section>

      <section aria-labelledby="modes" className="mt-2">
        <h2 id="modes" className="sr-only">Режимы</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModeCard
            href="/levels"
            icon="🎯"
            title="Испытания"
            text={`12 расстановок от простого ряда до «Шеберлер». Собрано звёзд: ${totalStars} из 36.`}
            accent
          />
          <ModeCard
            href="/daily"
            icon="☀️"
            title="Күн сынағы"
            text="Испытание дня — одна расстановка для всех. Попади в топ дня и принеси очки своему вузу."
            badge="каждый день новое"
          />
          <ModeCard href="/duel" icon="⚔️" title="Екеуара — дуэль" text="Вдвоём на одном телефоне, по очереди, как во дворе. Выбил — бросаешь ещё раз." />
          <ModeCard
            href="/editor"
            icon="✏️"
            title="Редактор"
            text="Собери свою расстановку и отправь ссылку другу: кто выбьет больше?"
          />
          <ModeCard
            href="/leaderboard"
            icon="🏆"
            title="Лига университетов"
            text="Narxoz, KBTU, SDU, AITU… Каждое испытание дня приносит очки твоему университету."
          />
          <ModeCard href="/shop" icon="🎨" title="Сақа и площадки" text="Золотая сақа, степь, войлочный киіз. Только внешний вид — никаких преимуществ." />
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Как играть</h2>
          <ol className="mt-4 grid gap-4">
            <Step n={1} title="Потяни назад">
              Коснись поля и потяни назад, как рогатку. Направление — куда полетит сақа, длина — сила броска.
            </Step>
            <Step n={2} title="Отпусти">
              Сақа скользит по земле и сбивает асыки. Пунктир показывает путь до первого удара.
            </Step>
            <Step n={3} title="Выбей за линию">
              Асык полностью за меловым кругом — +1. Выбил пару за раз — бонус. Сақа осталась в коне — −1.
            </Step>
          </ol>
        </div>
        <div className="card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Что такое асық?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Асық — таранная косточка барана. Казахские дети веками играли ими во дворах и на
              джайлау: ставили асыки в ряд внутри круга — <b className="text-text">кона</b> — и выбивали
              их тяжёлым биткой-асыком — <b className="text-text">сақой</b>. Сақу часто красили и даже
              заливали свинцом, чтобы била сильнее.
            </p>
          </div>
          <p className="mt-4 text-sm text-muted">
            У асыка четыре стороны: <b className="text-gold">алшы</b>, <b className="text-gold">тәйкі</b>,{" "}
            <b className="text-gold">бүк</b> и <b className="text-gold">шік</b>. В игре ты увидишь, какой стороной
            упал каждый выбитый асык.
          </p>
        </div>
      </section>

      {!me && (
        <section className="card mt-6 flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
          <AsyqMark className="h-10 w-10 shrink-0" />
          <p className="flex-1 text-sm text-muted">
            Можно играть без регистрации — прогресс сохранится в браузере. Создай аккаунт, чтобы попасть в
            рейтинг, выбрать свой университет и продолжать с любого устройства.
          </p>
          <Link href="/auth" className="btn btn-ghost">
            Создать аккаунт
          </Link>
        </section>
      )}
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  text,
  badge,
  accent,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card group flex gap-4 p-4 transition-colors hover:border-gold/50 ${accent ? "border-gold/30" : ""}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">{icon}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-[15px] font-bold">{title}</h3>
          {badge && <span className="chip !text-[10px]">{badge}</span>}
        </div>
        <p className="mt-1 text-sm leading-snug text-muted">{text}</p>
      </div>
      <span className="ml-auto self-center text-muted transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-[#2a1a05]">
        {n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm leading-snug text-muted">{children}</div>
      </div>
    </li>
  );
}

/** Декоративный ряд асыков на меловой линии, как на фото из двора. */
function AsyqRow() {
  return (
    <div className="relative mx-auto mt-10 h-12 max-w-md" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-chalk/40 blur-[0.5px]" />
      <div className="relative flex h-full items-center justify-center gap-1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <AsyqMark key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
  );
}
