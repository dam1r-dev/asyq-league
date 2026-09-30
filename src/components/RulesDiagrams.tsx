/**
 * Иллюстрации для страницы правил: обычные SVG без картинок.
 * Поле всегда «тёмный асфальт с меловым кругом», как в самой игре.
 */

const GROUND = "#4a4744";
const CHALK = "#f4efe6";
const BONE = "#ecd3a6";
const BONE_DARK = "#a8825a";

/** Силуэт асыка (тот же «бантик», что и на canvas), центрирован в (0,0). */
const ASYQ_PATH =
  "M-5.9 -8.6 Q0 -4.3 5.9 -8.6 Q12.7 -8.2 11.8 0 Q12.7 8.2 5.9 8.6 Q0 4.3 -5.9 8.6 Q-12.7 8.2 -11.8 0 Q-12.7 -8.2 -5.9 -8.6 Z";

export function Asyq({
  x,
  y,
  scale = 1,
  rotate = 0,
  fill = BONE,
  stroke = BONE_DARK,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <path d={ASYQ_PATH} transform="translate(1.5 2.5)" fill="rgba(0,0,0,0.35)" />
      <path d={ASYQ_PATH} fill={fill} stroke={stroke} strokeWidth={1.1} />
      <path d="M-4 0 Q0 1.6 4 0" fill="none" stroke="rgba(120,85,50,0.6)" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

function Frame({ w, h, children, label }: { w: number; h: number; children: React.ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="block h-auto w-full rounded-2xl">
      <defs>
        <marker id="rd-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#f2b441" />
        </marker>
        <linearGradient id="rd-power" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#cfc6b6" />
          <stop offset="0.6" stopColor="#f7e3b8" />
          <stop offset="1" stopColor="#f2b441" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} rx={18} fill={GROUND} />
      {children}
    </svg>
  );
}

/** Главная схема броска: линия, сақа, оттяжка и путь к асыкам. */
export function ThrowDiagram({
  pull,
  fly,
  line,
  label,
}: {
  pull: string;
  fly: string;
  line: string;
  label: string;
}) {
  return (
    <Frame w={320} h={270} label={label}>
      {/* Кон и асыки */}
      <circle cx={140} cy={92} r={64} fill="none" stroke={CHALK} strokeWidth={2.4} strokeOpacity={0.85} />
      <Asyq x={112} y={92} />
      <Asyq x={140} y={92} />
      <Asyq x={168} y={92} />
      {/* Линия броска */}
      <path d="M40 202 H240" stroke={CHALK} strokeWidth={2.4} strokeOpacity={0.8} />
      <text x={40} y={192} fill={CHALK} fillOpacity={0.75} fontSize={10.5}>
        {line}
      </text>
      {/* Путь сақа */}
      <path d="M140 208 L140 116" stroke="#f2b441" strokeWidth={3} strokeDasharray="6 6" fill="none" markerEnd="url(#rd-arrow)" />
      <text x={156} y={158} fill="#f2b441" fontSize={11} fontWeight={700}>
        {fly}
      </text>
      {/* Оттяжка «рогатки» */}
      <path d="M140 216 L140 256" stroke="#fff" strokeOpacity={0.55} strokeWidth={2.4} />
      <Asyq x={140} y={216} scale={1.3} />
      <circle cx={140} cy={258} r={10} fill="#f2b441" fillOpacity={0.35} stroke="#f2b441" strokeWidth={2} />
      <path d="M186 232 L186 256" stroke="#f2b441" strokeWidth={3} markerEnd="url(#rd-arrow)" />
      <text x={154} y={266} fill="#f2b441" fontSize={11} fontWeight={700}>
        {pull}
      </text>
      {/* Шкала силы */}
      <rect x={278} y={60} width={16} height={170} rx={8} fill="url(#rd-power)" />
      <text x={286} y={52} textAnchor="middle" fill={CHALK} fontSize={10.5} fontWeight={700}>
        100%
      </text>
      <text x={286} y={246} textAnchor="middle" fill={CHALK} fontSize={10.5} fontWeight={700}>
        0%
      </text>
    </Frame>
  );
}

export type ScoreKind = "out" | "edge" | "combo" | "penalty" | "clear";

/** Мини-картинка для карточки «за что очки». */
export function ScoreDiagram({ kind, label }: { kind: ScoreKind; label: string }) {
  return (
    <Frame w={160} h={112} label={label}>
      <circle cx={76} cy={56} r={40} fill="none" stroke={CHALK} strokeWidth={2.2} strokeOpacity={0.85} />
      {kind === "out" && (
        <>
          <Asyq x={70} y={56} opacity={0.35} />
          <path d="M84 56 L118 56" stroke="#f2b441" strokeWidth={2.4} strokeDasharray="4 4" markerEnd="url(#rd-arrow)" />
          <Asyq x={138} y={56} />
        </>
      )}
      {kind === "edge" && (
        <>
          <Asyq x={116} y={56} />
          <Asyq x={66} y={62} />
          <path d="M120 84 L120 98" stroke="#ec5a45" strokeWidth={0} />
        </>
      )}
      {kind === "combo" && (
        <>
          <Asyq x={136} y={26} />
          <Asyq x={142} y={56} />
          <Asyq x={136} y={86} />
          <path d="M96 50 L118 32 M98 56 L122 56 M96 62 L118 80" stroke="#f2b441" strokeWidth={2} strokeDasharray="3 3" markerEnd="url(#rd-arrow)" />
        </>
      )}
      {kind === "penalty" && (
        <>
          <Asyq x={78} y={62} scale={1.5} stroke="#ec5a45" />
          <path d="M60 84 Q78 94 96 84" stroke="#ec5a45" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === "clear" && (
        <>
          <text x={76} y={66} textAnchor="middle" fontSize={30}>
            ⭐
          </text>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={48 + i * 28} cy={102} r={4.5} fill="#f2b441" />
          ))}
        </>
      )}
    </Frame>
  );
}

/** Пиктограммы четырёх сторон асыка для страницы истории. */
export function SideDiagram({ side, label }: { side: "alshy" | "tayki" | "buk" | "shik"; label: string }) {
  return (
    <svg viewBox="0 0 72 72" role="img" aria-label={label} className="block h-16 w-16 shrink-0 rounded-xl bg-[#5a5651]">
      <defs>
        <radialGradient id={`sd-${side}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff3dc" />
          <stop offset="1" stopColor={BONE} />
        </radialGradient>
      </defs>
      {side === "alshy" && <Asyq x={36} y={36} scale={1.9} rotate={90} />}
      {side === "tayki" && <Asyq x={36} y={36} scale={1.9} rotate={-90} fill="#e2c493" />}
      {side === "buk" && (
        <g>
          <Asyq x={36} y={36} scale={2.1} fill={`url(#sd-${side})`} />
          <ellipse cx={34} cy={33} rx={8} ry={4.5} fill="#fff8e8" opacity={0.6} />
        </g>
      )}
      {side === "shik" && (
        <g>
          <Asyq x={36} y={36} scale={2.1} />
          <ellipse cx={36} cy={37} rx={8} ry={4.2} fill="#7a5a36" opacity={0.75} />
        </g>
      )}
    </svg>
  );
}
