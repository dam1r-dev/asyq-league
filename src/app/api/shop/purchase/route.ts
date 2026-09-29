import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

/**
 * ТЕСТОВЫЙ РЕЖИМ. Деньги не списываются: сервер лишь проверяет тестовую
 * карту 4242 4242 4242 4242 и выдаёт предмет, как это сделал бы настоящий
 * платёжный вебхук. Ни один предмет не влияет на физику и очки.
 */
const schema = z.object({
  itemId: z.string().max(40),
  card: z.string().max(30),
});

export const POST = safe(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) return fail("Нужно войти", 401);
  const body = await parseBody(req, schema);
  if (!body) return fail("Некорректные данные");

  const item = getItem(body.itemId);
  if (!item || item.priceKzt === 0) return fail("Этот предмет нельзя купить");
  if (body.card.replace(/\s/g, "") !== "4242424242424242")
    return fail("Тестовый режим: используйте карту 4242 4242 4242 4242", 402);

  await prisma.purchase.upsert({
    where: { userId_itemId: { userId: user.id, itemId: item.id } },
    update: {},
    create: { userId: user.id, itemId: item.id, priceKzt: item.priceKzt, testMode: true },
  });
  // Купленный скин сразу надеваем — пользователь видит результат покупки.
  if (item.kind === "saqa") await prisma.user.update({ where: { id: user.id }, data: { saqaSkin: item.id } });
  if (item.kind === "field") await prisma.user.update({ where: { id: user.id }, data: { fieldSkin: item.id } });
  return NextResponse.json({ ok: true, itemId: item.id });
});
