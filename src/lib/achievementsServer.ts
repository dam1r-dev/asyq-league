import "server-only";
import { LEVELS, getLevel } from "@/game/levels";
import { ACHIEVEMENTS, achRefKey, doneAchievements, type AchStats } from "./achievements";
import { award } from "./coins";
import { prisma } from "./prisma";
import { streakOf } from "./streak";

/** Собирает статистику игрока из уже хранимых данных. */
export async function collectStats(userId: string): Promise<AchStats> {
  const levelIds = LEVELS.map((l) => l.id);
  const bigLevelIds = levelIds.filter((id) => (getLevel(id)?.asyks.length ?? 0) >= 5);
  const [best, knocked, oneThrow, daily, purchases, duelWins, streak] = await Promise.all([
    prisma.attempt.groupBy({
      by: ["levelId"],
      where: { userId, kind: "level", levelId: { in: levelIds } },
      _max: { stars: true },
    }),
    prisma.attempt.aggregate({ where: { userId }, _sum: { knocked: true } }),
    prisma.attempt.count({ where: { userId, kind: "level", won: true, throwsUsed: 1, levelId: { in: bigLevelIds } } }),
    prisma.attempt.groupBy({ by: ["dayKey"], where: { userId, kind: "daily", dayKey: { not: null } } }),
    prisma.purchase.count({ where: { userId } }),
    prisma.match.count({
      where: {
        status: "finished",
        OR: [
          { hostUserId: userId, winner: 0 },
          { guestUserId: userId, winner: 1 },
        ],
      },
    }),
    streakOf(userId),
  ]);

  const stars = new Map(best.map((b) => [b.levelId, b._max.stars ?? 0]));
  const starsOf = (id: string) => stars.get(id) ?? 0;
  const chapterDone = (ch: 1 | 2 | 3) => {
    const list = LEVELS.filter((l) => (l.chapter ?? 1) === ch);
    return list.length > 0 && list.every((l) => starsOf(l.id) > 0);
  };
  return {
    stars: [...stars.values()].reduce((a, b) => a + b, 0),
    cleared: [...stars.values()].filter((s) => s > 0).length,
    threeStar: [...stars.values()].filter((s) => s >= 3).length,
    chapterDone: { 1: chapterDone(1), 2: chapterDone(2), 3: chapterDone(3) },
    oneThrowWin: oneThrow > 0,
    puddleWin: LEVELS.some((l) => (l.puddles?.length ?? 0) > 0 && starsOf(l.id) > 0),
    knocked: knocked._sum.knocked ?? 0,
    streak: streak.streak,
    dailyDays: daily.length,
    purchased: purchases > 0,
    duelWins,
  };
}

/**
 * Выдаёт новые достижения и возвращает полный список полученных.
 * Награда начисляется один раз (уникальный refKey), даже при гонке запросов.
 */
export async function syncAchievements(userId: string) {
  const stats = await collectStats(userId);
  const done = doneAchievements(stats);
  const rows = await prisma.coinTx.findMany({
    where: { userId, reason: "achievement" },
    select: { refKey: true, createdAt: true },
  });
  const have = new Map(rows.map((r) => [r.refKey, r.createdAt]));

  const newly: { id: string; reward: number }[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!done.includes(a.id) || have.has(achRefKey(userId, a.id))) continue;
    if (await award(userId, a.reward, "achievement", achRefKey(userId, a.id))) {
      newly.push({ id: a.id, reward: a.reward });
      have.set(achRefKey(userId, a.id), new Date());
    }
  }
  const items = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    unlockedAt: have.get(achRefKey(userId, a.id))?.toISOString() ?? null,
  }));
  return { items, newly };
}
