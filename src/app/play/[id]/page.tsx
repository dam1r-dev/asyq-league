import { notFound } from "next/navigation";
import { getLevel, nextLevelId } from "@/game/levels";
import LevelGate from "./LevelGate";

export default async function PlayPage({ params }: PageProps<"/play/[id]">) {
  const { id } = await params;
  const level = getLevel(id);
  if (!level) notFound();
  const next = nextLevelId(id);
  return <LevelGate levelId={level.id} nextHref={next ? `/play/${next}` : undefined} />;
}
