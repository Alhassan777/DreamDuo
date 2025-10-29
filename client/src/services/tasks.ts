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
  deadline?: string | null;  // Optional ISO string for deadline
}

/**
 * The backend returns tasks in this shape, using ISO strings for dates.
 */
export interface TaskResponse {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: { color: string; level: string; } | string; // Support both new object format and legacy string format
  category_id?: number;
  parent_id?: number | null;
  creation_date: string;          // An ISO date string from the backend
  deadline?: string;             // Optional ISO string for deadline
  subtasks?: TaskResponse[];      // 'subtasks' are nested tasks
  category?: CategoryResponse;    // Additional info about the category
  position_x?: number | null;     // Canvas X position
  position_y?: number | null;     // Canvas Y position
  canvas_color?: string | null;   // Custom canvas color
  canvas_shape?: string | null;   // Canvas shape: 'rectangle', 'rounded', 'circle'
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface TaskDependency {
  id: number;
  source_task_id: number;
  target_task_id: number;
  user_id: number;
  edge_color?: string | null;
  edge_style?: string | null;
  edge_width?: number | null;
  edge_animated?: boolean | null;
}

/**
 * Front-end shape for a Task. Again, store dates as ISO strings.
 */
export interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: { color: string; level: string; } | string; // Support both new object format and legacy string format
  category_id?: number;
  parent_id: number | null;
  creation_date: string; // Keep as ISO string
  deadline?: string;    // Optional ISO string for deadline
  collapsed?: boolean;
  children: Task[]; 
  category?: string;
  categoryIcon?: string;
  position_x?: number | null;     // Canvas X position
  position_y?: number | null;     // Canvas Y position
  canvas_color?: string | null;   // Custom canvas color
  canvas_shape?: string | null;   // Canvas shape: 'rectangle', 'rounded', 'circle'
}

// ------------------
// Conversion helpers
// ------------------

/**
 * Recursively converts the backend's TaskResponse (which may have nested subtasks)
 * into the front-end Task structure with 'children'.
 */
export function mapTaskResponseToTask(taskRes: TaskResponse): Task {
  return {
    id: taskRes.id,
    name: taskRes.name,
    description: taskRes.description,
    completed: taskRes.completed,
    priority: taskRes.priority, 
    parent_id: taskRes.parent_id ? Number(taskRes.parent_id) : null,
    category_id: taskRes.category_id,
    creation_date: taskRes.creation_date,         // Keep the ISO string 
    deadline: taskRes.deadline,                   // Add deadline field
    collapsed: false,                             // Default UI preference
    children: (taskRes.subtasks || []).map(mapTaskResponseToTask),
    category: taskRes.category?.name,
    categoryIcon: taskRes.category?.icon,
    position_x: taskRes.position_x,
    position_y: taskRes.position_y,
    canvas_color: taskRes.canvas_color,
    canvas_shape: taskRes.canvas_shape
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
        // Use local date string in YYYY-MM-DD format to preserve local timezone
        const now = new Date();
        task.creation_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      }
      
      // If deadline is provided as a full ISO string, keep it as is
      // The backend will handle it in local timezone
      
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
  toggleTaskComplete: async (taskId: number, _completed: boolean): Promise<TaskResponse> => {
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
  addSubtask: async (parentId: number, subtask: { name: string, parent_id?: number }): Promise<TaskResponse> => {
    try {
      // Always use the parentId parameter directly, ignoring any parent_id in the subtask object
      const taskData = {
        name: subtask.name,
        parent_id: parentId  // Use the parentId parameter directly
      };
      const response = await api.post('/tasks/', taskData);
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

  /**
   * Search tasks with comprehensive filters
   */
  searchTasksWithFilters: async (params: {
    timeScope: 'daily' | 'weekly' | 'monthly' | 'yearly';
    anchorDate: string;
    searchQuery?: string;
    categoryIds?: number[];
    priorityLevels?: string[];
    deadlineBefore?: string;
    deadlineAfter?: string;
    completionStatus?: 'all' | 'completed' | 'incomplete';
  }): Promise<Task[]> => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('time_scope', params.timeScope);
      queryParams.append('anchor_date', params.anchorDate);
      
      if (params.searchQuery) {
        queryParams.append('search_query', params.searchQuery);
      }
      if (params.categoryIds && params.categoryIds.length > 0) {
        queryParams.append('category_ids', params.categoryIds.join(','));
      }
      if (params.priorityLevels && params.priorityLevels.length > 0) {
        queryParams.append('priority_levels', params.priorityLevels.join(','));
      }
      if (params.deadlineBefore) {
        queryParams.append('deadline_before', params.deadlineBefore);
      }
      if (params.deadlineAfter) {
        queryParams.append('deadline_after', params.deadlineAfter);
      }
      if (params.completionStatus) {
        queryParams.append('completion_status', params.completionStatus);
      }

      const response = await api.get<TaskResponse[]>(`/tasks/search?${queryParams.toString()}`);
      const taskResponses = response.data;
      return taskResponses.map(mapTaskResponseToTask);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates the position of a task on the canvas
   */
  updateTaskPosition: async (taskId: number, x: number, y: number): Promise<void> => {
    try {
      await api.post(`/tasks/${taskId}/position`, { x, y });
    } catch (error) {
      console.error('Failed to update task position:', error);
      throw error;
    }
  },

  /**
   * Updates the appearance (color, shape) of a task on the canvas
   */
  updateTaskAppearance: async (
    taskId: number,
    color?: string | null,
    shape?: string | null
  ): Promise<void> => {
    try {
      await api.post(`/tasks/${taskId}/customize`, { color, shape });
    } catch (error) {
      console.error('Failed to update task appearance:', error);
      throw error;
    }
  },

  /**
   * Get all task dependencies for the current user
   */
  getDependencies: async (): Promise<TaskDependency[]> => {
    try {
      const response = await api.get('/tasks/dependencies');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
      throw error;
    }
  },

  /**
   * Create a new task dependency
   */
  createDependency: async (sourceTaskId: number, targetTaskId: number): Promise<TaskDependency> => {
    try {
      const response = await api.post('/tasks/dependencies', {
        source_task_id: sourceTaskId,
        target_task_id: targetTaskId,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create dependency:', error);
      throw error;
    }
  },

  /**
   * Delete a task dependency
   */
  deleteDependency: async (dependencyId: number): Promise<void> => {
    try {
      await api.delete(`/tasks/dependencies/${dependencyId}`);
    } catch (error) {
      console.error('Failed to delete dependency:', error);
      throw error;
    }
  },

  /**
   * Get dependencies for a specific task
   */
  getTaskDependencies: async (taskId: number): Promise<{ outgoing: TaskDependency[], incoming: TaskDependency[] }> => {
    try {
      const response = await api.get(`/tasks/${taskId}/dependencies`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch task dependencies:', error);
      throw error;
    }
  },

  /**
   * Update the appearance of a dependency edge
   */
  updateDependencyAppearance: async (
    dependencyId: number,
    appearance: {
      edge_color?: string | null;
      edge_style?: string | null;
      edge_width?: number | null;
      edge_animated?: boolean | null;
    }
  ): Promise<TaskDependency> => {
    try {
      const response = await api.put(`/tasks/dependencies/${dependencyId}/customize`, appearance);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update dependency appearance:', error);
      throw error;
    }
  },
};
