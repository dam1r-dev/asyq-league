import en from "./dict/en";
import type { Dict } from "./dict/index";
import kk from "./dict/kk";
import ru from "./dict/ru";
import type { Lang } from "./config";

export type { Dict };
export const dictionaries: Record<Lang, Dict> = { ru, kk, en };
