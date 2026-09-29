import { NextResponse } from "next/server";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { ownedItems } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { attemptSchema, verifyAttempt } from "@/lib/verify";

export const POST = safe(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  const body = await parseBody(req, attemptSchema);
  if (!body) return fail("badData");

  const v = verifyAttempt(body, await ownedItems(user.id));
  if (!v.ok) return fail(v.error);
  const { state, level, dayKey } = v;

  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: body.kind,
      levelId: level.id,
      dayKey,
      score: state.score,
      stars: state.stars,
      won: state.status === "won",
      throwsUsed: state.throwsUsed,
      knocked: state.knocked,
      inputs: JSON.stringify(body.inputs),
    },
  });

  const agg = await prisma.attempt.aggregate({
    where: { userId: user.id, levelId: level.id },
    _max: { score: true },
  });
  const best = agg._max.score ?? state.score;

  let rank: number | undefined;
  if (dayKey) {
    // Место в рейтинге дня = сколько игроков имеют лучший результат выше.
    const better = await prisma.attempt.groupBy({
      by: ["userId"],
      where: { kind: "daily", dayKey },
      _max: { score: true },
      having: { score: { _max: { gt: best } } },
    });
    rank = better.length + 1;
  }

  return NextResponse.json({ score: state.score, stars: state.stars, won: state.status === "won", best, rank });
});
