import api from './client';

export const sprintsApi = {
  getProjectSprints: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/sprints`);
    return response.data;
  },
  createSprint: async (projectId, data) => {
    const response = await api.post(`/projects/${projectId}/sprints`, data);
    return response.data;
  },
  updateSprint: async (sprintId, data) => {
    const response = await api.put(`/sprints/${sprintId}`, data);
    return response.data;
  },
  deleteSprint: async (sprintId) => {
    await api.delete(`/sprints/${sprintId}`);
  }
};
