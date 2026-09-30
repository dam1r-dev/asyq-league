import "server-only";
import { randomBytes } from "node:crypto";
import { DUEL_LEVEL, duelThrow, initDuel, type DuelState } from "@/game/duel";
import { isValidInput } from "@/game/round";
import type { ThrowInput } from "@/game/types";
import type { Match } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { safeEqual } from "./safeEqual";

/** Сколько секунд даётся на ход. Потом засчитывается поражение по неявке. */
export const TURN_SECONDS = 90;
/** Ожидание соперника: через полчаса ссылка перестаёт работать. */
export const WAIT_MINUTES = 30;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // без похожих 0/O, 1/I/L
export const CODE_RE = /^[A-Z0-9]{6}$/;

export function newCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export const newToken = () => randomBytes(18).toString("base64url");

export function cleanName(raw: string, fallback: string) {
  const s = raw.replace(/\s+/g, " ").trim().slice(0, 16);
  return s || fallback;
}

export function parseInputs(m: Pick<Match, "inputs">): ThrowInput[] {
  try {
    return JSON.parse(m.inputs) as ThrowInput[];
  } catch {
    return [];
  }
}

/** Проигрывает все броски: точно так же это делает и браузер. */
export function replayDuel(names: [string, string], inputs: ThrowInput[]): DuelState {
  return inputs.reduce((d, i) => duelThrow(d, i), initDuel(names));
}

export function seatOf(m: Match, token: string | undefined | null): 0 | 1 | null {
  if (!token) return null;
  if (safeEqual(token, m.hostToken)) return 0;
  if (safeEqual(token, m.guestToken)) return 1;
  return null;
}

/** Публичное состояние матча: без токенов игроков. */
export function publicState(m: Match) {
  return {
    code: m.code,
    status: m.status,
    hostName: m.hostName,
    guestName: m.guestName,
    inputs: parseInputs(m),
    winner: m.winner,
    endReason: m.endReason,
    lastMoveAt: m.lastMoveAt.getTime(),
    now: Date.now(),
    turnSeconds: TURN_SECONDS,
  };
}

/**
 * Ленивая проверка тайм-аута: любой опрос состояния закрывает матч, если
 * игрок, чей сейчас ход, молчит дольше TURN_SECONDS. Отдельных фоновых
 * задач не нужно.
 */
export async function settleTimeouts(m: Match): Promise<Match> {
  const now = Date.now();
  if (m.status === "playing" && now - m.lastMoveAt.getTime() > (TURN_SECONDS + 3) * 1000) {
    const duel = replayDuel([m.hostName, m.guestName ?? ""], parseInputs(m));
    if (duel.status === "playing") {
      const loser = duel.turn;
      const res = await prisma.match.updateMany({
        where: { id: m.id, version: m.version },
        data: { status: "finished", winner: loser === 0 ? 1 : 0, endReason: "timeout", version: { increment: 1 } },
      });
      if (res.count) return (await prisma.match.findUnique({ where: { id: m.id } })) ?? m;
    }
  }
  if (m.status === "waiting" && now - m.createdAt.getTime() > WAIT_MINUTES * 60 * 1000) {
    await prisma.match.updateMany({
      where: { id: m.id, status: "waiting" },
      data: { status: "finished", winner: null, endReason: "expired", version: { increment: 1 } },
    });
    return (await prisma.match.findUnique({ where: { id: m.id } })) ?? m;
  }
  return m;
}

/** Применить бросок игрока: проверка очереди, честности и записи. */
export async function applyMatchThrow(
  m: Match,
  seat: 0 | 1,
  input: ThrowInput,
  expected: number,
): Promise<{ ok: true; match: Match } | { ok: false; error: string; status: number }> {
  if (m.status !== "playing") return { ok: false, error: "matchNotActive", status: 409 };
  const inputs = parseInputs(m);
  if (inputs.length !== expected) return { ok: false, error: "stale", status: 409 };
  if (!isValidInput(DUEL_LEVEL, input)) return { ok: false, error: "badThrow", status: 400 };

  const duel = replayDuel([m.hostName, m.guestName ?? ""], inputs);
  if (duel.status !== "playing") return { ok: false, error: "matchNotActive", status: 409 };
  if (duel.turn !== seat) return { ok: false, error: "notYourTurn", status: 403 };

  const next = duelThrow(duel, input);
  const finished = next.status === "finished";
  const res = await prisma.match.updateMany({
    where: { id: m.id, version: m.version },
    data: {
      inputs: JSON.stringify([...inputs, input]),
      version: { increment: 1 },
      lastMoveAt: new Date(),
      ...(finished
        ? { status: "finished", endReason: "played", winner: next.winner === "draw" ? -1 : (next.winner as number) }
        : {}),
    },
  });
  if (!res.count) return { ok: false, error: "stale", status: 409 };
  return { ok: true, match: (await prisma.match.findUniqueOrThrow({ where: { id: m.id } })) };
}
