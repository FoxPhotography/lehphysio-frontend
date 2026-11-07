import React from 'react';
import { PlayCircle } from 'lucide-react';

const TS = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/;

const toSeconds = (m: RegExpMatchArray) => (Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]);

/**
 * Episode description with chapters: any line that contains a timestamp (12:34 or 1:02:03)
 * becomes a tappable chapter that jumps the player to that moment.
 */
export const EpisodeNotes: React.FC<{ text: string; onSeek: (seconds: number) => void }> = ({ text, onSeek }) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const chapters = lines.filter((l) => TS.test(l));
  const notes = lines.filter((l) => !TS.test(l));

  return (
    <section className="glass-card p-5 space-y-4" aria-label="ملخص الحلقة">
      <h2 className="text-base font-black text-white">ملخص الحلقة</h2>
      {notes.length > 0 && (
        <div className="space-y-2 text-sm text-zinc-300 leading-relaxed" dir="auto">
          {notes.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}
      {chapters.length > 0 && (
        <ol className="space-y-1.5">
          {chapters.map((line, i) => {
            const m = line.match(TS)!;
            const label = line.replace(TS, '').replace(/^[\s\-–—:|•]+|[\s\-–—:|•]+$/g, '');
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { onSeek(toSeconds(m)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center gap-3 text-start rounded-xl px-3 py-2.5 bg-zinc-900/50 border border-zinc-800 hover:border-brand-orange/40 active:scale-[0.99] transition"
                >
                  <PlayCircle className="w-4 h-4 text-brand-orange shrink-0" />
                  <span dir="ltr" className="text-xs font-black text-brand-orange tabular-nums shrink-0">{m[0]}</span>
                  <span dir="auto" className="text-sm text-zinc-200 font-bold truncate">{label || `جزء ${i + 1}`}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
