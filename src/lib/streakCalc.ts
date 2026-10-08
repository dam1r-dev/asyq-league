/**
 * Серии дней: сколько дней подряд игрок делал хотя бы одну попытку.
 * Чистая функция (без базы), поэтому её легко проверить тестом.
 */

/** Бонус тиынов за день серии: 5 за каждый день, максимум 35 (с седьмого дня). Первый день серии бонуса не даёт. */
export const STREAK_STEP = 5;
export const STREAK_CAP_DAYS = 7;

export function streakBonus(streak: number) {
  return streak >= 2 ? STREAK_STEP * Math.min(streak, STREAK_CAP_DAYS) : 0;
}

/**
 * @param played  множество ключей дней YYYY-MM-DD, в которые игрок играл
 * @param days    последние дни от сегодняшнего назад: [сегодня, вчера, позавчера, …]
 * Серия не прерывается, пока не закончился сегодняшний день: если сегодня ещё не играл,
 * считаем от вчерашнего дня.
 */
export function computeStreak(played: Set<string>, days: string[]) {
  const playedToday = played.has(days[0]);
  let i = playedToday ? 0 : 1;
  let streak = 0;
  while (i < days.length && played.has(days[i])) {
    streak++;
    i++;
  }
  return { streak, playedToday };
}
