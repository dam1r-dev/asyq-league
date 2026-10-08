import { describe, expect, it } from "vitest";
import { PUDDLE_DRAG, V_MAX } from "./constants";
import { challengeToLevel, decodeChallenge, encodeChallenge, validLayout } from "./custom";
import { dailyLevel } from "./daily";
import { duelThrow, initDuel } from "./duel";
import { ALL_LEVELS, CHAPTERS, getLevel } from "./levels";
import { createWorld, stepWorld } from "./physics";
import { applyThrow, initRound, normalizeInput, replayRound } from "./round";
import type { LevelDef, RoundState, ThrowInput } from "./types";

/** Прямой бросок из точки sx в точку (tx, ty) с силой power. */
function aim(level: LevelDef, sx: number, tx: number, ty: number, power: number): ThrowInput {
  const sy = level.lineY + 19;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  return normalizeInput(level, { sx, vx: (dx / len) * V_MAX * power, vy: (dy / len) * V_MAX * power });
}

/** Жадный бот: перебирает сетку бросков и берёт лучший по очкам. */
function greedyPlay(level: LevelDef) {
  let state: RoundState = initRound(level);
  while (state.status === "playing") {
    let best: { s: RoundState; value: number } | null = null;
    for (const target of state.asyks) {
      for (const sx of [level.kon.x - 120, level.kon.x - 60, level.kon.x, level.kon.x + 60, level.kon.x + 120]) {
        for (const dxOff of [-8, -4, 0, 4, 8]) {
          for (const power of [0.85, 1]) {
            const { state: s, result } = applyThrow(state, aim(level, sx, target.x + dxOff, target.y, power));
            const value = result.knockedIds.length * 10 - result.penalty * 5;
            if (!best || value > best.value) best = { s, value };
          }
        }
      }
    }
    state = best!.s;
  }
  return state;
}

describe("физика", () => {
  it("один и тот же бросок даёт один и тот же результат", () => {
    const level = getLevel("l3")!;
    const input = aim(level, 120, 190, 250, 0.93);
    const a = applyThrow(initRound(level), input);
    const b = applyThrow(initRound(level), input);
    expect(a.state).toEqual(b.state);
  });

  it("сильный прямой бросок выбивает асык", () => {
    const level = getLevel("l1")!;
    const { result } = applyThrow(initRound(level), aim(level, 200, 200, 250, 1));
    expect(result.hit).toBe(true);
    expect(result.knockedIds.length).toBeGreaterThan(0);
  });

  it("слабый бросок не долетает и штрафуется только если сақа в коне", () => {
    const level = getLevel("l1")!;
    const { result } = applyThrow(initRound(level), aim(level, 200, 200, 250, 0.2));
    expect(result.hit).toBe(false);
    expect(result.saqaInKon).toBe(false);
    expect(result.points).toBe(0);
  });

  it("очки за выбитый асык не начисляются повторно", () => {
    const level = getLevel("l2")!;
    let state = initRound(level);
    const seen = new Set<number>();
    for (let i = 0; i < level.throws && state.status === "playing"; i++) {
      const target = state.asyks[0];
      const r = applyThrow(state, aim(level, 200, target.x, target.y, 1));
      for (const id of r.result.knockedIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
      state = r.state;
    }
    expect(state.knocked).toBe(seen.size);
    expect(state.knocked + state.asyks.length).toBe(level.asyks.length);
  });

  it("реплей бросков восстанавливает раунд", () => {
    const level = getLevel("l4")!;
    const inputs = [aim(level, 130, 180, 235, 1), aim(level, 270, 230, 265, 0.95), aim(level, 200, 200, 250, 1)];
    let state = initRound(level);
    for (const i of inputs) state = applyThrow(state, i).state;
    expect(replayRound(level, inputs)).toEqual(state);
  });
});

describe("расстановки уровней", () => {
  for (const level of ALL_LEVELS) {
    it(`${level.id}: асыки и камни внутри кона и не налезают друг на друга`, () => {
      expect(validLayout(level.asyks, level.stones, level.kon, level.puddles)).toBe(true);
    });
  }

  it("нормы звёзд возрастают: par3 ≤ par2 ≤ число бросков", () => {
    for (const l of ALL_LEVELS) {
      expect(l.par3).toBeLessThanOrEqual(l.par2);
      expect(l.par2).toBeLessThanOrEqual(l.throws);
    }
  });
});

describe("баланс уровней", () => {
  for (const level of ALL_LEVELS) {
    it(`${level.id} «${level.title}» проходим`, () => {
      const final = greedyPlay(level);
      expect(final.status).toBe("won");
    });
  }

  it("ежедневные испытания проходимы", () => {
    for (const day of ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]) {
      const level = dailyLevel(day);
      expect(level.asyks.length).toBeGreaterThanOrEqual(6);
      expect(greedyPlay(level).status).toBe("won");
    }
  });
});

describe("испытание по ссылке", () => {
  it("кодируется и декодируется", () => {
    const c = { t: "Для Айдоса", a: [[200, 250], [180, 250]] as [number, number][], s: [], n: 4, by: "Дамир", sc: 5, th: 2 };
    const decoded = decodeChallenge(encodeChallenge(c));
    expect(decoded).toEqual(c);
    expect(challengeToLevel(decoded!).asyks).toHaveLength(2);
  });

  it("отклоняет асыки за пределами кона", () => {
    const bad = encodeChallenge({ t: "x", a: [[10, 10]], s: [], n: 3 });
    expect(decodeChallenge(bad)).toBeNull();
    expect(decodeChallenge("мусор")).toBeNull();
  });
});

describe("дуэль", () => {
  it("попадание даёт ещё бросок, промах передаёт ход", () => {
    let d = initDuel(["А", "Б"]);
    d = duelThrow(d, { sx: 200, vx: 0, vy: -V_MAX });
    expect(d.last!.result.knockedIds.length).toBeGreaterThan(0);
    if (!d.last!.result.saqaInKon) expect(d.turn).toBe(0);
    d = duelThrow(d, { sx: 60, vx: 0, vy: -100 });
    expect(d.turn).toBe(1);
  });
});

describe("лужи", () => {
  const asyk = [{ id: 1, x: 200, y: 300 }];
  /** Асык, которому дали скорость 300 px/s вверх: как далеко он уедет. */
  function asykTravel(puddles: { x: number; y: number; r: number }[]) {
    const w = createWorld(asyk, [], 560, { sx: 200, vx: 0, vy: -1 }, puddles);
    const a = w.bodies[1];
    a.vy = -300;
    for (let i = 0; i < 120 * 5; i++) stepWorld(w);
    return 300 - a.y;
  }

  it("асык в луже проезжает заметно меньше, чем по сухому", () => {
    const dry = asykTravel([]);
    const wet = asykTravel([{ x: 200, y: 280, r: 30 }]);
    expect(wet).toBeLessThan(dry * 0.6);
    expect(PUDDLE_DRAG).toBeGreaterThan(1);
  });

  it("лужа в стороне ничего не меняет", () => {
    expect(asykTravel([{ x: 330, y: 150, r: 20 }])).toBe(asykTravel([]));
  });

  it("результат с лужами детерминирован и восстанавливается реплеем", () => {
    const level = getLevel("l23")!;
    expect(level.puddles?.length).toBeGreaterThan(0);
    const inputs = [aim(level, 160, 200, 250, 1), aim(level, 240, 220, 230, 0.95)];
    let state = initRound(level);
    for (const i of inputs) state = applyThrow(state, i).state;
    expect(replayRound(level, inputs)).toEqual(state);
  });

  it("лужи сохраняются в ссылке-испытании", () => {
    const c = { t: "Вода", a: [[200, 250]] as [number, number][], s: [], w: [[200, 300, 24]] as [number, number, number][], n: 4 };
    const decoded = decodeChallenge(encodeChallenge(c));
    expect(decoded).toEqual(c);
    expect(challengeToLevel(decoded!).puddles).toEqual([{ x: 200, y: 300, r: 24 }]);
    expect(decodeChallenge(encodeChallenge({ ...c, w: [[20, 20, 24]] }))).toBeNull();
  });

  it("третья глава: 10 уровней с лужами, все проходимы ботом", () => {
    const ch3 = CHAPTERS.find((c) => c.id === 3)!;
    expect(ch3.levels).toHaveLength(10);
    for (const l of ch3.levels) expect(l.puddles?.length).toBeGreaterThan(0);
  });
});
