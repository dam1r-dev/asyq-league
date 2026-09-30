import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { safe } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { award } from "@/lib/coins";

const DEMO_COINS = 1000;

/**
 * Каждому проверяющему — свой временный аккаунт со своими 1000 🪙,
 * чтобы траты одного не опустошали кошелёк другого.
 */
export const POST = safe(async () => {
  const suffix = randomBytes(4).toString("hex");
  const user = await prisma.user.create({
    data: {
      username: `demo_${suffix}`,
      displayName: "Demo",
      // Пароль не выдаётся никому: войти можно только через эту кнопку.
      passwordHash: `!${randomBytes(24).toString("hex")}`,
    },
  });
  await award(user.id, DEMO_COINS, "welcome", `demo-welcome:${user.id}`);
  // Убираем временные аккаунты старше 3 дней.
  await prisma.user
    .deleteMany({
      where: { username: { startsWith: "demo_" }, createdAt: { lt: new Date(Date.now() - 3 * 24 * 3600 * 1000) } },
    })
    .catch(() => {});
  await createSession(user.id);
  return NextResponse.json({ ok: true });
});
