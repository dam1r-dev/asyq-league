import "server-only";
import { cookies, headers } from "next/headers";
import { isLang, LANG_COOKIE, langFromAcceptLanguage, THEME_COOKIE, type Lang } from "./config";
import { makeT } from "./translate";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  return langFromAcceptLanguage((await headers()).get("accept-language"));
}

export async function getServerT() {
  return makeT(await getLang());
}

export async function getTheme(): Promise<"light" | "dark" | null> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : null;
}
