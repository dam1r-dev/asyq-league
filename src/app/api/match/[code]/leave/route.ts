import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { CODE_RE, publicState, seatOf } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().max(60) });

/** Сдаться или закрыть ожидающий матч. Соперник побеждает. */
export const POST = safe(async (req: Request, ctx: RouteContext<"/api/match/[code]/leave">) => {
  const { code } = await ctx.params;
  if (!CODE_RE.test(code)) return fail("matchNotFound", 404);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");
  const m = await prisma.match.findUnique({ where: { code } });
  if (!m) return fail("matchNotFound", 404);
  const seat = seatOf(m, body.token);
  if (seat === null) return fail("notInMatch", 403);
  if (m.status === "finished") return NextResponse.json(publicState(m));

  const updated = await prisma.match.update({
    where: { id: m.id },
    data: {
      status: "finished",
      endReason: m.status === "waiting" ? "expired" : "left",
      winner: m.status === "waiting" ? null : seat === 0 ? 1 : 0,
      version: { increment: 1 },
    },
  });
  return NextResponse.json(publicState(updated));
});
