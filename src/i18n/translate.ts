import type { Lang } from "./config";
import { dictionaries, type Dict } from "./dict";

type Params = Record<string, string | number>;

// Все пути вида "result.title" в словаре (для автодополнения и проверки типов).
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Paths<Dict>;

function lookup(dict: Dict, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in cur) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(s: string, params?: Params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Формы множественного числа разделены «|»: ru — 3 формы, en — 2, kk — 1. */
function pluralForm(lang: Lang, n: number, forms: string[]) {
  if (forms.length === 1) return forms[0];
  if (lang === "ru") {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1] ?? forms[0];
    return forms[2] ?? forms[forms.length - 1];
  }
  return n === 1 ? forms[0] : (forms[1] ?? forms[0]);
}

export function makeT(lang: Lang) {
  const dict = dictionaries[lang];
  const fallback = dictionaries.ru;
  /** Перевод по ключу. Если в параметрах есть n — выбирается форма множественного числа. */
  function t(key: TKey | (string & {}), params?: Params): string {
    const raw = lookup(dict, key) ?? lookup(fallback, key) ?? key;
    const text = params && typeof params.n === "number" ? pluralForm(lang, params.n, raw.split("|")) : raw;
    return interpolate(text, params);
  }
  /** Перевод, если ключ существует, иначе undefined. */
  t.maybe = (key: string, params?: Params) => (lookup(dict, key) ?? lookup(fallback, key) ? t(key, params) : undefined);
  return t;
}

export type T = ReturnType<typeof makeT>;
