import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, ACH_IDS, doneAchievements, type AchStats } from "./achievements";

const empty: AchStats = {
  stars: 0, cleared: 0, threeStar: 0, chapterDone: { 1: false, 2: false, 3: false },
  oneThrowWin: false, puddleWin: false, knocked: 0, streak: 0, dailyDays: 0, purchased: false, duelWins: 0,
};

describe("достижения", () => {
  it("идентификаторы уникальны, награды положительные", () => {
    expect(new Set(ACH_IDS).size).toBe(ACH_IDS.length);
    for (const a of ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0);
  });
  it("новичок ничего не получает", () => expect(doneAchievements(empty)).toEqual([]));
  it("пороги срабатывают ровно на границе", () => {
    expect(doneAchievements({ ...empty, stars: 9 })).not.toContain("stars_10");
    expect(doneAchievements({ ...empty, stars: 10 })).toContain("stars_10");
    expect(doneAchievements({ ...empty, streak: 7 })).toEqual(expect.arrayContaining(["streak_3", "streak_7"]));
    expect(doneAchievements({ ...empty, knocked: 100 })).toEqual(["knock_100"]);
  });
  it("полное прохождение даёт всё, что зависит от прогресса", () => {
    const full: AchStats = { ...empty, stars: 84, cleared: 28, threeStar: 28, chapterDone: { 1: true, 2: true, 3: true }, knocked: 600 };
    const ids = doneAchievements(full);
    for (const id of ["first_win", "stars_all", "chapter1", "chapter2", "chapter3", "three_15", "knock_500"]) expect(ids).toContain(id);
  });
});
