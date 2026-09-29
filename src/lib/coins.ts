import "server-only";
import { almatyDayKey } from "@/game/daily";
import { prisma } from "./prisma";

/**
 * Тиыны — внутриигровая валюта. Каждое движение записывается в CoinTx
 * с уникальным refKey: одна и та же награда не может прийти дважды,
 * даже если запрос повторится.
 */

export const REWARDS = {
  welcome: 100,
  star: 10,
  dailyPlay: 15,
  /** Места в турнире дня: 1, 2, 3, 4–10. */
  dailyRank: [100, 70, 50, 25] as const,
};

export async function balance(userId: string) {
  const agg = await prisma.coinTx.aggregate({ where: { userId }, _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}

/** Начислить награду. Возвращает true, если начислено впервые. */
export async function award(userId: string, amount: number, reason: string, refKey: string) {
  try {
    await prisma.coinTx.create({ data: { userId, amount, reason, refKey } });
    return true;
  } catch {
    // Нарушение уникальности refKey — награда уже была выдана.
    return false;
  }
}

export function rankReward(rank: number) {
  if (rank === 1) return REWARDS.dailyRank[0];
  if (rank === 2) return REWARDS.dailyRank[1];
  if (rank === 3) return REWARDS.dailyRank[2];
  if (rank <= 10) return REWARDS.dailyRank[3];
  return 0;
}

/** Место игрока в турнире дня по его лучшему результату. */
export async function dailyRank(userId: string, dayKey: string) {
  const mine = await prisma.attempt.aggregate({
    where: { userId, kind: "daily", dayKey },
    _max: { score: true },
  });
  const best = mine._max.score;
  if (best === null) return null;
  const better = await prisma.attempt.groupBy({
    by: ["userId"],
    where: { kind: "daily", dayKey },
    _max: { score: true },
    having: { score: { _max: { gt: best } } },
  });
  return better.length + 1;
}

/**
 * Забрать награды за завершённые турниры дня (последние 7 дней, кроме
 * сегодняшнего — он ещё идёт).
 */
export async function claimDailyRewards(userId: string) {
  const today = almatyDayKey();
  const days = Array.from({ length: 7 }, (_, i) => almatyDayKey(new Date(Date.now() - (i + 1) * 24 * 3600 * 1000))).filter(
    (d) => d !== today,
  );
  const claimed: { day: string; rank: number; amount: number }[] = [];
  for (const day of days) {
    const refKey = `daily-rank:${userId}:${day}`;
    if (await prisma.coinTx.findUnique({ where: { refKey } })) continue;
    const rank = await dailyRank(userId, day);
    if (!rank) continue;
    const amount = rankReward(rank);
    if (!amount) continue;
    if (await award(userId, amount, "daily-rank", refKey)) claimed.push({ day, rank, amount });
  }
  return claimed;
}
