import { safe } from "@/lib/api";
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const POST = safe(async () => {
  await destroySession();
  return NextResponse.json({ ok: true });
});
