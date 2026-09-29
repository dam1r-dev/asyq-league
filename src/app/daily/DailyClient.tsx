"use client";

import { useMemo } from "react";
import PlayScreen from "@/components/game/PlayScreen";
import { dailyLevel } from "@/game/daily";
import { useT } from "@/i18n/provider";

export default function DailyClient({ dayKey }: { dayKey: string }) {
  const t = useT();
  const level = useMemo(() => dailyLevel(dayKey), [dayKey]);
  return (
    <PlayScreen
      level={level}
      mode="daily"
      dayKey={dayKey}
      roundKey={`daily-${dayKey}`}
      backHref="/leaderboard"
      hint={t("lvl.daily.hint")}
    />
  );
}
