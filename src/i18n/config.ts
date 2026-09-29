export const LANGS = ["ru", "kk", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ru";
export const LANG_COOKIE = "lang";
export const THEME_COOKIE = "theme";

export const LANG_LABEL: Record<Lang, string> = { ru: "Рус", kk: "Қаз", en: "Eng" };
export const LANG_LOCALE: Record<Lang, string> = { ru: "ru-RU", kk: "kk-KZ", en: "en-US" };

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** Язык из заголовка Accept-Language, если пользователь ещё не выбирал. */
export function langFromAcceptLanguage(header: string | null): Lang {
  const h = (header ?? "").toLowerCase();
  for (const part of h.split(",")) {
    const code = part.trim().slice(0, 2);
    if (code === "kk") return "kk";
    if (code === "ru") return "ru";
    if (code === "en") return "en";
  }
  return DEFAULT_LANG;
}
