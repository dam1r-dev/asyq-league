"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_AVATAR, paidParts, parseAvatar, type AvatarConfig } from "@/avatar/config";
import { getLocal, updateLocal, useLocal } from "@/lib/local";
import { setSoundEnabled } from "@/lib/sound";
import { DEFAULT_FIELD, DEFAULT_SAQA, isFree } from "@/lib/catalog";
import { useT } from "@/i18n/provider";

export interface Me {
  id: string;
  username: string;
  displayName: string;
  university: string | null;
  saqaSkin: string;
  fieldSkin: string;
  avatar: AvatarConfig;
  coins: number;
  /** Дней подряд с игрой и играл ли сегодня. */
  streak: number;
  playedToday: boolean;
  owned: string[];
  progress: Record<string, { best: number; stars: number }>;
}

interface AccountCtx {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Действующие скины и персонаж: у вошедшего — из профиля, у гостя — из браузера. */
  saqaSkin: string;
  fieldSkin: string;
  avatar: AvatarConfig;
  coins: number;
  owns: (itemId: string) => boolean;
  equip: (itemId: string, kind: "saqa" | "field") => Promise<void>;
  saveAvatar: (a: AvatarConfig) => Promise<boolean>;
  /** Короткое всплывающее сообщение внизу экрана. */
  toast: (text: string) => void;
}

async function loadMe(): Promise<Me | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { me: Me | null }).me;
  } catch {
    return null;
  }
}

const Ctx = createContext<AccountCtx | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const claimedFor = useRef<string | null>(null);
  const local = useLocal();
  const t = useT();

  useEffect(() => setSoundEnabled(local.settings.sound), [local.settings.sound]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, text }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4500);
  }, []);

  const refresh = useCallback(async () => {
    setMe(await loadMe());
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    loadMe().then((m) => {
      if (!alive) return;
      setMe(m);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // После входа забираем награды за прошедшие турниры дня (один раз за сессию).
  useEffect(() => {
    if (!me || claimedFor.current === me.id) return;
    claimedFor.current = me.id;
    fetch("/api/rewards", { method: "POST" })
      .then((r) => (r.ok ? r.json() : { claimed: [] }))
      .then((d: { claimed: { day: string; rank: number; amount: number }[] }) => {
        if (!d.claimed?.length) return;
        d.claimed.forEach((c) => toast(t("coins.reward", c)));
        void refresh();
      })
      .catch(() => {});
  }, [me, refresh, t, toast]);

  const owns = useCallback((id: string) => isFree(id) || !!me?.owned.includes(id), [me]);

  const equip = useCallback(
    async (itemId: string, kind: "saqa" | "field") => {
      updateLocal((d) => ({ ...d, settings: { ...d.settings, [kind]: itemId } }));
      if (me) {
        await fetch("/api/me", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(kind === "saqa" ? { saqaSkin: itemId } : { fieldSkin: itemId }),
        });
        await refresh();
      }
    },
    [me, refresh],
  );

  const saveAvatar = useCallback(
    async (a: AvatarConfig) => {
      if (!me) {
        // Гость хранит только бесплатные вещи.
        if (!paidParts(a).every(isFree)) return false;
        updateLocal((d) => ({ ...d, settings: { ...d.settings, avatar: a } }));
        return true;
      }
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatar: a }),
      });
      if (res.ok) await refresh();
      return res.ok;
    },
    [me, refresh],
  );

  const saqaSkin = me ? me.saqaSkin : owns(local.settings.saqa) ? local.settings.saqa : DEFAULT_SAQA;
  const fieldSkin = me ? me.fieldSkin : owns(local.settings.field) ? local.settings.field : DEFAULT_FIELD;
  const avatar = me ? me.avatar : parseAvatar(local.settings.avatar ?? DEFAULT_AVATAR);

  return (
    <Ctx.Provider
      value={{ me, loading, refresh, saqaSkin, fieldSkin, avatar, coins: me?.coins ?? 0, owns, equip, saveAvatar, toast }}
    >
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className="pop-in card border-gold/50 px-4 py-2.5 text-sm font-semibold shadow-xl">
            {x.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount вне AccountProvider");
  return ctx;
}

/** Лучший результат по уровню: максимум из браузера и профиля. */
export function useBest(levelId: string) {
  const { me } = useAccount();
  const local = useLocal();
  const l = local.levels[levelId];
  const s = me?.progress[levelId];
  return {
    best: Math.max(l?.best ?? 0, s?.best ?? 0),
    stars: Math.max(l?.stars ?? 0, s?.stars ?? 0),
  };
}

export function toggleSound() {
  const next = !getLocal().settings.sound;
  updateLocal((d) => ({ ...d, settings: { ...d.settings, sound: next } }));
  setSoundEnabled(next);
}

/** Управление сақой: стрелки ◀ ▶ или ползунок. */
export function toggleMoveControl() {
  updateLocal((d) => ({
    ...d,
    settings: { ...d.settings, moveControl: d.settings.moveControl === "slider" ? "buttons" : "slider" },
  }));
}
