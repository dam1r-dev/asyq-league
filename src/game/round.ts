import { ASYK_R, MAX_STEPS, SAQA_R, THROW_SPREAD, V_MAX } from "./constants";
import { createWorld, getSaqa, isAtRest, stepWorld, type World } from "./physics";
import { hashString } from "./rng";
import type {
  AsykSide,
  AsykState,
  LevelDef,
  RoundState,
  ThrowInput,
  ThrowResult,
} from "./types";

const SIDES: AsykSide[] = ["алшы", "тәйкі", "бүк", "шік"];

export function initRound(level: LevelDef): RoundState {
  return {
    level,
    asyks: level.asyks.map((p, i) => ({ id: i + 1, x: p.x, y: p.y })),
    throwsUsed: 0,
    score: 0,
    knocked: 0,
    history: [],
    status: "playing",
    finishBonus: 0,
    stars: 0,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Приводим ввод к каноническому виду: округление + ограничения. */
export function normalizeInput(level: LevelDef, raw: ThrowInput): ThrowInput {
  const minX = Math.max(SAQA_R + 4, level.kon.x - THROW_SPREAD);
  const maxX = Math.min(400 - SAQA_R - 4, level.kon.x + THROW_SPREAD);
  const sx = Math.round(Math.min(maxX, Math.max(minX, raw.sx)) * 10) / 10;
  let vx = raw.vx;
  let vy = Math.min(raw.vy, -1); // бросать можно только вперёд
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > V_MAX) {
    vx = (vx / speed) * V_MAX;
    vy = (vy / speed) * V_MAX;
  }
  return { sx, vx: round2(vx), vy: round2(vy) };
}

export function isValidInput(level: LevelDef, input: ThrowInput) {
  const n = normalizeInput(level, input);
  // Допускаем погрешность округления при ограничении скорости.
  return (
    Math.abs(n.sx - input.sx) < 1e-9 &&
    Math.abs(n.vx - input.vx) < 0.011 &&
    Math.abs(n.vy - input.vy) < 0.011
  );
}

export function inputPower(input: ThrowInput) {
  return Math.min(1, Math.sqrt(input.vx * input.vx + input.vy * input.vy) / V_MAX);
}

export function startThrow(state: RoundState, input: ThrowInput): World {
  return createWorld(state.asyks, state.level.stones, state.level.lineY, input);
}

/** Прогоняет симуляцию до полной остановки всех тел. */
export function runToRest(world: World) {
  while (!isAtRest(world) && world.step < MAX_STEPS) stepWorld(world);
}

function distToKon(level: LevelDef, x: number, y: number) {
  const dx = x - level.kon.x;
  const dy = y - level.kon.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Итог броска, когда всё остановилось:
 *  • асык полностью за меловой линией кона — выбит (+1), убирается с поля;
 *  • выбил несколько за один бросок — бонус +1 за каждый сверх первого;
 *  • сақа осталась внутри кона — штраф −1.
 * Выбитый асык навсегда удаляется из состояния, поэтому очки за него
 * невозможно получить второй раз.
 */
export function resolveThrow(
  state: RoundState,
  world: World,
  input: ThrowInput,
): { state: RoundState; result: ThrowResult } {
  const { level } = state;
  const remaining: AsykState[] = [];
  const knockedIds: number[] = [];
  for (const b of world.bodies) {
    if (b.kind !== "asyk") continue;
    if (distToKon(level, b.x, b.y) >= level.kon.r + ASYK_R) knockedIds.push(b.id);
    else remaining.push({ id: b.id, x: b.x, y: b.y });
  }

  const saqa = getSaqa(world);
  const saqaInKon = distToKon(level, saqa.x, saqa.y) < level.kon.r;
  const n = knockedIds.length;
  const comboBonus = n > 1 ? n - 1 : 0;
  const penalty = saqaInKon ? 1 : 0;
  const points = n + comboBonus - penalty;

  const throwIndex = state.throwsUsed;
  const sides = knockedIds.map(
    (id) => SIDES[hashString(`${level.id}:${throwIndex}:${id}`) % SIDES.length],
  );

  const result: ThrowResult = {
    input,
    power: inputPower(input),
    knockedIds,
    sides,
    hit: world.saqaTouched.size > 0,
    saqaInKon,
    points,
    comboBonus,
    penalty,
  };

  const throwsUsed = state.throwsUsed + 1;
  let score = Math.max(0, state.score + points);
  let status: RoundState["status"] = "playing";
  let finishBonus = 0;
  let stars: RoundState["stars"] = 0;
  if (remaining.length === 0) {
    status = "won";
    finishBonus = (level.throws - throwsUsed) * 2;
    score += finishBonus;
    stars = throwsUsed <= level.par3 ? 3 : throwsUsed <= level.par2 ? 2 : 1;
  } else if (throwsUsed >= level.throws) {
    status = "lost";
  }

  return {
    result,
    state: {
      ...state,
      asyks: remaining,
      throwsUsed,
      score,
      knocked: state.knocked + n,
      history: [...state.history, result],
      status,
      finishBonus,
      stars,
    },
  };
}

/** Бросок целиком, без анимации. */
export function applyThrow(state: RoundState, rawInput: ThrowInput) {
  if (state.status !== "playing") throw new Error("Раунд уже завершён");
  const input = normalizeInput(state.level, rawInput);
  const world = startThrow(state, input);
  runToRest(world);
  return resolveThrow(state, world, input);
}

/**
 * Восстанавливает раунд по списку бросков. Так работает и сохранение
 * прогресса (храним только броски), и серверная проверка результата.
 */
export function replayRound(level: LevelDef, inputs: ThrowInput[]) {
  let state = initRound(level);
  for (const input of inputs) {
    if (state.status !== "playing") break;
    state = applyThrow(state, input).state;
  }
  return state;
}
