import Link from "next/link";
import type { Metadata } from "next";
import { decodeChallenge } from "@/game/custom";
import ChallengeClient from "./ChallengeClient";
import { getServerT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/c/[code]">): Promise<Metadata> {
  const { code } = await params;
  const c = decodeChallenge(code);
  const t = await getServerT();
  if (!c) return { title: t("challenge.notFound") };
  const who = c.by ?? t("challenge.friend");
  return {
    title: t("challenge.metaTitle", { name: who }),
    description:
      c.sc !== undefined ? t("challenge.metaScore", { name: who, score: c.sc }) : t("challenge.metaNoScore", { title: c.t }),
  };
}

export default async function ChallengePage({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;
  const c = decodeChallenge(code);
  const t = await getServerT();
  if (!c)
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 font-display text-xl font-bold">{t("challenge.brokenTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("challenge.brokenText")}</p>
        <Link href="/editor" className="btn btn-primary mt-6">
          {t("challenge.create")}
        </Link>
      </div>
    );
  return <ChallengeClient code={code} />;
}
