import React from 'react';

export const EcgArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="art-ecg-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgb(20 184 166 / 0.22)" />
        <stop offset="100%" stopColor="rgb(20 184 166 / 0.04)" />
      </linearGradient>
    </defs>
    <rect x="16" y="18" width="208" height="114" rx="20" fill="url(#art-ecg-bg)" stroke="rgb(var(--a) / 0.32)" strokeWidth="2" />
    {/* Grid lines */}
    <path d="M30 48 H210 M30 75 H210 M30 102 H210 M72 30 V120 M120 30 V120 M168 30 V120" stroke="rgb(var(--a) / 0.12)" strokeWidth="1" />
    {/* Live Pulse Waveform */}
    <path
      d="M28 84 H62 L74 52 L88 108 L104 34 L120 96 L132 70 L144 84 H208"
      stroke="rgb(var(--a))"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lp-ecg-path"
    />
    {/* Medical Emergency Badge + Patient Tag */}
    <rect x="164" y="28" width="48" height="24" rx="8" fill="#09090b" stroke="rgb(var(--a) / 0.55)" strokeWidth="1.5" />
    <circle cx="177" cy="40" r="5" fill="#ef4444" />
    <text x="195" y="43.5" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="900" fontFamily="monospace">ER</text>
    <g transform="translate(30 28)">
      <circle cx="12" cy="12" r="11" fill="rgb(var(--a) / 0.2)" />
      <path d="M12 6 V18 M6 12 H18" stroke="rgb(var(--a))" strokeWidth="2.8" strokeLinecap="round" />
    </g>
  </svg>
));
EcgArt.displayName = 'EcgArt';

export const OsceArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    {/* OSCE Exam Stopwatch + Checklist */}
    <circle cx="78" cy="80" r="42" fill="rgb(var(--a) / 0.14)" stroke="rgb(var(--a))" strokeWidth="3" />
    <circle cx="78" cy="80" r="33" stroke="rgb(var(--a) / 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
    <rect x="64" y="26" width="28" height="9" rx="4" fill="rgb(var(--a))" />
    <line x1="78" y1="35" x2="78" y2="39" stroke="rgb(var(--a))" strokeWidth="3" />
    <path d="M78 80 V56 M78 80 L97 91" stroke="rgb(var(--a))" strokeWidth="4" strokeLinecap="round" />
    <circle cx="78" cy="80" r="4" fill="#ffffff" />
    {/* Clipboard Sheet */}
    <rect x="134" y="24" width="84" height="102" rx="14" fill="#17171a" stroke="rgb(var(--a) / 0.5)" strokeWidth="2" />
    <rect x="160" y="18" width="32" height="12" rx="6" fill="rgb(var(--a))" />
    <path d="M150 52 L158 60 L170 46" stroke="#34d399" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="178" y="51" width="26" height="6" rx="3" fill="rgb(var(--a) / 0.45)" />
    <path d="M150 78 L158 86 L170 72" stroke="#34d399" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="178" y="77" width="24" height="6" rx="3" fill="rgb(var(--a) / 0.45)" />
    <rect x="150" y="101" width="54" height="10" rx="5" fill="rgb(var(--a) / 0.25)" />
    <text x="177" y="109" textAnchor="middle" fill="#e9d5ff" fontSize="8" fontWeight="900">COMBO x4</text>
  </svg>
));
OsceArt.displayName = 'OsceArt';

export const MuscleArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    {/* Stylized Muscle Belly + Vector Lines */}
    <path
      d="M42 96 C46 56, 86 34, 128 38 C166 42, 194 64, 198 92 C174 82, 148 82, 120 94 C94 106, 62 108, 42 96 Z"
      fill="rgb(var(--a) / 0.18)"
      stroke="rgb(var(--a))"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M62 84 C88 64, 128 58, 166 70" stroke="rgb(var(--a) / 0.85)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M72 93 C98 76, 136 70, 174 80" stroke="rgb(var(--a) / 0.5)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="122" cy="64" r="7" fill="rgb(var(--a))" />
    <circle cx="122" cy="64" r="14" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" />
    {/* Force Direction Arrows */}
    <path d="M36 46 L62 28 M62 28 L49 27 M62 28 L57 40" stroke="rgb(var(--a))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M206 44 L180 26 M180 26 L193 25 M180 26 L185 38" stroke="rgb(var(--a))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="86" y="114" width="68" height="20" rx="10" fill="rgb(var(--a) / 0.15)" stroke="rgb(var(--a) / 0.4)" strokeWidth="1.5" />
    <text x="120" y="127" textAnchor="middle" fill="#6ee7b7" fontSize="9.5" fontWeight="900">ORIGIN → INS</text>
  </svg>
));
MuscleArt.displayName = 'MuscleArt';

export const SudokuArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <g transform="translate(65 18)">
      <rect x="0" y="0" width="110" height="110" rx="16" fill="#17171a" stroke="rgb(var(--a) / 0.6)" strokeWidth="2.5" />
      <line x1="36.6" y1="4" x2="36.6" y2="106" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" />
      <line x1="73.3" y1="4" x2="73.3" y2="106" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" />
      <line x1="4" y1="36.6" x2="106" y2="36.6" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" />
      <line x1="4" y1="73.3" x2="106" y2="73.3" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" />
      <rect x="40" y="40" width="30" height="30" rx="7" fill="rgb(var(--a) / 0.32)" stroke="rgb(var(--a))" strokeWidth="1.8" />
      <text x="18" y="25" textAnchor="middle" fill="rgb(var(--a))" fontSize="15" fontWeight="900" fontFamily="monospace">4</text>
      <text x="91" y="25" textAnchor="middle" fill="#d8b4fe" fontSize="15" fontWeight="900" fontFamily="monospace">6</text>
      <text x="55" y="61" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="monospace">A</text>
      <text x="18" y="96" textAnchor="middle" fill="#d8b4fe" fontSize="15" fontWeight="900" fontFamily="monospace">2</text>
      <text x="91" y="96" textAnchor="middle" fill="#34d399" fontSize="15" fontWeight="900" fontFamily="monospace">5</text>
    </g>
    <rect x="18" y="26" width="38" height="20" rx="8" fill="rgb(var(--a) / 0.18)" stroke="rgb(var(--a) / 0.4)" />
    <text x="37" y="39.5" textAnchor="middle" fill="#e9d5ff" fontSize="9" fontWeight="900">150</text>
    <rect x="184" y="62" width="42" height="22" rx="8" fill="rgb(var(--a))" />
    <text x="205" y="76.5" textAnchor="middle" fill="#09090b" fontSize="10" fontWeight="900">500 XP</text>
  </svg>
));
SudokuArt.displayName = 'SudokuArt';

export const WordleArt = React.memo(() => {
  const row1 = [
    { ch: 'F', bg: 'rgb(16 185 129 / 0.32)', border: '#10b981', ink: '#6ee7b7' },
    { ch: 'E', bg: 'rgba(63,63,70,0.45)', border: 'rgba(161,161,170,0.35)', ink: '#d4d4d8' },
    { ch: 'M', bg: 'rgb(var(--a) / 0.32)', border: 'rgb(var(--a))', ink: '#fde047' },
    { ch: 'U', bg: 'rgb(16 185 129 / 0.32)', border: '#10b981', ink: '#6ee7b7' },
    { ch: 'R', bg: 'rgb(16 185 129 / 0.32)', border: '#10b981', ink: '#6ee7b7' },
  ];
  return (
    <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="200" height="110" rx="18" fill="#17171a" stroke="rgb(var(--a) / 0.35)" strokeWidth="1.8" />
      {row1.map((item, i) => (
        <g key={item.ch} transform={`translate(${34 + i * 35} 34)`}>
          <rect width="30" height="36" rx="8" fill={item.bg} stroke={item.border} strokeWidth="2" />
          <text x="15" y="23.5" textAnchor="middle" fill={item.ink} fontSize="17" fontWeight="900" fontFamily="monospace">
            {item.ch}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={34 + i * 35} y="80" width="30" height="22" rx="6" fill="rgb(255 255 255 / 0.04)" stroke="rgb(var(--a) / 0.25)" />
      ))}
      <rect x="64" y="110" width="112" height="8" rx="4" fill="rgb(var(--a) / 0.3)" />
    </svg>
  );
});
WordleArt.displayName = 'WordleArt';

export const NerveArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <path d="M34 75 H98 L136 38 H202" stroke="rgb(var(--a))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M98 75 L140 112 H202" stroke="rgb(var(--a) / 0.55)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="34" cy="75" r="11" fill="rgb(var(--a))" />
    <circle cx="34" cy="75" r="18" stroke="rgb(var(--a) / 0.35)" strokeWidth="2" className="lp-spark-pulse" />
    <circle cx="98" cy="75" r="8" fill="#09090b" stroke="rgb(var(--a))" strokeWidth="3.5" />
    <circle cx="136" cy="38" r="7" fill="rgb(var(--a))" />
    <circle cx="202" cy="38" r="11" fill="rgb(var(--a) / 0.28)" stroke="rgb(var(--a))" strokeWidth="3" />
    <circle cx="202" cy="112" r="8" fill="rgb(var(--a) / 0.18)" stroke="rgb(var(--a) / 0.65)" strokeWidth="2.5" />
    <text x="34" y="108" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="900">ROOT</text>
    <text x="196" y="18" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="900">IMPULSE</text>
  </svg>
));
NerveArt.displayName = 'NerveArt';

export const MemoryArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <g transform="rotate(-10 80 78)">
      <rect x="46" y="30" width="66" height="88" rx="14" fill="#17171a" stroke="rgb(var(--a) / 0.55)" strokeWidth="2.5" />
      <circle cx="79" cy="68" r="15" stroke="rgb(var(--a) / 0.7)" strokeWidth="2.5" />
      <text x="79" y="102" textAnchor="middle" fill="rgb(var(--a))" fontSize="10" fontWeight="900">NERVE</text>
    </g>
    <path d="M108 66 Q126 42 146 62" stroke="#34d399" strokeWidth="2.8" strokeDasharray="4 3" strokeLinecap="round" />
    <g transform="rotate(9 162 74)">
      <rect x="128" y="30" width="66" height="88" rx="14" fill="rgb(var(--a) / 0.18)" stroke="rgb(var(--a))" strokeWidth="2.8" />
      <path d="M148 70 L157 79 L175 59" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="161" y="102" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">MATCH</text>
    </g>
  </svg>
));
MemoryArt.displayName = 'MemoryArt';

export const WheelArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="120" cy="80" r="54" fill="#17171a" stroke="rgb(var(--a))" strokeWidth="3.5" />
    <circle cx="120" cy="80" r="46" fill="rgb(var(--a) / 0.14)" stroke="rgb(var(--a) / 0.4)" strokeWidth="1.5" />
    {[0, 45, 90, 135].map((deg) => (
      <line
        key={deg}
        x1="120"
        y1="30"
        x2="120"
        y2="130"
        stroke="rgb(var(--a) / 0.45)"
        strokeWidth="1.8"
        transform={`rotate(${deg} 120 80)`}
      />
    ))}
    <circle cx="120" cy="80" r="14" fill="rgb(var(--a))" stroke="#09090b" strokeWidth="3" />
    <polygon points="120,30 112,12 128,12" fill="#fde047" stroke="#09090b" strokeWidth="1.5" />
    <text x="198" y="36" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="900">500 XP</text>
  </svg>
));
WheelArt.displayName = 'WheelArt';

export const MpAnatomyArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="64" cy="72" r="28" fill="rgb(var(--a) / 0.18)" stroke="rgb(var(--a))" strokeWidth="2.5" />
    <circle cx="64" cy="64" r="9" fill="rgb(var(--a))" />
    <path d="M46 90 C51 80, 77 80, 82 90" stroke="rgb(var(--a))" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="176" cy="72" r="28" fill="rgb(255 255 255 / 0.06)" stroke="rgb(var(--a) / 0.65)" strokeWidth="2.5" />
    <circle cx="176" cy="64" r="9" fill="#fde047" />
    <path d="M158 90 C163 80, 189 80, 194 90" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="100" y="56" width="40" height="30" rx="12" fill="rgb(var(--a))" />
    <text x="120" y="76" textAnchor="middle" fill="#09090b" fontSize="14" fontWeight="900">VS</text>
    <text x="120" y="128" textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="900">ANATOMY ARENA</text>
  </svg>
));
MpAnatomyArt.displayName = 'MpAnatomyArt';

export const MpClinicalArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <rect x="26" y="24" width="188" height="92" rx="18" fill="#17171a" stroke="rgb(var(--a) / 0.45)" strokeWidth="2" />
    <path d="M38 72 H72 L84 48 L98 92 L112 38 L126 84 L138 64 L148 72 H200" stroke="rgb(var(--a))" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="42" y="104" width="66" height="22" rx="11" fill="rgb(var(--a))" />
    <text x="75" y="118.5" textAnchor="middle" fill="#09090b" fontSize="9.5" fontWeight="900">PLAYER 1</text>
    <rect x="132" y="104" width="66" height="22" rx="11" fill="#1f2937" stroke="rgb(var(--a) / 0.6)" />
    <text x="165" y="118.5" textAnchor="middle" fill="#2dd4bf" fontSize="9.5" fontWeight="900">PLAYER 2</text>
  </svg>
));
MpClinicalArt.displayName = 'MpClinicalArt';

export const MpOsceArt = React.memo(() => (
  <svg viewBox="0 0 240 150" className="w-full h-full" fill="none" aria-hidden="true">
    <circle cx="120" cy="72" r="46" fill="rgb(var(--a) / 0.14)" stroke="rgb(var(--a) / 0.5)" strokeWidth="2.5" />
    <polygon points="124,36 96,76 118,76 112,108 144,66 121,66" fill="rgb(var(--a))" />
    <rect x="26" y="28" width="52" height="22" rx="11" fill="rgb(var(--a) / 0.2)" stroke="rgb(var(--a) / 0.45)" />
    <text x="52" y="42.5" textAnchor="middle" fill="#ddd6fe" fontSize="9.5" fontWeight="900">STREAK</text>
    <rect x="162" y="100" width="52" height="22" rx="11" fill="rgb(var(--a) / 0.2)" stroke="rgb(var(--a) / 0.45)" />
    <text x="188" y="114.5" textAnchor="middle" fill="#fde047" fontSize="9.5" fontWeight="900">OSCE ⚡</text>
  </svg>
));
MpOsceArt.displayName = 'MpOsceArt';

export const MpArt = MpAnatomyArt;
