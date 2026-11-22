import React from 'react';

export const EcgArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <rect x="10" y="14" width="100" height="52" rx="12" fill="rgb(var(--a) / 0.08)" stroke="rgb(var(--a) / 0.28)" strokeWidth="1.5" />
    <path
      d="M16 44 H34 L41 28 L49 56 L58 20 L66 50 L73 38 L79 44 H104"
      stroke="rgb(var(--a))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lp-ecg-path"
    />
    <g transform="translate(88 18)">
      <circle cx="8" cy="8" r="8" fill="rgb(var(--a) / 0.22)" />
      <path d="M8 4 V12 M4 8 H12" stroke="rgb(var(--a))" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
));
EcgArt.displayName = 'EcgArt';

export const MuscleArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <path
      d="M28 54 C30 34, 48 22, 66 24 C82 26, 92 38, 92 50 C82 46, 70 46, 58 52 C48 57, 36 58, 28 54 Z"
      fill="rgb(var(--a) / 0.16)"
      stroke="rgb(var(--a))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M40 46 C50 38, 66 36, 78 40" stroke="rgb(var(--a) / 0.7)" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M44 51 C54 44, 68 42, 82 45" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M22 30 L34 22 M34 22 L28 21 M34 22 L32 28" stroke="rgb(var(--a))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M98 28 L86 20 M86 20 L92 19 M86 20 L88 26" stroke="rgb(var(--a))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="62" cy="36" r="3" fill="rgb(var(--a))" />
  </svg>
));
MuscleArt.displayName = 'MuscleArt';

export const SudokuArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <g transform="translate(29 9)">
      <rect x="0" y="0" width="62" height="62" rx="10" fill="rgb(var(--a) / 0.08)" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.75" />
      <line x1="20.6" y1="2" x2="20.6" y2="60" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
      <line x1="41.3" y1="2" x2="41.3" y2="60" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
      <line x1="2" y1="20.6" x2="60" y2="20.6" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
      <line x1="2" y1="41.3" x2="60" y2="41.3" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
      <rect x="22.5" y="22.5" width="17" height="17" rx="4" fill="rgb(var(--a) / 0.28)" />
      <text x="10.5" y="14.5" textAnchor="middle" fill="rgb(var(--a))" fontSize="11" fontWeight="800" fontFamily="monospace">C5</text>
      <text x="51.5" y="14.5" textAnchor="middle" fill="rgb(var(--a) / 0.75)" fontSize="11" fontWeight="800" fontFamily="monospace">3</text>
      <text x="31" y="34.5" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">A</text>
      <text x="10.5" y="55" textAnchor="middle" fill="rgb(var(--a) / 0.75)" fontSize="11" fontWeight="800" fontFamily="monospace">1</text>
      <text x="51.5" y="55" textAnchor="middle" fill="rgb(var(--a))" fontSize="11" fontWeight="800" fontFamily="monospace">L4</text>
    </g>
  </svg>
));
SudokuArt.displayName = 'SudokuArt';

export const WordleArt = React.memo(() => {
  const letters = [
    { ch: 'L', bg: 'rgb(16 185 129 / 0.3)', border: '#10b981', ink: '#6ee7b7' },
    { ch: 'U', bg: 'rgb(var(--a) / 0.28)', border: 'rgb(var(--a))', ink: '#fde047' },
    { ch: 'M', bg: 'rgba(63,63,70,0.45)', border: 'rgba(161,161,170,0.35)', ink: '#d4d4d8' },
    { ch: 'B', bg: 'rgb(16 185 129 / 0.3)', border: '#10b981', ink: '#6ee7b7' },
    { ch: 'R', bg: 'rgb(var(--a) / 0.28)', border: 'rgb(var(--a))', ink: '#fde047' },
  ];
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
      {letters.map((item, i) => {
        const x = 9 + i * 21;
        return (
          <g key={item.ch} transform={`translate(${x} 26)`}>
            <rect width="18" height="24" rx="5" fill={item.bg} stroke={item.border} strokeWidth="1.5" />
            <text x="9" y="16" textAnchor="middle" fill={item.ink} fontSize="11.5" fontWeight="900" fontFamily="monospace">
              {item.ch}
            </text>
          </g>
        );
      })}
      <rect x="26" y="57" width="68" height="5" rx="2.5" fill="rgb(var(--a) / 0.25)" />
    </svg>
  );
});
WordleArt.displayName = 'WordleArt';

export const NerveArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <path d="M18 40 H48 L66 22 H96" stroke="rgb(var(--a))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M48 40 L68 58 H96" stroke="rgb(var(--a) / 0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="40" r="5" fill="rgb(var(--a))" />
    <circle cx="48" cy="40" r="4.5" fill="#111113" stroke="rgb(var(--a))" strokeWidth="2.5" />
    <circle cx="66" cy="22" r="4" fill="rgb(var(--a))" />
    <circle cx="96" cy="22" r="5.5" fill="rgb(var(--a) / 0.25)" stroke="rgb(var(--a))" strokeWidth="2" />
    <circle cx="96" cy="58" r="4.5" fill="rgb(var(--a) / 0.2)" stroke="rgb(var(--a) / 0.65)" strokeWidth="1.75" />
  </svg>
));
NerveArt.displayName = 'NerveArt';

export const OsceArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="44" cy="44" r="20" fill="rgb(var(--a) / 0.12)" stroke="rgb(var(--a))" strokeWidth="2" />
    <rect x="38" y="18" width="12" height="5" rx="2" fill="rgb(var(--a))" />
    <path d="M44 44 V32 M44 44 L53 49" stroke="rgb(var(--a))" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="70" y="20" width="34" height="42" rx="8" fill="rgb(var(--a) / 0.1)" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.5" />
    <path d="M77 32 L81 36 L88 28 M77 44 H97 M77 52 H92" stroke="rgb(var(--a))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
OsceArt.displayName = 'OsceArt';

export const MemoryArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <g transform="rotate(-8 44 42)">
      <rect x="26" y="16" width="36" height="48" rx="9" fill="#17171a" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.75" />
      <circle cx="44" cy="40" r="8" stroke="rgb(var(--a) / 0.6)" strokeWidth="1.8" />
    </g>
    <g transform="rotate(8 76 40)">
      <rect x="58" y="16" width="36" height="48" rx="9" fill="rgb(var(--a) / 0.18)" stroke="rgb(var(--a))" strokeWidth="2" />
      <path d="M70 40 L74 44 L83 34" stroke="rgb(var(--a))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
));
MemoryArt.displayName = 'MemoryArt';

export const WheelArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="60" cy="42" r="26" fill="rgb(var(--a) / 0.12)" stroke="rgb(var(--a))" strokeWidth="2" />
    <line x1="60" y1="16" x2="60" y2="68" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.5" />
    <line x1="34" y1="42" x2="86" y2="42" stroke="rgb(var(--a) / 0.45)" strokeWidth="1.5" />
    <line x1="41.6" y1="23.6" x2="78.4" y2="60.4" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
    <line x1="78.4" y1="23.6" x2="41.6" y2="60.4" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.5" />
    <circle cx="60" cy="42" r="7" fill="rgb(var(--a))" />
    <polygon points="60,20 55,10 65,10" fill="rgb(var(--a))" />
  </svg>
));
WheelArt.displayName = 'WheelArt';

export const MpArt = React.memo(() => (
  <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="34" cy="36" r="14" fill="rgb(var(--a) / 0.16)" stroke="rgb(var(--a))" strokeWidth="2" />
    <circle cx="34" cy="32" r="5" fill="rgb(var(--a))" />
    <path d="M25 46 C27 41, 41 41, 43 46" stroke="rgb(var(--a))" strokeWidth="2" strokeLinecap="round" />
    <circle cx="86" cy="36" r="14" fill="rgb(var(--a) / 0.12)" stroke="rgb(var(--a) / 0.7)" strokeWidth="2" />
    <circle cx="86" cy="32" r="5" fill="rgb(var(--a) / 0.8)" />
    <path d="M77 46 C79 41, 93 41, 95 46" stroke="rgb(var(--a) / 0.8)" strokeWidth="2" strokeLinecap="round" />
    <rect x="49" y="29" width="22" height="16" rx="8" fill="rgb(var(--a))" />
    <text x="60" y="40.5" textAnchor="middle" fill="#09090b" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">VS</text>
  </svg>
));
MpArt.displayName = 'MpArt';
