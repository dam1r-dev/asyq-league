import { COLOR_HEX } from "@/avatar/config";

/**
 * Магазин продаёт только внешний вид и дополнительный контент.
 * Физика, очки и рейтинг от покупок не зависят — это принципиально.
 *
 * Всё покупается за тиыны — внутриигровую валюту, которую зарабатывают игрой
 * (звёзды, турнир дня). Реальные деньги (тестовый режим) нужны только для
 * пакетов тиынов — для тех, кто не хочет ждать.
 */

export type ItemKind = "saqa" | "field" | "pack" | "outfit" | "hat" | "color" | "coins";

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
  /** Цена в тиынах (0 — бесплатно). */
  price: number;
  /** Только для пакетов тиынов: цена в тенге (тестовая оплата) и сколько тиынов. */
  priceKzt?: number;
  coins?: number;
  saqa?: SaqaLook;
  field?: FieldLook;
}

export const CATALOG: ShopItem[] = [
  {
    id: "saqa-classic",
    kind: "saqa",
    name: "Кәдімгі сақа",
    description: "Обычная костяная сақа. Бесплатно.",
    price: 0,
    saqa: { base: "#e9cfa3", light: "#fff3dc", dark: "#a8825a" },
  },
  {
    id: "saqa-qyzyl",
    kind: "saqa",
    name: "Қызыл сақа",
    description: "Сақа, окрашенная в красный, как во дворах 90-х.",
    price: 150,
    saqa: { base: "#d9533e", light: "#ff9a7d", dark: "#8c2718", dye: "#b53422" },
  },
  {
    id: "saqa-kok",
    kind: "saqa",
    name: "Көк сақа",
    description: "Небесно-голубая, цвета флага.",
    price: 150,
    saqa: { base: "#39b9d3", light: "#a8ecf7", dark: "#16707f", dye: "#1d93a8" },
  },
  {
    id: "saqa-altyn",
    kind: "saqa",
    name: "Алтын сақа",
    description: "Золотая сақа чемпиона лиги.",
    price: 400,
    saqa: { base: "#f2b441", light: "#fff0b3", dark: "#94600f", dye: "#d4921f" },
  },
  {
    id: "field-aula",
    kind: "field",
    name: "Аула",
    description: "Асфальт двора и мел. Бесплатно.",
    price: 0,
    field: { ground: "#4a4744", speck: ["#5a5652", "#3a3734", "#625d57"], chalk: "#f4efe6" },
  },
  {
    id: "field-auyl",
    kind: "field",
    name: "Ауыл",
    description: "Утоптанная земля за домом у бабушки.",
    price: 200,
    field: { ground: "#8a6443", speck: ["#9c7450", "#74533a", "#a88460"], chalk: "#fff6e3" },
  },
  {
    id: "field-dala",
    kind: "field",
    name: "Дала",
    description: "Выгоревшая летняя степь.",
    price: 200,
    field: { ground: "#8c8a4f", speck: ["#9d9b5c", "#77763f", "#b0a86a"], chalk: "#fffbea" },
  },
  {
    id: "field-kiiz",
    kind: "field",
    name: "Киіз",
    description: "Войлочный ковёр с орнаментом — для домашних турниров.",
    price: 350,
    field: { ground: "#7a2e24", speck: ["#8a372b", "#6a261d", "#93402f"], chalk: "#f5d58a", pattern: "felt" },
  },
  {
    id: "pack-legends",
    kind: "pack",
    name: "Дала аңыздары",
    description: "Набор из 4 новых испытаний: крепость, звезда, көкпар и великая степь.",
    price: 500,
  },
  // ——— Одежда кочевника
  { id: "outfit-simple", kind: "outfit", name: "Жейде", description: "", price: 0 },
  { id: "outfit-kamzol", kind: "outfit", name: "Камзол", description: "", price: 120 },
  { id: "outfit-shapan", kind: "outfit", name: "Шапан", description: "", price: 180 },
  { id: "outfit-koilek", kind: "outfit", name: "Қыз көйлегі", description: "", price: 200 },
  { id: "outfit-ton", kind: "outfit", name: "Тон", description: "", price: 300 },
  { id: "outfit-sauyt", kind: "outfit", name: "Батыр сауыты", description: "", price: 450 },
  // ——— Головные уборы
  { id: "hat-none", kind: "hat", name: "—", description: "", price: 0 },
  { id: "hat-taqiya", kind: "hat", name: "Ою тақия", description: "", price: 0 },
  { id: "hat-taqiya-kiiz", kind: "hat", name: "Киіз тақия", description: "", price: 60 },
  { id: "hat-taqiya-zer", kind: "hat", name: "Зерлі тақия", description: "", price: 250 },
  { id: "hat-borik", kind: "hat", name: "Бөрік", description: "", price: 120 },
  { id: "hat-tymaq", kind: "hat", name: "Тымақ", description: "", price: 180 },
  { id: "hat-saukele", kind: "hat", name: "Сәукеле", description: "", price: 300 },
  { id: "hat-dulygha", kind: "hat", name: "Дулыға", description: "", price: 350 },
  // ——— Цвета одежды
  ...(Object.keys(COLOR_HEX) as (keyof typeof COLOR_HEX)[]).map((id) => ({
    id,
    kind: "color" as const,
    name: id,
    description: "",
    price: { "color-white": 60, "color-black": 60, "color-burgundy": 80, "color-sky": 80, "color-silver": 150, "color-gold": 250 }[id as string] ?? 0,
  })),
  // ——— Пакеты тиынов (тестовая оплата реальными деньгами)
  { id: "coins-500", kind: "coins", name: "500", description: "", price: 0, priceKzt: 490, coins: 500 },
  { id: "coins-1200", kind: "coins", name: "1200", description: "", price: 0, priceKzt: 990, coins: 1200 },
  { id: "coins-3000", kind: "coins", name: "3000", description: "", price: 0, priceKzt: 1990, coins: 3000 },
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
  const item = getItem(id);
  return !!item && item.kind !== "coins" && item.price === 0;
}
