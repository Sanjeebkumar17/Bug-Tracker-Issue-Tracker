import api from './client';

export const authApi = {
  login: async (username_or_email, password) => {
    const response = await api.post('/auth/login', { username_or_email, password });
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
  getUsers: async (search = '') => {
    const response = await api.get('/users', { params: { search } });
    return response.data;
  }
};
