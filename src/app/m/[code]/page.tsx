import type { Metadata } from "next";
import OnlineDuel from "@/components/game/OnlineDuel";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: `${t("online.title")} — Asyq League`, description: t("online.lobbyLead") };
}

export default async function MatchPage({ params }: PageProps<"/m/[code]">) {
  const { code } = await params;
  return <OnlineDuel code={code.toUpperCase()} />;
}
