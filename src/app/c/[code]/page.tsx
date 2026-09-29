import Link from "next/link";
import type { Metadata } from "next";
import { decodeChallenge } from "@/game/custom";
import ChallengeClient from "./ChallengeClient";

export async function generateMetadata({ params }: PageProps<"/c/[code]">): Promise<Metadata> {
  const { code } = await params;
  const c = decodeChallenge(code);
  if (!c) return { title: "Испытание не найдено — Asyq League" };
  const who = c.by ?? "Друг";
  return {
    title: `${who} бросает тебе вызов — Asyq League`,
    description: c.sc !== undefined ? `${who} набрал ${c.sc} очков в асық ату. Сможешь лучше?` : `Испытание «${c.t}» в асық ату.`,
  };
}

export default async function ChallengePage({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;
  const c = decodeChallenge(code);
  if (!c)
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 font-display text-xl font-bold">Ссылка повреждена</h1>
        <p className="mt-2 text-sm text-muted">Не получилось прочитать испытание. Попроси друга отправить ссылку ещё раз.</p>
        <Link href="/editor" className="btn btn-primary mt-6">
          Создать своё испытание
        </Link>
      </div>
    );
  return <ChallengeClient code={code} />;
}
