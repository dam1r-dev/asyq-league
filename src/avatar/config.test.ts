import { describe, expect, it } from "vitest";
import { BEARDS, DEFAULT_AVATAR, HATS, MUSTACHES, avatarSchema, genderPreset, mustacheOf, parseAvatar } from "./config";
import { readFileSync } from "node:fs";

describe("внешность: усы, борода, кимешек", () => {
  it("старое сохранение с mustache:true читается как классические усы", () => {
    const legacy = JSON.stringify({ ...DEFAULT_AVATAR, mustache: true, mustacheStyle: undefined, beard: undefined });
    const a = parseAvatar(legacy);
    expect(mustacheOf(a)).toBe("classic");
    expect(a.beard).toBe("none");
  });

  it("принимает все стили усов и бород и отклоняет неизвестные", () => {
    for (const mustacheStyle of MUSTACHES) for (const beard of BEARDS)
      expect(avatarSchema.safeParse({ ...DEFAULT_AVATAR, mustacheStyle, beard }).success).toBe(true);
    expect(avatarSchema.safeParse({ ...DEFAULT_AVATAR, beard: "unicorn" }).success).toBe(false);
  });

  it("выбор девушки убирает усы и бороду", () => {
    expect(genderPreset("f")).toMatchObject({ gender: "f", mustacheStyle: "none", beard: "none", mustache: false });
  });

  it("каждый головной убор есть в каталоге, кимешек платный", () => {
    // catalog.ts использует алиас @/, поэтому читаем его как текст.
    const catalog = readFileSync(new URL("../lib/catalog.ts", import.meta.url), "utf8");
    for (const h of HATS) expect(catalog, h).toContain(`id: "${h}"`);
    const price = (id: string) => Number(new RegExp(`id: "${id}"[^}]*price: (\\d+)`).exec(catalog)?.[1]);
    expect(price("hat-kimeshek")).toBeGreaterThan(0);
    expect(price("hat-kimeshek-zhaulyk")).toBeGreaterThan(price("hat-kimeshek"));
  });
});
