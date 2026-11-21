import { apiFetch } from './api';

export const chatService = {
  async fetchChatMessages(beforeId?: string, token?: string) {
    let url = `/api/chat?limit=30`;
    if (beforeId) url += `&before=${beforeId}`;
    const res = await apiFetch(url, {}, token);
    return res;
  },

  async sendMessage(
    message: string,
    replyToId?: number | null,
    token?: string,
    replyToSuggestionId?: number | null,
    media?: { image_url?: string | null; audio_url?: string | null; audio_duration?: number }
  ) {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        reply_to: replyToId || null,
        reply_to_suggestion_id: replyToSuggestionId || null,
        image_url: media?.image_url || null,
        audio_url: media?.audio_url || null,
        audio_duration: media?.audio_duration || 0,
      }),
    }, token);
    return res;
  },

  async uploadAudio(blob: Blob, filename: string, token?: string) {
    const formData = new FormData();
    formData.append('audio', blob, filename);
    const res = await apiFetch('/api/upload/audio', {
      method: 'POST',
      body: formData,
    }, token);
    return res;
  },

  async toggleReaction(messageId: number, emoji: string, token?: string) {
    const res = await apiFetch(`/api/chat/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }, token);
    return res;
  },

  async editMessage(messageId: number, message: string, token?: string) {
    const res = await apiFetch(`/api/chat/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ message }),
    }, token);
    return res;
  },

  async deleteMessage(messageId: number, token?: string) {
    const res = await apiFetch(`/api/chat/${messageId}`, {
      method: 'DELETE',
    }, token);
    return res;
  },

  async bulkDeleteMessages(messageIds: number[], token?: string) {
    const res = await apiFetch('/api/chat/delete-bulk', {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    }, token);
    return res;
  },
};
