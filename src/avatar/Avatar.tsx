import { useId } from "react";
import { COLOR_HEX, EYE_COLORS, HAIR_COLORS, SKIN_TONES, type AvatarConfig } from "./config";

/**
 * Плоский персонаж в духе детской иллюстрации: большая голова, простые формы.
 * Рисуется слоями: волосы сзади → руки → ноги → одежда → голова → лицо →
 * волосы спереди → головной убор. Всё — обычный SVG, без картинок.
 */

const GOLD = "#e2b04a";
const FUR = "#d9b98c";
const FUR_DARK = "#b8935f";
const BOOT = "#4a3222";
const WHITE = "#f4efe5";

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amount < 0 ? c : 255 - c) * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function Avatar({
  config,
  variant = "full",
  className,
  title,
}: {
  config: AvatarConfig;
  /** full — во весь рост, head — только голова (для шапки и рейтинга). */
  variant?: "full" | "head";
  className?: string;
  title?: string;
}) {
  const skin = SKIN_TONES[config.skin];
  const skinDark = shade(skin, -0.12);
  const eye = EYE_COLORS[config.eyes];
  const hair = HAIR_COLORS[config.hairColor];
  const c = COLOR_HEX[config.color];
  const cDark = shade(c, -0.25);
  const nomad = config.outfit !== "outfit-simple";
  const altyn = config.outfit === "outfit-altyn-adam";
  const uid = useId().replace(/:/g, "");

  const viewBox = variant === "head" ? "44 18 112 112" : "0 -42 200 350";

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={title ?? "avatar"}>
      {altyn && <AltynAdamBack uid={uid} full={variant === "full"} />}
      {/* Волосы сзади */}
      {!altyn && config.hair === "long" && (
        <path d="M58 82 Q56 38 100 36 Q144 38 142 82 L146 150 Q100 160 54 150 Z" fill={hair} />
      )}
      {!altyn && config.hair === "braids" && (
        <g fill={hair}>
          <path d="M58 84 Q56 38 100 36 Q144 38 142 84 L140 120 L60 120 Z" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <ellipse cx={58} cy={128 + i * 15} rx={8} ry={9} />
              <ellipse cx={142} cy={128 + i * 15} rx={8} ry={9} />
            </g>
          ))}
        </g>
      )}

      {variant === "full" &&
        (altyn ? (
          <AltynAdamBody uid={uid} skin={skin} />
        ) : (
          <Body config={config} skin={skin} skinDark={skinDark} c={c} cDark={cDark} nomad={nomad} />
        ))}

      {/* Шея и голова */}
      <rect x={90} y={120} width={20} height={20} fill={skinDark} />
      <ellipse cx={61} cy={96} rx={7} ry={10} fill={skin} />
      <ellipse cx={139} cy={96} rx={7} ry={10} fill={skin} />
      <ellipse cx={100} cy={88} rx={40} ry={43} fill={skin} />

      {/* Лицо */}
      <circle cx={85} cy={90} r={5.5} fill={eye} />
      <circle cx={115} cy={90} r={5.5} fill={eye} />
      <circle cx={86.8} cy={88.2} r={1.6} fill="#fff" opacity={0.9} />
      <circle cx={116.8} cy={88.2} r={1.6} fill="#fff" opacity={0.9} />
      {config.mustache && (
        <path d="M88 103 Q94 99 100 102 Q106 99 112 103 Q106 107 100 104 Q94 107 88 103 Z" fill={hair} />
      )}
      <path d="M87 108 Q100 118 113 108" fill="none" stroke="#6b3f22" strokeWidth={3} strokeLinecap="round" />

      {/* Волосы спереди */}
      {!altyn && config.hair !== "bald" && (
        <path
          d="M60 86 Q56 42 100 40 Q144 42 140 86 Q136 70 128 60 Q108 66 84 60 Q70 64 60 86 Z"
          fill={hair}
        />
      )}
      {!altyn && config.hair === "bald" && <path d="M92 47 Q100 40 108 47 Q100 45 92 47 Z" fill={hair} />}

      {altyn ? <AltynAdamHat uid={uid} /> : <Hat hat={config.hat} c={c} cDark={cDark} />}
    </svg>
  );
}

function Body({
  config,
  skin,
  skinDark,
  c,
  cDark,
  nomad,
}: {
  config: AvatarConfig;
  skin: string;
  skinDark: string;
  c: string;
  cDark: string;
  nomad: boolean;
}) {
  const o = config.outfit;
  return (
    <g>
      {/* Ноги: у кочевых костюмов — высокие етік */}
      {nomad ? (
        <g fill={BOOT}>
          <rect x={76} y={250} width={20} height={52} rx={4} />
          <rect x={104} y={250} width={20} height={52} rx={4} />
          <rect x={72} y={292} width={26} height={10} rx={5} />
          <rect x={102} y={292} width={26} height={10} rx={5} />
        </g>
      ) : (
        <g>
          <rect x={78} y={250} width={18} height={44} fill={skin} />
          <rect x={104} y={250} width={18} height={44} fill={skin} />
          <rect x={72} y={290} width={26} height={12} rx={6} fill="#2d3e50" />
          <rect x={102} y={290} width={26} height={12} rx={6} fill="#2d3e50" />
        </g>
      )}

      {/* Руки */}
      {o === "outfit-simple" && (
        <g fill={skin}>
          <rect x={52} y={142} width={16} height={84} rx={8} />
          <rect x={132} y={142} width={16} height={84} rx={8} />
        </g>
      )}
      {(o === "outfit-kamzol" || o === "outfit-koilek") && (
        <g>
          <path d="M68 140 L50 150 L44 222 L62 224 L70 170 Z" fill={WHITE} />
          <path d="M132 140 L150 150 L156 222 L138 224 L130 170 Z" fill={WHITE} />
          <circle cx={54} cy={230} r={8} fill={skin} />
          <circle cx={146} cy={230} r={8} fill={skin} />
        </g>
      )}
      {(o === "outfit-shapan" || o === "outfit-ton") && (
        <g>
          <rect x={48} y={140} width={22} height={84} rx={9} fill={c} />
          <rect x={130} y={140} width={22} height={84} rx={9} fill={c} />
          <rect x={48} y={212} width={22} height={12} rx={4} fill={o === "outfit-ton" ? FUR : GOLD} />
          <rect x={130} y={212} width={22} height={12} rx={4} fill={o === "outfit-ton" ? FUR : GOLD} />
          <circle cx={59} cy={231} r={8} fill={skin} />
          <circle cx={141} cy={231} r={8} fill={skin} />
        </g>
      )}
      {o === "outfit-sauyt" && (
        <g>
          <rect x={50} y={142} width={18} height={84} rx={8} fill="#6b4426" />
          <rect x={132} y={142} width={18} height={84} rx={8} fill="#6b4426" />
          <circle cx={59} cy={231} r={8} fill={skin} />
          <circle cx={141} cy={231} r={8} fill={skin} />
        </g>
      )}
      {o === "outfit-simple" && (
        <g fill={skinDark}>
          <circle cx={60} cy={226} r={8} />
          <circle cx={140} cy={226} r={8} />
        </g>
      )}

      {/* Одежда */}
      {o === "outfit-simple" && (
        <g>
          <path d="M70 218 H130 V254 H106 V236 H94 V254 H70 Z" fill="#2d3e50" />
          <path d="M70 142 Q70 136 78 136 L86 136 Q100 156 114 136 L122 136 Q130 136 130 142 L130 222 L70 222 Z" fill={c} />
        </g>
      )}
      {o === "outfit-kamzol" && (
        <g>
          <path d="M72 216 H128 V258 H106 V240 H94 V258 H72 Z" fill="#3a2f28" />
          <path d="M68 140 Q68 134 76 134 L124 134 Q132 134 132 140 L132 222 L68 222 Z" fill={WHITE} />
          <path d="M68 140 Q68 134 76 134 L92 134 L96 226 L68 226 Z" fill={c} />
          <path d="M132 140 Q132 134 124 134 L108 134 L104 226 L132 226 Z" fill={c} />
          <path d="M92 134 L96 226 M108 134 L104 226" stroke={GOLD} strokeWidth={3} />
          <rect x={68} y={214} width={64} height={8} fill={cDark} />
          {[150, 170, 190].map((y) => (
            <g key={y} fill={GOLD}>
              <circle cx={89} cy={y} r={2.4} />
              <circle cx={111} cy={y} r={2.4} />
            </g>
          ))}
        </g>
      )}
      {(o === "outfit-shapan" || o === "outfit-ton") && (
        <g>
          <path d="M68 138 Q68 134 76 134 L124 134 Q132 134 132 138 L144 276 L56 276 Z" fill={c} />
          <path d="M100 150 L100 276" stroke={cDark} strokeWidth={3} />
          {o === "outfit-shapan" ? (
            <g>
              <path d="M84 134 L100 170 L116 134" fill="none" stroke={GOLD} strokeWidth={5} strokeLinejoin="round" />
              <path d="M100 170 L100 276" stroke={GOLD} strokeWidth={4} />
              <rect x={56} y={266} width={88} height={10} fill={GOLD} />
              <rect x={70} y={200} width={60} height={9} rx={3} fill={cDark} />
              <circle cx={100} cy={204.5} r={5} fill={GOLD} />
              {/* Орнамент на подоле */}
              {[70, 86, 114, 130].map((x) => (
                <path key={x} d={`M${x - 5} 256 q5 -8 10 0`} fill="none" stroke={GOLD} strokeWidth={2} />
              ))}
            </g>
          ) : (
            <g>
              <ellipse cx={100} cy={140} rx={38} ry={14} fill={FUR} />
              <path d="M94 150 L94 276 L106 276 L106 150 Z" fill={FUR} />
              <rect x={54} y={262} width={92} height={16} rx={6} fill={FUR} />
              {[64, 80, 96, 112, 128, 140].map((x) => (
                <circle key={x} cx={x} cy={270} r={2} fill={FUR_DARK} />
              ))}
            </g>
          )}
        </g>
      )}
      {o === "outfit-koilek" && (
        <g>
          <path d="M70 180 L130 180 L150 296 L50 296 Z" fill={c} />
          <path d="M50 290 Q60 300 70 290 Q80 300 90 290 Q100 300 110 290 Q120 300 130 290 Q140 300 150 290 L150 298 L50 298 Z" fill={WHITE} />
          <path d="M68 140 Q68 134 76 134 L124 134 Q132 134 132 140 L134 200 L66 200 Z" fill={cDark} />
          <path d="M88 134 Q100 150 112 134" fill={WHITE} />
          {[152, 166, 180, 194].map((y) => (
            <g key={y} fill={GOLD}>
              <circle cx={93} cy={y} r={2.5} />
              <circle cx={107} cy={y} r={2.5} />
            </g>
          ))}
          <path d="M66 200 L134 200" stroke={GOLD} strokeWidth={3} />
        </g>
      )}
      {o === "outfit-sauyt" && (
        <g>
          <path d="M70 138 L130 138 L136 262 L64 262 Z" fill="#5a3a22" />
          {/* Пластины доспеха рядами */}
          {Array.from({ length: 8 }, (_, row) => {
            const y = 146 + row * 14;
            const x0 = 70 - row * 0.8;
            const n = 6;
            const w = (60 + row * 1.6) / n;
            return Array.from({ length: n }, (_, i) => (
              <rect
                key={`${row}-${i}`}
                x={x0 + i * w + (row % 2 ? w / 2 - 2 : 0)}
                y={y}
                width={w - 2}
                height={13}
                rx={4}
                fill={row % 2 ? c : shade(c, -0.12)}
                stroke={cDark}
                strokeWidth={1}
              />
            ));
          })}
          <rect x={64} y={222} width={72} height={8} fill="#3b2415" />
          <circle cx={100} cy={226} r={5} fill={GOLD} />
          <ellipse cx={100} cy={140} rx={42} ry={13} fill={FUR} />
          <ellipse cx={62} cy={146} rx={12} ry={10} fill={FUR} />
          <ellipse cx={138} cy={146} rx={12} ry={10} fill={FUR} />
        </g>
      )}
    </g>
  );
}

function Hat({ hat, c, cDark }: { hat: AvatarConfig["hat"]; c: string; cDark: string }) {
  switch (hat) {
    case "hat-taqiya": {
      // Ою тақия: низкий бархатный конус и полоса орнамента-завитков.
      const light = shade(c, 0.45);
      return (
        <g>
          <path d="M62 58 Q66 36 100 20 Q134 36 138 58 Z" fill={c} />
          <path d="M100 20 Q90 36 86 58" fill="none" stroke={shade(c, 0.15)} strokeWidth={3} opacity={0.6} />
          <path d="M61 54 H139 L140 70 Q100 75 60 70 Z" fill={cDark} />
          <path d="M62 56 H138 M61 68 Q100 73 139 68" stroke={light} strokeWidth={1.4} fill="none" />
          {[68, 80, 92, 104, 116, 128].map((x) => (
            <path
              key={x}
              d={`M${x} 64 q0 -5 4 -5 q4 0 4 4 q0 3 -3 3 q-2 0 -2 -2`}
              fill="none"
              stroke={light}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ))}
        </g>
      );
    }
    case "hat-taqiya-kiiz":
      // Киіз тақия: простая плоская войлочная шапочка.
      return (
        <g>
          <path d="M63 68 L66 32 Q100 26 134 32 L137 68 Q100 73 63 68 Z" fill={c} />
          <ellipse cx={100} cy={32} rx={34} ry={6} fill={shade(c, 0.12)} />
          <path d="M66 36 Q100 42 134 36" fill="none" stroke={cDark} strokeWidth={1.2} opacity={0.6} />
          <path d="M63 66 Q100 71 137 66" fill="none" stroke={cDark} strokeWidth={2} opacity={0.7} />
        </g>
      );
    case "hat-taqiya-zer": {
      // Зерлі тақия: чёрный бархат, золотое шитьё и меандр по низу.
      const ZER = "#d9a63a";
      return (
        <g>
          <path d="M63 68 L66 32 Q100 26 134 32 L137 68 Q100 73 63 68 Z" fill="#1c1916" />
          <ellipse cx={100} cy={32} rx={34} ry={6} fill="#26211d" stroke={ZER} strokeWidth={1.2} />
          {/* Золотые листья и завитки */}
          {[74, 90, 110, 126].map((x, i) => (
            <g key={x} fill={ZER}>
              <ellipse cx={x} cy={44} rx={6} ry={2.6} transform={`rotate(${i % 2 ? 35 : -35} ${x} 44)`} />
              <ellipse cx={x + 5} cy={50} rx={4.5} ry={2} transform={`rotate(${i % 2 ? -30 : 30} ${x + 5} 50)`} />
            </g>
          ))}
          <path d="M70 40 q8 -6 14 0 t14 0 t14 0 t14 0 t14 0" fill="none" stroke={ZER} strokeWidth={1.3} />
          <circle cx={100} cy={32} r={3} fill={ZER} />
          {/* Меандр */}
          <path d="M63 56 H137" stroke={ZER} strokeWidth={1.4} />
          <path
            d="M65 66 v-7 h5 v4 h-2.5 M73 66 v-7 h5 v4 h-2.5 M81 66 v-7 h5 v4 h-2.5 M89 66 v-7 h5 v4 h-2.5 M97 66 v-7 h5 v4 h-2.5 M105 66 v-7 h5 v4 h-2.5 M113 66 v-7 h5 v4 h-2.5 M121 66 v-7 h5 v4 h-2.5 M129 66 v-7 h5 v4 h-2.5"
            fill="none"
            stroke={ZER}
            strokeWidth={1.3}
          />
          <path d="M63 68 Q100 73 137 68" fill="none" stroke={ZER} strokeWidth={1.6} />
        </g>
      );
    }
    case "hat-borik":
      return (
        <g>
          <path d="M70 58 L74 24 Q100 16 126 24 L130 58 Z" fill={c} />
          <circle cx={100} cy={20} r={4} fill={GOLD} />
          <rect x={60} y={50} width={80} height={20} rx={10} fill={FUR} />
          {[68, 80, 92, 104, 116, 128].map((x) => (
            <circle key={x} cx={x} cy={60} r={2} fill={FUR_DARK} />
          ))}
        </g>
      );
    case "hat-tymaq":
      return (
        <g>
          <ellipse cx={58} cy={104} rx={13} ry={30} fill={FUR} />
          <ellipse cx={142} cy={104} rx={13} ry={30} fill={FUR} />
          <path d="M54 80 Q50 22 100 18 Q150 22 146 80 Q100 66 54 80 Z" fill={FUR} />
          <path d="M76 40 Q100 16 124 40 Q100 34 76 40 Z" fill={c} />
          {[64, 78, 92, 108, 122, 136].map((x) => (
            <circle key={x} cx={x} cy={66 + Math.abs(100 - x) * 0.05} r={2.2} fill={FUR_DARK} />
          ))}
        </g>
      );
    case "hat-saukele":
      return (
        <g>
          {/* Үкі — перья филина на макушке */}
          <g fill="#fbf7ef">
            <ellipse cx={100} cy={-30} rx={10} ry={9} />
            <ellipse cx={92} cy={-24} rx={7} ry={7} />
            <ellipse cx={108} cy={-24} rx={7} ry={7} />
          </g>
          <path d="M76 62 L92 -20 L108 -20 L124 62 Z" fill={c} />
          {[0, 20, 40].map((dy) => (
            <path key={dy} d={`M${88 - dy * 0.2} ${0 + dy} H${112 + dy * 0.2}`} stroke={GOLD} strokeWidth={3} />
          ))}
          <path d="M90 -20 H110" stroke={GOLD} strokeWidth={4} />
          <rect x={66} y={54} width={68} height={16} rx={8} fill={FUR} />
          {/* Подвески по бокам */}
          {[62, 138].map((x) => (
            <g key={x} fill={GOLD}>
              <rect x={x - 1.5} y={70} width={3} height={40} />
              <circle cx={x} cy={112} r={4} />
            </g>
          ))}
        </g>
      );
    case "hat-dulygha":
      return (
        <g>
          {/* Нащёчники по бокам — лицо остаётся открытым */}
          <path d="M56 70 L70 70 L68 112 Q60 110 56 100 Z" fill="#7d858e" />
          <path d="M144 70 L130 70 L132 112 Q140 110 144 100 Z" fill="#7d858e" />
          <path d="M58 72 Q56 26 100 22 Q144 26 142 72 Z" fill="#9aa2ab" />
          <path d="M96 22 L100 -4 L104 22 Z" fill="#9aa2ab" />
          <circle cx={100} cy={-6} r={4} fill={c} />
          <rect x={56} y={64} width={88} height={9} rx={4} fill={cDark} />
          <rect x={98} y={70} width={4} height={14} rx={2} fill="#9aa2ab" />
          <path d="M72 46 Q100 30 128 46" fill="none" stroke="#c7ccd2" strokeWidth={3} />
        </g>
      );
    default:
      return null;
  }
}

/*
 * «Алтын адам» — Золотой человек из кургана Иссык (V–IV вв. до н.э.).
 * Цельный премиальный костюм: красный кафтан в золотых треугольных бляшках,
 * плащ, пояс с акинаком и высокий остроконечный головной убор со стрелами.
 */
const AA_RED = "#b3202a";
const AA_RED_DARK = "#7e141c";
const AA_GOLD = "#f0bf3c";
const AA_GOLD_DARK = "#b9831b";

function AltynAdamDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <pattern id={`aa-tri-${uid}`} width={8} height={7} patternUnits="userSpaceOnUse">
        <rect width={8} height={7} fill={AA_RED_DARK} />
        <path d="M0 7 L4 0.5 L8 7 Z" fill={AA_GOLD} stroke={AA_GOLD_DARK} strokeWidth={0.6} />
      </pattern>
      <radialGradient id={`aa-aura-${uid}`} cx="50%" cy="45%" r="55%">
        <stop offset="0" stopColor="#ffd970" stopOpacity={0.55} />
        <stop offset="1" stopColor="#ffd970" stopOpacity={0} />
      </radialGradient>
    </defs>
  );
}

function AltynAdamBack({ uid, full }: { uid: string; full: boolean }) {
  return (
    <g>
      <AltynAdamDefs uid={uid} />
      {/* Золотое сияние — видно издалека, даже в рейтинге */}
      <ellipse cx={100} cy={full ? 140 : 80} rx={full ? 98 : 60} ry={full ? 190 : 60} fill={`url(#aa-aura-${uid})`} />
      {full && <path d="M66 138 L40 296 Q100 308 160 296 L134 138 Z" fill={AA_RED_DARK} />}
      {/* Назатыльник головного убора */}
      <path d="M56 70 Q54 120 66 146 L134 146 Q146 120 144 70 Z" fill={AA_RED} />
    </g>
  );
}

function AltynAdamBody({ uid, skin }: { uid: string; skin: string }) {
  const tri = `url(#aa-tri-${uid})`;
  return (
    <g>
      {/* Сапоги в бляшках */}
      <rect x={76} y={250} width={20} height={48} rx={3} fill={tri} />
      <rect x={104} y={250} width={20} height={48} rx={3} fill={tri} />
      <rect x={70} y={292} width={28} height={10} rx={5} fill="#5b3a1f" />
      <rect x={102} y={292} width={28} height={10} rx={5} fill="#5b3a1f" />
      {/* Штаны */}
      <path d="M70 226 H130 V256 H104 V240 H96 V256 H70 Z" fill={AA_RED} />
      {/* Рукава */}
      <rect x={48} y={140} width={22} height={82} rx={9} fill={tri} />
      <rect x={130} y={140} width={22} height={82} rx={9} fill={tri} />
      <rect x={48} y={212} width={22} height={9} rx={3} fill={AA_GOLD} />
      <rect x={130} y={212} width={22} height={9} rx={3} fill={AA_GOLD} />
      <circle cx={59} cy={229} r={8} fill={skin} />
      <circle cx={141} cy={229} r={8} fill={skin} />
      {/* Кафтан */}
      <path d="M66 138 Q66 134 74 134 L126 134 Q134 134 134 138 L138 240 L62 240 Z" fill={tri} />
      <path d="M100 136 L100 240" stroke={AA_GOLD} strokeWidth={4} />
      <path d="M62 236 H138" stroke={AA_GOLD} strokeWidth={4} />
      {/* Золотой пояс с бляшками */}
      <rect x={62} y={196} width={76} height={12} rx={3} fill={AA_GOLD} stroke={AA_GOLD_DARK} strokeWidth={1} />
      {[70, 84, 100, 116, 130].map((x) => (
        <rect key={x} x={x - 4} y={198} width={8} height={8} rx={1.5} fill={AA_GOLD_DARK} />
      ))}
      {/* Акинак на поясе */}
      <path d="M126 206 L150 262" stroke={AA_RED_DARK} strokeWidth={7} strokeLinecap="round" />
      <path d="M126 206 L150 262" stroke={AA_GOLD} strokeWidth={2} strokeDasharray="4 4" />
      <path d="M118 196 L132 214" stroke={AA_GOLD} strokeWidth={5} strokeLinecap="round" />
      {/* Гривна на шее */}
      <path d="M84 138 Q100 150 116 138" fill="none" stroke={AA_GOLD} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function AltynAdamHat({ uid }: { uid: string }) {
  return (
    <g>
      {/* Высокий остроконечный головной убор */}
      <path d="M62 66 Q70 20 92 -34 L108 -34 Q130 20 138 66 Z" fill={AA_RED} />
      <path d="M92 -34 L100 -40 L108 -34 Z" fill={AA_GOLD} />
      {/* Золотые стрелы, торчащие вверх */}
      {[82, 92, 108, 118].map((x, i) => (
        <g key={x} stroke={AA_GOLD} strokeWidth={2} strokeLinecap="round">
          <path d={`M${x} 56 L${x + (i < 2 ? -6 : 6)} ${-6 + i * 3}`} />
          <path
            d={`M${x + (i < 2 ? -6 : 6)} ${-6 + i * 3} l-3 6 M${x + (i < 2 ? -6 : 6)} ${-6 + i * 3} l3 6`}
            strokeWidth={1.6}
          />
        </g>
      ))}
      {/* Бляшки-звери и полосы */}
      {[10, 26, 42].map((y) => (
        <path key={y} d={`M${86 - (y - 10) * 0.12} ${y} q14 -6 28 0`} fill="none" stroke={AA_GOLD} strokeWidth={2.2} />
      ))}
      <path d="M94 -14 l6 -8 l6 8 z M93 0 l7 -8 l7 8 z" fill={AA_GOLD} />
      {/* Золотой обод по лбу */}
      <path d="M60 62 Q100 50 140 62 L140 72 Q100 60 60 72 Z" fill={AA_GOLD} stroke={AA_GOLD_DARK} strokeWidth={1} />
      {[70, 85, 100, 115, 130].map((x) => (
        <circle key={x} cx={x} cy={64} r={2} fill={AA_RED_DARK} />
      ))}
      {/* Боковые пластины назатыльника */}
      <path d="M56 76 L66 76 L68 134 L58 128 Z" fill={`url(#aa-tri-${uid})`} />
      <path d="M144 76 L134 76 L132 134 L142 128 Z" fill={`url(#aa-tri-${uid})`} />
    </g>
  );
}
