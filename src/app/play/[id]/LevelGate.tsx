"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import PlayScreen from "@/components/game/PlayScreen";
import { getLevel } from "@/game/levels";
import { useT } from "@/i18n/provider";
import { levelTitle } from "@/i18n/game";

/** Платные испытания открываются только после (тестовой) покупки набора. */
export default function LevelGate({ levelId, nextHref }: { levelId: string; nextHref?: string }) {
  const level = getLevel(levelId)!;
  const { owns, loading } = useAccount();
  const t = useT();

  if (level.pack && !loading && !owns("pack-legends")) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 font-display text-xl font-bold">{levelTitle(level, t)}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("gate.text")}
        </p>
        <Link href="/shop" className="btn btn-primary mt-6">
          {t("gate.toShop")}
        </Link>
      </div>
    );
  }
  if (level.pack && loading) return null;

  return <PlayScreen level={level} mode="level" roundKey={level.id} backHref="/levels" nextHref={nextHref} />;
}
