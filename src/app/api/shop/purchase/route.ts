import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { balance } from "@/lib/coins";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/game/levels";

/**
 * Покупка предмета за тиыны. Ни один предмет не влияет на физику и очки.
 * Купленный скин или элемент одежды сразу надевается.
 */
const schema = z.object({ itemId: z.string().max(40) });

export const POST = safe(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  const body = await parseBody(req, schema);
  if (!body) return fail("badData");

  const item = getItem(body.itemId);
  if (!item || item.price <= 0 || item.kind === "coins") return fail("notForSale");
  const owned = await prisma.purchase.findUnique({ where: { userId_itemId: { userId: user.id, itemId: item.id } } });
  if (owned) return NextResponse.json({ ok: true, itemId: item.id });
  if (item.requiresStars) {
    // Сумма лучших звёзд по 12 основным испытаниям.
    const best = await prisma.attempt.groupBy({
      by: ["levelId"],
      where: { userId: user.id, kind: "level", levelId: { in: LEVELS.map((l) => l.id) } },
      _max: { stars: true },
    });
    const stars = best.reduce((sum, b) => sum + (b._max.stars ?? 0), 0);
    if (stars < item.requiresStars) return fail("notEnoughStars", 403);
  }
  if ((await balance(user.id)) < item.price) return fail("notEnoughCoins", 402);

  await prisma.$transaction([
    prisma.purchase.create({ data: { userId: user.id, itemId: item.id, priceKzt: item.price, testMode: false } }),
    prisma.coinTx.create({
      data: { userId: user.id, amount: -item.price, reason: "purchase", refKey: `purchase:${user.id}:${item.id}` },
    }),
  ]);
  if (item.kind === "saqa") await prisma.user.update({ where: { id: user.id }, data: { saqaSkin: item.id } });
  if (item.kind === "field") await prisma.user.update({ where: { id: user.id }, data: { fieldSkin: item.id } });
  return NextResponse.json({ ok: true, itemId: item.id });
});
