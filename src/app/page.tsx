"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import AsyqMark from "@/components/AsyqMark";
import { LEVELS } from "@/game/levels";
import { useLocal } from "@/lib/local";
import { useT } from "@/i18n/provider";

export default function Home() {
  const local = useLocal();
  const { me } = useAccount();
  const t = useT();

  const stars = (id: string) => Math.max(local.levels[id]?.stars ?? 0, me?.progress[id]?.stars ?? 0);
  const totalStars = LEVELS.reduce((s, l) => s + stars(l.id), 0);
  const nextLevel = LEVELS.find((l) => stars(l.id) === 0) ?? LEVELS[LEVELS.length - 1];
  const firstTime = !local.settings.tutorialDone && totalStars === 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16">
      <section className="relative overflow-hidden pt-10 pb-8 text-center sm:pt-16">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-good" /> {t("home.badge")}
        </div>
        <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
          {t("home.title1")}
          <br />
          <span className="text-gold">{t("home.title2")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg">
          {t("home.lead")}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/play/${firstTime ? "l1" : nextLevel.id}`} className="btn btn-primary w-full max-w-xs px-8 py-4 text-lg sm:w-auto">
            {firstTime ? t("home.playTutorial") : t("home.playLevel", { title: nextLevel.title })}
          </Link>
          <Link href="/rules" className="btn btn-ghost w-full max-w-xs sm:w-auto">
            {t("home.rules")}
          </Link>
        </div>
        <AsyqRow />
      </section>

      <section aria-labelledby="modes" className="mt-2">
        <h2 id="modes" className="sr-only">{t("nav.levels")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModeCard
            href="/levels"
            icon="🎯"
            title={t("home.modes.levels")}
            text={t("home.modes.levelsText", { stars: totalStars })}
            accent
          />
          <ModeCard
            href="/daily"
            icon="☀️"
            title={t("home.modes.daily")}
            text={t("home.modes.dailyText")}
            badge={t("home.modes.dailyBadge")}
          />
          <ModeCard href="/duel" icon="⚔️" title={t("home.modes.duel")} text={t("home.modes.duelText")} />
          <ModeCard
            href="/editor"
            icon="✏️"
            title={t("home.modes.editor")}
            text={t("home.modes.editorText")}
          />
          <ModeCard
            href="/leaderboard"
            icon="🏆"
            title={t("home.modes.league")}
            text={t("home.modes.leagueText")}
          />
          <ModeCard href="/shop" icon="🎨" title={t("home.modes.shop")} text={t("home.modes.shopText")} />
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{t("home.howTitle")}</h2>
          <ol className="mt-4 grid gap-4">
            <Step n={1} title={t("home.step1")}>
              {t("home.step1Text")}
            </Step>
            <Step n={2} title={t("home.step2")}>
              {t("home.step2Text")}
            </Step>
            <Step n={3} title={t("home.step3")}>
              {t("home.step3Text")}
            </Step>
          </ol>
        </div>
        <div className="card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-bold">{t("home.whatTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("home.whatText")}</p>
          </div>
          <p className="mt-4 text-sm text-muted">{t("home.sidesText")}</p>
        </div>
      </section>

      {!me && (
        <section className="card mt-6 flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
          <AsyqMark className="h-10 w-10 shrink-0" />
          <p className="flex-1 text-sm text-muted">{t("home.guestText")}</p>
          <Link href="/auth" className="btn btn-ghost">
            {t("home.createAccount")}
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-on-gold">
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
