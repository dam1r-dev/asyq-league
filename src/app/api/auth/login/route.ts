import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody, safe } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ username: z.string().trim().toLowerCase().max(40), password: z.string().max(100) });

export const POST = safe(async (req: Request) => {
  const body = await parseBody(req, schema);
  if (!body) return fail("Введите логин и пароль");
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return fail("Неверный логин или пароль", 401);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
});
