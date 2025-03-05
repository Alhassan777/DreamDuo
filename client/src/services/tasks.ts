import api from './api';

// ------------------
// Types for API
// ------------------

/**
 * Request shape used to create or update a Task,
 * expecting an ISO string for `creation_date`.
 */
export interface TaskCreateRequest {
  name: string;
  category_id?: number;
  description?: string;
  priority?: string;
  parent_id: number | null;
  creation_date?: string | null;  // ISO string (if provided)
}

/**
 * The backend returns tasks in this shape, using ISO strings for dates.
 */
export interface TaskResponse {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: string;
  category_id?: number;
  parent_id?: number | null;
  creation_date: string;          // An ISO date string from the backend
  subtasks?: TaskResponse[];      // 'subtasks' are nested tasks
  category?: CategoryResponse;    // Additional info about the category
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Front-end shape for a Task. Again, store dates as ISO strings.
 */
export interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: string;
  category_id?: number;
  parent_id: number | null;
  creation_date: string; // Keep as ISO string
  collapsed?: boolean;
  children: Task[]; 
  category?: string;
  categoryIcon?: string;
}

// ------------------
// Conversion helpers
// ------------------

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
    priority: taskRes.priority, 
    parent_id: taskRes.parent_id ?? null,
    category_id: taskRes.category_id,
    creation_date: taskRes.creation_date,         // Keep the ISO string 
    collapsed: false,                             // Default UI preference
    children: (taskRes.subtasks || []).map(mapTaskResponseToTask),
    category: taskRes.category?.name,
    categoryIcon: taskRes.category?.icon
  };
}

// ------------------
// Task service
// ------------------

export const tasksService = {
  /**
   * Fetches all root tasks. Each task can contain nested 'subtasks'.
   */
  getTasks: async (): Promise<Task[]> => {
    try {
      const response = await api.get<TaskResponse[]>('/tasks/');
      const taskResponses = response.data;
      return taskResponses.map(mapTaskResponseToTask);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches tasks filtered by an exact ISO date/time string.
   * Example usage:
   *   tasksService.getTasksByDate(new Date().toISOString());
   */
  getTasksByDate: async (isoString: string): Promise<Task[]> => {
    try {
      // Ensure we're only sending the date part (YYYY-MM-DD) as the server expects
      const dateOnly = isoString.split('T')[0];
      const response = await api.get<TaskResponse[]>(`/tasks/?date=${encodeURIComponent(dateOnly)}`);
      const taskResponses = response.data;
      return taskResponses.map(mapTaskResponseToTask);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch a task's entire hierarchy by ID.
   */
  getTaskHierarchy: async (taskId: number) => {
    try {
      const response = await api.get(`/tasks/${taskId}/hierarchy`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Moves a task to a new parent, then returns the updated task.
   */
  moveTask: async (taskId: number, newParentId: number | null): Promise<Task> => {
    try {
      const response = await api.put(`/tasks/${taskId}/move`, { parent_id: newParentId });
      return mapTaskResponseToTask(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Creates a new task. Make sure `creation_date` is an ISO string if provided.
   * If not provided, you can generate a default one here:
   *
   *   task.creation_date = task.creation_date ?? new Date().toISOString();
   */
  createTask: async (task: TaskCreateRequest): Promise<TaskResponse> => {
    try {
      // Optional: Provide a default date if none is supplied
      if (!task.creation_date) {
        // Use local timezone for default creation date with full ISO string
        const now = new Date();
        task.creation_date = now.toISOString();
      } else if (!task.creation_date.includes('T')) {
        // If only date part is provided (YYYY-MM-DD), convert to full ISO string
        // This ensures timezone information is preserved
        const date = new Date(task.creation_date);
        task.creation_date = date.toISOString();
      }
      const response = await api.post('/tasks/', task);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates an existing task. Partial updates can include a new ISO creation_date.
   */
  updateTask: async (taskId: number, updates: Partial<TaskCreateRequest>): Promise<TaskResponse> => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deletes a task by ID.
   */
  deleteTask: async (taskId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggles a task's 'completed' status on the server.
   * Some backends ignore the 'completed' value you send; it depends on the API.
   */
  toggleTaskComplete: async (taskId: number, completed: boolean): Promise<TaskResponse> => {
    try {
      const response = await api.put(`/tasks/${taskId}/toggle`, {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gets task statistics for a date range.
   * Returns counts of total and completed tasks for each day in the range.
   */
  getTaskStatsByDateRange: async (startDate: string, endDate: string): Promise<Array<{
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
  }>> => {
    try {
      const response = await api.get(`/tasks/stats?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Adds a new subtask under a given parent task.
   */
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

  /**
   * Updates just the name of a given task.
   */
  updateTaskName: async (taskId: number, newName: string): Promise<TaskResponse> => {
    try {
      const response = await api.put(`/tasks/${taskId}`, { name: newName });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
