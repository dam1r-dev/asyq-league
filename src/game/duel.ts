import { DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import { applyThrow, initRound } from "./round";
import type { LevelDef, RoundState, ThrowInput, ThrowResult } from "./types";

export const DUEL_THROWS_EACH = 8;

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

export interface DuelState {
  names: [string, string];
  field: RoundState;
  turn: 0 | 1;
  scores: [number, number];
  throwsLeft: [number, number];
  status: "playing" | "finished";
  winner: 0 | 1 | "draw" | null;
  last: { player: 0 | 1; result: ThrowResult; extraTurn: boolean } | null;
}

export function initDuel(names: [string, string]): DuelState {
  return {
    names,
    field: initRound(DUEL_LEVEL),
    turn: 0,
    scores: [0, 0],
    throwsLeft: [DUEL_THROWS_EACH, DUEL_THROWS_EACH],
    status: "playing",
    winner: null,
    last: null,
  };
}

/**
 * Правила дуэли (как во дворе):
 *  • игроки бросают по очереди с одной линии по общему кону;
 *  • выбитые асыки забирает тот, кто их выбил (+1, комбо-бонус, штраф −1);
 *  • выбил хотя бы один и сақа не осталась в коне — бросаешь ещё раз;
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

  const earnedExtra = result.knockedIds.length > 0 && !result.saqaInKon;
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
