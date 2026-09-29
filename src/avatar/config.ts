import { z } from "zod";

/**
 * Внешность персонажа. Тело (кожа, глаза, волосы) — всегда бесплатно:
 * внешность человека не продаётся. Покупаются только костюмы, головные
 * уборы и часть цветов (см. каталог магазина).
 */

export const SKIN_TONES = ["#f3d4b4", "#e2b48c", "#c9935f", "#a26d43", "#72492c"];
export const EYE_COLORS = ["#5a3a1e", "#1e1916", "#3f7d3c", "#3a6ea8", "#8b6a2b"];
export const HAIR_COLORS = ["#1c1613", "#3a2416", "#6f4323", "#9c5a2c", "#bdb6ad"];
export const HAIR_STYLES = ["short", "long", "braids", "bald"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const OUTFITS = ["outfit-simple", "outfit-kamzol", "outfit-shapan", "outfit-koilek", "outfit-ton", "outfit-sauyt"] as const;
export const HATS = ["hat-none", "hat-taqiya", "hat-borik", "hat-tymaq", "hat-saukele", "hat-dulygha"] as const;
export const COLORS = [
  "color-green",
  "color-blue",
  "color-red",
  "color-brown",
  "color-white",
  "color-black",
  "color-burgundy",
  "color-sky",
  "color-silver",
  "color-gold",
] as const;

export const COLOR_HEX: Record<(typeof COLORS)[number], string> = {
  "color-green": "#4cb86b",
  "color-blue": "#2d63b0",
  "color-red": "#c8322b",
  "color-brown": "#8a5a2b",
  "color-white": "#efe9dd",
  "color-black": "#2a2522",
  "color-burgundy": "#7d1f33",
  "color-sky": "#2cb8d0",
  "color-silver": "#aeb4bd",
  "color-gold": "#e0a72b",
};

export const avatarSchema = z.object({
  skin: z.number().int().min(0).max(SKIN_TONES.length - 1),
  eyes: z.number().int().min(0).max(EYE_COLORS.length - 1),
  hair: z.enum(HAIR_STYLES),
  hairColor: z.number().int().min(0).max(HAIR_COLORS.length - 1),
  mustache: z.boolean(),
  outfit: z.enum(OUTFITS),
  hat: z.enum(HATS),
  color: z.enum(COLORS),
});

export type AvatarConfig = z.infer<typeof avatarSchema>;

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 1,
  eyes: 0,
  hair: "short",
  hairColor: 2,
  mustache: false,
  outfit: "outfit-simple",
  hat: "hat-none",
  color: "color-green",
};

export function parseAvatar(raw: unknown): AvatarConfig {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    const r = avatarSchema.safeParse(value);
    return r.success ? r.data : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

/** Платные части внешности, которые нужно проверить по покупкам. */
export function paidParts(a: AvatarConfig) {
  return [a.outfit, a.hat, a.color];
}
