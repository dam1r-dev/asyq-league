import { DEFAULT_KON, DEFAULT_LINE_Y } from "./constants";
import type { Kon, LevelDef, Point, Puddle, Stone } from "./types";

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
  def: Omit<LevelDef, "kon" | "lineY" | "stones" | "puddles"> & {
    kon?: Kon;
    lineY?: number;
    stones?: Stone[];
    puddles?: Puddle[];
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
  // ——— Глава 2 «Көшпенділер жолы»: расстановки по мотивам символов кочевой культуры.
  level({
    id: "l13",
    title: "Жетіқарақшы",
    subtitle: "Большая Медведица: семь звёзд и Полярная",
    asyks: [
      { x: 135, y: 290 },
      { x: 185, y: 300 },
      { x: 200, y: 255 },
      { x: 150, y: 240 },
      { x: 232, y: 230 },
      { x: 268, y: 212 },
      { x: 305, y: 192 },
      { x: 100, y: 190 },
    ],
    throws: 8,
    par3: 4,
    par2: 6,
    chapter: 2,
  }),
  level({
    id: "l14",
    title: "Шаңырақ",
    subtitle: "Купол юрты: кольцо асыков вокруг камня",
    asyks: [
      { x: 255.4, y: 273 },
      { x: 223, y: 305.4 },
      { x: 177, y: 305.4 },
      { x: 144.6, y: 273 },
      { x: 144.6, y: 227 },
      { x: 177, y: 194.6 },
      { x: 223, y: 194.6 },
      { x: 255.4, y: 227 },
    ],
    stones: [{ x: 200, y: 250, r: 16 }],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 2,
  }),
  level({
    id: "l15",
    title: "Қошқар мүйіз",
    subtitle: "Бараний рог: две спирали из асыков",
    asyks: [
      { x: 142, y: 255 },
      { x: 164.9, y: 269.2 },
      { x: 140.3, y: 280.9 },
      { x: 118.6, y: 264.9 },
      { x: 118.2, y: 237.3 },
      { x: 258, y: 255 },
      { x: 235.1, y: 269.2 },
      { x: 259.7, y: 280.9 },
      { x: 281.4, y: 264.9 },
      { x: 281.8, y: 237.3 },
    ],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 2,
  }),
  level({
    id: "l16",
    title: "Тұлпар",
    subtitle: "Крылатый конь: два крыла и камень над головой",
    asyks: [
      { x: 200, y: 300 },
      { x: 200, y: 268 },
      { x: 178, y: 285 },
      { x: 156, y: 270 },
      { x: 134, y: 255 },
      { x: 112, y: 240 },
      { x: 222, y: 285 },
      { x: 244, y: 270 },
      { x: 266, y: 255 },
      { x: 288, y: 240 },
    ],
    stones: [{ x: 200, y: 228, r: 15 }],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 2,
  }),
  level({
    id: "l17",
    title: "Керуен",
    subtitle: "Караван на Великом шёлковом пути",
    asyks: [
      { x: 158, y: 205 },
      { x: 186, y: 205 },
      { x: 214, y: 205 },
      { x: 242, y: 205 },
      { x: 172, y: 233 },
      { x: 200, y: 233 },
      { x: 228, y: 233 },
      { x: 158, y: 261 },
      { x: 186, y: 261 },
      { x: 214, y: 261 },
      { x: 242, y: 261 },
    ],
    stones: [
      { x: 108, y: 233, r: 15 },
      { x: 292, y: 233, r: 15 },
    ],
    throws: 10,
    par3: 6,
    par2: 8,
    chapter: 2,
  }),
  level({
    id: "l18",
    title: "Алтын адам",
    subtitle: "Золотой человек: колпак, пояс и сапоги",
    asyks: [
      { x: 200, y: 160 },
      { x: 188, y: 184 },
      { x: 212, y: 184 },
      { x: 176, y: 208 },
      { x: 200, y: 208 },
      { x: 224, y: 208 },
      { x: 152, y: 238 },
      { x: 176, y: 238 },
      { x: 200, y: 238 },
      { x: 224, y: 238 },
      { x: 248, y: 238 },
      { x: 188, y: 266 },
      { x: 212, y: 266 },
      { x: 188, y: 290 },
      { x: 212, y: 290 },
    ],
    stones: [
      { x: 116, y: 210, r: 14 },
      { x: 284, y: 210, r: 14 },
    ],
    throws: 12,
    par3: 7,
    par2: 9,
    chapter: 2,
  }),
  // ——— Глава 3: «Су бойында» — лужи замедляют асыки и сақа
  level({
    id: "l19",
    title: "Бұлақ",
    subtitle: "Родник: лужа на пути сақа",
    asyks: row(5),
    puddles: [{ x: 200, y: 345, r: 30 }],
    throws: 7,
    par3: 4,
    par2: 5,
    chapter: 3,
  }),
  level({
    id: "l20",
    title: "Шалшық",
    subtitle: "Лужа у кромки кона не выпускает асыки",
    asyks: row(5, 190),
    puddles: [{ x: 200, y: 122, r: 34 }],
    throws: 7,
    par3: 3,
    par2: 5,
    chapter: 3,
  }),
  level({
    id: "l21",
    title: "Көл",
    subtitle: "Озёра по бокам ряда",
    asyks: row(7),
    puddles: [
      { x: 118, y: 250, r: 30 },
      { x: 282, y: 250, r: 30 },
    ],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 3,
  }),
  level({
    id: "l22",
    title: "Өзен",
    subtitle: "Река по диагонали разделяет асыки",
    asyks: [
      ...row(4, 190, 24, 150),
      ...row(4, 310, 24, 250),
    ],
    puddles: [
      { x: 140, y: 290, r: 26 },
      { x: 200, y: 250, r: 26 },
      { x: 260, y: 210, r: 26 },
    ],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 3,
  }),
  level({
    id: "l23",
    title: "Тоған",
    subtitle: "Пруд: кольцо асыков вокруг воды",
    asyks: ring(8, 58, K, Math.PI / 8),
    puddles: [{ x: 200, y: 250, r: 40 }],
    throws: 9,
    par3: 5,
    par2: 7,
    chapter: 3,
  }),
  level({
    id: "l24",
    title: "Сай",
    subtitle: "Овраг: два камня и вода перед рядом из пяти",
    asyks: row(5, 180, 26),
    stones: [
      { x: 140, y: 240, r: 14 },
      { x: 260, y: 240, r: 14 },
    ],
    puddles: [{ x: 200, y: 232, r: 24 }],
    throws: 10,
    par3: 5,
    par2: 7,
    chapter: 3,
  }),
  level({
    id: "l25",
    title: "Жылға",
    subtitle: "Ручей змейкой между асыками",
    asyks: [
      { x: 140, y: 170 },
      { x: 164, y: 170 },
      { x: 236, y: 232 },
      { x: 260, y: 232 },
      { x: 140, y: 294 },
      { x: 164, y: 294 },
      { x: 200, y: 232 },
      { x: 200, y: 170 },
    ],
    puddles: [
      { x: 200, y: 200, r: 24 },
      { x: 150, y: 232, r: 24 },
      { x: 200, y: 296, r: 24 },
    ],
    throws: 10,
    par3: 5,
    par2: 7,
    chapter: 3,
  }),
  level({
    id: "l26",
    title: "Оазис",
    subtitle: "Оазис: девять асыков и четыре лужи по углам",
    asyks: [
      ...row(3, 226, 24),
      ...row(3, 250, 24),
      ...row(3, 274, 24),
    ],
    puddles: [
      { x: 150, y: 200, r: 24 },
      { x: 250, y: 200, r: 24 },
      { x: 150, y: 300, r: 24 },
      { x: 250, y: 300, r: 24 },
    ],
    throws: 10,
    par3: 6,
    par2: 8,
    chapter: 3,
  }),
  level({
    id: "l27",
    title: "Жаңбыр",
    subtitle: "Дождь: лужи рассыпаны по всему кону",
    asyks: [
      { x: 150, y: 170 },
      { x: 250, y: 170 },
      { x: 200, y: 200 },
      { x: 120, y: 240 },
      { x: 280, y: 240 },
      { x: 175, y: 262 },
      { x: 225, y: 262 },
      { x: 150, y: 320 },
      { x: 250, y: 320 },
      { x: 200, y: 330 },
    ],
    puddles: [
      { x: 175, y: 205, r: 22 },
      { x: 235, y: 232, r: 22 },
      { x: 140, y: 280, r: 22 },
      { x: 220, y: 305, r: 22 },
    ],
    throws: 11,
    par3: 6,
    par2: 8,
    chapter: 3,
  }),
  level({
    id: "l28",
    title: "Су иесі",
    subtitle: "Хозяин воды: камни и озёра вокруг двенадцати асыков",
    asyks: [
      ...row(4, 190, 24, 200),
      ...row(5, 222, 24, 200),
      ...row(3, 254, 24, 200),
    ],
    stones: [
      { x: 118, y: 222, r: 14 },
      { x: 282, y: 222, r: 14 },
    ],
    puddles: [
      { x: 200, y: 150, r: 28 },
      { x: 135, y: 290, r: 26 },
      { x: 265, y: 290, r: 26 },
      { x: 200, y: 300, r: 22 },
    ],
    throws: 13,
    par3: 7,
    par2: 10,
    chapter: 3,
  }),
];

/** Главы: вторая открывается после прохождения первой. */
export const CHAPTERS = [
  { id: 1, levels: LEVELS.filter((l) => (l.chapter ?? 1) === 1) },
  { id: 2, levels: LEVELS.filter((l) => l.chapter === 2) },
  { id: 3, levels: LEVELS.filter((l) => l.chapter === 3) },
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
