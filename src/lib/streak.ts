import "server-only";
import { almatyDayKey } from "@/game/daily";
import { prisma } from "./prisma";
import { computeStreak } from "./streakCalc";

const LOOKBACK_DAYS = 40;

/** Текущая серия игрока по его попыткам (день считается по Алматы). */
export async function streakOf(userId: string) {
  const now = Date.now();
  const days = Array.from({ length: LOOKBACK_DAYS }, (_, i) => almatyDayKey(new Date(now - i * 24 * 3600 * 1000)));
  const rows = await prisma.attempt.findMany({
    where: { userId, createdAt: { gte: new Date(now - (LOOKBACK_DAYS + 1) * 24 * 3600 * 1000) } },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 3000,
  });
  const played = new Set(rows.map((r) => almatyDayKey(r.createdAt)));
  return { ...computeStreak(played, days), today: days[0] };
}
