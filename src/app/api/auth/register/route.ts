import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UNIVERSITIES } from "@/lib/universities";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Логин: 3–20 символов, латиница, цифры и _"),
  password: z.string().min(6, "Пароль — минимум 6 символов").max(100),
  displayName: z.string().trim().min(2, "Имя — минимум 2 символа").max(20),
  university: z.enum(UNIVERSITIES).optional(),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Проверьте поля");
  const { username, password, displayName, university } = parsed.data;

  if (await prisma.user.findUnique({ where: { username } })) return fail("Такой логин уже занят", 409);
  const user = await prisma.user.create({
    data: { username, displayName, university, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}

