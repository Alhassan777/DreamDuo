import api from './api';

// Types
export interface Category {
  id?: number;
  name: string;
  color?: string;
  icon?: string;
}

export interface PriorityColor {
  level: string;
  color: string;
}

export interface CompletionStatus {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

// Tags API service
export const tagsService = {
  // Category Management
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/tags/categories');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createCategory: async (category: Category): Promise<Category> => {
    try {
      const response = await api.post('/tags/categories', category);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (categoryId: number, category: Category): Promise<Category> => {
    try {
      const response = await api.put(`/tags/categories/${categoryId}`, category);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCategory: async (categoryId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/tags/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Priority Levels Management
  getPriorities: async (): Promise<PriorityColor[]> => {
    try {
      const response = await api.get('/tags/priorities');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addPriority: async (priority: string, color: string = '#000000'): Promise<{ message: string }> => {
    try {
      const response = await api.post('/tags/priorities', { priority, color });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePriority: async (priority: string, newPriority: string, color?: string): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/tags/priorities/${priority}`, { 
        new_priority: newPriority,
        color: color
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deletePriority: async (priority: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/tags/priorities/${priority}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Completion Status Management
  getCompletionStatus: async (): Promise<CompletionStatus> => {
    try {
      const response = await api.get('/tags/completion-status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Status Logo Management
  updateStatusLogo: async (statusId: string, logoId: string | null): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/tags/status-logo/${statusId}`, { logo_id: logoId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStatusLogos: async (): Promise<Record<string, string>> => {
    try {
      const response = await api.get('/tags/status-logos');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default tagsService;