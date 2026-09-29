import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, safe } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UNIVERSITIES } from "@/lib/universities";
import { award, REWARDS } from "@/lib/coins";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "badUsername"),
  password: z.string().min(6, "shortPassword").max(100),
  displayName: z.string().trim().min(2, "shortName").max(20),
  university: z.enum(UNIVERSITIES).optional(),
});

export const POST = safe(async (req: Request) => {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "checkFields");
  const { username, password, displayName, university } = parsed.data;

  if (await prisma.user.findUnique({ where: { username } })) return fail("usernameTaken", 409);
  const user = await prisma.user.create({
    data: { username, displayName, university, passwordHash: await bcrypt.hash(password, 10) },
  });
  // Приветственные тиыны — чтобы сразу было что примерить в магазине.
  await award(user.id, REWARDS.welcome, "welcome", `welcome:${user.id}`);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
});
