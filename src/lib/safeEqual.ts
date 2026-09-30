import { timingSafeEqual } from "node:crypto";

/** Сравнение секретов за постоянное время (не выдаёт, сколько первых символов совпало). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
