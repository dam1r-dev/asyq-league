import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { logEvent } from "./log";

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
      const msg = e instanceof Error ? e.message : "";
      const name = e instanceof Error ? e.name : "";
      // Клиенту — только код ошибки; подробности остаются в журнале сервера.
      logEvent("server_error", { name, message: msg.slice(0, 200) });
      if (msg.includes("AUTH_SECRET")) return fail("noSecret", 503);
      if (/prisma|libsql|sqlite|database|ECONN|fetch failed/i.test(name + msg)) return fail("noDb", 503);
      return fail("serverError", 500);
    }
  };
}
