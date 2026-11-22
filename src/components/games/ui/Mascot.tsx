import React from 'react';

export type MascotCharacter = 'doctor' | 'muscle' | 'brain' | 'skeleton' | 'nerve';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'confused'
  | 'surprised'
  | 'sad'
  | 'celebrating'
  | 'encouraging'
  | 'sleeping';

interface MascotProps {
  character: MascotCharacter;
  mood?: MascotMood;
  size?: number;
  className?: string;
  label?: string;
}

const MOOD_ANIMATION: Record<MascotMood, string> = {
  idle: 'lp-mascot-idle',
  happy: 'lp-mascot-bounce',
  excited: 'lp-mascot-bounce',
  thinking: 'lp-mascot-think',
  confused: 'lp-mascot-shake',
  surprised: 'lp-mascot-pop',
  sad: 'lp-mascot-shake',
  celebrating: 'lp-mascot-celebrate',
  encouraging: 'lp-mascot-idle',
  sleeping: 'lp-mascot-sleep',
};

const FaceExpression: React.FC<{ mood: MascotMood; cy?: number; darkInk?: string }> = ({
  mood,
  cy = 48,
  darkInk = '#18181b',
}) => {
  const leftEyeX = 41;
  const rightEyeX = 59;

  if (mood === 'sleeping') {
    return (
      <g>
        <path d={`M${leftEyeX - 5} ${cy} Q${leftEyeX} ${cy + 4} ${leftEyeX + 5} ${cy}`} stroke={darkInk} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d={`M${rightEyeX - 5} ${cy} Q${rightEyeX} ${cy + 4} ${rightEyeX + 5} ${cy}`} stroke={darkInk} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <circle cx="50" cy={cy + 10} r="2.4" fill={darkInk} />
      </g>
    );
  }

  if (mood === 'celebrating' || mood === 'happy' || mood === 'encouraging') {
    return (
      <g>
        {mood === 'celebrating' ? (
          <>
            <path d={`M${leftEyeX - 4} ${cy + 1} Q${leftEyeX} ${cy - 5} ${leftEyeX + 4} ${cy + 1}`} stroke={darkInk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d={`M${rightEyeX - 4} ${cy + 1} Q${rightEyeX} ${cy - 5} ${rightEyeX + 4} ${cy + 1}`} stroke={darkInk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse className="lp-mascot-eye" cx={leftEyeX} cy={cy} rx="3.8" ry="4.5" fill={darkInk} />
            <circle cx={leftEyeX - 1.2} cy={cy - 1.6} r="1.4" fill="#ffffff" />
            <ellipse className="lp-mascot-eye" cx={rightEyeX} cy={cy} rx="3.8" ry="4.5" fill={darkInk} />
            <circle cx={rightEyeX - 1.2} cy={cy - 1.6} r="1.4" fill="#ffffff" />
          </>
        )}
        {/* Rosy cheeks */}
        <ellipse cx="33" cy={cy + 6} rx="3.5" ry="2" fill="#fb7185" opacity="0.45" />
        <ellipse cx="67" cy={cy + 6} rx="3.5" ry="2" fill="#fb7185" opacity="0.45" />
        {/* Big smile */}
        <path
          d={`M42 ${cy + 8} Q50 ${cy + 16} 58 ${cy + 8}`}
          stroke={darkInk}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill={mood === 'celebrating' ? '#fb7185' : 'none'}
        />
      </g>
    );
  }

  if (mood === 'excited' || mood === 'surprised') {
    return (
      <g>
        <circle cx={leftEyeX} cy={cy - 1} r="4.6" fill="#ffffff" stroke={darkInk} strokeWidth="1.5" />
        <circle cx={leftEyeX} cy={cy - 1} r="2.2" fill={darkInk} />
        <circle cx={rightEyeX} cy={cy - 1} r="4.6" fill="#ffffff" stroke={darkInk} strokeWidth="1.5" />
        <circle cx={rightEyeX} cy={cy - 1} r="2.2" fill={darkInk} />
        {mood === 'excited' ? (
          <path d={`M42 ${cy + 8} Q50 ${cy + 17} 58 ${cy + 8} Z`} fill={darkInk} />
        ) : (
          <ellipse cx="50" cy={cy + 10} rx="3.5" ry="4.5" fill={darkInk} />
        )}
      </g>
    );
  }

  if (mood === 'thinking' || mood === 'confused') {
    return (
      <g>
        <path d={`M${leftEyeX - 4} ${cy - 7} L${leftEyeX + 4} ${cy - 5}`} stroke={darkInk} strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${rightEyeX - 4} ${cy - 5} L${rightEyeX + 4} ${cy - 8}`} stroke={darkInk} strokeWidth="2.2" strokeLinecap="round" />
        <circle className="lp-mascot-eye" cx={leftEyeX} cy={cy} rx="3.4" r="3.4" fill={darkInk} />
        <circle cx={leftEyeX + 1} cy={cy - 1} r="1.2" fill="#ffffff" />
        <circle className="lp-mascot-eye" cx={rightEyeX} cy={cy} r="3.4" fill={darkInk} />
        <circle cx={rightEyeX + 1} cy={cy - 1} r="1.2" fill="#ffffff" />
        {mood === 'thinking' ? (
          <path d={`M45 ${cy + 9} Q51 ${cy + 8} 56 ${cy + 9}`} stroke={darkInk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d={`M43 ${cy + 11} Q47 ${cy + 7} 51 ${cy + 11} T58 ${cy + 10}`} stroke={darkInk} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        )}
      </g>
    );
  }

  if (mood === 'sad') {
    return (
      <g>
        <path d={`M${leftEyeX - 4} ${cy - 5} L${leftEyeX + 4} ${cy - 7}`} stroke={darkInk} strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${rightEyeX - 4} ${cy - 7} L${rightEyeX + 4} ${cy - 5}`} stroke={darkInk} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={leftEyeX} cy={cy} r="3.4" fill={darkInk} />
        <circle cx={rightEyeX} cy={cy} r="3.4" fill={darkInk} />
        <path d={`M43 ${cy + 12} Q50 ${cy + 6} 57 ${cy + 12}`} stroke={darkInk} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  // Default idle
  return (
    <g>
      <ellipse className="lp-mascot-eye" cx={leftEyeX} cy={cy} rx="3.5" ry="4.2" fill={darkInk} />
      <circle cx={leftEyeX - 1.1} cy={cy - 1.4} r="1.3" fill="#ffffff" />
      <ellipse className="lp-mascot-eye" cx={rightEyeX} cy={cy} rx="3.5" ry="4.2" fill={darkInk} />
      <circle cx={rightEyeX - 1.1} cy={cy - 1.4} r="1.3" fill="#ffffff" />
      <path d={`M44 ${cy + 9} Q50 ${cy + 13} 56 ${cy + 9}`} stroke={darkInk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  );
};

export const Mascot: React.FC<MascotProps> = React.memo(({
  character,
  mood = 'idle',
  size = 64,
  className = '',
  label,
}) => {
  const animClass = MOOD_ANIMATION[mood] || 'lp-mascot-idle';

  return (
    <span
      className={`inline-flex items-center justify-center relative shrink-0 select-none ${animClass} ${className}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none">
        {character === 'doctor' && (
          <g>
            {/* Coat shoulders + teal stethoscope */}
            <path d="M23 92 C23 73, 35 66, 50 66 C65 66, 77 73, 77 92 Z" fill="#f4f4f5" stroke="#14b8a6" strokeWidth="2.5" />
            <path d="M40 67 L50 84 L60 67" fill="#0d9488" />
            <path d="M35 68 C34 80, 42 84, 50 84 C58 84, 66 80, 65 68" stroke="#ff6a00" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="84" r="4" fill="#ffb000" stroke="#18181b" strokeWidth="1.5" />
            {/* Head */}
            <rect x="25" y="20" width="50" height="49" rx="22" fill="#fed7aa" stroke="#ea580c" strokeWidth="2.2" />
            {/* Headband mirror / PT badge */}
            <rect x="27" y="14" width="46" height="12" rx="6" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="50" cy="20" r="6" fill="#ffb000" stroke="#18181b" strokeWidth="1.5" />
            <path d="M50 17.5 V22.5 M47.5 20 H52.5" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
            <FaceExpression mood={mood} cy={45} />
          </g>
        )}

        {character === 'muscle' && (
          <g>
            {/* Dynamic athletic silhouette */}
            <path
              d="M22 60 C16 48, 22 30, 34 26 C44 16, 56 16, 66 26 C78 30, 84 48, 78 60 C74 78, 64 88, 50 88 C36 88, 26 78, 22 60 Z"
              fill="#10b981"
              stroke="#6ee7b7"
              strokeWidth="2.4"
            />
            {/* Muscle fiber lines */}
            <path d="M27 64 C35 72, 43 75, 50 75 C57 75, 65 72, 73 64" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" />
            {/* Flexed mini arms */}
            <path d="M22 52 C12 46, 12 32, 22 30" stroke="#34d399" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M78 52 C88 46, 88 32, 78 30" stroke="#34d399" strokeWidth="5.5" strokeLinecap="round" />
            {/* Sport headband */}
            <path d="M30 28 Q50 22 70 28" stroke="#ffb000" strokeWidth="5" strokeLinecap="round" />
            <FaceExpression mood={mood} cy={48} darkInk="#052e16" />
          </g>
        )}

        {character === 'brain' && (
          <g>
            {/* Synapse antenna */}
            <line x1="50" y1="20" x2="50" y2="9" stroke="#c084fc" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="50" cy="8" r="4.5" fill="#fde047" />
            {/* Brain lobes */}
            <path
              d="M26 52 C19 48, 19 36, 26 32 C25 22, 36 16, 47 19 C50 17, 53 17, 56 19 C67 16, 77 23, 75 33 C82 37, 82 49, 75 53 C77 65, 66 74, 54 72 C51 74, 48 74, 45 72 C33 74, 23 64, 26 52 Z"
              fill="#a855f7"
              stroke="#e9d5ff"
              strokeWidth="2.2"
            />
            {/* Brain fold arcs */}
            <path d="M34 29 Q40 24 45 28 M56 28 Q62 24 67 30 M50 20 V30" stroke="#7e22ce" strokeWidth="2.2" strokeLinecap="round" />
            {/* Little feet */}
            <path d="M40 73 V84 H35 M60 73 V84 H65" stroke="#c084fc" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <FaceExpression mood={mood} cy={47} darkInk="#1e1b4b" />
          </g>
        )}

        {character === 'skeleton' && (
          <g>
            {/* Rounded friendly skull */}
            <path
              d="M25 46 C25 26, 36 16, 50 16 C64 16, 75 26, 75 46 C75 56, 70 62, 65 65 L65 77 C65 81, 61 84, 57 84 H43 C39 84, 35 81, 35 77 L35 65 C30 62, 25 56, 25 46 Z"
              fill="#f4f4f5"
              stroke="#fb923c"
              strokeWidth="2.4"
            />
            {/* Cheek teeth/grin lines */}
            <line x1="44" y1="74" x2="44" y2="83" stroke="#d4d4d8" strokeWidth="2" />
            <line x1="50" y1="74" x2="50" y2="83" stroke="#d4d4d8" strokeWidth="2" />
            <line x1="56" y1="74" x2="56" y2="83" stroke="#d4d4d8" strokeWidth="2" />
            {/* Cute orange bowtie */}
            <polygon points="50,86 41,82 41,90" fill="#ff6a00" />
            <polygon points="50,86 59,82 59,90" fill="#ffb000" />
            <circle cx="50" cy="86" r="2.2" fill="#ffffff" />
            <FaceExpression mood={mood} cy={46} darkInk="#18181b" />
          </g>
        )}

        {character === 'nerve' && (
          <g>
            {/* Dendrite star rays */}
            <path d="M50 18 L50 8 M28 28 L18 18 M72 28 L82 18 M22 54 L11 58 M78 54 L89 58 M50 74 V90" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="8" r="3.2" fill="#fde047" />
            <circle cx="18" cy="18" r="3" fill="#67e8f9" />
            <circle cx="82" cy="18" r="3" fill="#67e8f9" />
            <circle cx="11" cy="58" r="2.8" fill="#67e8f9" />
            <circle cx="89" cy="58" r="2.8" fill="#67e8f9" />
            <circle cx="50" cy="90" r="3.5" fill="#fde047" />
            {/* Soma glowing body */}
            <circle cx="50" cy="46" r="26" fill="#0891b2" stroke="#67e8f9" strokeWidth="2.6" />
            <circle cx="50" cy="46" r="21" fill="#22d3ee" opacity="0.28" />
            <FaceExpression mood={mood} cy={46} darkInk="#082f49" />
          </g>
        )}

        {/* Mood mini overlays */}
        {mood === 'confused' && (
          <text x="82" y="24" fill="#fbbf24" fontSize="16" fontWeight="900">?</text>
        )}
        {mood === 'celebrating' && (
          <g>
            <circle cx="16" cy="20" r="3" fill="#fbbf24" />
            <circle cx="84" cy="18" r="3.5" fill="#ff6a00" />
            <circle cx="88" cy="36" r="2.5" fill="#34d399" />
          </g>
        )}
        {mood === 'sleeping' && (
          <text x="76" y="24" fill="#a1a1aa" fontSize="12" fontWeight="900">zZ</text>
        )}
      </svg>
    </span>
  );
});

Mascot.displayName = 'Mascot';
