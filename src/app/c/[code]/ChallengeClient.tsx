"use client";

import { useMemo } from "react";
import PlayScreen from "@/components/game/PlayScreen";
import { challengeToLevel, decodeChallenge } from "@/game/custom";
import { hashString } from "@/game/rng";

export default function ChallengeClient({ code }: { code: string }) {
  const c = useMemo(() => decodeChallenge(code)!, [code]);
  const level = useMemo(() => {
    const l = challengeToLevel(c);
    const who = c.by ?? "Автор";
    return {
      ...l,
      hint:
        c.sc !== undefined
          ? `${who} набрал ${c.sc} очков${c.th ? ` за ${c.th} бросков` : ""}. Обгони!`
          : "Авторская расстановка. Выбей всё за отведённые броски.",
    };
  }, [c]);
  return (
    <PlayScreen
      level={level}
      mode="custom"
      roundKey={`custom-${hashString(code)}`}
      backHref="/editor"
      challenge={{ by: c.by, sc: c.sc, th: c.th, code }}
    />
  );
}
