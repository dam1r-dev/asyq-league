import "server-only";

/**
 * Структурные журналы безопасности: одна JSON-строка на событие, Vercel Logs
 * позволяет искать их по `event`. Пароли, токены и cookie сюда не попадают.
 */
export function logEvent(event: string, data: Record<string, string | number | boolean | null | undefined> = {}) {
  console.warn(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}
