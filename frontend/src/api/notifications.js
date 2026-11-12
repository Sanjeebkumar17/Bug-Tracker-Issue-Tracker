import api from './client';

export const notificationsApi = {
  getNotifications: async (unreadOnly = false) => {
    const response = await api.get('/notifications', { params: { unread_only: unreadOnly } });
    return response.data;
  },
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  }
};
