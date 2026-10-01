import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { isValidDuelConfig, MAX_PER_TURN, MAX_ROUNDS } from "@/game/duel";
import { getSessionUserId } from "@/lib/auth";
import { cleanName, newCode, newToken } from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { limitedByIp } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().max(40),
  mode: z.enum(["classic", "five"]).default("classic"),
  perTurn: z.number().int().min(1).max(MAX_PER_TURN).default(1),
  /** Коды своих полей из редактора (null — стандартное поле); сервер сам проверяет расстановки. */
  rounds: z.array(z.string().max(1500).nullable()).min(1).max(MAX_ROUNDS).optional(),
  /** Старый клиент присылал одно поле. */
  field: z.string().max(1500).nullish(),
});

/** Создать онлайн-дуэль. Возвращает код для ссылки и секрет хозяина. */
export const POST = safe(async (req: Request) => {
  if (await limitedByIp(req, "match-create", 30, 3600)) return fail("tooMany", 429);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");

  const rounds = (body.rounds ?? [body.field || null]).map((f) => f || null);
  if (!isValidDuelConfig({ mode: body.mode, perTurn: body.perTurn, rounds })) return fail("badField");

  // Заодно чистим старые матчи, чтобы таблица не росла.
  await prisma.match.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } });

  const token = newToken();
  const userId = await getSessionUserId();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const m = await prisma.match.create({
        data: {
          code: newCode(),
          hostName: cleanName(body.name, "Player 1"),
          mode: body.mode,
          perTurn: body.perTurn,
          rounds: JSON.stringify(rounds),
          hostToken: token,
          hostUserId: userId,
        },
      });
      return NextResponse.json({ code: m.code, token, seat: 0 });
    } catch {
      // Код уже занят — пробуем другой.
    }
  }
  return fail("noDb", 503);
});
