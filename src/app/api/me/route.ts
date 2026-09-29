import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getItem, isFree } from "@/lib/catalog";
import { serializeMe, ownedItems } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { UNIVERSITIES } from "@/lib/universities";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ me: user ? await serializeMe(user) : null });
  } catch {
    // Нет базы (например, не настроен Turso) — игра работает в гостевом режиме.
    return NextResponse.json({ me: null });
  }
}

const patchSchema = z.object({
  displayName: z.string().trim().min(2).max(20).optional(),
  university: z.enum(UNIVERSITIES).nullable().optional(),
  saqaSkin: z.string().max(40).optional(),
  fieldSkin: z.string().max(40).optional(),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Нужно войти", 401);
  const body = await parseBody(req, patchSchema);
  if (!body) return fail("Некорректные данные");

  // Надеть можно только то, что куплено (или бесплатно) и подходит по типу.
  const owned = await ownedItems(user.id);
  for (const [field, kind] of [
    ["saqaSkin", "saqa"],
    ["fieldSkin", "field"],
  ] as const) {
    const id = body[field];
    if (id === undefined) continue;
    if (getItem(id)?.kind !== kind) return fail("Неизвестный предмет");
    if (!isFree(id) && !owned.has(id)) return fail("Предмет не куплен", 403);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: body });
  return NextResponse.json({ me: await serializeMe(updated) });
}
