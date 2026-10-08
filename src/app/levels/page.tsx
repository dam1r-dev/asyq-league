"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import { CHAPTERS, LEGEND_LEVELS, LEVELS } from "@/game/levels";
import type { LevelDef } from "@/game/types";
import { useLocal } from "@/lib/local";
import { useT } from "@/i18n/provider";
import { levelSubtitle, levelTitle } from "@/i18n/game";

export default function LevelsPage() {
  const local = useLocal();
  const { me, owns } = useAccount();
  const t = useT();
  const rec = (id: string) => ({
    stars: Math.max(local.levels[id]?.stars ?? 0, me?.progress[id]?.stars ?? 0),
    best: Math.max(local.levels[id]?.best ?? 0, me?.progress[id]?.best ?? 0),
  });
  const total = LEVELS.reduce((s, l) => s + rec(l.id).stars, 0);
  const hasLegends = owns("pack-legends");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("levelsPage.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("levelsPage.lead")}</p>
        </div>
        <div className="chip !text-sm">⭐ {total}/{LEVELS.length * 3}</div>
      </div>

      {CHAPTERS.map((ch) => (
        <section key={ch.id} className="mt-6">
          <h2 className="font-display text-lg font-bold">{t(`levelsPage.ch${ch.id}`)}</h2>
          <p className="text-sm text-muted">{t(`levelsPage.ch${ch.id}Text`)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ch.levels.map((l) => {
              const i = LEVELS.indexOf(l);
              const unlocked = i === 0 || rec(LEVELS[i - 1].id).stars > 0;
              return <LevelCard key={l.id} level={l} index={i + 1} unlocked={unlocked} {...rec(l.id)} />;
            })}
          </div>
        </section>
      ))}

      <Link href="/history" className="card mt-8 flex items-center gap-4 border-gold/40 p-4 transition-colors hover:border-gold">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">📜</div>
        <div className="flex-1">
          <div className="font-display font-bold">{t("levelsPage.historyTitle")}</div>
          <div className="text-sm text-muted">{t("levelsPage.historyText")}</div>
        </div>
        <span className="text-muted">→</span>
      </Link>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">{t("levelsPage.packTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("levelsPage.packLead")}</p>
        </div>
        {!hasLegends && (
          <Link href="/shop" className="btn btn-primary shrink-0 !py-2 text-sm">
            {t("levelsPage.unlock")}
          </Link>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LEGEND_LEVELS.map((l, i) => (
          <LevelCard key={l.id} level={l} index={i + 1} unlocked={hasLegends} premium {...rec(l.id)} />
        ))}
      </div>
    </div>
  );
}

function LevelCard({
  level,
  index,
  unlocked,
  stars,
  best,
  premium,
}: {
  level: LevelDef;
  index: number;
  unlocked: boolean;
  stars: number;
  best: number;
  premium?: boolean;
}) {
  const t = useT();
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-muted">{premium ? "★" : ""}{index}</span>
        <span className="text-sm tracking-tight" aria-label={t("levelsPage.stars", { n: stars })}>
          {unlocked ? [1, 2, 3].map((s) => (s <= stars ? "⭐" : "☆")).join("") : "🔒"}
        </span>
      </div>
      <LevelPreview level={level} dim={!unlocked} />
      <div className="font-display text-sm font-bold leading-tight">{levelTitle(level, t)}</div>
      <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{levelSubtitle(level, t)}</div>
      <div className="mt-1 text-[11px] text-muted">⭐⭐⭐ ≤ {level.par3} · {t("levelsPage.throwsMax", { n: level.throws })}</div>
      {best > 0 && <div className="mt-0.5 text-xs text-gold">{t("levelsPage.record", { n: best })}</div>}
    </>
  );
  if (!unlocked)
    return (
      <div className="card flex flex-col gap-2 p-3 opacity-60" aria-disabled>
        {body}
      </div>
    );
  return (
    <Link href={`/play/${level.id}`} className="card flex flex-col gap-2 p-3 transition-colors hover:border-gold/50">
      {body}
    </Link>
  );
}

/** Мини-схема расстановки: кон, асыки и камни. */
export function LevelPreview({ level, dim }: { level: LevelDef; dim?: boolean }) {
  const pad = 10;
  const x0 = level.kon.x - level.kon.r - pad;
  const y0 = level.kon.y - level.kon.r - pad;
  const size = (level.kon.r + pad) * 2;
  return (
    <svg viewBox={`${x0} ${y0} ${size} ${size}`} className={`mx-auto aspect-square w-full max-w-[120px] ${dim ? "opacity-40" : ""}`} aria-hidden>
      <circle cx={level.kon.x} cy={level.kon.y} r={level.kon.r} fill="#2f2923" stroke="#f4efe6" strokeOpacity="0.6" strokeWidth="3" />
      {(level.puddles ?? []).map((w, i) => (
        <ellipse key={`w${i}`} cx={w.x} cy={w.y} rx={w.r} ry={w.r * 0.86} fill="#4fa3cf" opacity="0.9" />
      ))}
      {level.stones.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#77726a" />
      ))}
      {level.asyks.map((a, i) => (
        <ellipse key={i} cx={a.x} cy={a.y} rx={11} ry={8} fill="#e9cfa3" />
      ))}
    </svg>
  );
}
