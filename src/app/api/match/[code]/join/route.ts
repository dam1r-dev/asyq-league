import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { CODE_RE, cleanName, newToken, seatOf, settleTimeouts } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().max(40), token: z.string().max(60).optional() });

/** Войти в матч по ссылке. Уже вошедший игрок может вернуться со своим секретом. */
export const POST = safe(async (req: Request, ctx: RouteContext<"/api/match/[code]/join">) => {
  const { code } = await ctx.params;
  if (!CODE_RE.test(code)) return fail("matchNotFound", 404);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");
  const found = await prisma.match.findUnique({ where: { code } });
  if (!found) return fail("matchNotFound", 404);
  const m = await settleTimeouts(found);

  const seat = seatOf(m, body.token);
  if (seat !== null) return NextResponse.json({ code, token: body.token, seat });
  if (m.status !== "waiting" || m.guestToken) return fail("matchFull", 409);

  const token = newToken();
  const res = await prisma.match.updateMany({
    where: { id: m.id, status: "waiting", guestToken: null },
    data: {
      guestToken: token,
      guestName: cleanName(body.name, "Player 2"),
      guestUserId: await getSessionUserId(),
      status: "playing",
      lastMoveAt: new Date(),
      version: { increment: 1 },
    },
  });
  if (!res.count) return fail("matchFull", 409);
  return NextResponse.json({ code, token, seat: 1 });
});
