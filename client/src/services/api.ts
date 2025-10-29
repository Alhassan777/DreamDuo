import axios from 'axios';

axios.defaults.withCredentials = true;

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});
 

export const auth = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (first_name: string,last_name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { 
        first_name,
        last_name,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    // No need to handle token removal as it's managed by cookies
  },
};

export const user = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in');
      }
      throw error;
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await api.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;