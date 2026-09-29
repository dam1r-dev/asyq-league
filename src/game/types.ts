export interface Point {
  x: number;
  y: number;
}

export interface Kon extends Point {
  r: number;
}

export interface Stone extends Point {
  r: number;
}

/** Описание испытания: расстановка, лимит бросков и планки для звёзд. */
export interface LevelDef {
  id: string;
  /** Название на казахском — часть атмосферы. */
  title: string;
  /** Короткое пояснение на русском. */
  subtitle: string;
  kon: Kon;
  lineY: number;
  asyks: Point[];
  stones: Stone[];
  throws: number;
  /** Выиграл за ≤ par3 бросков — 3 звезды, за ≤ par2 — 2, иначе 1. */
  par3: number;
  par2: number;
  /** Платный набор испытаний (косметический контент, не даёт преимущества). */
  pack?: "legends";
  hint?: string;
}

/**
 * Бросок полностью описывается тремя числами: где стоит игрок на линии (sx)
 * и начальная скорость сақа (vx, vy). Числа округляются, поэтому клиент и
 * сервер симулируют ровно один и тот же бросок.
 */
export interface ThrowInput {
  sx: number;
  vx: number;
  vy: number;
}

export type BodyKind = "saqa" | "asyk" | "stone";

export interface Body {
  id: number;
  kind: BodyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  invMass: number;
  friction: number;
}

export interface CollisionEvent {
  step: number;
  a: number;
  b: number;
  /** Сила удара — для звука и тряски экрана. */
  impulse: number;
  kinds: [BodyKind, BodyKind];
}

export interface AsykState extends Point {
  id: number;
}

/** Сторона, которой упал выбитый асык. Косметика — на очки не влияет. */
export type AsykSide = "алшы" | "тәйкі" | "бүк" | "шік";

export interface ThrowResult {
  input: ThrowInput;
  power: number;
  knockedIds: number[];
  sides: AsykSide[];
  /** Сақа коснулась хотя бы одного асыка. */
  hit: boolean;
  saqaInKon: boolean;
  points: number;
  comboBonus: number;
  penalty: number;
}

export type RoundStatus = "playing" | "won" | "lost";

export interface RoundState {
  level: LevelDef;
  asyks: AsykState[];
  throwsUsed: number;
  score: number;
  knocked: number;
  history: ThrowResult[];
  status: RoundStatus;
  /** Бонус за оставшиеся броски, начисляется при победе. */
  finishBonus: number;
  stars: 0 | 1 | 2 | 3;
}
