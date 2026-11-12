import api from './client';

export const ticketsApi = {
  getTickets: async (filters = {}) => {
    const response = await api.get('/tickets', { params: filters });
    return response.data;
  },
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  createTicket: async (data) => {
    const response = await api.post('/tickets', data);
    return response.data;
  },
  updateTicket: async (id, data) => {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, status, order_index = null) => {
    const payload = { status };
    if (order_index !== null) payload.order_index = order_index;
    const response = await api.patch(`/tickets/${id}/status`, payload);
    return response.data;
  },
  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
  },
  addComment: async (ticketId, content, parentId = null) => {
    const payload = { content };
    if (parentId) payload.parent_id = parentId;
    const response = await api.post(`/tickets/${ticketId}/comments`, payload);
    return response.data;
  },
  deleteComment: async (commentId) => {
    await api.delete(`/comments/${commentId}`);
  },
  uploadAttachment: async (ticketId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteAttachment: async (attachmentId) => {
    await api.delete(`/attachments/${attachmentId}`);
  },
  logWork: async (ticketId, timeSpentMinutes, description = '') => {
    const response = await api.post(`/tickets/${ticketId}/worklogs`, {
      time_spent_minutes: timeSpentMinutes,
      description: description || null
    });
    return response.data;
  },
  getActivities: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/activities`);
    return response.data;
  }
};
