import { z } from "zod";
import { ASYK_R, DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import type { Kon, LevelDef, Point, Stone } from "./types";

/**
 * Авторские испытания из редактора. Вся расстановка упаковывается прямо в
 * ссылку (JSON → base64url), поэтому поделиться задачей можно даже без
 * аккаунта, а сервер не хранит ничего лишнего.
 */

export const MAX_CUSTOM_ASYKS = 16;
export const MAX_CUSTOM_STONES = 6;

const coord = z.number().finite();
const schema = z.object({
  t: z.string().trim().max(40).default("Испытание от друга"),
  a: z.array(z.tuple([coord, coord])).min(1).max(MAX_CUSTOM_ASYKS),
  s: z.array(z.tuple([coord, coord, z.number().min(10).max(22)])).max(MAX_CUSTOM_STONES).default([]),
  n: z.number().int().min(2).max(15),
  by: z.string().trim().max(24).optional(),
  sc: z.number().int().min(0).max(999).optional(),
  th: z.number().int().min(0).max(15).optional(),
  /** Необязательный размер кона и линия броска (для испытаний из кампании). */
  k: z.tuple([z.number().min(100).max(300), z.number().min(120).max(320), z.number().min(80).max(170)]).optional(),
  l: z.number().min(480).max(640).optional(),
});

export type CustomChallenge = z.infer<typeof schema>;

function toBase64Url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeChallenge(c: CustomChallenge) {
  return toBase64Url(JSON.stringify(c));
}

export function decodeChallenge(code: string): CustomChallenge | null {
  try {
    const parsed = schema.safeParse(JSON.parse(fromBase64Url(code)));
    if (!parsed.success) return null;
    const c = parsed.data;
    // Всё должно лежать внутри кона и не налезать друг на друга.
    const asyks = c.a.map(([x, y]) => ({ x, y }));
    const stones = c.s.map(([x, y, r]) => ({ x, y, r }));
    if (!validLayout(asyks, stones, konOf(c))) return null;
    return c;
  } catch {
    return null;
  }
}

function konOf(c: CustomChallenge): Kon {
  return c.k ? { x: c.k[0], y: c.k[1], r: c.k[2] } : DEFAULT_KON;
}

export function validLayout(asyks: Point[], stones: Stone[], kon: Kon = DEFAULT_KON) {
  const d = (a: Point, b: Point) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  for (const a of asyks) if (d(a, kon) + ASYK_R > kon.r) return false;
  for (const s of stones) if (d(s, kon) + s.r > kon.r + 40) return false;
  const all = [...asyks.map((p) => ({ ...p, r: ASYK_R })), ...stones];
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++)
      if (d(all[i], all[j]) < all[i].r + all[j].r - 0.5) return false;
  return true;
}

export function challengeToLevel(c: CustomChallenge): LevelDef {
  const n = c.a.length;
  const par3 = Math.max(1, Math.min(c.n, Math.ceil(n / 2.5)));
  return {
    id: "custom",
    title: c.t || "Испытание от друга",
    subtitle: c.by ? `Автор: ${c.by}` : "Авторская расстановка",
    kon: konOf(c),
    lineY: c.l ?? DEFAULT_LINE_Y,
    asyks: c.a.map(([x, y]) => ({ x, y })),
    stones: c.s.map(([x, y, r]) => ({ x, y, r })),
    throws: c.n,
    par3,
    par2: Math.min(c.n, par3 + 2),
  };
}

/** Превращает любой уровень в испытание для друга, с результатом отправителя. */
export function levelToChallenge(
  level: LevelDef,
  extra: { by?: string; sc?: number; th?: number } = {},
): CustomChallenge {
  const isDefault =
    level.kon.x === DEFAULT_KON.x && level.kon.y === DEFAULT_KON.y && level.kon.r === DEFAULT_KON.r;
  return {
    t: level.title.slice(0, 40),
    a: level.asyks.map((p) => [p.x, p.y]),
    s: level.stones.map((s) => [s.x, s.y, s.r]),
    n: level.throws,
    ...(isDefault ? {} : { k: [level.kon.x, level.kon.y, level.kon.r] as [number, number, number] }),
    ...(level.lineY !== DEFAULT_LINE_Y ? { l: level.lineY } : {}),
    ...extra,
  };
}
