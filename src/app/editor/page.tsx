"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { ASYK_R, DEFAULT_KON, DEFAULT_LINE_Y, WORLD_H, WORLD_W } from "@/game/constants";
import { encodeChallenge, MAX_CUSTOM_ASYKS, MAX_CUSTOM_STONES, validLayout } from "@/game/custom";
import { drawBone, drawStone, initialAngle, renderFieldLayer } from "@/game/render";
import type { LevelDef, Point, Stone } from "@/game/types";
import { fieldLook } from "@/lib/catalog";
import { useT } from "@/i18n/provider";

type Tool = "asyk" | "stone" | "erase";
const STONE_R = 14;

const PRESET: Point[] = Array.from({ length: 7 }, (_, i) => ({ x: 200 - 3 * 24 + i * 24, y: 250 }));

export default function EditorPage() {
  const { me, fieldSkin } = useAccount();
  const t = useT();
  const [asyks, setAsyks] = useState<Point[]>(PRESET);
  const [stones, setStones] = useState<Stone[]>([]);
  const [tool, setTool] = useState<Tool>("asyk");
  const [throws, setThrows] = useState(6);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Показываем только верхнюю часть поля с коном — её и редактируем.
  const VIEW = { y0: 60, h: 400 };
  const height = (width / WORLD_W) * VIEW.h;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = width / WORLD_W;
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d")!;
    const level: LevelDef = {
      id: "editor",
      title: "",
      subtitle: "",
      kon: DEFAULT_KON,
      lineY: DEFAULT_LINE_Y,
      asyks: [],
      stones: [],
      throws: 1,
      par2: 1,
      par3: 1,
    };
    const bg = renderFieldLayer(level, fieldLook(fieldSkin), scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, -VIEW.y0 * scale * dpr);
    ctx.drawImage(bg, 0, 0, WORLD_W, WORLD_H);
    stones.forEach((s) => drawStone(ctx, s));
    asyks.forEach((a, i) => drawBone(ctx, a.x, a.y, ASYK_R, initialAngle(i + 1)));
  }, [asyks, stones, width, height, fieldSkin, VIEW.y0]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = {
      x: Math.round(((e.clientX - rect.left) / rect.width) * WORLD_W),
      y: Math.round(((e.clientY - rect.top) / rect.height) * VIEW.h + VIEW.y0),
    };
    setMessage(null);
    const hitAsyk = asyks.findIndex((a) => Math.hypot(a.x - p.x, a.y - p.y) < ASYK_R + 4);
    const hitStone = stones.findIndex((s) => Math.hypot(s.x - p.x, s.y - p.y) < s.r + 4);
    if (tool === "erase" || hitAsyk >= 0 || hitStone >= 0) {
      // Нажатие по фигуре — удаляет её (удобно на телефоне без отдельного ластика).
      if (hitAsyk >= 0) setAsyks(asyks.filter((_, i) => i !== hitAsyk));
      else if (hitStone >= 0) setStones(stones.filter((_, i) => i !== hitStone));
      return;
    }
    if (tool === "asyk") {
      if (asyks.length >= MAX_CUSTOM_ASYKS) return setMessage(t("editor.maxAsyks", { n: MAX_CUSTOM_ASYKS }));
      const next = [...asyks, p];
      if (!validLayout(next, stones)) return setMessage(t("editor.badAsyk"));
      setAsyks(next);
    } else {
      if (stones.length >= MAX_CUSTOM_STONES) return setMessage(t("editor.maxStones", { n: MAX_CUSTOM_STONES }));
      const next = [...stones, { ...p, r: STONE_R }];
      if (!validLayout(asyks, next)) return setMessage(t("editor.badStone"));
      setStones(next);
    }
  };

  const code = () =>
    encodeChallenge({
      t: title.trim() || t("lvl.custom.title"),
      a: asyks.map((p) => [p.x, p.y]),
      s: stones.map((s) => [s.x, s.y, s.r]),
      n: throws,
      by: me?.displayName,
    });

  const share = async () => {
    if (!asyks.length) return setMessage(t("editor.needAsyk"));
    const url = `${window.location.origin}/c/${code()}`;
    const text = t("editor.shareText", { asyks: t("common.asyksN", { n: asyks.length }), throws: t("common.throwsN", { n: throws }) });
    try {
      if (navigator.share) {
        await navigator.share({ title: "Asyq League", text, url });
        return;
      }
    } catch {}
    await navigator.clipboard?.writeText(`${text} ${url}`);
    setMessage(t("editor.copied"));
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-6 pb-16">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold">{t("editor.title")}</h1>
        <span className="author-badge">{t("common.authorBadge")}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{t("editor.lead")}</p>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1" role="radiogroup" aria-label={t("editor.tool")}>
        {(
          [
            ["asyk", t("editor.asyk")],
            ["stone", t("editor.stone")],
            ["erase", t("editor.erase")],
          ] as [Tool, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            role="radio"
            aria-checked={tool === t}
            onClick={() => setTool(t)}
            className={`rounded-xl py-2 text-sm font-semibold ${tool === t ? "bg-surface-2 text-text" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div ref={wrapRef} className="mt-3 overflow-hidden rounded-[20px] border border-line">
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{ width, height }}
          onPointerDown={onPointerDown}
          aria-label={t("editor.canvasAria")}
        />
      </div>
      <div className="mt-2 flex min-h-5 justify-between text-xs text-muted">
        <span>
          {t("editor.counts", { a: asyks.length, amax: MAX_CUSTOM_ASYKS, s: stones.length, smax: MAX_CUSTOM_STONES })}
        </span>
        <button className="underline" onClick={() => (setAsyks([]), setStones([]))}>
          {t("editor.clear")}
        </button>
      </div>
      {message && <p className="mt-1 text-sm text-gold">{message}</p>}

      <div className="card mt-4 grid gap-4 p-4">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">{t("editor.name")}</span>
          <input className="input" maxLength={40} placeholder={t("editor.namePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("editor.throws")}</span>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost h-9 w-9 !p-0" onClick={() => setThrows(Math.max(2, throws - 1))} aria-label={t("editor.fewer")}>
              −
            </button>
            <b className="w-6 text-center font-display">{throws}</b>
            <button className="btn btn-ghost h-9 w-9 !p-0" onClick={() => setThrows(Math.min(15, throws + 1))} aria-label={t("editor.more")}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {asyks.length ? (
          <Link href={`/c/${code()}`} className="btn btn-ghost">
            {t("editor.test")}
          </Link>
        ) : (
          <button className="btn btn-ghost" disabled>
            {t("editor.test")}
          </button>
        )}
        <button className="btn btn-primary" onClick={share} disabled={!asyks.length}>
          {t("editor.send")}
        </button>
      </div>
    </div>
  );
}
