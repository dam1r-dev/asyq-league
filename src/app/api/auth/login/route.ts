import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { award, balance } from "@/lib/coins";
import { prisma } from "@/lib/prisma";

const schema = z.object({ username: z.string().trim().toLowerCase().max(40), password: z.string().max(100) });

export const POST = safe(async (req: Request) => {
  const body = await parseBody(req, schema);
  if (!body) return fail("enterCredentials");
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return fail("badCredentials", 401);
  if (user.username === "demo") {
    // Общий тестовый аккаунт: каждый вход пополняет баланс до 1000 🪙.
    const have = await balance(user.id);
    if (have < 1000) await award(user.id, 1000 - have, "topup", `demo-refill:${user.id}:${Date.now()}`);
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
});
