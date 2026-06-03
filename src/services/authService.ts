import { apiFetch, API_BASE } from './api';

export const authService = {
  async fetchUserProfile(token?: string) {
    const res = await apiFetch('/api/auth/me', {}, token);
    return res;
  },

  async fetchXpSettings() {
    const res = await apiFetch('/api/xp-settings');
    return res;
  },

  async fetchUsernamesDirectory(token?: string) {
    const res = await apiFetch('/api/users/usernames', {}, token);
    return res;
  },

  async updateProfile(body: any, token?: string) {
    const res = await apiFetch('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, token);
    return res;
  },

  async uploadImage(file: Blob, fileName: string, token?: string) {
    const formData = new FormData();
    formData.append('image', file, fileName);

    const res = await apiFetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    }, token);
    return res;
  },

  async fetchFrames() {
    const res = await apiFetch('/api/frames');
    return res;
  },

  async login(form: any) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  },

  async register(form: any) {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  },

  async confirmCode(email: string, code: string) {
    const res = await apiFetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    return res;
  },

  async forgotPassword(email: string) {
    const res = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res;
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const res = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
    return res;
  },

  // Push Notifications API
  async unsubscribePush(endpoint: string) {
    const res = await apiFetch('/api/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
    return res;
  },

  async getVapidKey() {
    const res = await apiFetch('/api/notifications/vapid-key');
    return res;
  },

  async subscribePush(subscription: any, deviceType: string, token?: string) {
    const res = await apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription,
        device_type: deviceType,
      }),
    }, token);
    return res;
  },

  // Admin User operations
  async fetchAdminUsers(token?: string) {
    const res = await apiFetch('/api/admin/users', {}, token);
    return res;
  },

  async toggleUserRole(userId: number, role: string, token?: string) {
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }, token);
    return res;
  },
};
