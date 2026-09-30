import { NextResponse } from "next/server";
import { fail, safe } from "@/lib/api";
import { CODE_RE, publicState, settleTimeouts } from "@/lib/match";
import { prisma } from "@/lib/prisma";

/** Состояние матча. Клиент опрашивает его раз в секунду-две. */
export const GET = safe(async (_req: Request, ctx: RouteContext<"/api/match/[code]">) => {
  const { code } = await ctx.params;
  if (!CODE_RE.test(code)) return fail("matchNotFound", 404);
  const found = await prisma.match.findUnique({ where: { code } });
  if (!found) return fail("matchNotFound", 404);
  const m = await settleTimeouts(found);
  return NextResponse.json(publicState(m), { headers: { "cache-control": "no-store" } });
});
