import type { FieldLook, SaqaLook } from "@/lib/catalog";
import { ASYK_R, SAQA_R, THROW_SPREAD, WORLD_H, WORLD_W } from "./constants";
import { hashString, mulberry32 } from "./rng";
import type { LevelDef, Point, Puddle, Stone } from "./types";

/** Рисование на canvas. Никакой логики игры — только картинка. */

const BONE: SaqaLook = { base: "#e9cfa3", light: "#fff3dc", dark: "#a8825a" };

/** Силуэт асыка сверху: «бантик» с вогнутыми боками, как настоящая кость. */
function asykPath(ctx: CanvasRenderingContext2D, r: number) {
  const w = r * 1.18;
  const h = r * 0.86;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h);
  ctx.quadraticCurveTo(0, -h * 0.5, w * 0.5, -h);
  ctx.quadraticCurveTo(w * 1.08, -h * 0.95, w, 0);
  ctx.quadraticCurveTo(w * 1.08, h * 0.95, w * 0.5, h);
  ctx.quadraticCurveTo(0, h * 0.5, -w * 0.5, h);
  ctx.quadraticCurveTo(-w * 1.08, h * 0.95, -w, 0);
  ctx.quadraticCurveTo(-w * 1.08, -h * 0.95, -w * 0.5, -h);
  ctx.closePath();
}

export function drawBone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  look: SaqaLook = BONE,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  // Тень
  ctx.save();
  ctx.translate(x + r * 0.28, y + r * 0.38);
  ctx.rotate(angle);
  asykPath(ctx, r);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.restore();

  ctx.translate(x, y);
  ctx.rotate(angle);
  asykPath(ctx, r);
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r * 1.4);
  g.addColorStop(0, look.light);
  g.addColorStop(0.45, look.base);
  g.addColorStop(1, look.dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(0.8, r * 0.09);
  ctx.strokeStyle = look.dark;
  ctx.stroke();

  // Бороздка по центру кости
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, 0);
  ctx.quadraticCurveTo(0, r * 0.18, r * 0.35, 0);
  ctx.strokeStyle = look.dye ?? "rgba(120,85,50,0.55)";
  ctx.lineWidth = Math.max(0.8, r * 0.12);
  ctx.stroke();
  ctx.restore();
}

/** Лужа воды: тёмная кромка, голубая вода и пара бликов-кругов. */
export function drawPuddle(ctx: CanvasRenderingContext2D, w: Puddle) {
  const rand = mulberry32(hashString(`w${w.x}:${w.y}`));
  ctx.save();
  // Неровная кромка: эллипс чуть шире воды.
  ctx.beginPath();
  ctx.ellipse(w.x, w.y, w.r * 1.08, w.r * 0.94, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40,30,20,0.35)";
  ctx.fill();
  const g = ctx.createRadialGradient(w.x - w.r * 0.3, w.y - w.r * 0.35, 1, w.x, w.y, w.r);
  g.addColorStop(0, "#9bd8ef");
  g.addColorStop(0.6, "#4fa3cf");
  g.addColorStop(1, "#2f78a8");
  ctx.beginPath();
  ctx.ellipse(w.x, w.y, w.r, w.r * 0.86, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "#e6f6ff";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const k = 0.35 + i * 0.28 + rand() * 0.05;
    ctx.beginPath();
    ctx.ellipse(w.x + (rand() - 0.5) * 4, w.y + (rand() - 0.5) * 3, w.r * k, w.r * k * 0.86, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStone(ctx: CanvasRenderingContext2D, s: Stone) {
  const rand = mulberry32(hashString(`${s.x}:${s.y}`));
  const n = 9;
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = s.r * (0.88 + rand() * 0.2);
    pts.push({ x: s.x + Math.cos(a) * rr, y: s.y + Math.sin(a) * rr });
  }
  const path = () => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(s.r * 0.25, s.r * 0.35);
  path();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill();
  ctx.restore();
  path();
  const g = ctx.createRadialGradient(s.x - s.r * 0.4, s.y - s.r * 0.4, 1, s.x, s.y, s.r * 1.2);
  g.addColorStop(0, "#b9b4ab");
  g.addColorStop(1, "#5d5953");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#3f3c38";
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Фон поля: земля с крапинками, меловой кон и линия броска.
 * Рисуется один раз во внеэкранный canvas и потом просто копируется.
 */
export function renderFieldLayer(level: LevelDef, look: FieldLook, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(WORLD_W * scale);
  canvas.height = Math.round(WORLD_H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  const rand = mulberry32(hashString(level.id + look.ground));

  ctx.fillStyle = look.ground;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = look.speck[i % look.speck.length];
    const size = 0.6 + rand() * 1.8;
    ctx.globalAlpha = 0.35 + rand() * 0.5;
    ctx.fillRect(rand() * WORLD_W, rand() * WORLD_H, size, size);
  }
  ctx.globalAlpha = 1;

  if (look.pattern === "felt") drawFeltOrnament(ctx, look);
  else {
    // Трещинки и опавшие листья — детали «двора».
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      let x = rand() * WORLD_W;
      let y = rand() * WORLD_H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += (rand() - 0.5) * 40;
        y += (rand() - 0.3) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const x = rand() * WORLD_W;
      const y = rand() * WORLD_H;
      if (Math.hypot(x - level.kon.x, y - level.kon.y) < level.kon.r + 20) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * Math.PI * 2);
      ctx.fillStyle = ["#c9782e", "#d9a13b", "#a4532a"][i % 3];
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Виньетка
  const v = ctx.createRadialGradient(WORLD_W / 2, WORLD_H * 0.45, WORLD_H * 0.25, WORLD_W / 2, WORLD_H * 0.45, WORLD_H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  for (const w of level.puddles ?? []) drawPuddle(ctx, w);

  // Меловой кон — несколько неровных проходов, как рисуют рукой.
  ctx.strokeStyle = look.chalk;
  ctx.lineCap = "round";
  for (let pass = 0; pass < 3; pass++) {
    ctx.globalAlpha = 0.35 + pass * 0.12;
    ctx.lineWidth = 2.6 - pass * 0.5;
    ctx.beginPath();
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const rr = level.kon.r + (rand() - 0.5) * 2.2;
      const px = level.kon.x + Math.cos(a) * rr;
      const py = level.kon.y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }

  // Линия броска и отметки допустимой зоны.
  const minX = level.kon.x - THROW_SPREAD;
  const maxX = level.kon.x + THROW_SPREAD;
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalAlpha = 0.45 + pass * 0.2;
    ctx.lineWidth = 2.2 - pass * 0.6;
    ctx.beginPath();
    ctx.moveTo(minX, level.lineY + (rand() - 0.5));
    ctx.lineTo(maxX, level.lineY + (rand() - 0.5));
    ctx.stroke();
  }
  ctx.globalAlpha = 0.7;
  for (const x of [minX, maxX]) {
    ctx.beginPath();
    ctx.moveTo(x, level.lineY - 7);
    ctx.lineTo(x, level.lineY + 7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function drawFeltOrnament(ctx: CanvasRenderingContext2D, look: FieldLook) {
  ctx.save();
  ctx.strokeStyle = look.chalk;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, WORLD_W - 28, WORLD_H - 28);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, WORLD_W - 48, WORLD_H - 48);
  // Упрощённые «бараньи рога» по углам
  const horn = (x: number, y: number, sx: number, sy: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(18, 0, 26, 10, 22, 20);
    ctx.bezierCurveTo(19, 27, 9, 25, 11, 18);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, 18, 10, 26, 20, 22);
    ctx.stroke();
    ctx.restore();
  };
  horn(34, 34, 1, 1);
  horn(WORLD_W - 34, 34, -1, 1);
  horn(34, WORLD_H - 34, 1, -1);
  horn(WORLD_W - 34, WORLD_H - 34, -1, -1);
  ctx.restore();
}

/** Начальный угол асыка — просто для разнообразия картинки. */
export function initialAngle(id: number) {
  return ((hashString(`a${id}`) % 1000) / 1000 - 0.5) * 0.9;
}

export const RENDER_R = { asyk: ASYK_R, saqa: SAQA_R };
