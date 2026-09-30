import { DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import { challengeToLevel, decodeChallenge } from "./custom";
import { applyThrow, initRound } from "./round";
import type { LevelDef, RoundState, ThrowInput, ThrowResult } from "./types";

/** Классика: у каждого по 8 бросков. */
export const DUEL_THROWS_EACH = 8;

/**
 * Режимы дуэли:
 *  • classic — выбил асык (и сақа не осталась в коне) — бросаешь ещё раз;
 *  • five — «пятёрки»: у каждого по 5 бросков, ходы строго по очереди.
 */
export type DuelMode = "classic" | "five";
export const DUEL_MODES: DuelMode[] = ["classic", "five"];
export const THROWS_BY_MODE: Record<DuelMode, number> = { classic: DUEL_THROWS_EACH, five: 5 };

export interface DuelConfig {
  mode: DuelMode;
  /** Код своего поля из редактора (как в ссылке /c/CODE) или null — стандартное поле. */
  field: string | null;
}

export const DEFAULT_DUEL_CONFIG: DuelConfig = { mode: "classic", field: null };

export const DUEL_LEVEL: LevelDef = {
  id: "duel",
  title: "Екеуара",
  subtitle: "Дуэль на одном устройстве",
  kon: DEFAULT_KON,
  lineY: DEFAULT_LINE_Y,
  asyks: Array.from({ length: 11 }, (_, i) => ({ x: 200 - 5 * 23 + i * 23, y: 250 })),
  stones: [],
  // Лимит поля не используется — у каждого игрока свой лимит бросков.
  throws: 999,
  par3: 999,
  par2: 999,
};

const levelCache = new Map<string, LevelDef | null>();

/** Поле дуэли: своё из редактора или стандартное. Битый код → null. */
export function duelLevel(field: string | null | undefined): LevelDef | null {
  if (!field) return DUEL_LEVEL;
  if (levelCache.has(field)) return levelCache.get(field) ?? null;
  const c = decodeChallenge(field);
  const level = c ? { ...challengeToLevel(c), id: "duel", throws: 999, par3: 999, par2: 999 } : null;
  if (levelCache.size > 50) levelCache.clear();
  levelCache.set(field, level);
  return level;
}

/** Проверка настроек от клиента. */
export function isValidDuelConfig(c: DuelConfig) {
  return DUEL_MODES.includes(c.mode) && duelLevel(c.field) !== null;
}

export interface DuelState {
  names: [string, string];
  config: DuelConfig;
  field: RoundState;
  turn: 0 | 1;
  scores: [number, number];
  throwsLeft: [number, number];
  /** Сколько бросков у каждого было в начале. */
  throwsEach: number;
  status: "playing" | "finished";
  winner: 0 | 1 | "draw" | null;
  last: { player: 0 | 1; result: ThrowResult; extraTurn: boolean } | null;
}

export function initDuel(names: [string, string], config: DuelConfig = DEFAULT_DUEL_CONFIG): DuelState {
  const level = duelLevel(config.field) ?? DUEL_LEVEL;
  const throwsEach = THROWS_BY_MODE[config.mode] ?? DUEL_THROWS_EACH;
  return {
    names,
    config,
    field: initRound(level),
    turn: 0,
    scores: [0, 0],
    throwsLeft: [throwsEach, throwsEach],
    throwsEach,
    status: "playing",
    winner: null,
    last: null,
  };
}

/**
 * Правила дуэли (как во дворе):
 *  • игроки бросают по очереди с одной линии по общему кону;
 *  • выбитые асыки забирает тот, кто их выбил (+1, комбо-бонус, штраф −1);
 *  • классика: выбил хотя бы один и сақа не осталась в коне — бросаешь ещё раз;
 *  • «пятёрки»: каждый бросает по 5 раз, ход всегда переходит к сопернику;
 *  • игра заканчивается, когда кон пуст или у обоих закончились броски.
 */
export function duelThrow(state: DuelState, input: ThrowInput): DuelState {
  if (state.status !== "playing") return state;
  const player = state.turn;
  const { state: field, result } = applyThrow(state.field, input);

  const scores: [number, number] = [...state.scores];
  scores[player] = Math.max(0, scores[player] + result.points);
  const throwsLeft: [number, number] = [...state.throwsLeft];
  throwsLeft[player] -= 1;

  const earnedExtra = state.config.mode === "classic" && result.knockedIds.length > 0 && !result.saqaInKon;
  const other = (1 - player) as 0 | 1;
  let turn: 0 | 1 = player;
  if (!earnedExtra || throwsLeft[player] === 0) turn = throwsLeft[other] > 0 ? other : player;
  const extraTurn = turn === player && earnedExtra && throwsLeft[player] > 0;

  const finished = field.asyks.length === 0 || (throwsLeft[0] === 0 && throwsLeft[1] === 0);
  return {
    ...state,
    field,
    scores,
    throwsLeft,
    turn,
    status: finished ? "finished" : "playing",
    winner: finished ? (scores[0] === scores[1] ? "draw" : scores[0] > scores[1] ? 0 : 1) : null,
    last: { player, result, extraTurn },
  };
}
