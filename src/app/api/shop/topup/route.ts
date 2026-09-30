import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { award } from "@/lib/coins";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

/**
 * ТЕСТОВЫЙ РЕЖИМ оплаты реальными деньгами: пакет тиынов.
 * Деньги не списываются — сервер проверяет тестовую карту 4242… и начисляет
 * тиыны, как это сделал бы вебхук платёжного провайдера.
 */
const schema = z.object({ itemId: z.string().max(40), card: z.string().max(30) });

export const POST = safe(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  if (!(await rateLimit(`topup:${user.id}`, 20, 3600))) return fail("tooMany", 429);
  // Тестовая карта публична, поэтому пакеты тиынов ограничены суточным лимитом:
  // дорогие костюмы нельзя «накликать» пополнением.
  if (!(await rateLimit(`topup-day:${user.id}`, 3, 86400))) return fail("topupLimit", 429);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");
  const item = getItem(body.itemId);
  if (!item || item.kind !== "coins" || !item.coins || !item.priceKzt) return fail("notForSale");
  if (body.card.replace(/\s/g, "") !== "4242424242424242") return fail("testCard", 402);

  await prisma.purchase.create({ data: { userId: user.id, itemId: `${item.id}#${randomUUID()}`, priceKzt: item.priceKzt, testMode: true } });
  await award(user.id, item.coins, "topup", `topup:${user.id}:${randomUUID()}`);
  return NextResponse.json({ ok: true, coins: item.coins });
});
