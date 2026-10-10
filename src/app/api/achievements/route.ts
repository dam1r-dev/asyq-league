import { NextResponse } from "next/server";
import { fail, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { syncAchievements } from "@/lib/achievementsServer";
import { rateLimit } from "@/lib/rateLimit";

/** Список достижений игрока; заодно выдаёт новые (например, за победу в дуэли). */
export const GET = safe(async () => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  if (!(await rateLimit(`ach:${user.id}`, 30, 60))) return fail("tooMany", 429);
  return NextResponse.json(await syncAchievements(user.id));
});
