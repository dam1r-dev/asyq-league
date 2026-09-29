import type { RoundState, ThrowResult } from "./types";

/**
 * Советы возвращаются ключами словаря (coach.*), а не готовым текстом —
 * так движок не зависит от языка интерфейса.
 */
export interface Tip {
  tone: "good" | "warn" | "bad";
  key: string;
  params?: Record<string, number>;
}

/** Короткий совет после броска: что пошло не так и как исправить. */
export function throwTip(r: ThrowResult): Tip {
  const n = r.knockedIds.length;
  if (n >= 3) return { tone: "good", key: "coach.many", params: { n } };
  if (n > 0 && r.saqaInKon) return { tone: "warn", key: "coach.knockedButIn" };
  if (n === 2) return { tone: "good", key: "coach.double" };
  if (n === 1) return { tone: "good", key: "coach.one" };
  if (!r.hit && r.saqaInKon) return { tone: "bad", key: "coach.missIn" };
  if (!r.hit) return { tone: "bad", key: "coach.miss" };
  if (r.power < 0.75) return { tone: "warn", key: "coach.weak" };
  return { tone: "warn", key: "coach.center" };
}

export interface RoundStats {
  throws: number;
  hitRate: number;
  avgPower: number;
  penalties: number;
  combos: number;
  advice: { key: string; params?: Record<string, number> };
}

/** Итог раунда: точность, средняя сила и один главный совет. */
export function roundStats(state: RoundState): RoundStats {
  const h = state.history;
  const throws = h.length || 1;
  const hits = h.filter((r) => r.hit).length;
  const penalties = h.filter((r) => r.penalty > 0).length;
  const combos = h.filter((r) => r.knockedIds.length > 1).length;
  const avgPower = h.reduce((s, r) => s + r.power, 0) / throws;
  const hitRate = hits / throws;

  let advice: RoundStats["advice"];
  if (hitRate < 0.5) advice = { key: "coach.adviceAccuracy" };
  else if (penalties >= 2) advice = { key: "coach.advicePenalty" };
  else if (avgPower < 0.7) advice = { key: "coach.adviceSoft" };
  else if (combos === 0 && state.level.asyks.length > 4) advice = { key: "coach.adviceSide" };
  else if (state.status === "won" && state.stars < 3) advice = { key: "coach.adviceStars", params: { n: state.level.par3 } };
  else advice = { key: "coach.adviceGreat" };

  return { throws: h.length, hitRate, avgPower, penalties, combos, advice };
}
