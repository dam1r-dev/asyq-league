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

/**
 * Оборачивает обработчик: любая неожиданная ошибка (нет базы, не задан
 * AUTH_SECRET) превращается в понятный JSON-ответ, а не в пустой 500.
 */
export function safe<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("AUTH_SECRET")) return fail("noSecret", 503);
      return fail("noDb", 503);
    }
  };
}
