"use client";

import { useMemo } from "react";
import PlayScreen from "@/components/game/PlayScreen";
import { challengeToLevel, decodeChallenge } from "@/game/custom";
import { hashString } from "@/game/rng";
import { useT } from "@/i18n/provider";

export default function ChallengeClient({ code }: { code: string }) {
  const t = useT();
  const c = useMemo(() => decodeChallenge(code)!, [code]);
  const level = useMemo(() => challengeToLevel(c), [c]);
  const who = c.by ?? t("common.author");
  const hint =
    c.sc !== undefined
      ? c.th
        ? t("lvl.custom.hintScoreThrows", { name: who, score: c.sc, throws: t("common.throwsN", { n: c.th }) })
        : t("lvl.custom.hintScore", { name: who, score: c.sc })
      : t("lvl.custom.hint");
  return (
    <PlayScreen
      level={level}
      mode="custom"
      roundKey={`custom-${hashString(code)}`}
      backHref="/editor"
      challenge={{ by: c.by, sc: c.sc, th: c.th, code }}
      hint={hint}
    />
  );
}
