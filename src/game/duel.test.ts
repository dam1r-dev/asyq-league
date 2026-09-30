import { describe, expect, it } from "vitest";
import { encodeChallenge } from "./custom";
import { DUEL_LEVEL, duelLevel, duelThrow, initDuel, isValidDuelConfig, type DuelConfig } from "./duel";
import { V_MAX } from "./constants";

const hit = { sx: 200, vx: 0, vy: -V_MAX };
const miss = { sx: 60, vx: 0, vy: -100 };

describe("режимы дуэли", () => {
  it("классика: 8 бросков, стандартное поле из 11 асыков", () => {
    const d = initDuel(["А", "Б"]);
    expect(d.throwsLeft).toEqual([8, 8]);
    expect(d.field.asyks).toHaveLength(11);
  });

  it("пятёрки: по 5 бросков, ход всегда переходит к сопернику", () => {
    const cfg: DuelConfig = { mode: "five", field: null };
    let d = initDuel(["А", "Б"], cfg);
    expect(d.throwsLeft).toEqual([5, 5]);
    // Даже точный бросок не даёт дополнительного хода.
    d = duelThrow(d, hit);
    expect(d.turn).toBe(1);
    expect(d.last?.extraTurn).toBe(false);
    d = duelThrow(d, miss);
    expect(d.turn).toBe(0);
  });

  it("пятёрки: после 10 бросков игра заканчивается", () => {
    let d = initDuel(["А", "Б"], { mode: "five", field: null });
    for (let i = 0; i < 10; i++) d = duelThrow(d, miss);
    expect(d.status).toBe("finished");
    expect(d.throwsLeft).toEqual([0, 0]);
  });
});

describe("своё поле", () => {
  const code = encodeChallenge({ t: "Тест", a: [[200, 250], [226, 250], [174, 250]], s: [[200, 180, 14]], n: 6 });

  it("собирает поле из кода редактора", () => {
    const d = initDuel(["А", "Б"], { mode: "classic", field: code });
    expect(d.field.asyks).toHaveLength(3);
    expect(d.field.level.stones).toHaveLength(1);
    expect(d.field.level.id).toBe("duel");
  });

  it("битый код не принимается, пустой — стандартное поле", () => {
    expect(duelLevel("не-код")).toBeNull();
    expect(duelLevel(null)).toBe(DUEL_LEVEL);
    expect(isValidDuelConfig({ mode: "five", field: "не-код" })).toBe(false);
    expect(isValidDuelConfig({ mode: "five", field: code })).toBe(true);
    expect(isValidDuelConfig({ mode: "bad" as never, field: null })).toBe(false);
  });

  it("поле кэшируется: тот же объект для того же кода", () => {
    expect(duelLevel(code)).toBe(duelLevel(code));
  });
});
