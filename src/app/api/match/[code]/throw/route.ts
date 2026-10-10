import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { CODE_RE, applyMatchThrow, publicState, seatOf, settleTimeouts } from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { syncAchievements } from "@/lib/achievementsServer";
import { limitedByIp } from "@/lib/rateLimit";
import { inputSchema } from "@/lib/verify";

const schema = z.object({
  token: z.string().max(60),
  input: inputSchema,
  /** Сколько бросков клиент считает уже сыгранными: защита от гонок. */
  expected: z.number().int().min(0).max(100),
});

/** Сделать бросок. Сервер сам проверяет очередь и честность броска. */
export const POST = safe(async (req: Request, ctx: RouteContext<"/api/match/[code]/throw">) => {
  const { code } = await ctx.params;
  if (!CODE_RE.test(code)) return fail("matchNotFound", 404);
  if (await limitedByIp(req, "match-throw", 120, 60)) return fail("tooMany", 429);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");
  const found = await prisma.match.findUnique({ where: { code } });
  if (!found) return fail("matchNotFound", 404);
  const m = await settleTimeouts(found);

  const seat = seatOf(m, body.token);
  if (seat === null) return fail("notInMatch", 403);
  const r = await applyMatchThrow(m, seat, body.input, body.expected);
  if (!r.ok) return fail(r.error, r.status);
  // Матч закончился: победителю-аккаунту сразу засчитываем достижение (матчи удаляются через сутки).
  if (r.match.status === "finished") {
    for (const uid of [r.match.hostUserId, r.match.guestUserId])
      if (uid) await syncAchievements(uid).catch(() => {});
  }
  return NextResponse.json(publicState(r.match));
});
