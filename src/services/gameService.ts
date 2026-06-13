import { apiFetch, API_BASE } from './api';

export const gameService = {
  async fetchLeaderboard(tab: string, batch?: string) {
    let url = `/api/leaderboard?tab=${tab}`;
    if (tab === 'batch' && batch) {
      url += `&batch=${encodeURIComponent(batch)}`;
    }
    const res = await apiFetch(url);
    return res;
  },

  async createGameRoom(rounds: number, duration: number, token?: string) {
    const res = await apiFetch('/api/games/create', {
      method: 'POST',
      body: JSON.stringify({ rounds, roundDuration: duration }),
    }, token);
    return res;
  },

  async joinGameRoom(code: string, token?: string) {
    const res = await apiFetch('/api/games/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code.toUpperCase() }),
    }, token);
    return res;
  },

  async startGame(code: string, token?: string) {
    const res = await apiFetch('/api/games/start', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code }),
    }, token);
    return res;
  },

  async submitGameAnswer(code: string, answer: string, token?: string) {
    const res = await apiFetch('/api/games/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code, answer }),
    }, token);
    return res;
  },

  async nextRound(code: string, token?: string) {
    const res = await apiFetch('/api/games/next-round', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code }),
    }, token);
    return res;
  },

  async playAgain(code: string, token?: string) {
    const res = await apiFetch('/api/games/play-again', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code }),
    }, token);
    return res;
  },

  async leaveGameRoom(code: string, token?: string) {
    const res = await apiFetch('/api/games/leave', {
      method: 'POST',
      body: JSON.stringify({ roomCode: code }),
    }, token);
    return res;
  },

  async redeemXpCode(code: string, token?: string) {
    const res = await apiFetch('/api/xp-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }, token);
    return res;
  },

  async claimGamePlayXp(token?: string) {
    const res = await apiFetch('/api/games/1/play', {
      method: 'POST',
    }, token);
    return res;
  },

  // Admin XP Code management
  async fetchAdminCodes(token?: string) {
    const res = await apiFetch('/api/admin/xp-codes', {}, token);
    return res;
  },

  async adminCreateCode(body: any, token?: string) {
    const res = await apiFetch('/api/admin/xp-codes', {
      method: 'POST',
      body: JSON.stringify(body),
    }, token);
    return res;
  },

  async adminDeleteCode(codeId: number, token?: string) {
    const res = await apiFetch(`/api/admin/xp-codes/${codeId}`, {
      method: 'DELETE',
    }, token);
    return res;
  },
};
