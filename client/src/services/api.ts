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

export default api;