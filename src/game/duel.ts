import { DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import { challengeToLevel, decodeChallenge } from "./custom";
import { applyThrow, initRound } from "./round";
import type { LevelDef, RoundState, ThrowInput, ThrowResult } from "./types";

/** Классика: у каждого по 8 бросков за раунд. */
export const DUEL_THROWS_EACH = 8;

/**
 * Режимы дуэли:
 *  • classic — выбил асык (и сақа не осталась в коне) — получаешь ещё один бросок;
 *  • five — «пятёрки»: у каждого по 5 бросков за раунд, без дополнительных бросков.
 */
export type DuelMode = "classic" | "five";
export const DUEL_MODES: DuelMode[] = ["classic", "five"];
export const THROWS_BY_MODE: Record<DuelMode, number> = { classic: DUEL_THROWS_EACH, five: 5 };

export const MAX_PER_TURN = 5;
export const MAX_ROUNDS = 5;

export interface DuelConfig {
  mode: DuelMode;
  /** Сколько бросков подряд делает игрок за один ход (1–5). */
  perTurn: number;
  /** Раунды матча: код своего поля из редактора или null — стандартное поле. */
  rounds: (string | null)[];
}

export const DEFAULT_DUEL_CONFIG: DuelConfig = { mode: "classic", perTurn: 1, rounds: [null] };

/**
 * Приводит любые данные (в том числе сохранённые старой версией, где было
 * одно поле `field`) к корректным настройкам. Битые коды полей → стандартное поле.
 */
export function normalizeDuelConfig(raw: unknown): DuelConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const mode: DuelMode = r.mode === "five" ? "five" : "classic";
  const perTurn = Math.min(MAX_PER_TURN, Math.max(1, Math.round(Number(r.perTurn)) || 1));
  let list: unknown[] = Array.isArray(r.rounds) ? r.rounds : typeof r.field === "string" ? [r.field] : [null];
  list = list.slice(0, MAX_ROUNDS);
  const rounds = list.map((x) => (typeof x === "string" && x && duelLevel(x) ? x : null));
  return { mode, perTurn, rounds: rounds.length ? rounds : [null] };
}

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

/** Проверка настроек от клиента (строгая: ничего не «чиним» молча). */
export function isValidDuelConfig(c: DuelConfig) {
  return (
    DUEL_MODES.includes(c.mode) &&
    Number.isInteger(c.perTurn) &&
    c.perTurn >= 1 &&
    c.perTurn <= MAX_PER_TURN &&
    c.rounds.length >= 1 &&
    c.rounds.length <= MAX_ROUNDS &&
    c.rounds.every((f) => duelLevel(f) !== null)
  );
}

export interface DuelState {
  names: [string, string];
  config: DuelConfig;
  field: RoundState;
  /** Номер текущего раунда (с 0) и их общее число. */
  round: number;
  roundsTotal: number;
  turn: 0 | 1;
  /** Сколько бросков осталось игроку в текущем ходе. */
  turnLeft: number;
  /** Очки за весь матч. */
  scores: [number, number];
  /** Сколько бросков осталось в текущем раунде. */
  throwsLeft: [number, number];
  /** Сколько бросков у каждого было в начале раунда. */
  throwsEach: number;
  status: "playing" | "finished";
  winner: 0 | 1 | "draw" | null;
  last: { player: 0 | 1; result: ThrowResult; extraTurn: boolean; roundOver: boolean } | null;
}

function startRound(config: DuelConfig, index: number) {
  const level = duelLevel(config.rounds[index]) ?? DUEL_LEVEL;
  const throwsEach = THROWS_BY_MODE[config.mode] ?? DUEL_THROWS_EACH;
  // Начинающий игрок чередуется: в нечётных раундах первым бросает второй.
  const turn = (index % 2) as 0 | 1;
  return { field: initRound(level), throwsEach, turn, turnLeft: Math.min(config.perTurn, throwsEach) };
}

export function initDuel(names: [string, string], config: DuelConfig = DEFAULT_DUEL_CONFIG): DuelState {
  const r = startRound(config, 0);
  return {
    names,
    config,
    field: r.field,
    round: 0,
    roundsTotal: config.rounds.length,
    turn: r.turn,
    turnLeft: r.turnLeft,
    scores: [0, 0],
    throwsLeft: [r.throwsEach, r.throwsEach],
    throwsEach: r.throwsEach,
    status: "playing",
    winner: null,
    last: null,
  };
}

/**
 * Правила дуэли (как во дворе):
 *  • игроки бросают по очереди с одной линии по общему кону; за один ход
 *    игрок делает несколько бросков подряд (настройка 1–5);
 *  • выбитые асыки забирает тот, кто их выбил (+1, комбо-бонус, штраф −1);
 *  • классика: выбил хотя бы один и сақа не осталась в коне — получаешь ещё один бросок;
 *  • раунд заканчивается, когда кон пуст или у обоих закончились броски;
 *  • матч может состоять из нескольких раундов (у каждого своё поле), очки суммируются.
 */
export function duelThrow(state: DuelState, input: ThrowInput): DuelState {
  if (state.status !== "playing") return state;
  const player = state.turn;
  const { state: field, result } = applyThrow(state.field, input);

  const scores: [number, number] = [...state.scores];
  scores[player] = Math.max(0, scores[player] + result.points);
  const throwsLeft: [number, number] = [...state.throwsLeft];
  throwsLeft[player] -= 1;

  const bonus = state.config.mode === "classic" && result.knockedIds.length > 0 && !result.saqaInKon;
  const turnLeft = state.turnLeft - 1 + (bonus ? 1 : 0);

  const roundOver = field.asyks.length === 0 || (throwsLeft[0] === 0 && throwsLeft[1] === 0);
  const base = { ...state, scores };

  if (roundOver) {
    if (state.round + 1 < state.roundsTotal) {
      const next = startRound(state.config, state.round + 1);
      return {
        ...base,
        field: next.field,
        round: state.round + 1,
        throwsEach: next.throwsEach,
        throwsLeft: [next.throwsEach, next.throwsEach],
        turn: next.turn,
        turnLeft: next.turnLeft,
        status: "playing",
        winner: null,
        last: { player, result, extraTurn: false, roundOver: true },
      };
    }
    return {
      ...base,
      field,
      throwsLeft,
      turnLeft: 0,
      status: "finished",
      winner: scores[0] === scores[1] ? "draw" : scores[0] > scores[1] ? 0 : 1,
      last: { player, result, extraTurn: false, roundOver: true },
    };
  }

  const other = (1 - player) as 0 | 1;
  let turn: 0 | 1 = player;
  let left = Math.min(turnLeft, throwsLeft[player]);
  if (left <= 0) {
    turn = throwsLeft[other] > 0 ? other : player;
    left = Math.min(state.config.perTurn, throwsLeft[turn]);
  }
  return {
    ...base,
    field,
    throwsLeft,
    turn,
    turnLeft: left,
    last: { player, result, extraTurn: turn === player, roundOver: false },
  };
}
