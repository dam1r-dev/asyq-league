import { describe, expect, it } from "vitest";
import { computeStreak, streakBonus } from "./streakCalc";

const days = ["10-08", "10-07", "10-06", "10-05", "10-04", "10-03"]; // сегодня, вчера, …

describe("серия дней", () => {
  it("считает дни подряд, включая сегодня", () => {
    expect(computeStreak(new Set(["10-08", "10-07", "10-06"]), days)).toEqual({ streak: 3, playedToday: true });
  });
  it("серия не рвётся, пока не закончился сегодняшний день", () => {
    expect(computeStreak(new Set(["10-07", "10-06"]), days)).toEqual({ streak: 2, playedToday: false });
  });
  it("пропущенный день обнуляет серию", () => {
    expect(computeStreak(new Set(["10-08", "10-06", "10-05"]), days)).toEqual({ streak: 1, playedToday: true });
    expect(computeStreak(new Set(["10-06", "10-05"]), days)).toEqual({ streak: 0, playedToday: false });
  });
  it("без игр серия 0", () => expect(computeStreak(new Set(), days)).toEqual({ streak: 0, playedToday: false }));
  it("бонус: нет за первый день, 5 за каждый день серии, максимум 35", () => {
    expect([0, 1, 2, 3, 7, 8, 30].map(streakBonus)).toEqual([0, 0, 10, 15, 35, 35, 35]);
  });
});
