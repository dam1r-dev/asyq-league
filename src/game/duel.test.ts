import { describe, expect, it } from "vitest";
import { encodeChallenge } from "./custom";
import {
  DEFAULT_DUEL_CONFIG,
  DUEL_LEVEL,
  duelLevel,
  duelThrow,
  initDuel,
  isValidDuelConfig,
  normalizeDuelConfig,
  type DuelConfig,
} from "./duel";
import { V_MAX } from "./constants";

const hit = { sx: 200, vx: 0, vy: -V_MAX };
const miss = { sx: 60, vx: 0, vy: -100 };
const five = (perTurn = 1, rounds: (string | null)[] = [null]): DuelConfig => ({ mode: "five", perTurn, rounds });

describe("режимы дуэли", () => {
  it("классика: 8 бросков, стандартное поле из 11 асыков", () => {
    const d = initDuel(["А", "Б"]);
    expect(d.throwsLeft).toEqual([8, 8]);
    expect(d.field.asyks).toHaveLength(11);
    expect(d.turnLeft).toBe(1);
  });

  it("пятёрки: по 5 бросков, при 1 броске за ход очередь строго чередуется", () => {
    let d = initDuel(["А", "Б"], five());
    expect(d.throwsLeft).toEqual([5, 5]);
    d = duelThrow(d, hit); // даже точный бросок не даёт доп. хода в пятёрках
    expect(d.turn).toBe(1);
    expect(d.last?.extraTurn).toBe(false);
    d = duelThrow(d, miss);
    expect(d.turn).toBe(0);
  });

  it("пятёрки: после 10 бросков игра заканчивается", () => {
    let d = initDuel(["А", "Б"], five());
    for (let i = 0; i < 10; i++) d = duelThrow(d, miss);
    expect(d.status).toBe("finished");
    expect(d.throwsLeft).toEqual([0, 0]);
  });
});

describe("несколько бросков за ход", () => {
  it("при 3 бросках за ход игрок бросает трижды подряд, потом ход переходит", () => {
    let d = initDuel(["А", "Б"], five(3));
    const turns: number[] = [];
    for (let i = 0; i < 6; i++) {
      turns.push(d.turn);
      d = duelThrow(d, miss);
    }
    expect(turns).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("в классике бонусный бросок добавляется к броскам хода", () => {
    const d = initDuel(["А", "Б"], { mode: "classic", perTurn: 2, rounds: [null] });
    expect(d.turnLeft).toBe(2);
    const after = duelThrow(d, miss);
    expect(after.turn).toBe(0);
    expect(after.turnLeft).toBe(1);
    expect(duelThrow(after, miss).turn).toBe(1);
  });

  it("последний ход не превышает оставшиеся броски", () => {
    let d = initDuel(["А", "Б"], five(5));
    for (let i = 0; i < 10; i++) d = duelThrow(d, miss);
    expect(d.status).toBe("finished");
  });
});

describe("несколько раундов со своими полями", () => {
  const code = encodeChallenge({ t: "Тест", a: [[200, 250], [226, 250], [174, 250]], s: [[200, 180, 14]], n: 6 });

  it("собирает поле каждого раунда из кода редактора", () => {
    const d = initDuel(["А", "Б"], { mode: "classic", perTurn: 1, rounds: [code] });
    expect(d.field.asyks).toHaveLength(3);
    expect(d.field.level.stones).toHaveLength(1);
    expect(d.field.level.id).toBe("duel");
  });

  it("раунды идут друг за другом, очки суммируются, начинающий чередуется", () => {
    let d = initDuel(["А", "Б"], five(1, [null, code]));
    expect(d.roundsTotal).toBe(2);
    for (let i = 0; i < 10; i++) d = duelThrow(d, miss);
    expect(d.status).toBe("playing");
    expect(d.round).toBe(1);
    expect(d.field.asyks).toHaveLength(3); // поле второго раунда
    expect(d.throwsLeft).toEqual([5, 5]);
    expect(d.turn).toBe(1); // во втором раунде первым бросает соперник
    expect(d.last?.roundOver).toBe(true);
    for (let i = 0; i < 10; i++) d = duelThrow(d, miss);
    expect(d.status).toBe("finished");
  });

  it("очки не обнуляются между раундами", () => {
    let d = initDuel(["А", "Б"], five(1, [null, null]));
    d = duelThrow(d, hit);
    const first = d.scores[0];
    for (let i = 0; i < 9; i++) d = duelThrow(d, miss);
    expect(d.round).toBe(1);
    expect(d.scores[0]).toBeGreaterThanOrEqual(first);
  });
});

describe("проверка настроек", () => {
  const code = encodeChallenge({ t: "Тест", a: [[200, 250]], s: [], n: 6 });

  it("принимает корректные и отклоняет битые", () => {
    expect(isValidDuelConfig(DEFAULT_DUEL_CONFIG)).toBe(true);
    expect(isValidDuelConfig(five(5, [code, null]))).toBe(true);
    expect(isValidDuelConfig(five(6))).toBe(false);
    expect(isValidDuelConfig(five(0))).toBe(false);
    expect(isValidDuelConfig(five(1, []))).toBe(false);
    expect(isValidDuelConfig(five(1, Array(6).fill(null)))).toBe(false);
    expect(isValidDuelConfig(five(1, ["не-код"]))).toBe(false);
    expect(isValidDuelConfig({ mode: "bad" as never, perTurn: 1, rounds: [null] })).toBe(false);
  });

  it("normalizeDuelConfig чинит данные и понимает старый формат с одним полем", () => {
    expect(normalizeDuelConfig(null)).toEqual(DEFAULT_DUEL_CONFIG);
    expect(normalizeDuelConfig({ mode: "five", field: code })).toEqual({ mode: "five", perTurn: 1, rounds: [code] });
    expect(normalizeDuelConfig({ mode: "x", perTurn: 99, rounds: ["битый", code] })).toEqual({
      mode: "classic",
      perTurn: 5,
      rounds: [null, code],
    });
  });

  it("битый код → null, пустой → стандартное поле, поле кэшируется", () => {
    expect(duelLevel("не-код")).toBeNull();
    expect(duelLevel(null)).toBe(DUEL_LEVEL);
    expect(duelLevel(code)).toBe(duelLevel(code));
  });
});
