import api from './client';

export const projectsApi = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  createProject: async (data) => {
    const response = await api.post('/projects', data);
    return response.data;
  },
  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
  },
  addMember: async (projectId, data) => {
    const response = await api.post(`/projects/${projectId}/members`, data);
    return response.data;
  },
  updateMemberRole: async (projectId, userId, role) => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, { role });
    return response.data;
  },
  removeMember: async (projectId, userId) => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  }
};
