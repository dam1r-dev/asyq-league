import "server-only";
import { prisma } from "./prisma";

/**
 * Ограничение частоты запросов. Счётчики лежат в базе, потому что на Vercel
 * каждый запрос может обслуживаться отдельным экземпляром без общей памяти.
 */

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

/** true — запрос разрешён, false — лимит исчерпан. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const now = new Date();
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowSec * 1000);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      // Изредка чистим просроченные счётчики.
      if (Math.random() < 0.02) await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
      return true;
    }
    const updated = await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return updated.count <= limit;
  } catch {
    // База недоступна — сам маршрут всё равно вернёт ошибку.
    return true;
  }
}

/** Проверка по IP: true, если запрос пора отклонить (429). */
export async function limitedByIp(req: Request, name: string, limit: number, windowSec: number) {
  return !(await rateLimit(`${name}:${clientIp(req)}`, limit, windowSec));
}
