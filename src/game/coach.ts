import type { RoundState, ThrowResult } from "./types";

/** Короткий совет после броска: что пошло не так и как исправить. */
export function throwTip(r: ThrowResult): { tone: "good" | "warn" | "bad"; text: string } {
  const n = r.knockedIds.length;
  if (n >= 3) return { tone: "good", text: `Керемет! ${n} асыка одним броском.` };
  if (n > 0 && r.saqaInKon)
    return { tone: "warn", text: "Выбил, но сақа осталась в коне (−1). Бросай сильнее — пусть пролетает насквозь." };
  if (n === 2) return { tone: "good", text: "Дубль! Бонус +1 за второй асык." };
  if (n === 1) return { tone: "good", text: "Есть! Попробуй зайти сбоку, чтобы выбить несколько сразу." };
  if (!r.hit && r.saqaInKon)
    return { tone: "bad", text: "Мимо, и сақа осталась в коне (−1). Прицелься точнее и добавь силы." };
  if (!r.hit) return { tone: "bad", text: "Мимо. Следи за пунктиром — он показывает первый удар." };
  if (r.power < 0.75) return { tone: "warn", text: "Попал, но слабо. Нужно больше силы, чтобы асык вылетел за линию." };
  return { tone: "warn", text: "Попал, но асык остался в коне. Бей ближе к центру асыка." };
}

export interface RoundStats {
  throws: number;
  hitRate: number;
  avgPower: number;
  penalties: number;
  combos: number;
  advice: string;
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

  let advice: string;
  if (hitRate < 0.5) advice = "Главное сейчас — точность. Не спеши: наведи пунктир на край асыка.";
  else if (penalties >= 2) advice = "Сақа часто застревает в коне. Бросай на 80–100% силы.";
  else if (avgPower < 0.7) advice = "Ты бросаешь мягко. Асыки вылетают только от сильного удара.";
  else if (combos === 0 && state.level.asyks.length > 4)
    advice = "Встань сбоку на линии (кнопки ◀ ▶) и бей вдоль ряда — так выбивают по 2–3 асыка.";
  else if (state.status === "won" && state.stars < 3)
    advice = `Для трёх звёзд уложись в ${state.level.par3} бросков.`;
  else advice = "Отличная серия! Попробуй испытание дня и сравни себя с другими.";

  return { throws: h.length, hitRate, avgPower, penalties, combos, advice };
}
