import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  Send,
  LogOut,
  Users,
  Copy,
  Link,
  Play,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  XCircle,
  Timer,
  Star,
  Crown,
  RotateCcw,
  Loader2,
  Zap,
  UserMinus,
  Flame,
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import { playSound } from '../utils/soundEngine';
import { fireWinConfetti, firePodiumFireworks } from '../utils/confetti';
import { GAME_MODE_LABELS, buildGameInvite, getGameModeLabel } from '../utils/gameInvite';
import { chatService } from '../services/chatService';
import { gameService } from '../services/gameService';
import { useSocket } from '../context/SocketContext';
import { UserAvatar } from '../components/UserAvatar';
import { Mascot, type MascotCharacter } from '../components/games/ui/Mascot';
import { AnimatedNumber } from '../components/games/ui/AnimatedNumber';
import { MpAnatomyArt, MpClinicalArt, MpOsceArt } from '../components/games/ui/GameArt';
import { haptic } from '../components/games/ui/feedback';
import '../styles/games.css';

interface FloatingReaction {
  id: number;
  username: string;
  emoji: string;
  leftPct: number;
}

const REACTION_EMOJIS = ['🔥', '🧠', '⚡', '😂', '👏', '💀'];

interface PlayGameProps {
  activeGameRoom: any;
  user: any;
  handleLeaveGameRoom: () => void;
  handleStartGame: () => void;
  handleSubmitGameAnswer: (e: React.FormEvent) => void;
  submittedGameAnswer: string;
  setSubmittedGameAnswer: (val: string) => void;
  handleNextRound: () => void;
  handlePlayAgain: () => void;
  showToast: (msg: string) => void;
  token: string;
  apiBase: string;
  setActiveGameRoom: (room: any) => void;
}

// ─── Log Color Helper ──────────────────────────────────────────────────────────
const getLogStyle = (type: string): string => {
  switch (type) {
    case 'correct': return 'text-emerald-400';
    case 'wrong':   return 'text-red-400';
    case 'chat':    return 'text-sky-400';
    case 'close':   return 'text-amber-400';
    default:        return 'text-zinc-400';
  }
};

const getLogIcon = (type: string) => {
  switch (type) {
    case 'correct': return <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
    case 'wrong':   return <XCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />;
    case 'chat':    return <MessageSquare className="w-3.5 h-3.5 shrink-0 text-sky-400" />;
    default:        return null;
  }
};

// ─── Question type label ───────────────────────────────────────────────────────
const getTypeLabel = (type: string) => {
  if (type === 'muscle') return 'عضلة';
  if (type === 'bone') return 'عظمة';
  if (type === 'ligament') return 'رباط';
  if (type === 'clinical') return 'حالة إكلينيكية';
  if (type === 'special_test') return 'Special Test';
  return 'عصب';
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const PlayGame: React.FC<PlayGameProps> = ({
  activeGameRoom,
  user,
  handleLeaveGameRoom,
  handleStartGame,
  handleSubmitGameAnswer,
  submittedGameAnswer,
  setSubmittedGameAnswer,
  handleNextRound,
  handlePlayAgain,
  showToast,
  token,
  apiBase,
  setActiveGameRoom,
}) => {
  const socket = useSocket();
  const [chatMessage, setChatMessage] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [submittingOption, setSubmittingOption] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const prevWinnerRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevPlayersCountRef = useRef<number>(activeGameRoom?.players?.length || 0);
  const prevRoundRef = useRef<number>(0);
  const lastWarnSecRef = useRef<number>(-1);
  const [roundBanner, setRoundBanner] = useState<number | null>(null);

  // Flag active multiplayer game for deferred PWA update prompt
  useEffect(() => {
    document.documentElement.dataset.gameActive = '1';
    window.dispatchEvent(new Event('lp:game-active-change'));
    return () => {
      document.documentElement.dataset.gameActive = '';
      window.dispatchEvent(new Event('lp:game-active-change'));
    };
  }, []);

  // Local timer ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    let timerId: any;
    if (activeGameRoom?.status === 'playing' && !activeGameRoom?.roundWinner) {
      timerId = setInterval(() => setTick((t) => t + 1), 250);
    }
    return () => { if (timerId) clearInterval(timerId); };
  }, [activeGameRoom?.status, activeGameRoom?.roundWinner]);

  const room = activeGameRoom;
  if (!room) return null;

  const isHost = room.host === user?.username;

  // Timer calculations
  let timeLeft = 0;
  let elapsed = 0;
  if (room.status === 'playing' && room.roundStartTime) {
    elapsed = Math.max(0, (Date.now() - room.roundStartTime) / 1000);
    timeLeft = Math.max(0, Math.ceil(room.roundDuration - elapsed));
  }

  const timerPct = room.roundDuration > 0 ? (timeLeft / room.roundDuration) * 100 : 0;
  const inviteUrl = `${window.location.origin}/game/${room.code}`;

  const handleCopyInviteUrl = async () => {
    try {
      await copyToClipboard(inviteUrl);
      showToast('تم نسخ رابط الدعوة بنجاح! 📋');
      playSound('tap');
      
      const modeLabel = getGameModeLabel(room.mode);
      const shareData = {
        title: `${modeLabel.title} 🧠`,
        text: `تعال انضم لـ ${modeLabel.title} معي في Leh Physio! كود الغرفة: ${room.code} ⚡`,
        url: inviteUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData).catch(() => {});
      }
    } catch (err) {
      showToast('فشل النسخ تلقائياً.');
    }
  };

  // Post the room as a join card in the public chat (once a minute at most)
  const [sharingToChat, setSharingToChat] = useState(false);
  const [sharedAt, setSharedAt] = useState(0);
  const handleShareToChat = async () => {
    if (sharingToChat) return;
    if (Date.now() - sharedAt < 60000) { showToast('لسه باعت الدعوة في الشات — استنى دقيقة ⏳'); return; }
    setSharingToChat(true);
    try {
      const res = await chatService.sendMessage(buildGameInvite(room.code, room.mode), null, token);
      if (res.ok) {
        setSharedAt(Date.now());
        showToast('الدعوة اتبعتت في الشات العام 🎮');
        playSound('correct');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'الدعوة ماتبعتتش');
      }
    } catch {
      showToast('مش قادرين نوصل للسيرفر.');
    } finally {
      setSharingToChat(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.answersLog]);

  // Confetti and sound triggers
  useEffect(() => {
    if (!room) return;
    const currentWinner = room.roundWinner;
    const prevWinner = prevWinnerRef.current;
    if (currentWinner && currentWinner !== prevWinner && currentWinner !== 'timeout' && currentWinner !== 'draw') {
      if (currentWinner === user?.username) {
        fireWinConfetti();
        playSound('correct');
        haptic('success');
      } else {
        playSound('receive');
      }
    } else if (currentWinner === 'draw' && prevWinner !== 'draw') {
      playSound('wrong');
      haptic('error');
    }
    prevWinnerRef.current = currentWinner;

    const currentStatus = room.status;
    const prevStatus = prevStatusRef.current;
    if (currentStatus === 'finished' && prevStatus === 'playing') {
      if (room.finalWinner === user?.username) {
        firePodiumFireworks();
        playSound('jackpot');
        haptic('success');
      } else {
        fireWinConfetti();
        playSound('game_win');
      }
    }
    prevStatusRef.current = currentStatus;
  }, [room.status, room.roundWinner, room.finalWinner, user?.username]);

  // Reactive room join, round start banner, and countdown warning audio
  useEffect(() => {
    const count = room.players?.length || 0;
    if (prevPlayersCountRef.current > 0 && count > prevPlayersCountRef.current) {
      playSound('room_join');
      haptic('tap');
    }
    prevPlayersCountRef.current = count;
  }, [room.players?.length]);

  useEffect(() => {
    if (room.status !== 'playing') {
      prevRoundRef.current = 0;
      setRoundBanner(null);
      return undefined;
    }
    const curRound = room.currentRound || 1;
    if (curRound !== prevRoundRef.current) {
      prevRoundRef.current = curRound;
      playSound('round_start');
      setRoundBanner(curRound);
      const t = setTimeout(() => setRoundBanner(null), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [room.status, room.currentRound]);

  useEffect(() => {
    if (room.status === 'playing' && !room.roundWinner && timeLeft > 0 && timeLeft <= 5) {
      if (lastWarnSecRef.current !== timeLeft) {
        lastWarnSecRef.current = timeLeft;
        playSound('timer_warn');
      }
    } else {
      lastWarnSecRef.current = -1;
    }
  }, [room.status, room.roundWinner, timeLeft]);

  // Listen for live floating emoji reactions
  useEffect(() => {
    if (!socket || !room?.code) return undefined;
    const onReaction = (payload: { id: number; username: string; emoji: string }) => {
      const leftPct = 15 + ((payload.id * 97) % 70);
      setFloatingReactions((prev) => [...prev.slice(-14), { ...payload, leftPct }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== payload.id));
      }, 2100);
    };
    socket.on('game_reaction', onReaction);
    return () => {
      socket.off('game_reaction', onReaction);
    };
  }, [socket, room?.code]);

  const handleSendReaction = async (emoji: string) => {
    if (!token || !room?.code) return;
    try {
      await gameService.sendRoomReaction(room.code, emoji, token);
    } catch {
      // Ignore transient reaction errors
    }
  };

  const handleOptionClick = async (option: string) => {
    if (!token || !room?.code || submittingOption) return;
    setSubmittingOption(option);
    try {
      const res = await gameService.submitGameAnswer(room.code, option, token, true);
      const data = await res.json();
      if (res.ok) {
        if (data.room) setActiveGameRoom(data.room);
        if (data.isCorrect) {
          playSound('correct');
          haptic('success');
        } else {
          playSound('wrong');
          haptic('error');
        }
      } else if (data?.error) {
        showToast(data.error);
      }
    } catch {
      showToast('مشكلة في الاتصال.');
    } finally {
      setSubmittingOption(null);
    }
  };

  const renderFloatingReactions = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <m.div
            key={r.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -260, scale: [0.6, 1.25, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{ left: `${r.leftPct}%`, bottom: '18%' }}
            className="absolute flex flex-col items-center gap-0.5"
          >
            <span className="text-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">{r.emoji}</span>
            <span className="text-[10px] font-black text-white bg-black/70 border border-white/10 px-1.5 py-0.5 rounded-full">
              @{r.username}
            </span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderReactionBar = () => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800/70">
      <span className="text-2xs font-extrabold text-zinc-500">تفاعل مباشر:</span>
      <div className="flex items-center gap-1.5">
        {REACTION_EMOJIS.map((em) => (
          <m.button
            key={em}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSendReaction(em)}
            className="w-8 h-8 rounded-xl bg-zinc-950/80 hover:bg-white/10 border border-white/5 flex items-center justify-center text-base cursor-pointer transition-colors"
          >
            {em}
          </m.button>
        ))}
      </div>
    </div>
  );

  const modeKey = (room.gameMode || 'anatomy') as 'anatomy' | 'clinical' | 'special_tests';
  const modeInfo = GAME_MODE_LABELS[modeKey] || GAME_MODE_LABELS.anatomy;
  const modeTheme: {
    accent: 'orange' | 'teal' | 'violet';
    mascot: MascotCharacter;
    art: React.ReactNode;
  } =
    modeKey === 'clinical'
      ? { accent: 'teal', mascot: 'doctor', art: <MpClinicalArt /> }
      : modeKey === 'special_tests'
        ? { accent: 'violet', mascot: 'muscle', art: <MpOsceArt /> }
        : { accent: 'orange', mascot: 'brain', art: <MpAnatomyArt /> };

  // Send chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !token) return;
    const msg = chatMessage;
    setChatMessage('');
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    try {
      const res = await fetch(`${apiBase}/api/games/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomCode: room.code, message: msg }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        playSound('send');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickPlayer = async (targetUsername: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/api/games/kick`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ roomCode: room.code, targetUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        showToast(`تم طرد اللاعب @${targetUsername} بنجاح 🚨`);
        playSound('wrong');
      } else {
        showToast(data.error || 'معرفناش نطرد اللاعب.');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالخادم.');
    }
  };

  const isEliminatedThisRound = Array.isArray(room.roundOptionUsed) && room.roundOptionUsed.includes(user?.username);
  const renderChatBox = (maxH = '130px') => (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-3 text-start flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-2xs font-extrabold text-zinc-400 uppercase tracking-wider">شات الغرفة</span>
        </div>
      </div>

      <div
        className="flex flex-col gap-1.5 overflow-y-auto pe-1 mb-2 scrollbar-thin scrollbar-thumb-white/10"
        style={{ maxHeight: maxH }}
      >
        {(!room.answersLog || room.answersLog.length === 0) ? (
          <div className="text-zinc-600 text-xs font-semibold py-2.5 text-center">
            مفيش رسايل لسه. سلّم على صحابك أو خمّن الإجابة! 👋
          </div>
        ) : (
          room.answersLog.map((log: any, idx: number) => {
            const isChat = log.type === 'chat';
            const colonIdx = isChat && typeof log.text === 'string' ? log.text.indexOf(':') : -1;
            const rawSender = colonIdx !== -1 ? log.text.slice(0, colonIdx).trim() : (log.username || '');
            const cleanSender = rawSender.replace(/^@+/, '').trim().toLowerCase();
            const msgBody = colonIdx !== -1 ? log.text.substring(colonIdx + 1) : log.text;
            const myUsername = (user?.username || '').replace(/^@+/, '').trim().toLowerCase();
            const isMe = Boolean(
              isChat &&
              myUsername &&
              (
                (log.username && log.username.replace(/^@+/, '').trim().toLowerCase() === myUsername) ||
                (cleanSender && cleanSender === myUsername)
              )
            );

            const textColor = isChat
              ? (isMe ? 'text-orange-400' : 'text-sky-300')
              : getLogStyle(log.type);

            const icon = isChat
              ? <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-orange-400' : 'text-sky-400'}`} />
              : getLogIcon(log.type);

            return (
              <m.div
                key={idx}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-1.5 text-xs leading-relaxed ${textColor}`}
              >
                {icon}
                {isChat ? (
                  <span>
                    <strong className={isMe ? 'text-orange-400 font-bold' : 'text-sky-300 font-bold'}>
                      @{rawSender.replace(/^@+/, '')}:
                    </strong>
                    <span className={isMe ? 'text-orange-300 font-semibold' : 'text-sky-200 font-medium'}>
                      {msgBody}
                    </span>
                  </span>
                ) : (
                  <span>{log.text}</span>
                )}
              </m.div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendChatMessage} autoComplete="off" data-lpignore="true" data-form-type="other" className="flex gap-2 items-end">
        <div className="flex-1 relative flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-brand-orange/60 rounded-xl px-3 py-1 transition-colors min-h-[44px]">
          <textarea
            ref={chatInputRef}
            dir="auto"
            rows={1}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
            inputMode="text"
            enterKeyHint="send"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto leading-relaxed py-1.5 px-3 min-h-[32px] max-h-[85px] font-medium"
            placeholder={
              room.status === 'playing' && !room.roundWinner
                ? (isEliminatedThisRound ? 'دورك خلص في الجولة دي (شات فقط)…' : 'اكتب تخمينك أو رسالة…')
                : 'اكتب رسالة…'
            }
            value={chatMessage}
            onChange={(e) => {
              setChatMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 85)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
          />
        </div>

        <m.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-[13px] flex items-center justify-center hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-md mb-0.5"
        >
          <Send className="rtl:-scale-x-100 w-4 h-4" />
        </m.button>
      </form>
    </div>
  );

  // ─── WAITING ROOM / LOBBY (FLAT FULL PAGE) ────────────────────────────────────
  if (room.status === 'waiting') {
    return (
      <div
        data-accent={modeTheme.accent}
        className="w-full min-h-[100dvh] overflow-y-auto pt-20 xl:pt-8 pb-32 px-4 max-w-xl mx-auto text-start space-y-4"
      >
        {renderFloatingReactions()}

        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-2xs font-extrabold uppercase tracking-wider">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>مستنيين اللاعبين • {modeInfo.badge}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                socket?.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{socket?.connected ? 'متصل لحظياً' : 'جاري الاتصال…'}</span>
            </span>
          </div>
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLeaveGameRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 cursor-pointer transition-colors shrink-0"
          >
            <LogOut className="rtl:-scale-x-100 w-3.5 h-3.5" />
            <span>خروج</span>
          </m.button>
        </div>

        {/* Mode Hero Card */}
        <div className="lp-tile p-4 flex items-center gap-3.5">
          <div className="w-24 h-16 rounded-xl bg-black/30 border border-white/10 p-1.5 flex items-center justify-center shrink-0">
            {modeTheme.art}
          </div>
          <Mascot character={modeTheme.mascot} mood="happy" size={46} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-white leading-tight">{modeInfo.title}</h2>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              {room.rounds} جولات · {room.roundDuration} ثانية للجولة · XP مفتوح للفائز
            </p>
          </div>
        </div>

        {/* Room Code Ticket Card */}
        <div className="text-center py-5 bg-zinc-900/60 rounded-2xl border border-brand-orange/25 relative overflow-hidden">
          <p className="text-2xs text-zinc-400 font-extrabold uppercase tracking-widest mb-1.5">كود الغرفة</p>
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              await copyToClipboard(room.code);
              showToast(`تم نسخ كود الغرفة: ${room.code} 📋`);
              playSound('tap');
            }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-zinc-950 border border-brand-orange/40 hover:border-brand-orange text-white cursor-pointer transition-all shadow-md"
          >
            <span className="text-3xl font-black tracking-[6px] text-brand-orange font-mono">{room.code}</span>
            <Copy className="w-4 h-4 text-zinc-400" />
          </m.button>
          <p className="text-xs text-zinc-500 mt-2 font-medium">دوس عشان تنسخ الكود وتبعته لصحابك</p>
        </div>

        {/* Invite Link Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70 min-w-0">
            <Link className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 truncate font-mono">{inviteUrl}</span>
          </div>
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyInviteUrl}
            className="px-4 py-2.5 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-black hover:bg-brand-orange/25 cursor-pointer transition-colors shrink-0"
          >
            نسخ
          </m.button>
        </div>

        {/* Share as a join card in the public chat */}
        <m.button
          whileTap={{ scale: 0.98 }}
          onClick={handleShareToChat}
          disabled={sharingToChat}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-orange text-black text-sm font-black cursor-pointer disabled:opacity-60"
        >
          <span aria-hidden>💬</span>
          <span>{sharingToChat ? 'بنبعت…' : Date.now() - sharedAt < 60000 ? 'اتبعتت في الشات ✓' : 'شارك الروم في الشات العام'}</span>
        </m.button>

        {/* Connected Players Section */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-black text-zinc-200">Connected Players ({room.players.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map((p: any) => (
              <m.div
                key={p.username}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar 
                    username={p.username} 
                    avatarUrl={p.avatar_url} 
                    equippedFrame={p.equipped_frame} 
                    size={28} 
                  />
                  <span className="text-xs font-extrabold text-white truncate"><bdi dir="ltr">@{p.username}</bdi></span>
                </div>
                {p.username === room.host ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-brand-orange text-black text-2xs font-black shrink-0">HOST</span>
                ) : (
                  isHost && (
                    <button
                      onClick={() => handleKickPlayer(p.username)}
                      title="اطرد اللاعب"
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </m.div>
            ))}
          </div>
        </div>

        {/* Room Chat */}
        {renderChatBox('120px')}

        {/* Live Reactions */}
        {renderReactionBar()}

        {/* Start Button */}
        <div className="pt-2">
          {isHost ? (
            <m.button
              whileHover={{ scale: room.players.length < 2 ? 1 : 1.02 }}
              whileTap={{ scale: room.players.length < 2 ? 1 : 0.98 }}
              onClick={() => {
                if (room.players.length < 2) {
                  showToast('لازم يبقى فيه لاعبين على الأقل عشان التحدي يبدأ!');
                  playSound('wrong');
                } else {
                  playSound('round_start');
                  handleStartGame();
                }
              }}
              disabled={room.players.length < 2}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm md:text-base cursor-pointer transition-all shadow-lg ${
                room.players.length < 2
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-850'
                  : 'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow hover:shadow-orange-intense'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ التحدي</span>
              {room.players.length < 2 && <span className="text-xs font-medium ms-1">(محتاج لاعبين أو أكتر)</span>}
            </m.button>
          ) : (
            <div className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
              <span className="text-xs font-bold">مستنيين صاحب الغرفة يبدأ…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PLAYING STATE (FLAT FULL PAGE) ───────────────────────────────────────────
  if (room.status === 'playing') {
    const question = room.currentQuestion;
    const myScore = room.players.find((p: any) => p.username === user?.username)?.score || 0;
    const currentHintIdx = Math.min(3, Math.floor(elapsed / (room.roundDuration / 4)));
    const currentHint = question?.hints?.[currentHintIdx] || '';
    const timerColor = timeLeft <= 5 ? 'text-red-400 animate-pulse' : timeLeft <= 10 ? 'text-amber-400' : 'text-white';
    const hasUsedOptionThisRound = Array.isArray(room.roundOptionUsed) && room.roundOptionUsed.includes(user?.username);

    const sortedPlayers = [...room.players].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    return (
      <div
        data-accent={modeTheme.accent}
        className="w-full max-w-xl mx-auto text-start pt-20 xl:pt-8 pb-8 px-4 flex flex-col space-y-3"
      >
        {renderFloatingReactions()}

        {/* Non-blocking Round Start Pill */}
        <AnimatePresence>
          {roundBanner !== null && !room.roundWinner && (
            <m.div
              initial={{ opacity: 0, y: -14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-20 inset-x-0 z-40 flex justify-center pointer-events-none"
            >
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs shadow-orange-glow">
                ⚡ الجولة {roundBanner} من {room.rounds} بدأت!
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Top Arena Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mascot
              character={modeTheme.mascot}
              mood={room.roundWinner ? 'happy' : timeLeft <= 5 ? 'surprised' : 'thinking'}
              size={38}
            />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-2xs font-black uppercase tracking-wider mb-1">
                Round {room.currentRound} of {room.rounds} • {modeInfo.badge}
              </div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5 truncate">
                <Zap className="w-4 h-4 text-brand-orange fill-current shrink-0" />
                <span className="truncate">{modeInfo.title}</span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[54px]">
              <Timer className="w-3.5 h-3.5 text-zinc-500 mb-0.5" />
              <span className={`text-base font-black font-mono leading-none ${timerColor}`}>
                {room.roundWinner ? '—' : `${timeLeft}s`}
              </span>
            </div>
            {/* My Score */}
            <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[54px]">
              <Star className="w-3.5 h-3.5 text-brand-amber fill-current mb-0.5" />
              <span className="text-base font-black font-mono text-white leading-none">{myScore}</span>
            </div>
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLeaveGameRoom}
              className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
              title="اخرج من اللعبة"
            >
              <LogOut className="rtl:-scale-x-100 w-4 h-4" />
            </m.button>
          </div>
        </div>

        {/* Timer Progress Bar */}
        {!room.roundWinner && (
          <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <m.div
              className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-brand-orange'}`}
              style={{ width: `${timerPct}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        )}

        {/* Question Card */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 space-y-2.5">
          {/* 4-Step Progressive Hint Strip */}
          {!room.roundWinner && (
            <div className="grid grid-cols-4 gap-1.5" dir="ltr">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-colors ${
                    step < currentHintIdx
                      ? 'bg-emerald-500'
                      : step === currentHintIdx
                        ? 'bg-brand-orange'
                        : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-2xs font-black border border-brand-orange/30 bg-brand-orange/10 text-brand-orange uppercase">
              {getTypeLabel(question?.type)}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-2xs font-bold border border-zinc-700/60 bg-zinc-800/60 text-zinc-300">
              Hint {currentHintIdx + 1} / 4
            </span>
          </div>
          <AnimatePresence mode="wait">
            <m.p
              key={room.roundWinner ? 'answer' : currentHintIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm md:text-base font-bold leading-relaxed text-zinc-100"
            >
              {room.roundWinner ? (
                <>
                  <span className="text-zinc-400 font-normal">الإجابة: </span>
                  <span className="text-emerald-400 font-extrabold text-lg">{question?.structure}</span>
                </>
              ) : currentHint}
            </m.p>
          </AnimatePresence>

          {/* Interactive 4-Option Quick Cards */}
          {!room.roundWinner && Array.isArray(question?.options) && question.options.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt: string) => (
                  <m.button
                    key={opt}
                    type="button"
                    dir="ltr"
                    whileTap={hasUsedOptionThisRound ? undefined : { scale: 0.97 }}
                    disabled={hasUsedOptionThisRound || !!submittingOption}
                    onClick={() => handleOptionClick(opt)}
                    className={`p-3 rounded-xl border text-left text-xs font-extrabold transition-all flex items-center justify-between gap-2 ${
                      hasUsedOptionThisRound
                        ? 'bg-zinc-950/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-60'
                        : 'bg-zinc-950/90 border-zinc-700/80 hover:border-brand-orange/70 hover:bg-brand-orange/10 text-white cursor-pointer'
                    }`}
                  >
                    <span>{opt}</span>
                    {submittingOption === opt && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange shrink-0" />}
                  </m.button>
                ))}
              </div>
              {hasUsedOptionThisRound && (
                <p className="text-2xs font-bold text-red-400 text-center">
                  إجابتك غلط — دورك خلص في الجولة دي ومش هتقدر تخمّن في الشات!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Intermission Banner */}
        <AnimatePresence>
          {room.roundWinner && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-4 text-center space-y-2"
            >
              <div className="flex justify-center">
                <Mascot
                  character={modeTheme.mascot}
                  mood={
                    room.roundWinner === user?.username
                      ? 'celebrating'
                      : room.roundWinner === 'timeout' || room.roundWinner === 'draw'
                        ? 'confused'
                        : 'happy'
                  }
                  size={44}
                />
              </div>
              <h4 className="text-sm md:text-base font-black text-brand-amber">
                {room.roundWinner === 'timeout'
                  ? '⏱️ الوقت خلص!'
                  : room.roundWinner === 'draw'
                    ? '🤝 تعادل! كل اللاعبين اختاروا غلط!'
                    : `🎉 @${room.roundWinner} جاوب صح!`}
              </h4>
              <p className="text-xs text-zinc-300">
                الإجابة الصح: <strong className="text-emerald-400 font-extrabold">{question?.structure}</strong>
              </p>
              {isHost && room.currentRound < room.rounds && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextRound}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-sm cursor-pointer shadow-md"
                >
                  <span>الجولة الجاية</span>
                  <ChevronRight className="rtl:-scale-x-100 w-4 h-4" />
                </m.button>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Sorted Live Scoreboard Strip */}
        <div className="flex flex-wrap gap-2 pt-1">
          {sortedPlayers.map((p: any, idx: number) => (
            <div
              key={p.username}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-500/10 border-amber-500/35'
                  : 'bg-zinc-900/80 border-zinc-800'
              }`}
            >
              <span className="text-[10px] font-black text-zinc-400">#{idx + 1}</span>
              <UserAvatar 
                username={p.username} 
                avatarUrl={p.avatar_url} 
                equippedFrame={p.equipped_frame} 
                size={20} 
              />
              <span className="text-xs font-bold text-zinc-300"><bdi dir="ltr">@{p.username}</bdi></span>
              {(p.streak || 0) >= 2 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                  <Flame className="w-3 h-3 fill-current text-brand-orange" />
                  {p.streak}
                </span>
              )}
              <span className="text-xs font-black text-brand-orange font-mono tabular-nums">
                <AnimatedNumber value={p.score || 0} />
              </span>
            </div>
          ))}
        </div>

        {/* Live Reactions */}
        {renderReactionBar()}

        {/* Live Answer Feed & Chat */}
        {renderChatBox('140px')}
      </div>
    );
  }

  // ─── FINISHED STATE (FLAT FULL PAGE) ──────────────────────────────────────────
  if (room.status === 'finished') {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const podiumSlots = [
      { player: sorted[1], rank: 2, heightCls: 'h-20', borderCls: 'border-zinc-400/50 bg-zinc-400/10', badgeCls: 'bg-zinc-300 text-black' },
      { player: sorted[0], rank: 1, heightCls: 'h-28', borderCls: 'border-amber-400/60 bg-gradient-to-t from-amber-500/20 to-brand-orange/20 shadow-[0_0_24px_rgba(245,158,11,0.2)]', badgeCls: 'bg-gradient-to-r from-amber-400 to-brand-orange text-black' },
      { player: sorted[2], rank: 3, heightCls: 'h-16', borderCls: 'border-amber-700/50 bg-amber-800/15', badgeCls: 'bg-amber-700 text-white' },
    ].filter((s) => !!s.player);

    return (
      <div
        data-accent={modeTheme.accent}
        className="w-full min-h-[100dvh] overflow-y-auto pt-20 xl:pt-8 pb-32 px-4 max-w-md mx-auto text-start space-y-4"
      >
        {renderFloatingReactions()}

        {/* Trophy + Mascot */}
        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <m.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500/20 to-brand-orange/20 border border-amber-500/40 flex items-center justify-center shadow-orange-glow"
            >
              <Trophy className="w-8 h-8 text-brand-amber fill-current" />
            </m.div>
            <Mascot
              character={modeTheme.mascot}
              mood={room.finalWinner === user?.username ? 'celebrating' : 'happy'}
              size={54}
            />
          </div>

          <h2 className="text-2xl font-black text-white">التحدي خلص</h2>
          <p className="text-xs text-zinc-400 mt-1">
            <span className="text-brand-amber font-black">@{room.finalWinner || 'محدش'}</span> كسب التحدي! 👑
          </p>
        </div>

        {/* 3-Step Victory Podium */}
        {sorted.length >= 2 && (
          <div className="grid grid-cols-3 items-end gap-2 pt-2 px-1" dir="ltr">
            {podiumSlots.map(({ player, rank, heightCls, borderCls, badgeCls }) => (
              <div key={player.username} className="flex flex-col items-center text-center gap-1.5">
                <UserAvatar
                  username={player.username}
                  avatarUrl={player.avatar_url}
                  equippedFrame={player.equipped_frame}
                  size={rank === 1 ? 44 : 36}
                />
                <span className="text-[11px] font-black text-white truncate max-w-full">
                  @{player.username}
                </span>
                <div className={`w-full ${heightCls} rounded-t-2xl border flex flex-col items-center justify-center p-2 ${borderCls}`}>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black mb-1 ${badgeCls}`}>
                    {rank === 1 ? '👑 #1' : `#${rank}`}
                  </span>
                  <span className="text-xs font-black text-white font-mono tabular-nums">
                    <AnimatedNumber value={player.score || 0} /> pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unlimited Multiplayer XP Note */}
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-center text-[11px] font-bold text-emerald-300">
          ⚡ التحديات الأونلاين بتحسب XP مفتوح بدون حد يومي!
        </div>

        {/* Final Leaderboard */}
        <div className="space-y-2 text-start">
          {sorted.map((p: any, idx: number) => (
            <m.div
              key={p.username}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.07 }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${
                idx === 0
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-zinc-900/60 border-zinc-800/60'
              }`}
            >
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                idx === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-xs' :
                idx === 1 ? 'bg-zinc-400 text-black' :
                idx === 2 ? 'bg-amber-800 text-white' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {idx === 0 ? <Crown className="w-3.5 h-3.5 fill-current" /> : idx + 1}
              </span>
              <UserAvatar 
                username={p.username} 
                avatarUrl={p.avatar_url} 
                equippedFrame={p.equipped_frame} 
                size={28} 
              />
              <span className="flex-1 text-xs font-black text-white"><bdi dir="ltr">@{p.username}</bdi></span>
              <span className="text-xs font-black text-brand-orange font-mono tabular-nums">
                <AnimatedNumber value={p.score || 0} /> pts
              </span>
            </m.div>
          ))}
        </div>

        {/* Chat in Finished screen */}
        {renderChatBox('100px')}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2">
          {isHost && (
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlayAgain}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs md:text-sm hover:bg-emerald-500/25 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>العب تاني (نفس الغرفة)</span>
            </m.button>
          )}
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeaveGameRoom}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 text-red-400 font-black text-xs md:text-sm hover:bg-red-500/10 cursor-pointer transition-colors"
          >
            <LogOut className="rtl:-scale-x-100 w-4 h-4" />
            <span>اخرج من الغرفة</span>
          </m.button>
        </div>
      </div>
    );
  }

  return null;
};
