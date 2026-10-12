import { describe, expect, it } from "vitest";
import { AIM_REWARD, aimRefKey, aimTiers } from "./aimBonus";

describe("бонус за сложность прицела", () => {
  it("лёгкий прицел наград не даёт", () => {
    expect(aimTiers("long")).toEqual([]);
    expect(aimTiers(undefined)).toEqual([]);
  });
  it("средний даёт одну ступень, сложный — обе", () => {
    expect(aimTiers("short")).toEqual(["short"]);
    expect(aimTiers("none")).toEqual(["short", "none"]);
  });
  it("общая награда за уровень ограничена 15 тиынами", () => {
    expect(aimTiers("none").reduce((s, t) => s + AIM_REWARD[t], 0)).toBe(15);
  });
  it("ключи награды разные для ступеней и уровней", () => {
    expect(new Set([aimRefKey("u", "l1", "short"), aimRefKey("u", "l1", "none"), aimRefKey("u", "l2", "short")]).size).toBe(3);
  });
});
