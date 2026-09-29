import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T | null> {
  try {
    const parsed = schema.safeParse(await req.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
