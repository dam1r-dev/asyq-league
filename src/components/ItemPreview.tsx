"use client";

import { useEffect, useRef } from "react";
import { fieldLook, saqaLook, type ShopItem } from "@/lib/catalog";
import { drawBone } from "@/game/render";

/** Маленькое превью предмета тем же рендером, что и в игре. */
export default function ItemPreview({ item, fieldSkin }: { item: ShopItem; fieldSkin: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 160 * dpr;
    c.height = 100 * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const field = fieldLook(item.kind === "field" ? item.id : fieldSkin);
    ctx.fillStyle = field.ground;
    ctx.fillRect(0, 0, 160, 100);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = field.speck[i % field.speck.length];
      ctx.globalAlpha = 0.6;
      ctx.fillRect((i * 53) % 160, (i * 29 + i * i) % 100, 1.5, 1.5);
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = field.chalk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80, 150, 125, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (item.kind === "pack") {
      for (let i = 0; i < 5; i++) drawBone(ctx, 40 + i * 20, 52, 9, (i - 2) * 0.2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, 160, 100);
      ctx.font = "700 26px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("🏔️", 80, 62);
      return;
    }
    for (let i = 0; i < 4; i++) drawBone(ctx, 35 + i * 20, 40, 8, (i - 1.5) * 0.25);
    drawBone(ctx, 118, 70, 16, -0.3, saqaLook(item.kind === "saqa" ? item.id : undefined));
  }, [item, fieldSkin]);
  return <canvas ref={ref} className="h-[100px] w-full rounded-xl object-cover" style={{ aspectRatio: "16/10" }} aria-hidden />;
}
