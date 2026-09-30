import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { logEvent } from "./log";
import { prisma } from "./prisma";

/**
 * Простая сессия: подписанный JWT (HS256) в httpOnly-cookie.
 * В токене только id пользователя и версия формата — всё остальное
 * читается из базы, поэтому устаревший токен не ломает страницы.
 */

const PROD = process.env.NODE_ENV === "production";
// Префикс __Host- привязывает cookie к нашему домену (без Domain, только Secure, Path=/).
const COOKIE = PROD ? "__Host-asyq_session" : "asyq_session";
const SESSION_VERSION = 1;
const MAX_AGE = 60 * 60 * 24 * 7;

let warnedShort = false;
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET не задан");
  if (PROD && s.length < 32 && !warnedShort) {
    warnedShort = true;
    logEvent("weak_auth_secret", { length: s.length });
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string, sessionVersion = 0) {
  const token = await new SignJWT({ v: SESSION_VERSION, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: PROD,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  // Через set с maxAge 0: удаление cookie с префиксом __Host- тоже обязано быть Secure.
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: PROD, path: "/", maxAge: 0 });
}

async function readToken(): Promise<{ id: string; sv: number } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.v !== SESSION_VERSION || typeof payload.sub !== "string") return null;
    return { id: payload.sub, sv: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch {
    return null;
  }
}

/** Пользователь сессии; токен, выданный до выхода из аккаунта, не принимается. */
export async function getSessionUser() {
  const t = await readToken();
  if (!t) return null;
  const user = await prisma.user.findUnique({ where: { id: t.id } });
  if (!user || user.sessionVersion !== t.sv) return null;
  return user;
}

export async function getSessionUserId(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null;
}

/** Выход: отзываем все токены пользователя (кроме общего demo — им пользуются несколько человек). */
export async function revokeSessions() {
  const t = await readToken();
  if (!t) return;
  await prisma.user.updateMany({
    where: { id: t.id, username: { not: "demo" }, sessionVersion: t.sv },
    data: { sessionVersion: { increment: 1 } },
  });
}
