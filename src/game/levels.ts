import { DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import type { Kon, LevelDef, Point, Stone } from "./types";

const K = DEFAULT_KON;

function row(n: number, cy = K.y, gap = 24, cx = K.x): Point[] {
  const start = cx - ((n - 1) * gap) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: start + i * gap, y: cy }));
}

function ring(n: number, radius: number, c: Point = K, phase = 0): Point[] {
  // Точки на окружности считаем заранее через таблицу, а не Math.sin в
  // симуляции — расстановка всё равно фиксируется до начала раунда.
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return {
      x: Math.round((c.x + Math.cos(a) * radius) * 10) / 10,
      y: Math.round((c.y + Math.sin(a) * radius) * 10) / 10,
    };
  });
}

function level(
  def: Omit<LevelDef, "kon" | "lineY" | "stones"> & {
    kon?: Kon;
    lineY?: number;
    stones?: Stone[];
  },
): LevelDef {
  return { kon: K, lineY: DEFAULT_LINE_Y, stones: [], ...def };
}

export const TUTORIAL_ID = "l1";

export const LEVELS: LevelDef[] = [
  level({
    id: "l1",
    title: "Алғашқы соқ",
    subtitle: "Первый удар: три асыка в ряд",
    asyks: row(3),
    throws: 5,
    par3: 2,
    par2: 3,
    hint: "Потяни назад и отпусти. Бей в середину ряда.",
  }),
  level({
    id: "l2",
    title: "Қатар",
    subtitle: "Ряд из пяти — классика двора",
    asyks: row(5),
    throws: 6,
    par3: 3,
    par2: 4,
    hint: "Бей по краю ряда наискосок — собьёшь несколько за раз.",
  }),
  level({
    id: "l3",
    title: "Ұзын қатар",
    subtitle: "Длинный ряд из девяти",
    asyks: row(9),
    throws: 8,
    par3: 4,
    par2: 6,
    hint: "Встань сбоку на линии и бей вдоль ряда.",
  }),
  level({
    id: "l4",
    title: "Екі қатар",
    subtitle: "Два ряда: передний прикрывает задний",
    asyks: [...row(5, K.y - 16), ...row(5, K.y + 16)],
    throws: 8,
    par3: 4,
    par2: 6,
  }),
  level({
    id: "l5",
    title: "Шашыранды",
    subtitle: "Асыки разбросаны по кону",
    asyks: [
      { x: 150, y: 200 },
      { x: 250, y: 190 },
      { x: 200, y: 250 },
      { x: 120, y: 280 },
      { x: 285, y: 290 },
      { x: 175, y: 320 },
      { x: 235, y: 330 },
    ],
    throws: 8,
    par3: 5,
    par2: 6,
    hint: "Точность важнее силы: каждый асык — отдельная цель.",
  }),
  level({
    id: "l6",
    title: "Тас",
    subtitle: "Камень прикрывает середину ряда",
    asyks: row(6),
    stones: [{ x: 200, y: 320, r: 16 }],
    throws: 7,
    par3: 4,
    par2: 5,
    hint: "Камень не сдвинуть. Заходи с боков.",
  }),
  level({
    id: "l7",
    title: "Алыс",
    subtitle: "Маленький кон и дальний бросок",
    kon: { x: 200, y: 220, r: 105 },
    lineY: 600,
    asyks: row(5, 220, 22),
    throws: 6,
    par3: 3,
    par2: 4,
  }),
  level({
    id: "l8",
    title: "Үшбұрыш",
    subtitle: "Треугольник из десяти асыков",
    asyks: [
      ...row(4, 220),
      ...row(3, 243),
      ...row(2, 266),
      ...row(1, 289),
    ],
    throws: 8,
    par3: 4,
    par2: 6,
    hint: "Разбей вершину треугольника на полной силе.",
  }),
  level({
    id: "l9",
    title: "Қақпа",
    subtitle: "Ворота из камней",
    asyks: row(6, 210),
    stones: [
      { x: 150, y: 300, r: 15 },
      { x: 250, y: 300, r: 15 },
      { x: 90, y: 250, r: 13 },
      { x: 310, y: 250, r: 13 },
    ],
    throws: 8,
    par3: 4,
    par2: 6,
  }),
  level({
    id: "l10",
    title: "Айқас",
    subtitle: "Крест в центре кона",
    asyks: [
      ...row(5),
      { x: 200, y: 202 },
      { x: 200, y: 226 },
      { x: 200, y: 274 },
      { x: 200, y: 298 },
    ],
    throws: 8,
    par3: 5,
    par2: 6,
  }),
  level({
    id: "l11",
    title: "Кіші кон",
    subtitle: "Тесный кон — сақа легко застревает",
    kon: { x: 200, y: 250, r: 90 },
    asyks: [...row(3, 235), ...row(3, 265)],
    throws: 6,
    par3: 3,
    par2: 4,
    hint: "Бросай сильно: сақа должна пролететь кон насквозь.",
  }),
  level({
    id: "l12",
    title: "Шеберлер",
    subtitle: "Испытание мастеров: 13 асыков и камни",
    asyks: row(13, K.y, 21),
    stones: [
      { x: 130, y: 330, r: 14 },
      { x: 270, y: 330, r: 14 },
    ],
    throws: 10,
    par3: 5,
    par2: 7,
  }),
];

/** Платный набор «Дала аңыздары» — дополнительные испытания, не преимущество. */
export const LEGEND_LEVELS: LevelDef[] = [
  level({
    id: "p1",
    title: "Қорған",
    subtitle: "Крепость: асыки внутри кольца камней",
    asyks: row(4),
    stones: ring(6, 64, K, Math.PI / 6).map((p) => ({ ...p, r: 12 })),
    throws: 8,
    par3: 5,
    par2: 6,
    pack: "legends",
  }),
  level({
    id: "p2",
    title: "Жұлдыз",
    subtitle: "Звезда из асыков",
    asyks: [{ x: 200, y: 250 }, ...ring(8, 55, K, -Math.PI / 2)],
    throws: 8,
    par3: 4,
    par2: 6,
    pack: "legends",
  }),
  level({
    id: "p3",
    title: "Көкпар",
    subtitle: "Асыки у дальнего края кона",
    asyks: row(7, 150, 24),
    stones: [{ x: 200, y: 260, r: 20 }],
    throws: 7,
    par3: 4,
    par2: 5,
    pack: "legends",
  }),
  level({
    id: "p4",
    title: "Ұлы дала",
    subtitle: "Великая степь: большой кон, дальний бросок",
    kon: { x: 200, y: 230, r: 160 },
    lineY: 610,
    asyks: [...row(6, 190), ...row(6, 270), { x: 200, y: 230 }],
    throws: 9,
    par3: 5,
    par2: 7,
    pack: "legends",
  }),
];

export const ALL_LEVELS = [...LEVELS, ...LEGEND_LEVELS];

export function getLevel(id: string): LevelDef | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}

export function nextLevelId(id: string): string | undefined {
  const list = id.startsWith("p") ? LEGEND_LEVELS : LEVELS;
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 ? list[i + 1]?.id : undefined;
}
