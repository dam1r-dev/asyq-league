import { almatyDayKey } from "@/game/daily";
import DailyClient from "./DailyClient";

export const dynamic = "force-dynamic";

export default function DailyPage() {
  // Дата берётся на сервере по времени Алматы — у всех один и тот же день.
  const dayKey = almatyDayKey();
  return <DailyClient dayKey={dayKey} />;
}
