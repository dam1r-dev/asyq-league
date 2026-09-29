import Link from "next/link";
import type { Metadata } from "next";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: `${t("rules.title")} — Asyq League` };
}

export default async function RulesPage() {
  const t = await getServerT();
  const badge = <span className="author-badge">{t("common.authorBadge")}</span>;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16">
      <h1 className="font-display text-2xl font-bold">{t("rules.title")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("rules.lead")} {badge}.
      </p>

      <Section title={t("rules.fieldTitle")}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("rules.kon")}</li>
          <li>{t("rules.saqa")}</li>
          <li>
            {t("rules.stones")} {badge}
          </li>
        </ul>
      </Section>

      <Section title={t("rules.orderTitle")}>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>{t("rules.o1")}</li>
          <li>{t("rules.o2")}</li>
          <li>{t("rules.o3")}</li>
          <li>{t("rules.o4")}</li>
          <li>{t("rules.o5")}</li>
        </ol>
      </Section>

      <Section title={t("rules.scoreTitle")}>
        <table className="w-full text-sm">
          <tbody className="[&_td]:py-2 [&_td]:align-top [&_tr]:border-b [&_tr]:border-line">
            <tr>
              <td>{t("rules.sOut")}</td>
              <td className="text-right font-bold text-good">+1</td>
            </tr>
            <tr>
              <td>
                {t("rules.sCombo")} {badge}
              </td>
              <td className="text-right font-bold text-good">+1</td>
            </tr>
            <tr>
              <td>{t("rules.sPenalty")}</td>
              <td className="text-right font-bold text-bad">−1</td>
            </tr>
            <tr>
              <td>
                {t("rules.sBonus")} {badge}
              </td>
              <td className="text-right font-bold text-good">+2</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3">{t("rules.sNote")}</p>
      </Section>

      <Section title={t("rules.winTitle")}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            {t("rules.wLevels")} {badge}
          </li>
          <li>{t("rules.wDuel")}</li>
          <li>{t("rules.wChallenge")}</li>
        </ul>
      </Section>

      <Section title={t("rules.adaptTitle")}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("rules.a1")}</li>
          <li>{t("rules.a2")}</li>
          <li>{t("rules.a3")}</li>
          <li>
            {t("rules.a4")} {badge}
          </li>
        </ul>
      </Section>

      <div className="mt-8 flex gap-3">
        <Link href="/play/l1" className="btn btn-primary">
          {t("rules.tutorial")}
        </Link>
        <Link href="/levels" className="btn btn-ghost">
          {t("rules.toLevels")}
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mt-5 p-5 text-[15px] leading-relaxed">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
