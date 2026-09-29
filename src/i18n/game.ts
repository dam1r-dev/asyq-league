import type { LevelDef } from "@/game/types";
import type { Tip } from "@/game/coach";
import type { T } from "./translate";

/** Подзаголовок уровня на текущем языке (названия уровней — всегда на казахском). */
export function levelSubtitle(level: LevelDef, t: T, extra?: { day?: string; by?: string }) {
  if (level.id.startsWith("daily-")) return t("lvl.daily.sub", { day: extra?.day ?? level.id.slice(6) });
  if (level.id === "custom") return extra?.by ? t("lvl.custom.by", { name: extra.by }) : t("lvl.custom.sub");
  if (level.id === "duel") return t("lvl.duel.sub");
  return t.maybe(`lvl.${level.id}.sub`) ?? level.subtitle;
}

export function levelHint(level: LevelDef, t: T) {
  const h = t.maybe(`lvl.${level.id}.hint`);
  return h || undefined;
}

/** Текст совета с правильными формами слов («5 асыков», «3 броска»). */
export function tipText(tip: Tip | { key: string; params?: Record<string, number> }, t: T) {
  const p = tip.params ?? {};
  if (tip.key === "coach.many") return t(tip.key, { asyks: t("common.asyksN", { n: p.n }) });
  if (tip.key === "coach.adviceStars") return t(tip.key, { throws: t("common.throwsN", { n: p.n }) });
  return t(tip.key);
}

/** Сообщение об ошибке с сервера: код → перевод. */
export function errorText(code: string | undefined, t: T, fallback: string) {
  if (!code) return fallback;
  return t.maybe(`err.${code}`) ?? code;
}
