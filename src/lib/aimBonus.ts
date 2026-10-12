/**
 * Бонус за сложность прицела. Настройку выбирает игрок, поэтому награда
 * ограничена: за каждый уровень каждая ступень сложности оплачивается один раз,
 * а пройдя уровень на «сложном», игрок получает и ступень «среднего» (чтобы
 * не собирать их повторно). Очки и звёзды от сложности не зависят.
 */

export type Aim = "long" | "short" | "none";

export const AIM_ORDER: Aim[] = ["long", "short", "none"];
/** Награда за ступень, тиынов. */
export const AIM_REWARD: Record<Exclude<Aim, "long">, number> = { short: 5, none: 10 };

/** Ступени, за которые полагается награда при игре на данной сложности. */
export function aimTiers(aim: Aim | undefined): ("short" | "none")[] {
  const i = AIM_ORDER.indexOf(aim ?? "long");
  return AIM_ORDER.slice(1, i + 1) as ("short" | "none")[];
}

export function aimRefKey(userId: string, levelId: string, tier: "short" | "none") {
  return `aim:${userId}:${levelId}:${tier}`;
}
