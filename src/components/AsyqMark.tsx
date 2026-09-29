/** Логотип: силуэт асыка сверху. */
export default function AsyqMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <radialGradient id="asyq-g" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff3dc" />
          <stop offset="0.5" stopColor="#f2b441" />
          <stop offset="1" stopColor="#a8651a" />
        </radialGradient>
      </defs>
      <path
        d="M14 12 Q24 18 34 12 Q46 13 44 24 Q46 35 34 36 Q24 30 14 36 Q2 35 4 24 Q2 13 14 12 Z"
        fill="url(#asyq-g)"
        stroke="#7a4a12"
        strokeWidth="2"
      />
      <path d="M17 24 Q24 28 31 24" fill="none" stroke="#7a4a12" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
