import { safe } from "@/lib/api";
import { NextResponse } from "next/server";
import { destroySession, revokeSessions } from "@/lib/auth";

export const POST = safe(async () => {
  await revokeSessions();
  await destroySession();
  return NextResponse.json({ ok: true });
});
