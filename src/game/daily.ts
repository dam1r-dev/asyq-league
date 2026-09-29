import { ASYK_R, DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import { hashString, mulberry32 } from "./rng";
import type { LevelDef, Point, Stone } from "./types";

/** Дата по Алматы в формате YYYY-MM-DD — ключ ежедневного испытания. */
export function almatyDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isDayKey(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

const PATTERNS = ["row", "rows", "scatter", "triangle"] as const;

/**
 * Генерирует расстановку дня из даты. Генератор детерминированный, поэтому
 * у всех игроков (и на сервере) испытание одинаковое — без хранения в БД.
 */
export function dailyLevel(dayKey: string): LevelDef {
  const rand = mulberry32(hashString(`asyq-daily:${dayKey}`));
  const kon = DEFAULT_KON;
  const pattern = PATTERNS[Math.floor(rand() * PATTERNS.length)];
  const asyks: Point[] = [];
  const stones: Stone[] = [];
  const r1 = (n: number) => Math.round(n * 10) / 10;

  if (pattern === "row") {
    const n = 7 + Math.floor(rand() * 5);
    const y = kon.y - 20 + rand() * 40;
    for (let i = 0; i < n; i++) asyks.push({ x: r1(kon.x - ((n - 1) * 23) / 2 + i * 23), y: r1(y) });
  } else if (pattern === "rows") {
    const n = 4 + Math.floor(rand() * 3);
    for (const dy of [-18, 18])
      for (let i = 0; i < n; i++) asyks.push({ x: r1(kon.x - ((n - 1) * 24) / 2 + i * 24), y: kon.y + dy });
  } else if (pattern === "triangle") {
    const rows = 3 + Math.floor(rand() * 2);
    for (let r = 0; r < rows; r++) {
      const n = rows - r;
      for (let i = 0; i < n; i++) asyks.push({ x: kon.x - ((n - 1) * 24) / 2 + i * 24, y: kon.y - 30 + r * 23 });
    }
  } else {
    const n = 6 + Math.floor(rand() * 4);
    let guard = 0;
    while (asyks.length < n && guard++ < 500) {
      const p = { x: r1(kon.x + (rand() * 2 - 1) * 100), y: r1(kon.y + (rand() * 2 - 1) * 100) };
      if (!fitsInKon(p, 25)) continue;
      if (asyks.some((a) => dist(a, p) < 28)) continue;
      asyks.push(p);
    }
  }

  const stoneCount = Math.floor(rand() * 3); // 0–2 камня
  let guard = 0;
  while (stones.length < stoneCount && guard++ < 500) {
    const s = {
      x: r1(kon.x + (rand() * 2 - 1) * 110),
      y: r1(kon.y + 40 + rand() * 80),
      r: 12 + Math.floor(rand() * 5),
    };
    if (!fitsInKon(s, s.r + 5)) continue;
    if (asyks.some((a) => dist(a, s) < s.r + ASYK_R + 12)) continue;
    if (stones.some((o) => dist(o, s) < o.r + s.r + 30)) continue;
    stones.push(s);
  }

  const n = asyks.length;
  const par3 = Math.max(3, Math.ceil(n / 2.5));
  return {
    id: `daily-${dayKey}`,
    title: "Күн сынағы",
    subtitle: `Испытание дня · ${dayKey}`,
    kon,
    lineY: DEFAULT_LINE_Y,
    asyks,
    stones,
    throws: par3 + 4,
    par3,
    par2: par3 + 2,
  };
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function fitsInKon(p: Point, margin: number) {
  return dist(p, DEFAULT_KON) + margin < DEFAULT_KON.r;
}
