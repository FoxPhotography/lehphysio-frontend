import React from 'react';

interface RankMedalProps {
  rank: 1 | 2 | 3;
  size?: number;
}

const MEDAL_THEMES = {
  1: {
    id: 'gold',
    ribbonLeft: '#DC2626',
    ribbonRight: '#B91C1C',
    rimLight: '#FEF08A',
    rimDark: '#B45309',
    faceTop: '#FDE047',
    faceMid: '#F59E0B',
    faceBot: '#D97706',
    textColor: '#451A03',
    glow: 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.55))',
  },
  2: {
    id: 'silver',
    ribbonLeft: '#2563EB',
    ribbonRight: '#1D4ED8',
    rimLight: '#F8FAFC',
    rimDark: '#475569',
    faceTop: '#F1F5F9',
    faceMid: '#CBD5E1',
    faceBot: '#94A3B8',
    textColor: '#0F172A',
    glow: 'drop-shadow(0 2px 6px rgba(148, 163, 184, 0.45))',
  },
  3: {
    id: 'bronze',
    ribbonLeft: '#9F1239',
    ribbonRight: '#881337',
    rimLight: '#FDBA74',
    rimDark: '#7C2D12',
    faceTop: '#FB923C',
    faceMid: '#D97706',
    faceBot: '#9A3412',
    textColor: '#FFF7ED',
    glow: 'drop-shadow(0 2px 6px rgba(217, 119, 6, 0.45))',
  },
} as const;

export const RankMedal: React.FC<RankMedalProps> = ({ rank, size = 34 }) => {
  const t = MEDAL_THEMES[rank];
  const gradId = `medal-face-${t.id}`;
  const rimId = `medal-rim-${t.id}`;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size, filter: t.glow }}
      aria-label={`المركز ${rank}`}
    >
      <svg viewBox="0 0 36 40" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradId} x1="6" y1="10" x2="30" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={t.faceTop} />
            <stop offset="55%" stopColor={t.faceMid} />
            <stop offset="100%" stopColor={t.faceBot} />
          </linearGradient>
          <linearGradient id={rimId} x1="6" y1="10" x2="30" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={t.rimLight} />
            <stop offset="100%" stopColor={t.rimDark} />
          </linearGradient>
        </defs>

        {/* Ribbon */}
        <path d="M10 2 L16 2 L19 13 L13 13 Z" fill={t.ribbonLeft} />
        <path d="M26 2 L20 2 L17 13 L23 13 Z" fill={t.ribbonRight} />
        <rect x="13" y="11.5" width="10" height="2.6" rx="1.2" fill={t.rimLight} opacity="0.9" />

        {/* Outer metallic rim */}
        <circle cx="18" cy="24.5" r="11.5" fill={`url(#${rimId})`} />

        {/* Medal face */}
        <circle cx="18" cy="24.5" r="9.6" fill={`url(#${gradId})`} />

        {/* Inner embossed ring */}
        <circle
          cx="18"
          cy="24.5"
          r="7.8"
          stroke={t.rimLight}
          strokeWidth="0.9"
          strokeOpacity="0.65"
          strokeDasharray="2 1.2"
        />

        {/* Specular highlight */}
        <path
          d="M11.5 18.5 C13.8 15.8 18.5 15.2 22.5 16.8"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />

        {/* Rank number */}
        <text
          x="18"
          y="28.3"
          textAnchor="middle"
          fill={t.textColor}
          fontSize="11.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {rank}
        </text>
      </svg>
    </span>
  );
};
