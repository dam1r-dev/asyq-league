/**
 * Магазин продаёт только внешний вид и дополнительный контент.
 * Физика, очки и рейтинг от покупок не зависят — это принципиально.
 */

export type ItemKind = "saqa" | "field" | "pack";

export interface SaqaLook {
  base: string;
  light: string;
  dark: string;
  /** Краска на сақа — во дворе сақа часто красили, чтобы не спутать. */
  dye?: string;
}

export interface FieldLook {
  ground: string;
  speck: string[];
  chalk: string;
  pattern?: "felt";
}

export interface ShopItem {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  priceKzt: number;
  saqa?: SaqaLook;
  field?: FieldLook;
}

export const CATALOG: ShopItem[] = [
  {
    id: "saqa-classic",
    kind: "saqa",
    name: "Кәдімгі сақа",
    description: "Обычная костяная сақа. Бесплатно.",
    priceKzt: 0,
    saqa: { base: "#e9cfa3", light: "#fff3dc", dark: "#a8825a" },
  },
  {
    id: "saqa-qyzyl",
    kind: "saqa",
    name: "Қызыл сақа",
    description: "Сақа, окрашенная в красный, как во дворах 90-х.",
    priceKzt: 290,
    saqa: { base: "#d9533e", light: "#ff9a7d", dark: "#8c2718", dye: "#b53422" },
  },
  {
    id: "saqa-kok",
    kind: "saqa",
    name: "Көк сақа",
    description: "Небесно-голубая, цвета флага.",
    priceKzt: 290,
    saqa: { base: "#39b9d3", light: "#a8ecf7", dark: "#16707f", dye: "#1d93a8" },
  },
  {
    id: "saqa-altyn",
    kind: "saqa",
    name: "Алтын сақа",
    description: "Золотая сақа чемпиона лиги.",
    priceKzt: 490,
    saqa: { base: "#f2b441", light: "#fff0b3", dark: "#94600f", dye: "#d4921f" },
  },
  {
    id: "field-aula",
    kind: "field",
    name: "Аула",
    description: "Асфальт двора и мел. Бесплатно.",
    priceKzt: 0,
    field: { ground: "#4a4744", speck: ["#5a5652", "#3a3734", "#625d57"], chalk: "#f4efe6" },
  },
  {
    id: "field-auyl",
    kind: "field",
    name: "Ауыл",
    description: "Утоптанная земля за домом у бабушки.",
    priceKzt: 390,
    field: { ground: "#8a6443", speck: ["#9c7450", "#74533a", "#a88460"], chalk: "#fff6e3" },
  },
  {
    id: "field-dala",
    kind: "field",
    name: "Дала",
    description: "Выгоревшая летняя степь.",
    priceKzt: 390,
    field: { ground: "#8c8a4f", speck: ["#9d9b5c", "#77763f", "#b0a86a"], chalk: "#fffbea" },
  },
  {
    id: "field-kiiz",
    kind: "field",
    name: "Киіз",
    description: "Войлочный ковёр с орнаментом — для домашних турниров.",
    priceKzt: 590,
    field: { ground: "#7a2e24", speck: ["#8a372b", "#6a261d", "#93402f"], chalk: "#f5d58a", pattern: "felt" },
  },
  {
    id: "pack-legends",
    kind: "pack",
    name: "Дала аңыздары",
    description: "Набор из 4 новых испытаний: крепость, звезда, көкпар и великая степь.",
    priceKzt: 790,
  },
];

export const DEFAULT_SAQA = "saqa-classic";
export const DEFAULT_FIELD = "field-aula";

export function getItem(id: string) {
  return CATALOG.find((i) => i.id === id);
}

export function saqaLook(id: string | undefined): SaqaLook {
  return (getItem(id ?? "")?.saqa ?? getItem(DEFAULT_SAQA)!.saqa)!;
}

export function fieldLook(id: string | undefined): FieldLook {
  return (getItem(id ?? "")?.field ?? getItem(DEFAULT_FIELD)!.field)!;
}

export function isFree(id: string) {
  return getItem(id)?.priceKzt === 0;
}
