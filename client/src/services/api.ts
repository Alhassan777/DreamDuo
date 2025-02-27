import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const auth = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

// Add auth token to all requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;