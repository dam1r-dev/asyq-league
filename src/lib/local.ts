"use client";

import { useSyncExternalStore } from "react";
import type { ThrowInput } from "@/game/types";
import { DEFAULT_FIELD, DEFAULT_SAQA } from "./catalog";
import { DEFAULT_AVATAR, type AvatarConfig } from "@/avatar/config";

/**
 * Локальное хранилище в браузере. Работает и для гостя, и как кэш для
 * вошедшего игрока. Храним только броски — очки всегда пересчитываются
 * движком, поэтому подделать рекорд правкой localStorage не выйдет:
 * сервер при синхронизации проверит броски сам.
 */

export interface LevelRecord {
  best: number;
  stars: number;
  inputs: ThrowInput[];
}

export interface HistoryEntry {
  key: string;
  title: string;
  score: number;
  stars: number;
  won: boolean;
  at: number;
}

export interface LocalData {
  levels: Record<string, LevelRecord>;
  daily: Record<string, LevelRecord>;
  history: HistoryEntry[];
  settings: {
    sound: boolean;
    saqa: string;
    field: string;
    tutorialDone: boolean;
    /** Персонаж гостя (только бесплатные части). */
    avatar: AvatarConfig;
  };
}

const KEY = "asyq:v1";

const EMPTY: LocalData = {
  levels: {},
  daily: {},
  history: [],
  settings: { sound: true, saqa: DEFAULT_SAQA, field: DEFAULT_FIELD, tutorialDone: false, avatar: DEFAULT_AVATAR },
};

let cache: LocalData | null = null;
const listeners = new Set<() => void>();

function read(): LocalData {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LocalData>) : {};
    cache = {
      ...EMPTY,
      ...parsed,
      settings: { ...EMPTY.settings, ...parsed.settings },
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: LocalData) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Приватный режим или переполнение — игра продолжает работать в памяти.
  }
  listeners.forEach((l) => l());
}

export function getLocal() {
  return read();
}

export function updateLocal(fn: (d: LocalData) => LocalData) {
  write(fn(read()));
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocal(): LocalData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Сохраняет результат, если он лучше прежнего. Возвращает true для нового рекорда. */
export function recordResult(
  bucket: "levels" | "daily",
  id: string,
  title: string,
  result: { score: number; stars: number; won: boolean; inputs: ThrowInput[] },
) {
  let isBest = false;
  updateLocal((d) => {
    const prev = d[bucket][id];
    isBest = !prev || result.score > prev.best || result.stars > prev.stars;
    const nextRecord: LevelRecord = prev
      ? {
          best: Math.max(prev.best, result.score),
          stars: Math.max(prev.stars, result.stars),
          inputs: result.score >= prev.best ? result.inputs : prev.inputs,
        }
      : { best: result.score, stars: result.stars, inputs: result.inputs };
    const entry: HistoryEntry = {
      key: id,
      title,
      score: result.score,
      stars: result.stars,
      won: result.won,
      at: Date.now(),
    };
    return {
      ...d,
      [bucket]: result.won || bucket === "daily" ? { ...d[bucket], [id]: nextRecord } : d[bucket],
      history: [entry, ...d.history].slice(0, 40),
    };
  });
  return isBest;
}

// ——— Незаконченный раунд: храним броски, чтобы продолжить после перезагрузки.

const roundKey = (id: string) => `asyq:round:${id}`;

export function loadRoundInputs(id: string): ThrowInput[] {
  try {
    const raw = window.localStorage.getItem(roundKey(id));
    return raw ? (JSON.parse(raw) as ThrowInput[]) : [];
  } catch {
    return [];
  }
}

export function saveRoundInputs(id: string, inputs: ThrowInput[]) {
  try {
    if (inputs.length) window.localStorage.setItem(roundKey(id), JSON.stringify(inputs));
    else window.localStorage.removeItem(roundKey(id));
  } catch {}
}
