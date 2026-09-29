import "server-only";
import { z } from "zod";
import { almatyDayKey, dailyLevel, isDayKey } from "@/game/daily";
import { getLevel } from "@/game/levels";
import { isValidInput, replayRound } from "@/game/round";
import type { LevelDef } from "@/game/types";

export const inputSchema = z.object({
  sx: z.number().finite(),
  vx: z.number().finite(),
  vy: z.number().finite(),
});

export const attemptSchema = z.object({
  kind: z.enum(["level", "daily"]),
  levelId: z.string().max(40),
  dayKey: z.string().optional(),
  inputs: z.array(inputSchema).min(1).max(20),
});

export type AttemptBody = z.infer<typeof attemptSchema>;

/**
 * Античит: клиент присылает только броски, сервер сам проигрывает раунд
 * тем же детерминированным движком. Очки, звёзды и победа — только отсюда.
 */
export function verifyAttempt(body: AttemptBody, owned: Set<string>):
  | { ok: true; level: LevelDef; dayKey: string | null; state: ReturnType<typeof replayRound> }
  | { ok: false; error: string } {
  let level: LevelDef | undefined;
  let dayKey: string | null = null;

  if (body.kind === "daily") {
    if (!body.dayKey || !isDayKey(body.dayKey)) return { ok: false, error: "badDay" };
    // Засчитываем только сегодняшний турнир: вчерашний уже закрыт и награждён.
    if (body.dayKey !== almatyDayKey()) return { ok: false, error: "dayClosed" };
    dayKey = body.dayKey;
    level = dailyLevel(dayKey);
  } else {
    level = getLevel(body.levelId);
    if (!level) return { ok: false, error: "noLevel" };
    if (level.pack && !owned.has("pack-legends")) return { ok: false, error: "packNotOwned" };
  }

  if (body.inputs.length > level.throws) return { ok: false, error: "tooManyThrows" };
  if (!body.inputs.every((i) => isValidInput(level!, i))) return { ok: false, error: "badThrow" };

  const state = replayRound(level, body.inputs);
  if (state.status === "playing") return { ok: false, error: "notFinished" };
  if (state.throwsUsed !== body.inputs.length) return { ok: false, error: "extraThrows" };
  return { ok: true, level, dayKey, state };
}
