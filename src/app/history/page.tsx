import Link from "next/link";
import type { Metadata } from "next";
import { SideDiagram } from "@/components/RulesDiagrams";
import { LEVELS } from "@/game/levels";
import { levelTitle } from "@/i18n/game";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: `${t("history.metaTitle")} — Asyq League`,
    description: t("history.lead"),
  };
}

/** Открытые источники, по которым подготовлен раздел. */
const SOURCES: { title: string; url: string }[] = [
  { title: "UNESCO — Kazakh traditional game of assyk (2017)", url: "https://ich.unesco.org/en/state/kazakhstan-KZ" },
  {
    title: "The Astana Times — UNESCO includes traditional Kazakh game on Intangible Cultural Heritage list",
    url: "https://astanatimes.com/2017/12/unesco-includes-traditional-kazakh-game-on-intangible-cultural-heritage-list/",
  },
  {
    title: "Euronews — From horseback wrestling to sheep bone tossing: World Nomad Games 2024",
    url: "https://www.euronews.com/culture/2024/09/12/horseback-wrestling-to-sheep-bone-tossing-highlights-from-the-world-nomad-games",
  },
  { title: "Museum of Cambridge — Folklore Finds: Astragali, or Knucklebones", url: "https://www.museumofcambridge.org.uk/2025/01/folklore-finds-astragali-or-knucklebones/" },
  { title: "Ана тілі — Асық", url: "https://anatili.kazgazeta.kz/news/asyq" },
  { title: "Wikipedia — Astragalomancy", url: "https://en.wikipedia.org/wiki/Astragalomancy" },
];

export default async function HistoryPage() {
  const t = await getServerT();
  const symbols = LEVELS.filter((l) => l.chapter === 2);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20">
      {/* Обложка */}
      <header className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-surface via-surface-2 to-surface p-6 sm:p-8">
        <div className="text-4xl" aria-hidden>
          📜
        </div>
        <h1 className="mt-3 font-display text-3xl leading-tight font-extrabold sm:text-4xl">{t("history.title")}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{t("history.lead")}</p>
        <div className="ornament-divider mt-5" />
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("history.note")}</p>
      </header>

      {/* Что такое асык */}
      <Block title={t("history.aTitle")}>
        <p>{t("history.a1")}</p>
        <p className="mt-3">{t("history.a2")}</p>
        <h3 className="mt-6 font-display text-base font-bold">{t("history.sidesTitle")}</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["alshy", "tayki", "buk", "shik"] as const).map((s) => (
            <li key={s} className="flex items-center gap-3 rounded-2xl border border-line bg-bg/40 p-3">
              <SideDiagram side={s} label={t(`history.${s}`)} />
              <span className="text-sm leading-snug">{t(`history.${s}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm leading-snug">{t("history.rank")}</p>
      </Block>

      {/* Лента времени */}
      <Block title={t("history.bTitle")}>
        <ol className="relative ml-2 border-l-2 border-gold/40 pl-6">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="relative pb-6 last:pb-0">
              <span className="absolute top-1 -left-[33px] h-4 w-4 rounded-full border-[3px] border-bg bg-gold" aria-hidden />
              <div className="font-display text-sm font-bold text-gold">{t(`history.e${n}y`)}</div>
              <p className="mt-1">{t(`history.e${n}`)}</p>
            </li>
          ))}
        </ol>
      </Block>

      <Block title={t("history.cTitle")}>
        <p>{t("history.c1")}</p>
        <p className="mt-3">{t("history.c2")}</p>
      </Block>

      <Block title={t("history.dTitle")}>
        <p>{t("history.d1")}</p>
        <p className="mt-3">{t("history.d2")}</p>
        <p className="mt-3">{t("history.d3")}</p>
      </Block>

      <Block title={t("history.eTitle")}>
        <p>{t("history.eP1")}</p>
        <p className="mt-3">{t("history.eP2")}</p>
        <p className="mt-3">{t("history.eP3")}</p>
      </Block>

      {/* Знаешь ли ты */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">💡 {t("facts.title")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-4 text-sm leading-relaxed">
              <span className="mr-1 font-display font-bold text-gold">{n}.</span>
              {t(`facts.f${n}`)}
            </div>
          ))}
        </div>
      </section>

      {/* Символы в уровнях */}
      <Block title={t("history.gTitle")}>
        <p>{t("history.g1")}</p>
        <p className="mt-3">{t("history.g2")}</p>
        <h3 className="mt-6 font-display text-base font-bold">{t("history.symbolsTitle")}</h3>
        <ul className="mt-3 grid gap-3">
          {symbols.map((l) => (
            <li key={l.id} className="rounded-2xl border border-line bg-bg/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display font-bold">{levelTitle(l, t)}</h4>
                <Link href={`/play/${l.id}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                  {t("common.play")}
                </Link>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`lvl.${l.id}.fact`)}</p>
            </li>
          ))}
        </ul>
      </Block>

      {/* Источники */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">📚 {t("history.srcTitle")}</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sky underline underline-offset-2 hover:text-gold">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t("history.srcNote")}</p>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/levels" className="btn btn-primary">
          {t("history.playCta")}
        </Link>
        <Link href="/rules" className="btn btn-ghost">
          {t("history.rulesCta")}
        </Link>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mt-5 p-5 text-[15px] leading-relaxed sm:p-6">
      <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
