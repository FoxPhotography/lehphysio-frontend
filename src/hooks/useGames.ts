import React, { useState, useEffect, useRef } from 'react';
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
  const [submittedGameAnswer, setSubmittedGameAnswer] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameError, setGameError] = useState('');
  const [gameTab, setGameTab] = useState<'single' | 'multiplayer'>('single');
  const [isMultiplayerExpanded, setIsMultiplayerExpanded] = useState(false);

  // Single-player Games States
  const [activeGame, setActiveGame] = useState<any>(null); // memory, spin, quiz
  const [gameQuestionIdx, setGameQuestionIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameFeedback, setGameFeedback] = useState('');
  const [gamePlayError, setGamePlayError] = useState('');
  const [gamePlaySuccess, setGamePlaySuccess] = useState('');

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  
  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

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
    return () => {};
  }, [activeGameRoom?.code, currentPage, token, user?.username, socket]);

  const handleCreateGameRoom = async () => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await gameService.createGameRoom(createGameRounds, createGameDuration, token);
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        changePage('play-game', { roomCode: data.code });
      } else {
        setGameError(data.error);
      }
    } catch (e) {
      setGameError('Connection to server failed.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleJoinGameRoom = async (code: string) => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    if (!code) { setGameError('Enter room code.'); return; }
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
      }
    } catch (e) {
      setGameError('Incorrect room code.');
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

  // Single-player Memory Game
  const initMemoryGame = () => {
    const terms = ['Femur 🦴', 'Deltoid 💪', 'ACL 🎗️', 'Neuron 🧠', 'Patella 🥏', 'Spasticity ⚡', 'Clavicle 🦴', 'Synapse ⚡'];
    const deck = [...terms, ...terms]
      .map((val, idx) => ({ id: idx, value: val, isFlipped: false, isMatched: false }))
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
      if (newCards[firstIdx].value === newCards[secondIdx].value) {
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
        }, 1000);
      }
    }
  };

  const claimGameXP = async () => {
    if (!token) return;
    try {
      const res = await gameService.claimGamePlayXp(token);
      const data = await res.json();
      if (res.ok) {
        setGamePlaySuccess(data.message);
        triggerXpPopup(data.xp_earned);
        fetchUserProfile();
      } else {
        setGamePlayError(data.error);
      }
    } catch (e) {
      setGamePlayError('Failed to save game score.');
    }
  };

  // Spin Wheel Operations
  const handleSpinWheelClick = async () => {
    if (isSpinning) return;
    if (!token) {
      showToast('Please login to play 🔐');
      return;
    }
    setIsSpinning(true);

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
        showToast(data.error || 'Failed to spin the wheel.');
        setIsSpinning(false);
        return;
      }

      const { prizeIndex, prizeLabel, xpAmount, try_again } = data;

      // Animate the wheel to land on prizeIndex
      const targetDeg = (12 - prizeIndex) * 30 % 360;
      const startAngle = wheelRotation;
      const randomRotations = 1440; // 4 full spins
      const newRot = startAngle + randomRotations + ((targetDeg - (startAngle % 360) + 360) % 360);

      playChatSound('start');

      const startTime = performance.now();
      const duration = 5000;
      let lastSegmentIndex = Math.floor((startAngle - 15) / 30);
      let lastTickTime = 0;

      const animateTicks = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 5);
        const currentAngle = startAngle + easeProgress * (newRot - startAngle);
        setWheelRotation(currentAngle);

        const currentSegmentIndex = Math.floor((currentAngle - 15) / 30);
        if (currentSegmentIndex !== lastSegmentIndex) {
          const timeNow = performance.now();
          const minThrottle = progress > 0.8 ? 80 : 35; 
          if (timeNow - lastTickTime > minThrottle) {
            playChatSound('tick');
            lastTickTime = timeNow;
          }
          lastSegmentIndex = currentSegmentIndex;
        }

        if (progress < 1) {
          requestAnimationFrame(animateTicks);
        }
      };
      requestAnimationFrame(animateTicks);

      setTimeout(() => {
        setWheelRotation(newRot);
        
        // Show results
        if (try_again) {
          showToast('Try Again! You get another spin! 🍀');
        } else {
          showToast(`Spin Wheel: You won ${prizeLabel}`);
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
      showToast('Connection error.');
      setIsSpinning(false);
    }
  };

  return {
    activeGameRoom, setActiveGameRoom,
    gameRoomCodeInput, setGameRoomCodeInput,
    createGameRounds, setCreateGameRounds,
    createGameDuration, setCreateGameDuration,
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
    memoryCards, initMemoryGame, handleCardClick, memoryMoves, memoryMatches,
    isSpinning, wheelRotation, handleSpinWheelClick,
    handleCreateGameRoom, handleJoinGameRoom, handleStartGame, handleSubmitGameAnswer, handleNextRound, handlePlayAgain, handleLeaveGameRoom
  };
};
