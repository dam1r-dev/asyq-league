// Все размеры — в «игровых единицах». Поле рисуется в прямоугольнике 400×700,
// а canvas просто масштабирует его под экран. Так физика не зависит от размера
// устройства: один и тот же бросок даёт один и тот же результат везде.

export const WORLD_W = 400;
export const WORLD_H = 700;

/** Фиксированный шаг симуляции (секунды). Никогда не зависит от FPS. */
export const DT = 1 / 120;
/** Предохранитель: максимум 25 секунд «игрового» времени на бросок. */
export const MAX_STEPS = 120 * 25;

export const SAQA_R = 13;
export const ASYK_R = 10;

/** Сақа тяжелее асыка — её традиционно заливают свинцом (қорғасын). */
export const SAQA_MASS = 2.5;
export const ASYK_MASS = 1;

/** Замедление от трения о землю, ед/с². Асык неровный — тормозит сильнее. */
export const SAQA_FRICTION = 180;
export const ASYK_FRICTION = 360;

/** Коэффициент упругости удара кость о кость и кость о камень. */
export const RESTITUTION = 0.88;
export const STONE_RESTITUTION = 0.6;

/** Скорость броска при 100% силы. */
export const V_MAX = 800;

/** Как далеко от центра кона можно встать на линии броска. */
export const THROW_SPREAD = 150;

export const DEFAULT_KON = { x: 200, y: 250, r: 140 };
export const DEFAULT_LINE_Y = 560;
