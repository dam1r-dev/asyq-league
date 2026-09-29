"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fieldLook, saqaLook } from "@/lib/catalog";
import { sfx, vibrate } from "@/lib/sound";
import {
  ASYK_R,
  SAQA_FRICTION,
  SAQA_R,
  THROW_SPREAD,
  V_MAX,
  WORLD_H,
  WORLD_W,
} from "@/game/constants";
import { isAtRest, saqaStartY, stepWorld, type World } from "@/game/physics";
import { drawBone, drawStone, initialAngle, renderFieldLayer } from "@/game/render";
import { initRound, normalizeInput, startThrow } from "@/game/round";
import type { AsykState, LevelDef, ThrowInput } from "@/game/types";
import { useT } from "@/i18n/provider";

/**
 * Видимая часть поля: пустые полосы сверху и снизу обрезаны, чтобы кон
 * и асыки были крупнее (особенно на широких экранах).
 */
const VIEW_Y0 = 60;
const VIEW_H = 640;

/** Сколько экранных «игровых единиц» нужно оттянуть для 100% силы. */
const MAX_PULL = 150;
const MIN_PULL = 12;

interface Props {
  level: LevelDef;
  asyks: AsykState[];
  disabled?: boolean;
  saqaSkin?: string;
  fieldSkin?: string;
  showHint?: boolean;
  /** Бросок сыгран до конца (все тела остановились). */
  onThrowEnd: (input: ThrowInput) => void;
  onThrowStart?: () => void;
  /** Как двигать сақа вдоль линии: стрелки ◀ ▶ или ползунок. */
  moveControl?: "buttons" | "slider";
  /** Заголовок/подпись поверх поля, например «Ход: Айдос». */
  overlay?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export default function GameCanvas({
  level,
  asyks,
  disabled,
  saqaSkin,
  fieldSkin,
  showHint,
  onThrowEnd,
  onThrowStart,
  overlay,
  moveControl = "buttons",
}: Props) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0, scale: 1 });
  const [sx, setSx] = useState(level.kon.x);
  const [flying, setFlying] = useState(false);
  const [aiming, setAiming] = useState(false);

  // Всё, что меняется каждый кадр, живёт в ref — без лишних ререндеров React.
  const st = useRef({
    world: null as World | null,
    input: null as ThrowInput | null,
    phase: "aim" as "aim" | "fly" | "fade",
    fadeT: 0,
    knockedLive: new Set<number>(),
    aim: null as null | { x0: number; y0: number; x1: number; y1: number; id: number },
    angles: new Map<number, number>(),
    particles: [] as Particle[],
    popups: [] as Popup[],
    trail: [] as { x: number; y: number }[],
    shake: 0,
    slowmo: 0,
    acc: 0,
    field: null as HTMLCanvasElement | null,
    t: 0,
  });

  // Свежие пропсы для игрового цикла, который живёт вне рендера React.
  const forwardLabel = t("canvas.forward");
  const propsRef = useRef({ level, asyks, disabled, sx, onThrowEnd, onThrowStart, saqaSkin, forwardLabel });
  useLayoutEffect(() => {
    propsRef.current = { level, asyks, disabled, sx, onThrowEnd, onThrowStart, saqaSkin, forwardLabel };
  });

  // Подгоняем canvas под контейнер, сохраняя пропорции поля.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const scale = Math.min(w / WORLD_W, h / VIEW_H);
      setSize({ w: WORLD_W * scale, h: VIEW_H * scale, scale });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Пересобираем слой фона при смене размера/скина/уровня.
  useEffect(() => {
    if (!size.scale) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    st.current.field = renderFieldLayer(level, fieldLook(fieldSkin), size.scale * dpr);
  }, [level, fieldSkin, size.scale]);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * WORLD_W,
        y: ((clientY - rect.top) / rect.height) * VIEW_H + VIEW_Y0,
      };
    },
    [],
  );

  /** Из жеста «оттянуть» получаем бросок: направление и силу. */
  const aimToInput = useCallback((): { input: ThrowInput; power: number; valid: boolean } | null => {
    const a = st.current.aim;
    if (!a) return null;
    const dx = a.x0 - a.x1;
    const dy = a.y0 - a.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < MIN_PULL) return null;
    const power = Math.min(1, len / MAX_PULL);
    const nx = dx / len;
    const ny = dy / len;
    const valid = ny < -0.08;
    const { level: lv, sx: x } = propsRef.current;
    const input = normalizeInput(lv, { sx: x, vx: nx * power * V_MAX, vy: ny * power * V_MAX });
    return { input, power, valid };
  }, []);

  const launch = useCallback((input: ThrowInput, power: number) => {
    const s = st.current;
    const { level: lv, asyks: current } = propsRef.current;
    const round = { ...initRound(lv), asyks: current };
    s.world = startThrow(round, input);
    s.input = input;
    s.phase = "fly";
    s.knockedLive = new Set();
    s.trail = [];
    s.acc = 0;
    s.slowmo = 0;
    setFlying(true);
    sfx.whoosh(power);
    vibrate(10);
    propsRef.current.onThrowStart?.();
  }, []);

  // ——— Ввод: Pointer Events одинаково работают для мыши, пальца и стилуса.
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || flying) return;
    sfx.unlock();
    const p = toWorld(e.clientX, e.clientY);
    (e.target as Element).setPointerCapture(e.pointerId);
    st.current.aim = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, id: e.pointerId };
    setAiming(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const a = st.current.aim;
    if (!a || a.id !== e.pointerId) return;
    const p = toWorld(e.clientX, e.clientY);
    a.x1 = p.x;
    a.y1 = p.y;
  };
  const endAim = (e: React.PointerEvent, cancel: boolean) => {
    const a = st.current.aim;
    if (!a || a.id !== e.pointerId) return;
    const res = aimToInput();
    st.current.aim = null;
    setAiming(false);
    if (!cancel && res && res.valid) launch(res.input, res.power);
  };

  const nudge = (d: number) => {
    setSx((x) => Math.max(level.kon.x - THROW_SPREAD, Math.min(level.kon.x + THROW_SPREAD, x + d)));
  };

  // Клавиатура: стрелки двигают сақа вдоль линии.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (st.current.phase !== "aim") return;
      if (e.key === "ArrowLeft") nudge(-10);
      if (e.key === "ArrowRight") nudge(10);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.kon.x]);

  // ——— Главный цикл отрисовки.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.scale) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const ctx = canvas.getContext("2d")!;
    // canvas не понимает CSS-переменные, поэтому берём реальное имя шрифта.
    const displayFont =
      getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim() || "system-ui";
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dtReal = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      s.t += dtReal;
      const { level: lv, asyks: current, sx: x } = propsRef.current;

      // Симуляция: фиксированный шаг, скорость воспроизведения меняется
      // (замедление при выбивании, ускорение когда всё улетело за экран).
      if (s.phase === "fly" && s.world) {
        const w = s.world;
        const onScreen = w.bodies.some(
          (b) => (b.vx !== 0 || b.vy !== 0) && b.x > -20 && b.x < WORLD_W + 20 && b.y > VIEW_Y0 - 20 && b.y < VIEW_Y0 + VIEW_H + 20,
        );
        const timeScale = s.slowmo > 0 ? 0.3 : onScreen ? 1 : 4;
        s.slowmo = Math.max(0, s.slowmo - dtReal);
        s.acc += dtReal * timeScale;
        let steps = 0;
        while (s.acc >= 1 / 120 && steps < 200) {
          s.acc -= 1 / 120;
          steps++;
          const events = stepWorld(w);
          for (const ev of events) {
            const a = w.bodies.find((b) => b.id === ev.a)!;
            const b = w.bodies.find((b2) => b2.id === ev.b)!;
            const strength = ev.impulse / 500;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            if (ev.kinds.includes("stone")) sfx.stone(strength);
            else sfx.click(strength);
            if (strength > 0.25) {
              s.shake = Math.min(9, s.shake + strength * 5);
              vibrate(Math.min(30, 8 + strength * 20));
            }
            for (let i = 0; i < 6 + strength * 10; i++) {
              s.particles.push({
                x: mx,
                y: my,
                vx: (Math.random() - 0.5) * 140 * (0.4 + strength),
                vy: (Math.random() - 0.5) * 140 * (0.4 + strength),
                life: 0,
                max: 0.35 + Math.random() * 0.3,
                color: ev.kinds.includes("stone") ? "#bdb6aa" : "#f3e2c1",
              });
            }
          }
          // Асык пересёк меловую линию — праздник: замедление и «+1».
          for (const b of w.bodies) {
            if (b.kind !== "asyk" || s.knockedLive.has(b.id)) continue;
            const d = Math.hypot(b.x - lv.kon.x, b.y - lv.kon.y);
            if (d >= lv.kon.r + ASYK_R) {
              s.knockedLive.add(b.id);
              s.slowmo = s.knockedLive.size === 1 ? 0.45 : 0.2;
              s.popups.push({
                x: Math.max(30, Math.min(WORLD_W - 30, b.x)),
                y: Math.max(VIEW_Y0 + 40, Math.min(VIEW_Y0 + VIEW_H - 40, b.y)),
                text: s.knockedLive.size > 1 ? `+1 ×${s.knockedLive.size}` : "+1",
                life: 0,
                color: "#f2b441",
              });
              sfx.knock(s.knockedLive.size);
              vibrate(35);
            }
          }
          if (isAtRest(w) || w.step > 120 * 25) break;
        }
        const saqa = w.bodies[0];
        s.trail.push({ x: saqa.x, y: saqa.y });
        if (s.trail.length > 14) s.trail.shift();
        // Вращение асыков в полёте — только для красоты.
        for (const b of w.bodies) {
          if (b.kind === "stone") continue;
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > 0) s.angles.set(b.id, (s.angles.get(b.id) ?? initialAngle(b.id)) + sp * dtReal * 0.012 * (b.id % 2 ? 1 : -1));
        }
        if (isAtRest(w) || w.step > 120 * 25) {
          s.phase = "fade";
          s.fadeT = 0;
        }
      } else if (s.phase === "fade") {
        s.fadeT += dtReal;
        if (s.fadeT > 0.45) {
          const input = s.input!;
          s.phase = "aim";
          s.world = null;
          s.trail = [];
          setFlying(false);
          propsRef.current.onThrowEnd(input);
        }
      }

      // ——— Рисуем
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const k = (canvas.width / WORLD_W);
      let ox = 0;
      let oy = 0;
      if (s.shake > 0.05) {
        ox = (Math.random() - 0.5) * s.shake;
        oy = (Math.random() - 0.5) * s.shake;
        s.shake *= Math.pow(0.02, dtReal);
      }
      ctx.setTransform(k, 0, 0, k, ox * k, (oy - VIEW_Y0) * k);
      if (s.field) ctx.drawImage(s.field, 0, 0, WORLD_W, WORLD_H);

      for (const stone of lv.stones) drawStone(ctx, stone);

      const look = saqaLook(propsRef.current.saqaSkin);
      if (s.world) {
        const fadeAlpha = s.phase === "fade" ? Math.max(0, 1 - s.fadeT / 0.45) : 1;
        for (const b of s.world.bodies) {
          if (b.kind !== "asyk") continue;
          const out = Math.hypot(b.x - lv.kon.x, b.y - lv.kon.y) >= lv.kon.r + ASYK_R;
          drawBone(ctx, b.x, b.y, b.r, s.angles.get(b.id) ?? initialAngle(b.id), undefined, out ? fadeAlpha : 1);
        }
        // След сақа
        s.trail.forEach((p, i) => {
          ctx.globalAlpha = (i / s.trail.length) * 0.35;
          ctx.fillStyle = look.base;
          ctx.beginPath();
          ctx.arc(p.x, p.y, SAQA_R * (0.4 + (i / s.trail.length) * 0.5), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        const saqa = s.world.bodies[0];
        drawBone(ctx, saqa.x, saqa.y, SAQA_R, s.angles.get(0) ?? -0.2, look);
      } else {
        for (const a of current) drawBone(ctx, a.x, a.y, ASYK_R, s.angles.get(a.id) ?? initialAngle(a.id));
        const sy = saqaStartY(lv.lineY);
        if (!propsRef.current.disabled) {
          // Мягкое свечение: «меня можно бросать».
          const pulse = 0.5 + 0.5 * Math.sin(s.t * 3);
          ctx.beginPath();
          ctx.arc(x, sy, SAQA_R + 6 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(242,180,65,${0.25 + pulse * 0.25})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        drawBone(ctx, x, sy, SAQA_R, -0.2, look);
        drawAim(ctx, s, x, sy, lv, current);
      }

      // Частицы пыли
      s.particles = s.particles.filter((p) => (p.life += dtReal) < p.max);
      for (const p of s.particles) {
        p.x += p.vx * dtReal;
        p.y += p.vy * dtReal;
        p.vx *= 0.9;
        p.vy *= 0.9;
        ctx.globalAlpha = 1 - p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
      }
      ctx.globalAlpha = 1;

      // Всплывающие «+1»
      s.popups = s.popups.filter((p) => (p.life += dtReal) < 1.1);
      for (const p of s.popups) {
        const t = p.life / 1.1;
        ctx.globalAlpha = 1 - t * t;
        ctx.font = `800 ${20 + (1 - t) * 6}px ${displayFont}`;
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(20,12,4,0.8)";
        ctx.strokeText(p.text, p.x, p.y - t * 30);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y - t * 30);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };

    /** Пунктир прицела: куда покатится сақа и где будет первый удар. */
    function drawAim(
      c: CanvasRenderingContext2D,
      s: typeof st.current,
      x: number,
      y: number,
      lv: LevelDef,
      current: AsykState[],
    ) {
      const res = aimToInput();
      if (!res) return;
      const { input, power, valid } = res;
      const speed = Math.hypot(input.vx, input.vy);
      const dx = input.vx / speed;
      const dy = input.vy / speed;
      const color = valid ? (power > 0.8 ? "#f2b441" : power > 0.5 ? "#f7e3b8" : "#cfc6b6") : "#ec5a45";

      // Резинка «рогатки» от сақа к пальцу
      const a = s.aim!;
      c.strokeStyle = "rgba(255,255,255,0.25)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (a.x1 - a.x0), y + (a.y1 - a.y0));
      c.stroke();

      if (valid) {
        // Свободный пробег при трении: v² / 2a.
        const travel = (speed * speed) / (2 * SAQA_FRICTION);
        let hitT = travel;
        let hit: { x: number; y: number } | null = null;
        const targets = [
          ...current.map((p) => ({ x: p.x, y: p.y, r: ASYK_R })),
          ...lv.stones,
        ];
        for (const t of targets) {
          const R = t.r + SAQA_R;
          const px = x - t.x;
          const py = y - t.y;
          const b = dx * px + dy * py;
          const cc = px * px + py * py - R * R;
          const disc = b * b - cc;
          if (disc < 0) continue;
          const tt = -b - Math.sqrt(disc);
          if (tt > 0 && tt < hitT) {
            hitT = tt;
            hit = { x: x + dx * tt, y: y + dy * tt };
          }
        }
        c.setLineDash([5, 7]);
        c.lineDashOffset = -s.t * 30;
        c.strokeStyle = color;
        c.globalAlpha = 0.9;
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + dx * hitT, y + dy * hitT);
        c.stroke();
        c.setLineDash([]);
        if (hit) {
          c.beginPath();
          c.arc(hit.x, hit.y, SAQA_R, 0, Math.PI * 2);
          c.strokeStyle = color;
          c.lineWidth = 1.5;
          c.stroke();
        } else {
          // Где сақа остановится без удара
          c.beginPath();
          c.arc(x + dx * hitT, y + dy * hitT, 4, 0, Math.PI * 2);
          c.fillStyle = color;
          c.fill();
        }
        c.globalAlpha = 1;
      }

      // Подпись силы
      c.font = `700 15px ${displayFont}`;
      c.textAlign = "center";
      c.lineWidth = 4;
      c.strokeStyle = "rgba(15,10,5,0.85)";
      const label = valid ? `${Math.round(power * 100)}%` : propsRef.current.forwardLabel;
      const ly = y + 40;
      c.strokeText(label, x, ly);
      c.fillStyle = color;
      c.fillText(label, x, ly);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, aimToInput]);

  const canMove = !disabled && !flying;

  return (
    <div ref={wrapRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: size.w, height: size.h }}>
        <canvas
          ref={canvasRef}
          className="block touch-none select-none rounded-[22px] shadow-2xl shadow-black/60"
          style={{ width: size.w, height: size.h, cursor: disabled ? "default" : aiming ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endAim(e, false)}
          onPointerCancel={(e) => endAim(e, true)}
          aria-label={t("canvas.aria")}
          role="img"
        />
        {overlay}
        {showHint && canMove && !aiming && (
          <div
            className="pointer-events-none absolute"
            style={{ left: (sx / WORLD_W) * size.w - 18, top: ((saqaStartY(level.lineY) - VIEW_Y0) / VIEW_H) * size.h - 18 }}
          >
            <div className="hint-drag text-4xl drop-shadow-lg">👆</div>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 flex items-center justify-between gap-3 px-3"
          style={{ top: ((saqaStartY(level.lineY) + 26 - VIEW_Y0) / VIEW_H) * size.h }}
        >
          {moveControl === "slider" ? (
            <input
              type="range"
              aria-label={t("canvas.slider")}
              className="asyq-range pointer-events-auto w-full"
              min={level.kon.x - THROW_SPREAD}
              max={level.kon.x + THROW_SPREAD}
              step={1}
              value={sx}
              disabled={!canMove}
              onChange={(e) => setSx(Number(e.target.value))}
            />
          ) : (
            <>
              <button
                type="button"
                aria-label={t("canvas.left")}
                className="btn btn-ghost pointer-events-auto h-11 w-11 !p-0 text-lg"
                disabled={!canMove}
                onClick={() => nudge(-12)}
              >
                ◀
              </button>
              <button
                type="button"
                aria-label={t("canvas.right")}
                className="btn btn-ghost pointer-events-auto h-11 w-11 !p-0 text-lg"
                disabled={!canMove}
                onClick={() => nudge(12)}
              >
                ▶
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

