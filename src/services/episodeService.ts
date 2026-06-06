import { apiFetch } from './api';

export const episodeService = {
  async fetchEpisodes(token?: string) {
    const res = await apiFetch('/api/episodes', {}, token);
    return res;
  },

  async fetchEpisodeDetail(episodeId: number, token?: string) {
    const res = await apiFetch(`/api/episodes/${episodeId}`, {}, token);
    return res;
  },

  async likeEpisode(episodeId: number, token?: string) {
    const res = await apiFetch(`/api/episodes/${episodeId}/interact`, {
      method: 'POST',
      body: JSON.stringify({ type: 'like' }),
    }, token);
    return res;
  },

  async submitQuiz(episodeId: number, answer: number, token?: string) {
    const res = await apiFetch(`/api/episodes/${episodeId}/interact`, {
      method: 'POST',
      body: JSON.stringify({ type: 'quiz', answer }),
    }, token);
    return res;
  },

  async addComment(episodeId: number, content: string, parentId?: number, token?: string) {
    const res = await apiFetch(`/api/episodes/${episodeId}/interact`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'comment',
        content,
        parent_id: parentId || null,
        parentId: parentId || null,
      }),
    }, token);
    return res;
  },

  async deleteComment(commentId: number, token?: string) {
    const res = await apiFetch(`/api/community/comments/${commentId}`, {
      method: 'DELETE',
    }, token);
    return res;
  },

  async editComment(commentId: number, content: string, token?: string) {
    const res = await apiFetch(`/api/community/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }, token);
    return res;
  },
};
