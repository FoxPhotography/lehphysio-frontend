import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { Trash2, Send, Loader2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onCancel: () => void;
  onSend: (audioBlob: Blob, durationSec: number, mimeType: string) => Promise<void>;
  onError?: (msg: string) => void;
}

const NUM_BARS = 24;

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onCancel,
  onSend,
  onError,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(NUM_BARS).fill(18));
  const [sending, setSending] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const mimeRef = useRef<string>('audio/webm');
  const canceledRef = useRef(false);

  const cleanupMedia = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const mime = pickSupportedMimeType();
        mimeRef.current = mime || 'audio/webm';
        const recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);

        chunksRef.current = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        recorder.start(150);
        recorderRef.current = recorder;
        startTimeRef.current = Date.now();

        // Live Web Audio Analyser for smooth waveform bars
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            if (!mounted) return;
            analyser.getByteFrequencyData(dataArray);
            const nextBars: number[] = [];
            for (let i = 0; i < NUM_BARS; i++) {
              const val = dataArray[i % dataArray.length] || 0;
              nextBars.push(Math.max(16, Math.min(100, Math.round((val / 255) * 100))));
            }
            setBars(nextBars);
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } catch {
          // Visualiser optional
        }
      } catch {
        onError?.('افتح إذن الميكروفون عشان تقدر تسجل فويس نوت 🎤');
        onCancel();
      }
    };

    startRecording();

    const secTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);

    return () => {
      mounted = false;
      clearInterval(secTimer);
      cleanupMedia();
    };
  }, []);

  const handleDiscard = () => {
    canceledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    cleanupMedia();
    onCancel();
  };

  const handleFinishAndSend = () => {
    const rec = recorderRef.current;
    if (!rec || sending) return;
    setSending(true);
    const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    rec.onstop = async () => {
      cleanupMedia();
      if (canceledRef.current) return;
      const actualMime = rec.mimeType || mimeRef.current || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: actualMime });
      if (blob.size < 300) {
        setSending(false);
        onError?.('التسجيل قصير جداً، جرب تاني.');
        onCancel();
        return;
      }
      try {
        await onSend(blob, durationSec, actualMime);
      } finally {
        setSending(false);
      }
    };

    if (rec.state !== 'inactive') {
      rec.stop();
    } else {
      cleanupMedia();
      setSending(false);
    }
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <m.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex items-center gap-2.5 py-2"
    >
      <m.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={handleDiscard}
        disabled={sending}
        className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        aria-label="إلغاء التسجيل"
      >
        <Trash2 className="w-4.5 h-4.5" />
      </m.button>

      <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-zinc-900/85 border border-rose-500/35 shadow-[0_0_20px_rgba(244,63,94,0.12)] min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
        </span>

        <span className="text-xs font-black text-white font-mono tabular-nums shrink-0" dir="ltr">
          {formattedTime}
        </span>

        {/* Live Animated Waveform Bars */}
        <div className="flex-1 flex items-center justify-center gap-[2.5px] h-6 overflow-hidden" dir="ltr">
          {bars.map((h, i) => (
            <m.span
              key={i}
              animate={{ height: `${h}%` }}
              transition={{ type: 'spring', stiffness: 450, damping: 24, mass: 0.4 }}
              className="w-[2.5px] rounded-full bg-gradient-to-t from-brand-orange to-rose-400"
              style={{ minHeight: 4 }}
            />
          ))}
        </div>
      </div>

      <m.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleFinishAndSend}
        disabled={sending}
        className="w-10 h-10 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-amber text-black flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-brand-orange/25 disabled:opacity-60"
        aria-label="إرسال الفويس نوت"
      >
        {sending ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
        ) : (
          <Send className="rtl:-scale-x-100 w-4.5 h-4.5 stroke-[2.5] translate-x-0.5" />
        )}
      </m.button>
    </m.div>
  );
};
