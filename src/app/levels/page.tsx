"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import { LEGEND_LEVELS, LEVELS } from "@/game/levels";
import type { LevelDef } from "@/game/types";
import { useLocal } from "@/lib/local";

export default function LevelsPage() {
  const local = useLocal();
  const { me, owns } = useAccount();
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
          <h1 className="font-display text-2xl font-bold">Испытания</h1>
          <p className="mt-1 text-sm text-muted">Пройди испытание, чтобы открыть следующее. Меньше бросков — больше звёзд.</p>
        </div>
        <div className="chip !text-sm">⭐ {total}/36</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LEVELS.map((l, i) => {
          const unlocked = i === 0 || rec(LEVELS[i - 1].id).stars > 0;
          return <LevelCard key={l.id} level={l} index={i + 1} unlocked={unlocked} {...rec(l.id)} />;
        })}
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Дала аңыздары</h2>
          <p className="mt-1 text-sm text-muted">Дополнительный набор испытаний. Не влияет на рейтинг и не даёт преимуществ.</p>
        </div>
        {!hasLegends && (
          <Link href="/shop" className="btn btn-primary shrink-0 !py-2 text-sm">
            Открыть
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
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-muted">{premium ? "★" : ""}{index}</span>
        <span className="text-sm tracking-tight" aria-label={`Звёзд: ${stars}`}>
          {unlocked ? [1, 2, 3].map((s) => (s <= stars ? "⭐" : "☆")).join("") : "🔒"}
        </span>
      </div>
      <LevelPreview level={level} dim={!unlocked} />
      <div className="font-display text-sm font-bold leading-tight">{level.title}</div>
      <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{level.subtitle}</div>
      {best > 0 && <div className="mt-1 text-xs text-gold">Рекорд: {best}</div>}
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
      {level.stones.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#77726a" />
      ))}
      {level.asyks.map((a, i) => (
        <ellipse key={i} cx={a.x} cy={a.y} rx={11} ry={8} fill="#e9cfa3" />
      ))}
    </svg>
  );
}
