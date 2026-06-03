import { apiFetch } from './api';

export const chatService = {
  async fetchChatMessages(beforeId?: string, token?: string) {
    let url = `/api/chat?limit=30`;
    if (beforeId) url += `&before=${beforeId}`;
    const res = await apiFetch(url, {}, token);
    return res;
  },

  async sendMessage(message: string, replyToId?: number | null, token?: string) {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, reply_to: replyToId || null }),
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
