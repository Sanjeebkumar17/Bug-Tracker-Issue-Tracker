import api from './client';

export const tagsApi = {
  getProjectTags: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tags`);
    return response.data;
  },
  createTag: async (projectId, data) => {
    const response = await api.post(`/projects/${projectId}/tags`, data);
    return response.data;
  },
  deleteTag: async (tagId) => {
    await api.delete(`/tags/${tagId}`);
  }
};
