import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, Sparkles, X } from 'lucide-react';
import {
  getAudioSettings,
  subscribeAudioSettings,
  updateAudioSettings,
  playSound,
  startAmbientIfEnabled,
  type AudioSettings,
} from '../../utils/soundEngine';

function useAudioSettings(): [AudioSettings, (p: Partial<AudioSettings>) => void] {
  const [settings, setSettings] = useState<AudioSettings>(() => getAudioSettings());
  useEffect(() => subscribeAudioSettings(setSettings), []);
  return [settings, (partial) => updateAudioSettings(partial)];
}

export const SoundSettingsPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [settings, setPartial] = useAudioSettings();

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
        checked ? 'bg-brand-orange' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`block w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-[-22px] ltr:translate-x-[22px]' : 'translate-x-[-2px] ltr:translate-x-[2px]'
        }`}
      />
    </button>
  );

  return (
    <div className={`space-y-3 text-start ${compact ? '' : 'p-1'}`}>
      {/* Master Audio */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#17171a] border border-white/[0.07]">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.master ? (
            <Volume2 className="w-4.5 h-4.5 text-brand-orange shrink-0" />
          ) : (
            <VolumeX className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-black text-white">الصوت العام</p>
            <p className="text-[11px] font-semibold text-zinc-400">تشغيل أو كتم كل أصوات المنصة والألعاب</p>
          </div>
        </div>
        <Toggle
          checked={settings.master}
          onChange={(v) => {
            setPartial({ master: v });
            if (v) playSound('tap');
          }}
          label="تفعيل الصوت العام"
        />
      </div>

      {/* Sound Effects */}
      <div className="p-3 rounded-2xl bg-[#17171a] border border-white/[0.07] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">مؤثرات اللعب والتفاعل (SFX)</p>
              <p className="text-[11px] font-semibold text-zinc-400">أصوات الإجابات، العداد، والعجلة</p>
            </div>
          </div>
          <Toggle
            checked={settings.sfx}
            onChange={(v) => {
              setPartial({ sfx: v });
              if (v) playSound('confirm');
            }}
            label="تفعيل المؤثرات"
          />
        </div>
        {settings.sfx && settings.master && (
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => setPartial({ sfxVolume: Number(e.target.value) })}
              aria-label="مستوى صوت المؤثرات"
              className="flex-1 h-1.5 bg-zinc-800 rounded-lg accent-brand-orange cursor-pointer"
            />
            <span className="text-[11px] font-black text-zinc-300 w-9 text-end tabular-nums" dir="ltr">
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Soft Ambience / BGM */}
      <div className="p-3 rounded-2xl bg-[#17171a] border border-white/[0.07] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Music className="w-4 h-4 text-violet-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">موسيقى خلفية هادية</p>
              <p className="text-[11px] font-semibold text-zinc-400">نغمات تركيز خفيفة أثناء اللعب</p>
            </div>
          </div>
          <Toggle
            checked={settings.bgm}
            onChange={(v) => {
              setPartial({ bgm: v });
              if (v) startAmbientIfEnabled();
            }}
            label="تفعيل الموسيقى الخلفية"
          />
        </div>
        {settings.bgm && settings.master && (
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.bgmVolume}
              onChange={(e) => setPartial({ bgmVolume: Number(e.target.value) })}
              aria-label="مستوى الموسيقى الخلفية"
              className="flex-1 h-1.5 bg-zinc-800 rounded-lg accent-violet-400 cursor-pointer"
            />
            <span className="text-[11px] font-black text-zinc-300 w-9 text-end tabular-nums" dir="ltr">
              {Math.round(settings.bgmVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => playSound('reward')}
        className="w-full min-h-[42px] rounded-xl bg-zinc-900 border border-white/10 hover:border-brand-orange/40 text-brand-amber font-black text-xs cursor-pointer active:scale-95 transition-transform"
      >
        جرّب نغمة ليه فيزيو 🔊
      </button>
    </div>
  );
};

export const SoundSettingsButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [settings] = useAudioSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="إعدادات الصوت"
        title="إعدادات الصوت"
        className={`w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-brand-orange active:scale-95 transition-all cursor-pointer shrink-0 ${
          settings.master ? 'text-brand-amber' : 'text-zinc-500'
        } ${className}`}
      >
        {settings.master ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[180] bg-black/75 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="إعدادات الصوت"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#111113] border border-white/10 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">إعدادات الصوت والمؤثرات</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SoundSettingsPanel compact />
          </div>
        </div>
      )}
    </>
  );
};
