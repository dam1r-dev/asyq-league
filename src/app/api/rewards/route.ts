import { NextResponse } from "next/server";
import { fail, safe } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { claimDailyRewards } from "@/lib/coins";

/** Забрать награды за места в прошедших турнирах дня. */
export const POST = safe(async () => {
  const user = await getSessionUser();
  if (!user) return fail("needLogin", 401);
  return NextResponse.json({ claimed: await claimDailyRewards(user.id) });
});
