import "server-only";
import { almatyDayKey } from "@/game/daily";
import { LEVELS } from "@/game/levels";
import { prisma } from "./prisma";

export interface Row {
  name: string;
  university: string | null;
  value: number;
  extra?: string;
  userId?: string;
}

async function usersById(ids: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, displayName: true, university: true },
  });
  return new Map(users.map((u) => [u.id, u]));
}

/** Лучший результат каждого игрока в испытании дня. */
export async function dayBoard(dayKey = almatyDayKey()): Promise<Row[]> {
  const best = await prisma.attempt.groupBy({
    by: ["userId"],
    where: { kind: "daily", dayKey },
    _max: { score: true },
    orderBy: { _max: { score: "desc" } },
    take: 50,
  });
  const users = await usersById(best.map((b) => b.userId));
  return best.map((b) => ({
    userId: b.userId,
    name: users.get(b.userId)?.displayName ?? "—",
    university: users.get(b.userId)?.university ?? null,
    value: b._max.score ?? 0,
  }));
}

/**
 * Лига университетов: за последние 7 дней складываем лучшие результаты
 * каждого студента в каждом испытании дня. Так вузу выгодно, чтобы играли
 * многие и каждый день, а не один «задрот».
 */
export async function universityBoard(): Promise<Row[]> {
  const days = Array.from({ length: 7 }, (_, i) => almatyDayKey(new Date(Date.now() - i * 24 * 3600 * 1000)));
  const best = await prisma.attempt.groupBy({
    by: ["userId", "dayKey"],
    where: { kind: "daily", dayKey: { in: days } },
    _max: { score: true },
  });
  const users = await usersById([...new Set(best.map((b) => b.userId))]);
  const totals = new Map<string, { points: number; players: Set<string> }>();
  for (const b of best) {
    const uni = users.get(b.userId)?.university;
    if (!uni) continue;
    const t = totals.get(uni) ?? { points: 0, players: new Set<string>() };
    t.points += b._max.score ?? 0;
    t.players.add(b.userId);
    totals.set(uni, t);
  }
  return [...totals.entries()]
    .map(([uni, t]) => ({ name: uni, university: uni, value: t.points, extra: `${t.players.size} игр.` }))
    .sort((a, b) => b.value - a.value);
}

/** Мастера: сумма лучших звёзд по 12 основным испытаниям. */
export async function mastersBoard(): Promise<Row[]> {
  const best = await prisma.attempt.groupBy({
    by: ["userId", "levelId"],
    where: { kind: "level", levelId: { in: LEVELS.map((l) => l.id) } },
    _max: { stars: true },
  });
  const sum = new Map<string, number>();
  for (const b of best) sum.set(b.userId, (sum.get(b.userId) ?? 0) + (b._max.stars ?? 0));
  const top = [...sum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
  const users = await usersById(top.map(([id]) => id));
  return top.map(([id, stars]) => ({
    userId: id,
    name: users.get(id)?.displayName ?? "—",
    university: users.get(id)?.university ?? null,
    value: stars,
  }));
}
