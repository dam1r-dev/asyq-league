"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { useT } from "@/i18n/provider";
import Avatar from "@/avatar/Avatar";
import type { AvatarConfig } from "@/avatar/config";

type Tab = "day" | "uni" | "masters";
interface Row {
  name: string;
  university: string | null;
  value: number;
  players?: number;
  mine?: boolean;
  avatar?: AvatarConfig;
}

const TABS: { id: Tab; label: string; hint: string; unit: string }[] = [
  { id: "day", label: "leaderboard.tabDay", hint: "leaderboard.hintDay", unit: "common.points" },
  { id: "uni", label: "leaderboard.tabUni", hint: "leaderboard.hintUni", unit: "common.points" },
  { id: "masters", label: "leaderboard.tabMasters", hint: "leaderboard.hintMasters", unit: "⭐" },
];

export default function LeaderboardPage() {
  const { me } = useAccount();
  const t = useT();
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
      <h1 className="font-display text-2xl font-bold">{t("leaderboard.title")}</h1>

      <Link href="/daily" className="card mt-4 flex items-center gap-4 border-gold/40 p-4">
        <div className="text-3xl">☀️</div>
        <div className="flex-1">
          <div className="font-display font-bold">{t("leaderboard.dailyCard")}</div>
          <div className="text-sm text-muted">{t("leaderboard.dailyCardText")}</div>
        </div>
        <span className="btn btn-primary !py-2 text-sm">{t("common.play")}</span>
      </Link>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1" role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-xl py-2 text-sm font-semibold ${tab === tb.id ? "bg-surface-2 text-text" : "text-muted"}`}
          >
            {t(tb.label)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{t(info.hint)}</p>
      {tab === "day" && <p className="mt-1 text-sm font-semibold text-gold">{t("leaderboard.prizes")}</p>}

      <ol className="card mt-3 divide-y divide-line">
        {!rows && <li className="p-4 text-sm text-muted">{t("common.loading")}</li>}
        {rows?.length === 0 && (
          <li className="p-6 text-center text-sm text-muted">
            {data?.offline
              ? t("leaderboard.offline")
              : tab === "uni"
                ? t("leaderboard.emptyUni")
                : t("leaderboard.empty")}
          </li>
        )}
        {rows?.map((r, i) => {
          const mine = tab === "uni" ? me?.university === r.name : !!r.mine;
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
              {r.avatar && <Avatar config={r.avatar} variant="head" className="relative h-9 w-9 shrink-0 rounded-full bg-surface-2" />}
              <div className="relative min-w-0 flex-1">
                <div className="truncate font-semibold">
                  {r.name === "Другой" ? t("uni.other") : r.name}
                  {mine && <span className="ml-2 text-xs text-gold">{t("leaderboard.you")}</span>}
                </div>
                {(r.university && tab !== "uni") || r.players ? (
                  <div className="text-xs text-muted">{tab === "uni" ? t("leaderboard.players", { n: r.players ?? 0 }) : r.university === "Другой" ? t("uni.other") : r.university}</div>
                ) : null}
              </div>
              <b className="relative font-display">
                {r.value} <span className="text-xs font-normal text-muted">{info.unit.includes(".") ? t(info.unit) : info.unit}</span>
              </b>
            </li>
          );
        })}
      </ol>

      {!me && (
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/auth" className="text-gold underline">
            {t("leaderboard.loginPrompt1")}
          </Link>
          {t("leaderboard.loginPrompt2")}
        </p>
      )}
    </div>
  );
}
