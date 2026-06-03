import { apiFetch } from './api';

export const communityService = {
  async fetchCommunityPosts(beforeId?: string, token?: string) {
    let url = `/api/community/posts?limit=10`;
    if (beforeId) url += `&before=${beforeId}`;
    const res = await apiFetch(url, {}, token);
    return res;
  },

  async fetchNewsPosts(token?: string) {
    const res = await apiFetch('/api/community/posts?limit=20&news=true', {}, token);
    return res;
  },

  async createPost(title: string, content: string, imageUrl: string, isNews: boolean = false, token?: string) {
    const res = await apiFetch('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, image_url: imageUrl, is_news: isNews }),
    }, token);
    return res;
  },

  async editPost(postId: number, content: string, imageUrl: string, token?: string) {
    const res = await apiFetch(`/api/community/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, image_url: imageUrl }),
    }, token);
    return res;
  },

  async deletePost(postId: number, token?: string) {
    const res = await apiFetch(`/api/community/posts/${postId}`, {
      method: 'DELETE',
    }, token);
    return res;
  },

  async likePost(postId: number, token?: string) {
    const res = await apiFetch(`/api/community/posts/${postId}/like`, {
      method: 'POST',
    }, token);
    return res;
  },

  // Comments for Posts
  async fetchComments(postId: number) {
    const res = await apiFetch(`/api/community/posts/${postId}/comments`);
    return res;
  },

  async addComment(postId: number, content: string, parentId?: number | null, token?: string) {
    const res = await apiFetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId || null }),
    }, token);
    return res;
  },

  async deleteComment(commentId: number, token?: string) {
    const res = await apiFetch(`/api/community/comments/${commentId}`, {
      method: 'DELETE',
    }, token);
    return res;
  },

  async likeComment(commentId: number, token?: string) {
    const res = await apiFetch(`/api/community/comments/${commentId}/like`, {
      method: 'POST',
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

  // Suggestions API
  async fetchSuggestions(token?: string) {
    const res = await apiFetch('/api/suggestions', {}, token);
    return res;
  },

  async createSuggestion(title: string, content: string, token?: string) {
    const res = await apiFetch('/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }, token);
    return res;
  },

  async upvoteSuggestion(suggestionId: number, token?: string) {
    const res = await apiFetch(`/api/suggestions/${suggestionId}/upvote`, {
      method: 'POST',
    }, token);
    return res;
  },

  // Admin Suggestions operations
  async fetchAdminSuggestions(token?: string) {
    const res = await apiFetch('/api/admin/suggestions', {}, token);
    return res;
  },

  async updateSuggestionStatus(suggestionId: number, status: 'approved' | 'rejected', token?: string) {
    const res = await apiFetch(`/api/admin/suggestions/${suggestionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
    return res;
  },
};
