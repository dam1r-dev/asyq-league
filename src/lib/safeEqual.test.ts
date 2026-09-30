import { describe, expect, it } from "vitest";
import { isWeakPassword } from "./password";
import { safeEqual } from "./safeEqual";

describe("safeEqual", () => {
  it("равные строки совпадают", () => expect(safeEqual("abc123", "abc123")).toBe(true));
  it("разные строки и разная длина не совпадают", () => {
    expect(safeEqual("abc123", "abc124")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
  it("пустые и отсутствующие значения не совпадают", () => {
    expect(safeEqual(null, "x")).toBe(false);
    expect(safeEqual(undefined, undefined)).toBe(false);
  });
});

describe("isWeakPassword", () => {
  it("отклоняет частые пароли, повторы и совпадение с логином", () => {
    expect(isWeakPassword("12345678", "aidos")).toBe(true);
    expect(isWeakPassword("Password123", "aidos")).toBe(true);
    expect(isWeakPassword("aaaaaaaa", "aidos")).toBe(true);
    expect(isWeakPassword("aidos_2007", "aidos_2007")).toBe(true);
  });
  it("пропускает нормальные пароли", () => expect(isWeakPassword("tulpar-Kerbez-47", "aidos")).toBe(false));
});
