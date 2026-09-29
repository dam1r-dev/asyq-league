import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { ownedItems } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { inputSchema, verifyAttempt } from "@/lib/verify";

/**
 * После входа гостевой прогресс из браузера переносится в профиль.
 * Каждый результат проверяется так же, как обычная попытка.
 */
const schema = z.object({
  levels: z.record(z.string().max(40), z.array(inputSchema).min(1).max(20)),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Нужно войти", 401);
  const body = await parseBody(req, schema);
  if (!body) return fail("Некорректные данные");
  const entries = Object.entries(body.levels).slice(0, 40);

  const owned = await ownedItems(user.id);
  const existing = await prisma.attempt.groupBy({
    by: ["levelId"],
    where: { userId: user.id, kind: "level" },
    _max: { score: true },
  });
  const bestBy = new Map(existing.map((e) => [e.levelId, e._max.score ?? 0]));

  let imported = 0;
  for (const [levelId, inputs] of entries) {
    const v = verifyAttempt({ kind: "level", levelId, inputs }, owned);
    if (!v.ok || v.state.status !== "won") continue;
    if ((bestBy.get(levelId) ?? -1) >= v.state.score) continue;
    await prisma.attempt.create({
      data: {
        userId: user.id,
        kind: "level",
        levelId,
        score: v.state.score,
        stars: v.state.stars,
        won: true,
        throwsUsed: v.state.throwsUsed,
        knocked: v.state.knocked,
        inputs: JSON.stringify(inputs),
      },
    });
    imported++;
  }
  return NextResponse.json({ imported });
}
