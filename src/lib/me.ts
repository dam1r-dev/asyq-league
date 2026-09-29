import "server-only";
import { prisma } from "./prisma";
import type { User } from "@/generated/prisma/client";

/** Профиль для клиента: без хэша пароля, с покупками и лучшими результатами. */
export async function serializeMe(user: User) {
  const [purchases, best] = await Promise.all([
    prisma.purchase.findMany({ where: { userId: user.id }, select: { itemId: true } }),
    prisma.attempt.groupBy({
      by: ["levelId"],
      where: { userId: user.id, kind: "level" },
      _max: { score: true, stars: true },
    }),
  ]);
  const progress: Record<string, { best: number; stars: number }> = {};
  for (const b of best) progress[b.levelId] = { best: b._max.score ?? 0, stars: b._max.stars ?? 0 };
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    university: user.university,
    saqaSkin: user.saqaSkin,
    fieldSkin: user.fieldSkin,
    owned: purchases.map((p) => p.itemId),
    progress,
  };
}

export async function ownedItems(userId: string) {
  const rows = await prisma.purchase.findMany({ where: { userId }, select: { itemId: true } });
  return new Set(rows.map((r) => r.itemId));
}
