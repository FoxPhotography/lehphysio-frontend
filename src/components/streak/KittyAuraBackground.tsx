import React, { useEffect, useRef, useState } from 'react';
import { playSound, type SoundEvent } from '../../utils/soundEngine';

interface KittyAuraBackgroundProps {
  density?: 'full' | 'lite';
  interactive?: boolean;
}

interface BurstHeart {
  id: number;
  target: 'float' | 'companion';
  x: number;
  y: number;
  kx: string;
  symbol: string;
}

interface CompanionMood {
  key: 'sleep' | 'wake' | 'sit' | 'happy';
  src: string;
  alt: string;
  animClass: string;
  sfx: SoundEvent;
  lines: string[];
  burstCount: number;
}

const COMPANION_MOODS: CompanionMood[] = [
  {
    key: 'sleep',
    src: '/kitties/kitty-sleep.png',
    alt: 'قطة نايمة',
    animClass: 'kitty-sleep-anim',
    sfx: 'kitty_purr',
    lines: ['بُرّرّر~ هنام تاني 🌙', 'تصبح على خير 💜', 'نايمة مبسوطة 💤'],
    burstCount: 3,
  },
  {
    key: 'wake',
    src: '/kitties/kitty-wake.png',
    alt: 'قطة لسه صاحية',
    animClass: 'kitty-peek-anim',
    sfx: 'kitty_paw',
    lines: ['مين صحّاني؟ 😿', 'هاه؟ فيه إيه؟ 👀', 'كانت نومة حلوة 💤'],
    burstCount: 3,
  },
  {
    key: 'sit',
    src: '/kitties/kitty-sit.png',
    alt: 'قطة قاعدة مبسوطة',
    animClass: 'kitty-peek-anim',
    sfx: 'kitty_meow',
    lines: ['أوكي صحيت أهو 🐾', 'هتدلعني؟ 💜', 'مياو~ صباح الخير ✨'],
    burstCount: 4,
  },
  {
    key: 'happy',
    src: '/kitties/kitty-peek.png',
    alt: 'قطة فرحانة أوي',
    animClass: 'kitty-float-anim',
    sfx: 'kitty_zoomies',
    lines: ['مياااو! مبسوطة أوي 💖', 'أحلى دلع ✨', 'يلا نلعب! 🐾'],
    burstCount: 5,
  },
];

const MEOW_LINES = ['مياو~ ✨', 'Zoomies! ⚡', 'كيتيز سحرية 🐾', 'نورتوا يا أبطال 💜'];

const MAGIC_MOTES = [
  { left: '12%', top: '18%', size: 8, delay: '0s' },
  { left: '28%', top: '12%', size: 6, delay: '0.6s' },
  { left: '72%', top: '14%', size: 8, delay: '1.1s' },
  { left: '88%', top: '24%', size: 6, delay: '0.3s' },
  { left: '18%', top: '62%', size: 7, delay: '1.5s' },
  { left: '82%', top: '58%', size: 7, delay: '0.9s' },
  { left: '48%', top: '10%', size: 5, delay: '1.8s' },
  { left: '54%', top: '76%', size: 6, delay: '0.4s' },
];

export const KittyAuraBackground: React.FC<KittyAuraBackgroundProps> = ({
  density = 'full',
  interactive = false,
}) => {
  const [floatBounce, setFloatBounce] = useState(0);
  const [sleepBounce, setSleepBounce] = useState(0);
  const [moodIdx, setMoodIdx] = useState(0);
  const [bubbleMsg, setBubbleMsg] = useState<{ target: 'float' | 'companion'; text: string } | null>(null);
  const [hearts, setHearts] = useState<BurstHeart[]>([]);
  const nextId = useRef(1);
  const dozeTimerRef = useRef<number | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (interactive) {
      COMPANION_MOODS.forEach((m) => {
        const img = new Image();
        img.src = m.src;
      });
    }
    return () => {
      if (dozeTimerRef.current !== null) window.clearTimeout(dozeTimerRef.current);
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    };
  }, [interactive]);

  const showBubble = (target: 'float' | 'companion', text: string) => {
    setBubbleMsg({ target, text });
    if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => {
      setBubbleMsg((cur) => (cur?.target === target && cur.text === text ? null : cur));
    }, 1750);
  };

  const spawnBurst = (target: 'float' | 'companion', count: number) => {
    const symbols = ['💖', '🐾', '✨', '💛'];
    const created: BurstHeart[] = Array.from({ length: count }, (_, i) => ({
      id: nextId.current++,
      target,
      x: 32 + Math.random() * 36,
      y: 18 + Math.random() * 28,
      kx: `${Math.round((Math.random() - 0.5) * 34)}px`,
      symbol: symbols[i % symbols.length],
    }));
    setHearts((prev) => [...prev.slice(-10), ...created]);
    setTimeout(() => {
      const ids = new Set(created.map((c) => c.id));
      setHearts((prev) => prev.filter((h) => !ids.has(h.id)));
    }, 1100);
  };

  const handlePetFloat = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('kitty_meow');
    if (navigator.vibrate) navigator.vibrate(14);
    setFloatBounce((k) => k + 1);
    showBubble('float', MEOW_LINES[Math.floor(Math.random() * MEOW_LINES.length)]);
    spawnBurst('float', 4);
  };

  const handleTapCompanion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (moodIdx + 1) % COMPANION_MOODS.length;
    const nextMood = COMPANION_MOODS[nextIdx];
    setMoodIdx(nextIdx);
    setSleepBounce((k) => k + 1);
    playSound(nextMood.sfx);
    if (navigator.vibrate) navigator.vibrate(14);
    showBubble(
      'companion',
      nextMood.lines[Math.floor(Math.random() * nextMood.lines.length)]
    );
    spawnBurst('companion', nextMood.burstCount);

    if (dozeTimerRef.current !== null) {
      window.clearTimeout(dozeTimerRef.current);
      dozeTimerRef.current = null;
    }
    if (nextIdx !== 0) {
      dozeTimerRef.current = window.setTimeout(() => {
        setMoodIdx(0);
      }, 14000);
    }
  };

  const motes = density === 'lite' ? MAGIC_MOTES.slice(0, 4) : MAGIC_MOTES;
  const currentMood = COMPANION_MOODS[moodIdx];

  return (
    <div aria-hidden={!interactive} className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-[3]">
      {/* Enchanted twinkling gold/lavender motes */}
      {motes.map((m, idx) => (
        <span
          key={idx}
          className="absolute rounded-full animate-pulse"
          style={{
            left: m.left,
            top: m.top,
            width: `${m.size}px`,
            height: `${m.size}px`,
            animationDelay: m.delay,
            background: idx % 2 === 0 ? 'radial-gradient(circle, #fde68a 0%, #f59e0b 65%, transparent 100%)' : 'radial-gradient(circle, #f5d0fe 0%, #c084fc 65%, transparent 100%)',
            boxShadow: idx % 2 === 0 ? '0 0 10px rgba(253,230,138,0.85)' : '0 0 10px rgba(192,132,252,0.85)',
            opacity: 0.78,
          }}
        />
      ))}

      {/* Floating Yuumi-style Magical Spellbook Kitty */}
      {interactive ? (
        <button
          type="button"
          onClick={handlePetFloat}
          aria-label="دلّع القطة السحرية"
          title="اضغط على القطة لتسمع صوتها!"
          className="kitty-pet-btn pointer-events-auto cursor-pointer absolute top-2 start-2 sm:top-3 sm:start-3 bg-transparent border-0 p-0 focus:outline-none z-10"
        >
          <div key={floatBounce} className={floatBounce > 0 ? 'kitty-pet-pop' : ''}>
            <img
              src="/kitties/yuumi-float.png"
              alt="قطة سحرية"
              draggable={false}
              className="kitty-float-anim w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_6px_14px_rgba(192,132,252,0.45)] select-none"
            />
          </div>
          <span className="absolute inset-0 pointer-events-none">
            {hearts
              .filter((h) => h.target === 'float')
              .map((h) => (
                <span
                  key={h.id}
                  className="kitty-heart-float absolute text-sm pointer-events-none select-none z-20"
                  style={{
                    left: `${h.x}%`,
                    top: `${h.y}%`,
                    ['--kx' as any]: h.kx,
                  }}
                >
                  {h.symbol}
                </span>
              ))}
          </span>
          {bubbleMsg?.target === 'float' && (
            <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-purple-950/95 border border-amber-300/60 text-[10px] font-black text-amber-200 shadow-lg">
              {bubbleMsg.text}
            </span>
          )}
        </button>
      ) : (
        <div className={density === 'lite' ? 'absolute bottom-1 end-1.5 opacity-95' : 'absolute top-3 start-3 opacity-90'}>
          <img
            src="/kitties/yuumi-float.png"
            alt=""
            draggable={false}
            className={`kitty-float-anim object-contain drop-shadow-[0_4px_10px_rgba(192,132,252,0.4)] select-none ${
              density === 'lite' ? 'w-12 h-12' : 'w-20 h-20'
            }`}
          />
        </div>
      )}

      {/* Interactive Sleep -> Wake -> Sit -> Happy Companion Kitty */}
      {density === 'full' && (
        interactive ? (
          <button
            type="button"
            onClick={handleTapCompanion}
            aria-label={moodIdx === 0 ? 'صحّي القطة النايمة' : currentMood.alt}
            title={moodIdx === 0 ? 'اضغط عشان تصحّي القطة!' : 'اضغط تاني لتغيير حركة القطة!'}
            className="kitty-pet-btn pointer-events-auto cursor-pointer absolute top-3 end-2 sm:top-4 sm:end-3 bg-transparent border-0 p-0 focus:outline-none z-10"
          >
            {moodIdx === 0 && (
              <span
                aria-hidden
                className="kitty-peek-anim absolute -top-1 end-1 px-1.5 py-0.5 rounded-full bg-purple-950/85 border border-fuchsia-300/45 text-[9px] font-black tracking-wide text-fuchsia-200 shadow-sm pointer-events-none select-none z-20"
              >
                Zzz
              </span>
            )}
            <div key={`${currentMood.key}-${sleepBounce}`} className={sleepBounce > 0 ? 'kitty-pet-pop' : ''}>
              <img
                src={currentMood.src}
                alt={currentMood.alt}
                draggable={false}
                className={`${currentMood.animClass} w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_14px_rgba(244,114,182,0.5)] select-none transition-transform duration-200`}
              />
            </div>
            <span className="absolute inset-0 pointer-events-none">
              {hearts
                .filter((h) => h.target === 'companion')
                .map((h) => (
                  <span
                    key={h.id}
                    className="kitty-heart-float absolute text-sm pointer-events-none select-none z-20"
                    style={{
                      left: `${h.x}%`,
                      top: `${h.y}%`,
                      ['--kx' as any]: h.kx,
                    }}
                  >
                    {h.symbol}
                  </span>
                ))}
            </span>
            {bubbleMsg?.target === 'companion' && (
              <span className="absolute -bottom-2 end-1/2 translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-purple-950/95 border border-fuchsia-300/60 text-[10px] font-black text-fuchsia-200 shadow-lg z-20">
                {bubbleMsg.text}
              </span>
            )}
          </button>
        ) : (
          <div className="absolute top-3 end-2 opacity-90">
            <img
              src="/kitties/kitty-sleep.png"
              alt=""
              draggable={false}
              className="kitty-sleep-anim w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(244,114,182,0.35)] select-none"
            />
          </div>
        )
      )}
    </div>
  );
};
