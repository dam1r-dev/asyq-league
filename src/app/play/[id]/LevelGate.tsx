"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import PlayScreen from "@/components/game/PlayScreen";
import { getLevel } from "@/game/levels";

/** Платные испытания открываются только после (тестовой) покупки набора. */
export default function LevelGate({ levelId, nextHref }: { levelId: string; nextHref?: string }) {
  const level = getLevel(levelId)!;
  const { owns, loading } = useAccount();

  if (level.pack && !loading && !owns("pack-legends")) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 font-display text-xl font-bold">{level.title}</h1>
        <p className="mt-2 text-sm text-muted">
          Это испытание из набора «Дала аңыздары». Откройте набор в магазине (тестовый режим — без реальной оплаты).
        </p>
        <Link href="/shop" className="btn btn-primary mt-6">
          В магазин
        </Link>
      </div>
    );
  }
  if (level.pack && loading) return null;

  return <PlayScreen level={level} mode="level" roundKey={level.id} backHref="/levels" nextHref={nextHref} />;
}
