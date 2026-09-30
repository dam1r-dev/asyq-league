"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { duelLevel, DUEL_LEVEL, THROWS_BY_MODE, duelThrow, initDuel, type DuelConfig, type DuelState } from "@/game/duel";
import type { ThrowInput } from "@/game/types";
import { errorText, sideName } from "@/i18n/game";
import { useT } from "@/i18n/provider";
import { sfx } from "@/lib/sound";
import { useIsClient } from "@/lib/useIsClient";
import { useLocal } from "@/lib/local";
import GameCanvas from "./GameCanvas";
import GameToolbar from "./GameToolbar";

/** Состояние матча, как его отдаёт сервер. */
interface Srv {
  code: string;
  status: "waiting" | "playing" | "finished";
  hostName: string;
  guestName: string | null;
  mode: "classic" | "five";
  field: string | null;
  inputs: ThrowInput[];
  winner: number | null;
  endReason: "played" | "timeout" | "left" | "expired" | null;
  lastMoveAt: number;
  now: number;
  turnSeconds: number;
}

interface Creds {
  token: string;
  seat: 0 | 1;
}

const credKey = (code: string) => `asyq:match:${code}`;

export function saveCreds(code: string, c: Creds) {
  try {
    localStorage.setItem(credKey(code), JSON.stringify(c));
  } catch {}
}

function loadCreds(code: string): Creds | null {
  try {
    const raw = localStorage.getItem(credKey(code));
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}

function replay(names: [string, string], inputs: ThrowInput[], config: DuelConfig): DuelState {
  return inputs.reduce((d, i) => duelThrow(d, i), initDuel(names, config));
}

export default function OnlineDuel({ code }: { code: string }) {
  const isClient = useIsClient();
  if (!isClient) return <div className="h-[calc(100dvh-56px)]" />;
  return <Match code={code} />;
}

function Match({ code }: { code: string }) {
  const t = useT();
  const local = useLocal();
  const { me, saqaSkin, fieldSkin, toast } = useAccount();

  const [creds, setCreds] = useState<Creds | null>(() => loadCreds(code));
  const [srv, setSrv] = useState<Srv | null>(null);
  const [gone, setGone] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const [joinName, setJoinName] = useState("");
  const [busy, setBusy] = useState(false);

  // «Оптимистичный» список бросков: мой бросок виден сразу, до ответа сервера.
  const [mine, setMine] = useState<ThrowInput[]>([]);
  const [applied, setApplied] = useState(0);
  const [remote, setRemote] = useState<{ id: number; input: ThrowInput } | null>(null);
  const remoteIdx = useRef<number | null>(null);

  const list = useMemo(() => (srv && srv.inputs.length >= mine.length ? srv.inputs : mine), [srv, mine]);
  const names: [string, string] = [srv?.hostName ?? "", srv?.guestName ?? "…"];
  const config = useMemo<DuelConfig>(() => ({ mode: srv?.mode ?? "classic", field: srv?.field ?? null }), [srv?.mode, srv?.field]);
  const level = useMemo(() => duelLevel(config.field) ?? DUEL_LEVEL, [config]);
  const duel = useMemo(() => replay(names, list.slice(0, applied), config), [list, applied, srv?.hostName, srv?.guestName, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = useRef({ list, applied, duel });
  useLayoutEffect(() => {
    latest.current = { list, applied, duel };
  });

  // ——— Опрос сервера
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/match/${code}`, { cache: "no-store" });
      if (r.status === 404) {
        setGone(true);
        return null;
      }
      const d = (await r.json()) as Srv;
      setOffset(d.now - Date.now());
      setSrv(d);
      return d;
    } catch {
      return null;
    }
  }, [code]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      if (!alive) return;
      const d = await refresh();
      if (!alive || d?.status === "finished") return;
      timer = setTimeout(loop, document.hidden ? 5000 : 900);
    };
    void loop();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [refresh]);

  // Секундный таймер для обратного отсчёта хода.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ——— Броски соперника: проигрываем по одному, с анимацией
  const advance = useCallback(() => {
    const { list: l, applied: a } = latest.current;
    if (remoteIdx.current !== null) return;
    const pending = l.length - a;
    if (pending <= 0) return;
    let idx = a;
    if (pending > 2) {
      // Если пропустили много ходов, догоняем без анимации, кроме последнего.
      idx = l.length - 1;
      setApplied(idx);
    }
    remoteIdx.current = idx;
    setRemote({ id: idx, input: l[idx] });
  }, []);

  useEffect(() => {
    const id = setTimeout(advance, 0);
    return () => clearTimeout(id);
  }, [list.length, applied, remote, advance]);

  const seat = creds?.seat ?? null;

  const postThrow = async (input: ThrowInput, expected: number) => {
    try {
      const r = await fetch(`/api/match/${code}/throw`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: creds!.token, input, expected }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(errorText(d.error, t, t("play.netError")));
      setSrv(d as Srv);
    } catch (e) {
      toast(e instanceof Error ? e.message : t("play.netError"));
      setMine([]);
      const d = await refresh();
      if (d) setApplied(d.inputs.length);
    }
  };

  const onThrowEnd = (input: ThrowInput) => {
    const { list: l, duel: current } = latest.current;
    const next = duelThrow(current, input);
    if (next.last?.result.penalty) sfx.penalty();
    if (remoteIdx.current !== null) {
      // Закончилась анимация броска соперника.
      const idx = remoteIdx.current;
      remoteIdx.current = null;
      setRemote(null);
      setApplied(idx + 1);
      return;
    }
    // Мой бросок: применяем сразу и отправляем на сервер.
    const expected = l.length;
    const nextList = [...l, input];
    setMine(nextList);
    setApplied(nextList.length);
    void postThrow(input, expected);
  };

  // ——— Вход и выход
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`/api/match/${code}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: joinName.trim() || me?.displayName || t("duel.p2Default") }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(errorText(d.error, t, t("play.netError")));
      const c = { token: d.token as string, seat: d.seat as 0 | 1 };
      saveCreds(code, c);
      setCreds(c);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("play.netError"));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!creds) return;
    if (srv?.status === "playing" && !window.confirm(t("online.resignConfirm"))) return;
    const r = await fetch(`/api/match/${code}/leave`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: creds.token }),
    });
    if (r.ok) setSrv((await r.json()) as Srv);
  };

  const link = typeof window !== "undefined" ? `${window.location.origin}/m/${code}` : "";
  const shareLink = async () => {
    const text = t("online.shareText");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Asyq League", text, url: link });
        return;
      }
    } catch {
      // пользователь закрыл диалог — копируем
    }
    await navigator.clipboard?.writeText(`${text} ${link}`);
    toast(t("online.copied"));
  };

  // ——— Экраны
  if (gone) return <Notice icon="🤔" title={t("online.notFound")} />;
  if (!srv) return <div className="p-10 text-center text-muted">{t("common.loading")}</div>;

  if (!creds) {
    if (srv.status !== "waiting") return <Notice icon="🚪" title={t("online.full")} />;
    return (
      <div className="mx-auto w-full max-w-sm px-4 pt-10 pb-16">
        <div className="text-center text-5xl">⚔️</div>
        <h1 className="mt-3 text-center font-display text-xl font-bold">{t("online.joinTitle", { name: srv.hostName })}</h1>
        <p className="mt-2 text-center text-sm text-muted">{t("online.joinText", { n: THROWS_BY_MODE[srv.mode] })}</p>
        <p className="mt-2 text-center text-xs text-muted">
          {srv.mode === "five" ? t("duel.modeFive") : t("duel.modeClassic")} ·{" "}
          {srv.field ? t("duel.fieldCustom") : t("duel.fieldStd")}
        </p>
        <form onSubmit={join} className="card mt-6 grid gap-3 p-5">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">{t("online.yourName")}</span>
            <input
              className="input"
              maxLength={16}
              placeholder={me?.displayName ?? t("duel.p2Default")}
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "…" : t("online.joinBtn")}
          </button>
        </form>
      </div>
    );
  }

  if (srv.status === "waiting") {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-10 pb-16 text-center">
        <div className="text-5xl">⏳</div>
        <h1 className="mt-3 font-display text-2xl font-bold">{t("online.waitingTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("online.waitingText")}</p>
        <div className="card mt-6 break-all p-4 font-mono text-sm">{link}</div>
        <div className="mt-3 grid gap-2">
          <button className="btn btn-primary" onClick={shareLink}>
            {t("online.share")}
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard?.writeText(link);
              toast(t("online.copied"));
            }}
          >
            {t("online.copy")}
          </button>
          <button className="btn btn-ghost !text-muted" onClick={leave}>
            {t("online.cancel")}
          </button>
        </div>
        <p className="mt-4 text-xs text-muted">
          {t("online.code")}: <b className="font-mono tracking-widest text-text">{code}</b>
        </p>
      </div>
    );
  }

  // ——— Игра
  const playing = srv.status === "playing";
  const caughtUp = applied >= list.length && remote === null;
  const myTurn = playing && seat === duel.turn && caughtUp && duel.status === "playing";
  const oppName = seat === 0 ? names[1] : names[0];
  const turnName = duel.names[duel.turn];
  const over = srv.status === "finished" && caughtUp;
  const secondsLeft = Math.max(
    0,
    srv.turnSeconds - Math.floor((nowMs + offset - srv.lastMoveAt) / 1000),
  );

  const result = srv.winner === -1 ? "draw" : srv.winner === seat ? "win" : srv.winner === null ? "closed" : "lose";

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px)] w-full max-w-[560px] flex-col px-3 pb-3 lg:max-w-6xl lg:flex-row-reverse lg:gap-6 lg:pt-3">
      <aside className="flex flex-col lg:w-[340px] lg:shrink-0">
        <div className="flex items-center gap-3 py-2">
          <Link href="/duel" className="btn btn-ghost h-10 w-10 !p-0" aria-label={t("common.back")}>
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[15px] font-bold leading-tight">{t("online.title")}</div>
            <div className="truncate text-xs text-muted">{code}</div>
          </div>
          {playing && (
            <button className="btn btn-ghost !px-3 !py-2 text-xs" onClick={leave}>
              🏳️ {t("online.resign")}
            </button>
          )}
        </div>

        <GameToolbar />

        <div className="grid grid-cols-2 gap-2 pb-2">
          {[0, 1].map((p) => {
            const active = playing && duel.turn === p;
            return (
              <div key={p} className={`card px-3 py-2 transition-colors ${active ? "border-gold bg-surface-2" : "opacity-80"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {active && "▶ "}
                    {names[p]}
                    {seat === p && <span className="ml-1 text-xs font-normal text-gold">({t("online.you")})</span>}
                  </span>
                  <span className="font-display text-xl font-bold text-gold">{duel.scores[p]}</span>
                </div>
                <div className="mt-1 flex gap-1">
                  {Array.from({ length: duel.throwsEach }, (_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i < duel.throwsLeft[p] ? "bg-gold/80" : "bg-line"}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-2 min-h-[44px]" aria-live="polite">
          {playing && (
            <div
              key={list.length}
              className={`pop-in card px-3 py-2 text-center text-sm ${myTurn ? "border-gold/60" : ""}`}
            >
              {duel.last && (
                <div className="text-xs text-muted">
                  {duel.names[duel.last.player]}:{" "}
                  {duel.last.result.knockedIds.length
                    ? t("duel.knocked", {
                        n: duel.last.result.knockedIds.length,
                        sides: duel.last.result.sides.map((x) => sideName(x, t)).join(", "),
                      })
                    : t("duel.miss")}
                  {duel.last.result.penalty ? t("duel.penalty") : ""}
                </div>
              )}
              <span className="font-bold text-gold">{myTurn ? t("online.yourTurn") : t("online.oppTurn", { name: turnName })}</span>
              {caughtUp && <span className="text-muted"> · {t("online.timeLeft", { n: secondsLeft })}</span>}
            </div>
          )}
        </div>
      </aside>

      <div className="relative min-h-0 flex-1">
        <GameCanvas
          level={level}
          asyks={duel.field.asyks}
          disabled={!myTurn}
          saqaSkin={saqaSkin}
          fieldSkin={fieldSkin}
          moveControl={local.settings.moveControl ?? "buttons"}
          remoteThrow={remote}
          onThrowEnd={onThrowEnd}
        />
      </div>

      {over && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 backdrop-blur-sm sm:items-center">
          <div className="pop-in card w-full max-w-[400px] p-6 text-center" role="dialog" aria-modal="true">
            <div className="text-5xl">{result === "win" ? "🏆" : result === "draw" ? "🤝" : result === "lose" ? "😔" : "🚪"}</div>
            <h2 className="mt-3 font-display text-2xl font-bold">{t(`online.result.${result}`)}</h2>
            {srv.endReason && srv.endReason !== "played" && (
              <p className="mt-1 text-sm text-muted">{t(`online.reason.${srv.endReason}${result === "lose" && srv.endReason === "left" ? "Me" : ""}`)}</p>
            )}
            <p className="mt-2 text-muted">
              {names[0]} {duel.scores[0]} : {duel.scores[1]} {names[1]}
            </p>
            <p className="mt-1 text-xs text-muted">{oppName}</p>
            <div className="mt-6 grid gap-2">
              <Link href="/duel" className="btn btn-primary">
                {t("online.newMatch")}
              </Link>
              <Link href="/" className="btn btn-ghost">
                {t("common.menu")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Notice({ icon, title }: { icon: string; title: string }) {
  const t = useT();
  return (
    <div className="mx-auto mt-16 max-w-sm px-4 text-center">
      <div className="text-5xl">{icon}</div>
      <h1 className="mt-4 font-display text-xl font-bold">{title}</h1>
      <Link href="/duel" className="btn btn-primary mt-6">
        {t("online.newMatch")}
      </Link>
    </div>
  );
}
