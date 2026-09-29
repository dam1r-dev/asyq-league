"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getLocal, updateLocal, useLocal } from "@/lib/local";
import { setSoundEnabled } from "@/lib/sound";
import { DEFAULT_FIELD, DEFAULT_SAQA, isFree } from "@/lib/catalog";

export interface Me {
  id: string;
  username: string;
  displayName: string;
  university: string | null;
  saqaSkin: string;
  fieldSkin: string;
  owned: string[];
  progress: Record<string, { best: number; stars: number }>;
}

interface AccountCtx {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Действующие скины: у вошедшего — из профиля, у гостя — из браузера. */
  saqaSkin: string;
  fieldSkin: string;
  owns: (itemId: string) => boolean;
  equip: (itemId: string, kind: "saqa" | "field") => Promise<void>;
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
  const local = useLocal();

  useEffect(() => setSoundEnabled(local.settings.sound), [local.settings.sound]);

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

  const saqaSkin = me ? me.saqaSkin : owns(local.settings.saqa) ? local.settings.saqa : DEFAULT_SAQA;
  const fieldSkin = me ? me.fieldSkin : owns(local.settings.field) ? local.settings.field : DEFAULT_FIELD;

  return (
    <Ctx.Provider value={{ me, loading, refresh, saqaSkin, fieldSkin, owns, equip }}>{children}</Ctx.Provider>
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
