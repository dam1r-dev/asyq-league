import { ASYK_R } from "@/game/constants";
import { drawBone, drawPuddle, drawStone, initialAngle } from "@/game/render";
import type { LevelDef } from "@/game/types";

/**
 * Картинка для шаринга (1080×1350, формат 4:5 для Telegram и Instagram).
 * Рисуется прямо в браузере: шрифт сайта уже загружен, поэтому кириллица
 * и казахские буквы выглядят так же, как в игре, а сервер не нужен.
 */

export interface CardInput {
  title: string;
  subtitle?: string;
  /** Если задан — рисуем расстановку этого испытания. */
  level?: LevelDef;
  /** Звёзды (0..starsMax); при starsMax = 0 ряд звёзд не рисуется. */
  stars: number;
  starsMax: number;
  big: string;
  bigLabel: string;
  chips: string[];
  cta: string;
  url: string;
}

const W = 1080;
const H = 1350;
const GOLD = "#f2b441";

function fontFamily() {
  return getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim() || "system-ui, sans-serif";
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Подбирает размер шрифта так, чтобы строка влезла в maxW. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number, family: string) {
  let s = size;
  for (; s > 28; s -= 2) {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
  }
  return s;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(c: CardInput): Promise<Blob> {
  const family = fontFamily();
  try {
    // Шрифт подгружается по кускам (latin / cyrillic) — просим нужные начертания заранее.
    await Promise.all([
      document.fonts.load(`800 40px ${family}`, "Қазақша Русский Latin ҚӘІҢҒҮҰӨҺ"),
      document.fonts.load(`600 30px ${family}`, "Қазақша Русский Latin"),
    ]);
  } catch {}

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Фон и рамка
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1c1712");
  bg.addColorStop(1, "#33281b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 640, 60, W / 2, 640, 620);
  glow.addColorStop(0, "rgba(242,180,65,0.22)");
  glow.addColorStop(1, "rgba(242,180,65,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(242,180,65,0.55)";
  ctx.lineWidth = 6;
  roundRect(ctx, 30, 30, W - 60, H - 60, 44);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Шапка: косточки по бокам названия, вплотную к тексту
  ctx.fillStyle = GOLD;
  ctx.font = `800 54px ${family}`;
  const logoW = ctx.measureText("Asyq League").width;
  drawBone(ctx, W / 2 - logoW / 2 - 52, 108, 26, -0.25);
  drawBone(ctx, W / 2 + logoW / 2 + 52, 108, 26, 0.25);
  ctx.fillText("Asyq League", W / 2, 124);

  // Название и подпись
  ctx.fillStyle = "#fff6e4";
  const ts = fit(ctx, c.title, 800, 76, 900, family);
  ctx.font = `800 ${ts}px ${family}`;
  ctx.fillText(c.title, W / 2, 226);
  let y = 226;
  if (c.subtitle) {
    ctx.font = `600 34px ${family}`;
    ctx.fillStyle = "#cdbfa8";
    for (const line of wrap(ctx, c.subtitle, 880, 2)) {
      y += 46;
      ctx.fillText(line, W / 2, y);
    }
  }

  // Расстановка испытания (приближена к тому, что на поле)
  const top = y + 28;
  const boxH = 470;
  const cx = W / 2;
  const cy = top + boxH / 2;
  if (c.level) {
    const lv = c.level;
    const reach = Math.max(
      ...lv.asyks.map((a) => Math.hypot(a.x - lv.kon.x, a.y - lv.kon.y) + ASYK_R),
      ...lv.stones.map((st) => Math.hypot(st.x - lv.kon.x, st.y - lv.kon.y) + st.r),
      ...(lv.puddles ?? []).map((w) => Math.hypot(w.x - lv.kon.x, w.y - lv.kon.y) + w.r),
    );
    const extent = Math.min(lv.kon.r + 22, Math.max(reach + 36, lv.kon.r * 0.55));
    const k = boxH / 2 / extent;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, boxH / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#2a241d";
    ctx.fillRect(cx - boxH / 2, cy - boxH / 2, boxH, boxH);
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.translate(-lv.kon.x, -lv.kon.y);
    for (const w of lv.puddles ?? []) drawPuddle(ctx, w);
    ctx.beginPath();
    ctx.arc(lv.kon.x, lv.kon.y, lv.kon.r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(244,239,230,0.85)";
    ctx.lineWidth = 3.2;
    ctx.stroke();
    for (const st of lv.stones) drawStone(ctx, st);
    lv.asyks.forEach((a, i) => drawBone(ctx, a.x, a.y, ASYK_R, initialAngle(i + 1)));
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, boxH / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(242,180,65,0.55)";
    ctx.lineWidth = 5;
    ctx.stroke();
  } else {
    // Без уровня: россыпь асыков
    [
      [230, 10, -0.5],
      [385, 50, 0.3],
      [540, -20, -0.2],
      [695, 50, 0.5],
      [850, 10, -0.35],
    ].forEach(([dx, dy, a]) => drawBone(ctx, dx, cy + dy, 46, a));
  }

  // Звёзды
  let by = top + boxH + 20;
  if (c.starsMax > 0) {
    const gap = 130;
    const x0 = W / 2 - ((c.starsMax - 1) * gap) / 2;
    for (let i = 0; i < c.starsMax; i++)
      star(ctx, x0 + i * gap, by + 50, 50, i < c.stars ? GOLD : "rgba(255,255,255,0.12)", i < c.stars ? "#a8651a" : "rgba(255,255,255,0.18)");
    by += 112;
  }

  // Главное число и подпись
  ctx.fillStyle = GOLD;
  const bs = fit(ctx, c.big, 800, 140, 800, family);
  ctx.font = `800 ${bs}px ${family}`;
  ctx.fillText(c.big, W / 2, by + 104);
  ctx.fillStyle = "#cdbfa8";
  ctx.font = `600 34px ${family}`;
  ctx.fillText(c.bigLabel, W / 2, by + 152);

  // Плашки
  if (c.chips.length) {
    ctx.font = `700 30px ${family}`;
    const pad = 28;
    const widths = c.chips.map((t) => ctx.measureText(t).width + pad * 2);
    const total = widths.reduce((a, b2) => a + b2, 0) + (c.chips.length - 1) * 16;
    let x = (W - total) / 2;
    const chipY = by + 214;
    c.chips.forEach((t, i) => {
      roundRect(ctx, x, chipY - 38, widths[i], 60, 30);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();
      ctx.fillStyle = "#fff6e4";
      ctx.textAlign = "left";
      ctx.fillText(t, x + pad, chipY + 3);
      x += widths[i] + 16;
    });
    ctx.textAlign = "center";
  }

  // Подвал
  ctx.fillStyle = "#fff6e4";
  ctx.font = `800 40px ${family}`;
  ctx.fillText(c.cta, W / 2, H - 100);
  ctx.fillStyle = GOLD;
  ctx.font = `700 34px ${family}`;
  ctx.fillText(c.url, W / 2, H - 54);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/** Отправляет картинку через системное «Поделиться» или скачивает её. */
export async function shareCardImage(blob: Blob, filename: string, text: string, url: string): Promise<"shared" | "saved"> {
  const file = new File([blob], filename, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, url, title: "Asyq League" });
      return "shared";
    }
  } catch (e) {
    // Пользователь закрыл окно «Поделиться» — это не ошибка, ничего не скачиваем.
    if (e instanceof DOMException && e.name === "AbortError") return "shared";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "saved";
}
