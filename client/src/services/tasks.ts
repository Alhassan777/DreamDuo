import api from './api';

// Types for API requests/responses
export interface TaskCreateRequest {
  name: string;
  category_id?: number;
  priority?: string;
  parent_id: number | null;
  // creation_date?: string; // Not needed, since the backend sets it
}

export type TaskCategory = string;

/**
 * Category information returned from the backend
 */
export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

/**
 * The shape the backend returns, with "subtasks".
 * Each subtask is itself a TaskResponse in nested form.
 */
export interface TaskResponse {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: string;
  category_id?: number;
  parent_id?: number | null;
  creation_date: string;    // Typically an ISO string from the backend
  subtasks?: TaskResponse[]; // The backend calls them 'subtasks'
  category?: CategoryResponse; // Category information including name and icon
}

/**
 * The front-end Task shape, with 'children' for nesting.
 */
export interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: string;
  category_id?: number;
  parent_id: number | null;
  creation_date: Date;      // We'll parse from ISO
  collapsed?: boolean;
  children: Task[];
  category?: string;
  categoryIcon?: string;
}

/**
 * Recursively converts the backend's TaskResponse (which may have nested subtasks)
 * into the front-end Task structure with 'children'.
 */
function mapTaskResponseToTask(taskRes: TaskResponse): Task {
  return {
    id: taskRes.id,
    name: taskRes.name,
    description: taskRes.description,
    completed: taskRes.completed,
    priority: taskRes.priority, // Priority is a string from the backend
    parent_id: taskRes.parent_id ?? null,
    category_id: taskRes.category_id,
    creation_date: new Date(taskRes.creation_date), // parse ISO string
    collapsed: false, // default to expanded in the UI
    children: (taskRes.subtasks || []).map(mapTaskResponseToTask), // Recursively map subtasks
    category: taskRes.category?.name,
    categoryIcon: taskRes.category?.icon
  };
}

export const tasksService = {
  /**
   * Fetches all tasks from '/tasks/',
   * which returns an array of root tasks with nested 'subtasks'.
   * We then map them into the `Task` shape (with 'children').
   */
  getTasks: async (): Promise<Task[]> => {
    try {
      const response = await api.get<TaskResponse[]>('/tasks/');
      const taskResponses = response.data; // Each item can have nested 'subtasks'
      // Convert each root TaskResponse into a front-end Task
      const tasks: Task[] = taskResponses.map(mapTaskResponseToTask);
      return tasks;
    } catch (error) {
      throw error;
    }
  },

  // (no changes needed in the following methods except for type signatures)
  
  getTaskHierarchy: async (taskId: number) => {
    try {
      const response = await api.get(`/tasks/${taskId}/hierarchy`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  moveTask: async (taskId: number, newParentId: number | null): Promise<Task> => {
    try {
      const response = await api.put(`/tasks/${taskId}/move`, { parent_id: newParentId });
      return mapTaskResponseToTask(response.data);
    } catch (error) {
      throw error;
    }
  },

  createTask: async (task: TaskCreateRequest): Promise<TaskResponse> => {
    try {
      const response = await api.post('/tasks/', task);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (taskId: number, updates: Partial<TaskCreateRequest>): Promise<TaskResponse> => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  toggleTaskComplete: async (taskId: number, completed: boolean): Promise<TaskResponse> => {
    try {
      // Currently your backend route toggles automatically, ignoring 'completed'
      // If you want to pass 'completed', you'd do: { completed } instead of {}
      const response = await api.put(`/tasks/${taskId}/toggle`, {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addSubtask: async (parentId: number, subtask: { name: string }): Promise<TaskResponse> => {
    try {
      const response = await api.post('/tasks/', {
        name: subtask.name,
        parent_id: parentId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTaskName: async (taskId: number, newName: string): Promise<TaskResponse> => {
    try {
      const response = await api.put(`/tasks/${taskId}`, { name: newName });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

