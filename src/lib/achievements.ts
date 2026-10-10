/**
 * Достижения. Список и условия — чистый код без базы, чтобы их можно было
 * проверить тестами и показывать на клиенте. Что игрок уже получил, сервер
 * определяет по журналу тиынов (запись `ach:<user>:<id>`), поэтому
 * отдельная таблица не нужна, а награда выдаётся ровно один раз.
 */

export interface AchStats {
  /** Сумма лучших звёзд по всем испытаниям кампании. */
  stars: number;
  /** Сколько испытаний пройдено хотя бы на одну звезду. */
  cleared: number;
  /** Сколько испытаний пройдено на три звезды. */
  threeStar: number;
  /** Пройдены ли все испытания главы (ключ — номер главы). */
  chapterDone: Record<1 | 2 | 3, boolean>;
  /** Победа за один бросок на поле минимум из 5 асыков. */
  oneThrowWin: boolean;
  /** Пройдено хоть одно испытание с лужей. */
  puddleWin: boolean;
  /** Всего выбито асыков во всех попытках. */
  knocked: number;
  streak: number;
  /** В скольких разных днях сыграно испытание дня. */
  dailyDays: number;
  /** Куплена ли хоть одна платная вещь. */
  purchased: boolean;
  duelWins: number;
}

export interface AchDef {
  id: string;
  icon: string;
  /** Награда в тиынах. */
  reward: number;
  done: (s: AchStats) => boolean;
}

export const ACHIEVEMENTS: AchDef[] = [
  { id: "first_win", icon: "🎯", reward: 10, done: (s) => s.cleared >= 1 },
  { id: "stars_10", icon: "⭐", reward: 20, done: (s) => s.stars >= 10 },
  { id: "stars_30", icon: "🌟", reward: 40, done: (s) => s.stars >= 30 },
  { id: "stars_60", icon: "💫", reward: 60, done: (s) => s.stars >= 60 },
  { id: "stars_all", icon: "👑", reward: 150, done: (s) => s.stars >= 84 },
  { id: "chapter1", icon: "📘", reward: 40, done: (s) => s.chapterDone[1] },
  { id: "chapter2", icon: "🐎", reward: 60, done: (s) => s.chapterDone[2] },
  { id: "chapter3", icon: "💧", reward: 80, done: (s) => s.chapterDone[3] },
  { id: "three_5", icon: "✨", reward: 30, done: (s) => s.threeStar >= 5 },
  { id: "three_15", icon: "💎", reward: 80, done: (s) => s.threeStar >= 15 },
  { id: "one_throw", icon: "🎳", reward: 25, done: (s) => s.oneThrowWin },
  { id: "water", icon: "💦", reward: 15, done: (s) => s.puddleWin },
  { id: "knock_100", icon: "🦴", reward: 40, done: (s) => s.knocked >= 100 },
  { id: "knock_500", icon: "🏺", reward: 80, done: (s) => s.knocked >= 500 },
  { id: "streak_3", icon: "🔥", reward: 20, done: (s) => s.streak >= 3 },
  { id: "streak_7", icon: "🔥", reward: 50, done: (s) => s.streak >= 7 },
  { id: "daily_3", icon: "☀️", reward: 20, done: (s) => s.dailyDays >= 3 },
  { id: "daily_10", icon: "🏅", reward: 60, done: (s) => s.dailyDays >= 10 },
  { id: "shopper", icon: "🛍️", reward: 10, done: (s) => s.purchased },
  { id: "duel_win", icon: "⚔️", reward: 25, done: (s) => s.duelWins >= 1 },
];

export const ACH_IDS = ACHIEVEMENTS.map((a) => a.id);

export function achRefKey(userId: string, id: string) {
  return `ach:${userId}:${id}`;
}

/** Какие достижения выполнены при данной статистике. */
export function doneAchievements(stats: AchStats) {
  return ACHIEVEMENTS.filter((a) => a.done(stats)).map((a) => a.id);
}
