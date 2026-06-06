import { apiFetch } from './api';

export const reportService = {
  async submitReport(
    targetType: 'post' | 'comment' | 'message',
    targetId: number,
    reason: string,
    contentPreview?: string,
    token?: string
  ) {
    const res = await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
        reason,
        content_preview: contentPreview || '',
      }),
    }, token);
    return res;
  },

  async fetchReports(token?: string) {
    const res = await apiFetch('/api/admin/reports', {}, token);
    return res;
  },

  async updateReportStatus(reportId: number, action: 'dismiss' | 'resolve_delete', token?: string) {
    const res = await apiFetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }, token);
    return res;
  },
};
