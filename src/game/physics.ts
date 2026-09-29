import {
  ASYK_FRICTION,
  ASYK_MASS,
  ASYK_R,
  DT,
  RESTITUTION,
  SAQA_FRICTION,
  SAQA_MASS,
  SAQA_R,
  STONE_RESTITUTION,
} from "./constants";
import type { AsykState, Body, CollisionEvent, Stone, ThrowInput } from "./types";

/**
 * Небольшой детерминированный физический движок для кругов на плоскости
 * (вид сверху). Используются только + − × ÷ и Math.sqrt — они по стандарту
 * IEEE 754 дают одинаковый результат в любом браузере и в Node.js, поэтому
 * сервер может пересчитать бросок и получить ровно те же очки, что и игрок.
 * (Math.sin/cos/atan2 такой гарантии не дают, поэтому их здесь нет.)
 */

export const SAQA_ID = 0;
const STONE_ID_BASE = 1000;

export interface World {
  bodies: Body[];
  step: number;
  /** Id асыков, которых коснулась сақа за этот бросок. */
  saqaTouched: Set<number>;
}

export function saqaStartY(lineY: number) {
  return lineY + SAQA_R + 6;
}

export function createWorld(
  asyks: AsykState[],
  stones: Stone[],
  lineY: number,
  input: ThrowInput,
): World {
  const bodies: Body[] = [
    {
      id: SAQA_ID,
      kind: "saqa",
      x: input.sx,
      y: saqaStartY(lineY),
      vx: input.vx,
      vy: input.vy,
      r: SAQA_R,
      invMass: 1 / SAQA_MASS,
      friction: SAQA_FRICTION,
    },
  ];
  for (const a of asyks) {
    bodies.push({
      id: a.id,
      kind: "asyk",
      x: a.x,
      y: a.y,
      vx: 0,
      vy: 0,
      r: ASYK_R,
      invMass: 1 / ASYK_MASS,
      friction: ASYK_FRICTION,
    });
  }
  stones.forEach((s, i) => {
    bodies.push({
      id: STONE_ID_BASE + i,
      kind: "stone",
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      r: s.r,
      invMass: 0,
      friction: 0,
    });
  });
  return { bodies, step: 0, saqaTouched: new Set() };
}

/** Один шаг симуляции длиной DT. Возвращает удары, случившиеся на этом шаге. */
export function stepWorld(world: World): CollisionEvent[] {
  const { bodies } = world;
  const events: CollisionEvent[] = [];

  // 1. Трение и движение. Трение — постоянное замедление: тело гарантированно
  //    останавливается в ноль, а не «ползёт» бесконечно.
  for (const b of bodies) {
    if (b.invMass === 0) continue;
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (speed === 0) continue;
    const dec = b.friction * DT;
    if (speed <= dec) {
      b.vx = 0;
      b.vy = 0;
      continue;
    }
    const k = (speed - dec) / speed;
    b.vx *= k;
    b.vy *= k;
    b.x += b.vx * DT;
    b.y += b.vy * DT;
  }

  // 2. Столкновения кругов. Порядок перебора пар фиксирован, поэтому
  //    результат не зависит от устройства.
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const invSum = a.invMass + b.invMass;
      if (invSum === 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.r + b.r;
      const dist2 = dx * dx + dy * dy;
      if (dist2 >= minDist * minDist) continue;

      let dist = Math.sqrt(dist2);
      let nx: number;
      let ny: number;
      if (dist === 0) {
        nx = 0;
        ny = 1;
        dist = 0;
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }

      // Раздвигаем тела, чтобы они не залипали друг в друге.
      const overlap = minDist - dist;
      a.x -= nx * overlap * (a.invMass / invSum);
      a.y -= ny * overlap * (a.invMass / invSum);
      b.x += nx * overlap * (b.invMass / invSum);
      b.y += ny * overlap * (b.invMass / invSum);

      // Импульс вдоль нормали, только если тела сближаются.
      const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (vn <= 0) continue;
      const e =
        a.kind === "stone" || b.kind === "stone" ? STONE_RESTITUTION : RESTITUTION;
      const jImp = ((1 + e) * vn) / invSum;
      a.vx -= jImp * a.invMass * nx;
      a.vy -= jImp * a.invMass * ny;
      b.vx += jImp * b.invMass * nx;
      b.vy += jImp * b.invMass * ny;

      if (a.kind === "saqa" && b.kind === "asyk") world.saqaTouched.add(b.id);
      events.push({
        step: world.step,
        a: a.id,
        b: b.id,
        impulse: jImp,
        kinds: [a.kind, b.kind],
      });
    }
  }

  world.step++;
  return events;
}

export function isAtRest(world: World) {
  for (const b of world.bodies) {
    if (b.vx !== 0 || b.vy !== 0) return false;
  }
  return true;
}

export function getSaqa(world: World) {
  return world.bodies[0];
}
