import { NextResponse } from "next/server";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { ownedItems } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { attemptSchema, verifyAttempt } from "@/lib/verify";
import { award, balance, REWARDS } from "@/lib/coins";
import { streakOf } from "@/lib/streak";
import { streakBonus } from "@/lib/streakCalc";

export const POST = safe(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  // Каждая попытка перепроигрывается на сервере — защищаем процессор от заваливания.
  if (!(await rateLimit(`attempts:${user.id}`, 60, 60))) return fail("tooMany", 429);
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

  // Тиыны: за каждую новую звезду уровня (один раз за звезду) и за участие
  // в турнире дня (один раз в день).
  let earned = 0;
  if (body.kind === "level") {
    for (let s = 1; s <= state.stars; s++)
      if (await award(user.id, REWARDS.star, "star", `star:${user.id}:${level.id}:${s}`)) earned += REWARDS.star;
  } else if (dayKey) {
    if (await award(user.id, REWARDS.dailyPlay, "daily-play", `daily-play:${user.id}:${dayKey}`)) earned += REWARDS.dailyPlay;
  }

  // Серия дней: за игру несколько дней подряд — бонус, один раз в день.
  const { streak, today } = await streakOf(user.id);
  const bonus = streakBonus(streak);
  const gotStreak = bonus > 0 && (await award(user.id, bonus, "streak", `streak:${user.id}:${today}`));
  if (gotStreak) earned += bonus;

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

  return NextResponse.json({
    score: state.score,
    stars: state.stars,
    won: state.status === "won",
    best,
    rank,
    earned,
    streak,
    streakBonus: gotStreak ? bonus : 0,
    coins: await balance(user.id),
  });
});
