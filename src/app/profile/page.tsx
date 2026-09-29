"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { ALL_LEVELS, getLevel, LEVELS } from "@/game/levels";
import { getItem } from "@/lib/catalog";
import { UNIVERSITIES } from "@/lib/universities";
import { useI18n } from "@/i18n/provider";
import { levelSubtitle } from "@/i18n/game";
import { LANG_LOCALE } from "@/i18n/config";

interface HistoryData {
  recent: {
    id: string;
    kind: string;
    levelId: string;
    dayKey: string | null;
    score: number;
    stars: number;
    won: boolean;
    throwsUsed: number;
    knocked: number;
    createdAt: string;
  }[];
  totals: { rounds: number; wins: number; knocked: number; throws: number };
}

export default function ProfilePage() {
  const router = useRouter();
  const { me, loading, refresh } = useAccount();
  const { t, lang } = useI18n();
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setHistory(d));
    return () => {
      alive = false;
    };
  }, [me]);

  if (loading) return <div className="p-8 text-center text-muted">{t("common.loading")}</div>;
  if (!me)
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <div className="text-5xl">🎯</div>
        <h1 className="mt-4 font-display text-xl font-bold">{t("profile.guestTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("profile.guestText")}</p>
        <Link href="/auth" className="btn btn-primary mt-6">
          {t("profile.guestButton")}
        </Link>
      </div>
    );

  const stars = LEVELS.reduce((s, l) => s + (me.progress[l.id]?.stars ?? 0), 0);
  const cleared = LEVELS.filter((l) => (me.progress[l.id]?.stars ?? 0) > 0).length;
  const next = LEVELS.find((l) => !me.progress[l.id]);

  const updateUniversity = async (university: string) => {
    setSaving(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ university: university || null }),
    });
    await refresh();
    setSaving(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
  };

  const totals = history?.totals;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{me.displayName}</h1>
          <p className="text-sm text-muted">@{me.username}</p>
        </div>
        <button className="btn btn-ghost !py-2 text-sm" onClick={logout}>
          {t("profile.logout")}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={t("profile.stars")} value={`${stars}/36`} accent />
        <Tile label={t("profile.cleared")} value={`${cleared}/12`} />
        <Tile label={t("profile.knocked")} value={totals ? totals.knocked : "…"} />
        <Tile label={t("profile.perThrow")} value={totals && totals.throws ? (totals.knocked / totals.throws).toFixed(2) : "…"} />
      </div>

      <div className="card mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="font-semibold">{t("profile.university")}</div>
          <div className="text-sm text-muted">{t("profile.universityText")}</div>
        </div>
        <select className="input sm:w-56" value={me.university ?? ""} disabled={saving} onChange={(e) => updateUniversity(e.target.value)}>
          <option value="">{t("auth.noUniversity")}</option>
          {UNIVERSITIES.map((u) => (
            <option key={u} value={u}>
              {u === "Другой" ? t("uni.other") : u}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-4 flex items-center gap-3 p-4">
        <div className="flex-1 text-sm">
          <div className="font-semibold">{t("profile.gear")}</div>
          <div className="text-muted">
            {getItem(me.saqaSkin)?.name} · {getItem(me.fieldSkin)?.name}
          </div>
        </div>
        <Link href="/shop" className="btn btn-ghost !py-2 text-sm">
          {t("profile.change")}
        </Link>
      </div>

      {next && (
        <Link href={`/play/${next.id}`} className="card mt-4 flex items-center gap-3 border-gold/40 p-4">
          <div className="flex-1">
            <div className="text-xs text-muted">{t("profile.nextGoal")}</div>
            <div className="font-display font-bold">{next.title}</div>
            <div className="text-sm text-muted">{levelSubtitle(next, t)}</div>
          </div>
          <span className="btn btn-primary !py-2 text-sm">{t("common.play")}</span>
        </Link>
      )}

      <h2 className="mt-8 font-display text-lg font-bold">{t("profile.records")}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ALL_LEVELS.filter((l) => me.progress[l.id]).map((l) => (
          <Link key={l.id} href={`/play/${l.id}`} className="card flex items-center justify-between px-4 py-2.5 text-sm hover:border-gold/40">
            <span className="font-semibold">{l.title}</span>
            <span className="text-muted">
              {"⭐".repeat(me.progress[l.id].stars)} <b className="ml-1 text-gold">{me.progress[l.id].best}</b>
            </span>
          </Link>
        ))}
        {Object.keys(me.progress).length === 0 && <p className="text-sm text-muted">{t("profile.noRecords")}</p>}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">{t("profile.history")}</h2>
      <div className="card mt-3 divide-y divide-line">
        {!history && <p className="p-4 text-sm text-muted">{t("common.loading")}</p>}
        {history?.recent.length === 0 && <p className="p-4 text-sm text-muted">{t("profile.noHistory")}</p>}
        {history?.recent.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${a.won ? "bg-good" : "bg-bad"}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">
                {a.kind === "daily" ? t("profile.dailyRow", { day: a.dayKey ?? "" }) : (getLevel(a.levelId)?.title ?? a.levelId)}
              </div>
              <div className="text-xs text-muted">
                {new Date(a.createdAt).toLocaleString(LANG_LOCALE[lang], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ·{" "}
                {t("profile.historyLine", { knocked: a.knocked, throws: a.throwsUsed })}
              </div>
            </div>
            <span className="text-xs">{"⭐".repeat(a.stars)}</span>
            <b className="w-8 text-right text-gold">{a.score}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-3">
      <div className={`font-display text-xl font-bold ${accent ? "text-gold" : ""}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
