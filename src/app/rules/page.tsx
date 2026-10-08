import Link from "next/link";
import type { Metadata } from "next";
import { ScoreDiagram, ThrowDiagram, type ScoreKind } from "@/components/RulesDiagrams";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: `${t("rules.title")} — Asyq League` };
}

const SCORE_CARDS: { kind: ScoreKind; n: 1 | 2 | 3 | 4 | 5; value: string; tone: "good" | "bad" | "neutral" }[] = [
  { kind: "out", n: 1, value: "+1", tone: "good" },
  { kind: "edge", n: 2, value: "0", tone: "neutral" },
  { kind: "combo", n: 3, value: "+1 ×", tone: "good" },
  { kind: "penalty", n: 4, value: "−1", tone: "bad" },
  { kind: "clear", n: 5, value: "+2 ×", tone: "good" },
];

const TONE = {
  good: "bg-good/20 text-good",
  bad: "bg-bad/20 text-bad",
  neutral: "bg-surface-2 text-muted",
} as const;

export default async function RulesPage() {
  const t = await getServerT();
  const badge = <span className="author-badge">{t("common.authorBadge")}</span>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20">
      <h1 className="font-display text-3xl font-extrabold">{t("rules.title")}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{t("rules.lead")}</p>

      {/* Цель */}
      <Section title={t("rules.goalTitle")} icon="🎯">
        <p className="text-[15px] leading-relaxed">{t("rules.goal")}</p>
      </Section>

      {/* Как бросить */}
      <Section title={t("rules.throwTitle")} icon="👆">
        <div className="grid items-center gap-5 md:grid-cols-[1.1fr_1fr]">
          <ThrowDiagram
            pull={t("rules.dgPull")}
            fly={t("rules.dgFly")}
            line={t("rules.dgLine")}
            label={t("rules.throwTitle")}
          />
          <ol className="grid gap-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-on-gold">
                  {n}
                </span>
                <div>
                  <div className="font-semibold">{t(`quick.s${n}t`)}</div>
                  <div className="text-sm leading-snug text-muted">{t(`quick.s${n}`)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2 text-sm">💡 {t("rules.dgPower")}</p>
      </Section>

      {/* Очки */}
      <Section title={t("rules.scoreTitle")} icon="🏆">
        <div className="grid gap-4 sm:grid-cols-2">
          {SCORE_CARDS.map((c, i) => (
            <div key={c.kind} className={`rounded-2xl border border-line bg-bg/40 p-3 ${i === 4 ? "sm:col-span-2 sm:grid sm:grid-cols-[200px_1fr] sm:gap-4" : ""}`}>
              <ScoreDiagram kind={c.kind} label={t(`rules.sc${c.n}t`)} />
              <div className={i === 4 ? "mt-3 sm:mt-0" : "mt-3"}>
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 font-display text-base font-extrabold ${TONE[c.tone]}`}>{c.value}</span>
                  <h3 className="font-semibold leading-tight">{t(`rules.sc${c.n}t`)}</h3>
                </div>
                <p className="mt-1.5 text-sm leading-snug text-muted">
                  {t(`rules.sc${c.n}d`)} {(c.n === 3 || c.n === 5) && badge}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Пример */}
      <Section title={t("rules.exTitle")} icon="🧮">
        <p className="mb-3 text-sm text-muted">{t("rules.exLead")}</p>
        <div className="overflow-hidden rounded-2xl border border-line text-sm">
          {[
            ["ex1", "ex1v", "text-good"],
            ["ex2", "ex2v", "text-bad"],
            ["ex3", "ex3v", "text-good"],
            ["ex4", "ex4v", "text-good"],
          ].map(([k, v, c]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5">
              <span>{t(`rules.${k}`)}</span>
              <b className={`shrink-0 text-right ${c}`}>{t(`rules.${v}`)}</b>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 bg-gold/15 px-3 py-3">
            <b>{t("rules.exTotal")}</b>
            <b className="text-right font-display text-base text-gold">{t("rules.exTotalV")}</b>
          </div>
        </div>
      </Section>

      {/* Звёзды */}
      <Section title={t("rules.starsTitle")} icon="⭐">
        <p className="text-[15px] leading-relaxed">{t("rules.starsText")}</p>
        <ul className="mt-3 grid gap-2 text-sm">
          {[
            ["⭐⭐⭐", "star3"],
            ["⭐⭐", "star2"],
            ["⭐", "star1"],
          ].map(([s, k]) => (
            <li key={k} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2">
              <span className="w-16 shrink-0">{s}</span>
              <span>{t(`rules.${k}`)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-display text-base font-bold">{t("rules.vsTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t("rules.vsText")}</p>
      </Section>

      {/* Советы */}
      <Section title={t("rules.tipsTitle")} icon="💡">
        <ul className="grid gap-2 text-[15px]">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="flex gap-2.5">
              <span className="text-gold">✦</span>
              <span className="leading-snug">{t(`rules.tip${n}`)}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Дуэль и вызов */}
      <Section title={t("rules.duelTitle")} icon="⚔️">
        <ul className="grid gap-2 text-[15px]">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex gap-2.5">
              <span className="text-gold">✦</span>
              <span className="leading-snug">{t(`rules.duel${n}`)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 font-display text-base font-bold">{t("rules.challTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t("rules.chall1")}</p>
      </Section>

      {/* FAQ */}
      <Section title={t("rules.faqTitle")} icon="❓">
        <div className="grid gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <details key={n} className="group rounded-xl border border-line bg-bg/40 px-3 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {t(`rules.q${n}`)}
                <span className="text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`rules.a${n}q`)}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Авторские правила */}
      <Section title={t("rules.ownTitle")} icon="✦">
        <ul className="grid gap-2 text-[15px]">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="flex items-start gap-2.5">
              {badge}
              <span className="leading-snug">{t(`rules.own${n}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{t("rules.ownNote")}</p>
      </Section>

      <Section title={t("rules.adaptTitle")} icon="🖥️">
        <ul className="grid gap-2 text-sm leading-relaxed text-muted">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex gap-2.5">
              <span className="text-gold">✦</span>
              <span>{t(`rules.a${n}`)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link href="/play/l1" className="btn btn-primary">
          {t("rules.tutorial")}
        </Link>
        <Link href="/levels" className="btn btn-ghost">
          {t("rules.toLevels")}
        </Link>
        <Link href="/history" className="btn btn-ghost">
          📜 {t("rules.toHistory")}
        </Link>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="card mt-5 p-5">
      <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold">
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
