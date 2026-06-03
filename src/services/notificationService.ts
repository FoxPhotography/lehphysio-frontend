import { apiFetch } from './api';

export const notificationService = {
  async fetchNotifications(page: number = 1, limit: number = 20, filter: string = 'all', token?: string) {
    const res = await apiFetch(
      `/api/in-app-notifications?page=${page}&limit=${limit}&filter=${filter}`,
      {},
      token
    );
    return res;
  },

  async fetchUnreadCount(token?: string) {
    const res = await apiFetch('/api/in-app-notifications/unread-count', {}, token);
    return res;
  },

  async markAsRead(id: number, token?: string) {
    const res = await apiFetch(`/api/in-app-notifications/${id}/read`, {
      method: 'PATCH',
    }, token);
    return res;
  },

  async markAllAsRead(token?: string) {
    const res = await apiFetch('/api/in-app-notifications/read-all', {
      method: 'POST',
    }, token);
    return res;
  },

  async softDelete(id: number, token?: string) {
    const res = await apiFetch(`/api/in-app-notifications/${id}`, {
      method: 'DELETE',
    }, token);
    return res;
  },

  async clearRead(token?: string) {
    const res = await apiFetch('/api/in-app-notifications/clear-read', {
      method: 'POST',
    }, token);
    return res;
  },

  async getPreferences(token?: string) {
    const res = await apiFetch('/api/in-app-notifications/preferences', {}, token);
    return res;
  },

  async updatePreferences(prefs: Record<string, boolean>, token?: string) {
    const res = await apiFetch('/api/in-app-notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }, token);
    return res;
  },
};
