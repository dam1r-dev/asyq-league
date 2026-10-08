import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { award, balance } from "@/lib/coins";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/log";
import { clientIp, limitedByIp, rateLimit } from "@/lib/rateLimit";

const schema = z.object({ username: z.string().trim().toLowerCase().max(40), password: z.string().max(100) });

/** Хэш для несуществующих логинов: bcrypt выполняется всегда, время ответа не выдаёт, есть ли такой пользователь. */
const DUMMY_HASH = bcrypt.hashSync("asyq-dummy-password", 10);

export const POST = safe(async (req: Request) => {
  if (await limitedByIp(req, "login", 15, 600)) return fail("tooMany", 429);
  const body = await parseBody(req, schema);
  if (!body) return fail("enterCredentials");
  // Отдельный лимит на логин против распределённого перебора (общий demo не блокируем).
  if (body.username !== "demo" && !(await rateLimit(`login-user:${body.username}`, 10, 900))) return fail("tooMany", 429);

  const user = await prisma.user.findUnique({ where: { username: body.username } });
  const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    logEvent("auth_fail", { ip: clientIp(req), username: body.username.slice(0, 20) });
    return fail("badCredentials", 401);
  }

  if (user.username === "demo") {
    // Общий тестовый аккаунт: каждый вход пополняет баланс до 1000 🪙.
    // Ключ зависит от баланса и минуты: параллельные входы не начислят дважды.
    const have = await balance(user.id);
    if (have < 1000)
      await award(user.id, 1000 - have, "demo-refill", `demo-refill:${user.id}:${have}:${Math.floor(Date.now() / 60000)}`);
  }
  await createSession(user.id, user.sessionVersion);
  return NextResponse.json({ ok: true });
});
