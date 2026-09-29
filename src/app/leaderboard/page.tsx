"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";

type Tab = "day" | "uni" | "masters";
interface Row {
  name: string;
  university: string | null;
  value: number;
  extra?: string;
  userId?: string;
}

const TABS: { id: Tab; label: string; hint: string; unit: string }[] = [
  { id: "day", label: "Күн сынағы", hint: "Лучший результат каждого игрока в сегодняшнем испытании.", unit: "очк." },
  {
    id: "uni",
    label: "Лига вузов",
    hint: "Сумма лучших результатов студентов в испытаниях дня за последние 7 дней. Чем больше однокурсников играет каждый день — тем выше вуз.",
    unit: "очк.",
  },
  { id: "masters", label: "Мастера", hint: "Сумма звёзд в 12 основных испытаниях.", unit: "⭐" },
];

export default function LeaderboardPage() {
  const { me } = useAccount();
  const [tab, setTab] = useState<Tab>("day");
  const [data, setData] = useState<{ tab: Tab; rows: Row[]; offline?: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/leaderboard?type=${tab}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setData({ tab, rows: d.rows ?? [], offline: d.offline }))
      .catch(() => alive && setData({ tab, rows: [], offline: true }));
    return () => {
      alive = false;
    };
  }, [tab]);

  const rows = data?.tab === tab ? data.rows : null;
  const info = TABS.find((t) => t.id === tab)!;
  const max = Math.max(1, ...(rows ?? []).map((r) => r.value));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16">
      <h1 className="font-display text-2xl font-bold">Рейтинг</h1>

      <Link href="/daily" className="card mt-4 flex items-center gap-4 border-gold/40 p-4">
        <div className="text-3xl">☀️</div>
        <div className="flex-1">
          <div className="font-display font-bold">Испытание дня</div>
          <div className="text-sm text-muted">Новая расстановка каждый день в 00:00 по Алматы. Играй сколько угодно — в зачёт идёт лучший.</div>
        </div>
        <span className="btn btn-primary !py-2 text-sm">Играть</span>
      </Link>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl py-2 text-sm font-semibold ${tab === t.id ? "bg-surface-2 text-text" : "text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{info.hint}</p>

      <ol className="card mt-3 divide-y divide-line">
        {!rows && <li className="p-4 text-sm text-muted">Загрузка…</li>}
        {rows?.length === 0 && (
          <li className="p-6 text-center text-sm text-muted">
            {data?.offline
              ? "Рейтинг временно недоступен."
              : tab === "uni"
                ? "Пока ни один вуз не набрал очков. Выбери университет в профиле и сыграй испытание дня!"
                : "Здесь пока пусто — стань первым!"}
          </li>
        )}
        {rows?.map((r, i) => {
          const mine = tab === "uni" ? me?.university === r.name : me?.id === r.userId;
          return (
            <li key={`${r.name}-${i}`} className={`relative flex items-center gap-3 px-4 py-3 ${mine ? "bg-gold/10" : ""}`}>
              <span
                className="absolute inset-y-0 left-0 bg-gold/5"
                style={{ width: `${(r.value / max) * 100}%` }}
                aria-hidden
              />
              <span className={`relative w-7 font-display font-bold ${i < 3 ? "text-gold" : "text-muted"}`}>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
              </span>
              <div className="relative min-w-0 flex-1">
                <div className="truncate font-semibold">
                  {r.name}
                  {mine && <span className="ml-2 text-xs text-gold">это ты</span>}
                </div>
                {(r.university && tab !== "uni") || r.extra ? (
                  <div className="text-xs text-muted">{tab === "uni" ? r.extra : r.university}</div>
                ) : null}
              </div>
              <b className="relative font-display">
                {r.value} <span className="text-xs font-normal text-muted">{info.unit}</span>
              </b>
            </li>
          );
        })}
      </ol>

      {!me && (
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/auth" className="text-gold underline">
            Войди
          </Link>
          , чтобы твои результаты попадали в рейтинг.
        </p>
      )}
    </div>
  );
}
