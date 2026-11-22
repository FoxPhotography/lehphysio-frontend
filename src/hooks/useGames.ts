import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { gameService } from '../services/gameService';
import { playChatSound, getLocalDateString } from '../utils/helpers';
import { GameRoom } from '../types';

export const useGames = () => {
  const { token, user, showToast, fetchUserProfile, triggerXpPopup } = useAuth();
  const socket = useSocket();

  // Multiplayer Room Game States
  const [activeGameRoom, setActiveGameRoom] = useState<GameRoom | null>(null);
  const [gameRoomCodeInput, setGameRoomCodeInput] = useState('');
  const [createGameRounds, setCreateGameRounds] = useState(5);
  const [createGameDuration, setCreateGameDuration] = useState(60);
  const [createGameMode, setCreateGameMode] = useState<'anatomy' | 'clinical' | 'special_tests'>('anatomy');
  const [submittedGameAnswer, setSubmittedGameAnswer] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameError, setGameError] = useState('');
  const [gameTab, setGameTab] = useState<'single' | 'multiplayer'>('single');
  const [isMultiplayerExpanded, setIsMultiplayerExpanded] = useState(false);

  // Single-player Games States
  const [activeGame, setActiveGame] = useState<'memory' | 'spin' | 'diagnosis' | 'special-tests' | 'nerve-path' | 'whos-responsible' | 'sudoku' | 'wordle' | null>(null);
  const [gameQuestionIdx, setGameQuestionIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameFeedback, setGameFeedback] = useState('');
  const [gamePlayError, setGamePlayError] = useState('');
  const [gamePlaySuccess, setGamePlaySuccess] = useState('');
  const [dailyPlays, setDailyPlays] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);

  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastSpinResult, setLastSpinResult] = useState<{
    label: string;
    xp: number;
    tryAgain: boolean;
    isMystery: boolean;
  } | null>(null);

  const { currentPage, changePage, setCurrentPage } = useAuth();

  // Multiplayer socket updates
  useEffect(() => {
    if (activeGameRoom && currentPage === 'play-game') {
      const joinRoom = () => {
        if (user?.username) {
          socket.emit('join_game', { roomCode: activeGameRoom.code, username: user.username });
        }
      };

      joinRoom();

      const handleGameUpdate = (data: any) => {
        setActiveGameRoom((prev: any) => {
          if (prev) {
            if (prev.status === 'waiting' && data.status === 'playing') {
              playChatSound('start');
            }
            if (prev.status === 'playing' && data.status === 'finished') {
              playChatSound('win');
            }
          }
          return data;
        });
      };

      const handleGameDeleted = (data: any) => {
        setActiveGameRoom(null);
        setCurrentPage('games');
        if (data && data.message) {
          showToast(data.message);
        }
      };

      const handlePlayerKicked = (data: any) => {
        if (data && data.username === user?.username) {
          setActiveGameRoom(null);
          setCurrentPage('games');
          showToast('لقد تم طردك من الغرفة بواسطة المضيف! 🚨');
          playChatSound('error');
        }
      };

      socket.on('game_update', handleGameUpdate);
      socket.on('game_deleted', handleGameDeleted);
      socket.on('player_kicked', handlePlayerKicked);
      socket.on('connect', joinRoom);

      return () => {
        if (user?.username) {
          socket.emit('leave_game', { roomCode: activeGameRoom.code, username: user.username });
        }
        socket.off('game_update', handleGameUpdate);
        socket.off('game_deleted', handleGameDeleted);
        socket.off('player_kicked', handlePlayerKicked);
        socket.off('connect', joinRoom);
      };
    }
    return () => { };
  }, [activeGameRoom?.code, currentPage, token, user?.username, socket]);

  const handleCreateGameRoom = async () => {
    if (!token) { showToast('سجّل دخول عشان تلعب 🔐'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await gameService.createGameRoom(createGameRounds, createGameDuration, token, createGameMode);
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        changePage('play-game', { roomCode: data.code });
      } else {
        setGameError(data.error);
        showToast(data.error || 'الروم دي اتقفلت خلاص 🔒');
      }
    } catch (e) {
      setGameError('مش قادرين نوصل للسيرفر.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleJoinGameRoom = async (code: string) => {
    if (!token) { showToast('سجّل دخول عشان تلعب 🔐'); return; }
    if (!code) { setGameError('اكتب كود الغرفة.'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await gameService.joinGameRoom(code, token);
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        changePage('play-game', { roomCode: data.code });
        setGameRoomCodeInput('');
      } else {
        setGameError(data.error);
        showToast(data.error || 'الروم دي اتقفلت خلاص 🔒');
        if (res.status === 404 || (data.error && data.error.includes('started'))) {
          window.dispatchEvent(new CustomEvent('game-room-closed-event', { detail: { code: code.toUpperCase() } }));
        }
      }
    } catch (e) {
      setGameError('كود الغرفة غلط.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await gameService.startGame(activeGameRoom.code, token);
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitGameAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedGameAnswer.trim() || !activeGameRoom || !token) return;
    const ans = submittedGameAnswer;
    setSubmittedGameAnswer('');
    try {
      const res = await gameService.submitGameAnswer(activeGameRoom.code, ans, token);
      const data = await res.json();
      if (res.ok) {
        if (data.isCorrect) {
          playChatSound('success');
          setActiveGameRoom(data.room);
        } else {
          playChatSound('error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRound = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await gameService.nextRound(activeGameRoom.code, token);
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayAgain = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await gameService.playAgain(activeGameRoom.code, token);
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGameRoom = async () => {
    if (!activeGameRoom || !token) return;
    try {
      await gameService.leaveGameRoom(activeGameRoom.code, token);
    } catch (e) {
      console.error(e);
    } finally {
      setActiveGameRoom(null);
      setCurrentPage('games');
    }
  };

  // Single-player Memory Game (dynamically loaded 60-pair bank, non-repeating per session)
  const initMemoryGame = async () => {
    const { ALL_MEMORY_PAIRS } = await import('../data/memoryPairs');
    let seenIds: number[] = [];
    try {
      const raw = sessionStorage.getItem('pt_memory_seen');
      if (raw) seenIds = JSON.parse(raw);
    } catch {
      seenIds = [];
    }

    let unseen = ALL_MEMORY_PAIRS.filter((p) => !seenIds.includes(p.pairId));
    if (unseen.length < 8) {
      seenIds = [];
      unseen = [...ALL_MEMORY_PAIRS];
    }

    const pairs = [...unseen].sort(() => Math.random() - 0.5).slice(0, 8);
    try {
      sessionStorage.setItem('pt_memory_seen', JSON.stringify([...seenIds, ...pairs.map((p) => p.pairId)]));
    } catch {
      // Ignore storage errors
    }

    const deck = pairs
      .flatMap((p) => [
        { id: `p${p.pairId}-a`, pairId: p.pairId, value: p.a.value, sub: p.a.sub, isFlipped: false, isMatched: false },
        { id: `p${p.pairId}-b`, pairId: p.pairId, value: p.b.value, sub: p.b.sub, isFlipped: false, isMatched: false },
      ])
      .sort(() => Math.random() - 0.5);
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setGameFinished(false);
    setGamePlaySuccess('');
    setGamePlayError('');
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);

    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);

    if (nextFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      if (newCards[firstIdx].pairId === newCards[secondIdx].pairId) {
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setMemoryCards(newCards);
        setFlippedCards([]);
        setMemoryMatches(prev => {
          const total = prev + 1;
          if (total === 8) {
            setGameFinished(true);
            playChatSound('win');
            claimGameXP();
          } else {
            playChatSound('success');
          }
          return total;
        });
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
          playChatSound('error');
        }, 900);
      }
    }
  };

  const loadDailyPlays = useCallback(async () => {
    if (!token) return;
    try {
      const res = await gameService.fetchDailyPlays(token);
      if (res.ok) {
        const data = await res.json();
        if (data.plays_by_game) {
          setDailyPlays(data.plays_by_game);
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    loadDailyPlays();
  }, [loadDailyPlays]);

  const claimGameXP = async (gameId: number = 1) => {
    if (!token) return;
    try {
      const res = await gameService.claimGamePlayXp(token, gameId);
      const data = await res.json();
      if (res.ok) {
        setGamePlaySuccess(data.message);
        if (data.xp_earned > 0) {
          triggerXpPopup(data.xp_earned);
        }
        if (data.plays_today !== undefined) {
          setDailyPlays(prev => ({ ...prev, [gameId]: data.plays_today }));
        }
        fetchUserProfile();
      } else {
        setGamePlayError(data.error);
      }
    } catch (e) {
      setGamePlayError('معرفناش نسجّل النتيجة.');
    }
  };

  // Spin Wheel Operations
  const handleSpinWheelClick = async () => {
    if (isSpinning) return;
    if (!token) {
      showToast('سجّل دخول عشان تلعب 🔐');
      return;
    }
    setIsSpinning(true);
    setLastSpinResult(null);
    (window as any).__isSpinningWheel = true;

    try {
      const res = await fetch(`${API_BASE || window.location.origin}/api/rewards/spin-wheel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'العجلة مالفّتش.');
        if (res.status === 400) fetchUserProfile();
        setIsSpinning(false);
        (window as any).__isSpinningWheel = false;
        return;
      }

      const { prizeIndex, prizeLabel, xpAmount, try_again } = data;

      // Animate the wheel to land on prizeIndex with realistic physics:
      // 1) Brief anticipation wind-up (-14 deg)
      // 2) 6-8 full spins + random jitter inside the winning 30-deg slice
      // 3) Suspenseful deceleration + subtle peg-settle rock at the end
      const jitter = (Math.random() - 0.5) * 18; // stay safely inside +-9 deg of slice center
      const targetDeg = ((12 - prizeIndex) * 30 + jitter + 360) % 360;
      const startAngle = wheelRotation;
      const windUpDeg = 14;
      const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
      const deltaToTarget = (targetDeg - (startAngle % 360) + 360) % 360;
      const newRot = startAngle + fullSpins + deltaToTarget;

      playChatSound('start');

      const startTime = performance.now();
      const windUpMs = 180;
      const spinMs = 5820;
      const duration = windUpMs + spinMs;
      let lastSegmentIndex = Math.floor((startAngle - 15) / 30);
      let lastTickTime = 0;

      const animateTicks = (now: number) => {
        const elapsed = now - startTime;
        let currentAngle = startAngle;

        if (elapsed < windUpMs) {
          const w = elapsed / windUpMs;
          const easeWind = Math.sin((w * Math.PI) / 2);
          currentAngle = startAngle - windUpDeg * easeWind;
        } else {
          const t = Math.min((elapsed - windUpMs) / spinMs, 1);
          const easeOut = 1 - Math.pow(1 - t, 3.6);
          const settle = t > 0.85 ? Math.sin(((t - 0.85) / 0.15) * Math.PI) * 2.2 * ((1 - t) / 0.15) : 0;
          const pulledStart = startAngle - windUpDeg;
          currentAngle = pulledStart + easeOut * (newRot - pulledStart) + settle;
        }

        setWheelRotation(currentAngle);

        const currentSegmentIndex = Math.floor((currentAngle - 15) / 30);
        if (currentSegmentIndex !== lastSegmentIndex) {
          const timeNow = performance.now();
          const progress = Math.min(elapsed / duration, 1);
          const minThrottle = progress > 0.8 ? 70 : 32;
          if (timeNow - lastTickTime > minThrottle) {
            playChatSound('tick');
            lastTickTime = timeNow;
          }
          lastSegmentIndex = currentSegmentIndex;
        }

        if (elapsed < duration) {
          requestAnimationFrame(animateTicks);
        }
      };
      requestAnimationFrame(animateTicks);

      setTimeout(() => {
        (window as any).__isSpinningWheel = false;
        setWheelRotation(newRot);
        const isMystery = prizeIndex === 0;
        setLastSpinResult({
          label: prizeLabel,
          xp: xpAmount || 0,
          tryAgain: !!try_again,
          isMystery,
        });

        // Show results
        if (try_again) {
          showToast('جرّب تاني! ليك لفة كمان! 🍀');
        } else {
          showToast(isMystery ? `جاكبوت! كسبت +${xpAmount} XP 🎁` : `كسبت +${xpAmount} XP ⚡`);
          if (xpAmount > 0) {
            playChatSound('win');
            triggerXpPopup(xpAmount);
          } else {
            playChatSound('error');
          }
        }

        // Refresh profile to update XP immediately
        fetchUserProfile();
        setIsSpinning(false);
      }, duration);

    } catch (err) {
      showToast('مشكلة في الاتصال.');
      setIsSpinning(false);
      (window as any).__isSpinningWheel = false;
    }
  };

  // Join straight from an invite card in the public chat
  const joinRef = useRef(handleJoinGameRoom);
  joinRef.current = handleJoinGameRoom;
  useEffect(() => {
    const onInvite = (e: Event) => {
      const code = (e as CustomEvent).detail?.code;
      if (code) joinRef.current(String(code).toUpperCase());
    };
    window.addEventListener('join-game-room', onInvite);
    return () => window.removeEventListener('join-game-room', onInvite);
  }, []);

  return {
    activeGameRoom, setActiveGameRoom,
    gameRoomCodeInput, setGameRoomCodeInput,
    createGameRounds, setCreateGameRounds,
    createGameDuration, setCreateGameDuration,
    createGameMode, setCreateGameMode,
    submittedGameAnswer, setSubmittedGameAnswer,
    isGameLoading, setIsGameLoading,
    gameError, setGameError,
    gameTab, setGameTab,
    isMultiplayerExpanded, setIsMultiplayerExpanded,
    activeGame, setActiveGame,
    gameQuestionIdx, setGameQuestionIdx,
    gameScore, setGameScore,
    gameFinished, setGameFinished,
    selectedAnswer, setSelectedAnswer,
    gameFeedback, setGameFeedback,
    gamePlayError, setGamePlayError,
    gamePlaySuccess, setGamePlaySuccess,
    dailyPlays, loadDailyPlays,
    memoryCards, initMemoryGame, handleCardClick, memoryMoves, memoryMatches, claimGameXP,
    isSpinning, wheelRotation, handleSpinWheelClick, lastSpinResult,
    handleCreateGameRoom, handleJoinGameRoom, handleStartGame, handleSubmitGameAnswer, handleNextRound, handlePlayAgain, handleLeaveGameRoom
  };
};
