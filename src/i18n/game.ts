import type { LevelDef } from "@/game/types";
import type { Tip } from "@/game/coach";
import type { T } from "./translate";
import type { ShopItem } from "@/lib/catalog";

/**
 * В английской версии казахские названия пишем латиницей, чтобы иностранцу
 * было что прочитать; в русской и казахской — оригинал на кириллице.
 */
const LATIN: Record<string, string> = {
  l1: "Algashqy soq",
  l2: "Qatar",
  l3: "Uzyn qatar",
  l4: "Eki qatar",
  l5: "Shashyrandy",
  l6: "Tas",
  l7: "Alys",
  l8: "Ushburysh",
  l9: "Qaqpa",
  l10: "Aiqas",
  l11: "Kishi kon",
  l12: "Sheberler",
  p1: "Qorghan",
  p2: "Zhuldyz",
  p3: "Kokpar",
  p4: "Uly dala",
  duel: "Ekeuara",
  daily: "Kün synaghy",
  "saqa-classic": "Kädimgi saqa",
  "saqa-qyzyl": "Qyzyl saqa",
  "saqa-kok": "Kök saqa",
  "saqa-altyn": "Altyn saqa",
  "field-aula": "Aula (yard)",
  "field-auyl": "Auyl (village)",
  "field-dala": "Dala (steppe)",
  "field-kiiz": "Kiiz (felt rug)",
  "pack-legends": "Dala anyzdary",
  "outfit-simple": "Zheide (shirt)",
  "outfit-kamzol": "Kamzol (vest)",
  "outfit-shapan": "Shapan (robe)",
  "outfit-koilek": "Qyz köilegi (dress)",
  "outfit-ton": "Ton (fur coat)",
  "outfit-sauyt": "Batyr sauyty (armour)",
  "outfit-altyn-adam": "Altyn Adam (Golden Man)",
  "hat-taqiya": "Oiu taqiya",
  "hat-taqiya-kiiz": "Kiiz taqiya",
  "hat-taqiya-zer": "Zerli taqiya",
  "hat-borik": "Börik",
  "hat-tymaq": "Tymaq",
  "hat-saukele": "Säukele",
  "hat-dulygha": "Dulygha (helmet)",
  алшы: "alshy",
  тәйкі: "täiki",
  бүк: "bük",
  шік: "shik",
};

export function levelTitle(level: LevelDef, t: T) {
  if (t.lang !== "en" || level.id === "custom") return level.title;
  return LATIN[level.id.startsWith("daily-") ? "daily" : level.id] ?? level.title;
}

export function itemName(item: ShopItem, t: T) {
  if (item.kind === "color") return t(`color.${item.id}`);
  return (t.lang === "en" && LATIN[item.id]) || item.name;
}

export function sideName(side: string, t: T) {
  return (t.lang === "en" && LATIN[side]) || side;
}

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
