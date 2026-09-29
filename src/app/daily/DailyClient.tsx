"use client";

import { useMemo } from "react";
import PlayScreen from "@/components/game/PlayScreen";
import { dailyLevel } from "@/game/daily";

export default function DailyClient({ dayKey }: { dayKey: string }) {
  const level = useMemo(
    () => ({ ...dailyLevel(dayKey), hint: "Одна расстановка для всех на сегодня. Лучший результат идёт в рейтинг дня и в копилку твоего вуза." }),
    [dayKey],
  );
  return <PlayScreen level={level} mode="daily" dayKey={dayKey} roundKey={`daily-${dayKey}`} backHref="/leaderboard" />;
}
