import api from './api';

export interface TimeLog {
  id: number;
  task_id: number;
  task_name: string | null;
  user_id: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  source: string;
  active_url: string | null;
  created_at: string;
  is_running: boolean;
  elapsed_seconds?: number;
}

export interface TaskTimeStats {
  task_id: number;
  task_name: string;
  total_seconds: number;
  log_count: number;
}

export interface DailyTimeStats {
  date: string;
  total_seconds: number;
  log_count: number;
}

export interface WeeklyTimeStats {
  day: string;
  date: string;
  total_seconds: number;
  log_count: number;
}

export interface TimeStats {
  total_time_seconds: number;
  today_seconds: number;
  today_log_count: number;
  tasks: TaskTimeStats[];
  daily_breakdown: DailyTimeStats[];
  weekly_stats: WeeklyTimeStats[];
  date_range: {
    start: string;
    end: string;
  };
}

export interface TimeLogsResponse {
  success: boolean;
  data: TimeLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimeStatsResponse {
  success: boolean;
  data: TimeStats;
}

export interface TaskTotalResponse {
  success: boolean;
  data: {
    task_id: number;
    task_name: string;
    total_seconds: number;
    log_count: number;
    formatted_time: string;
  };
}

export const timeService = {
  /**
   * Start a timer for a task
   */
  startTimer: async (taskId: number, notes?: string): Promise<{ success: boolean; data: TimeLog }> => {
    const body: { task_id: number; notes?: string } = { task_id: taskId };
    if (notes) body.notes = notes;
    
    const response = await api.post('/time/start', body);
    return response.data;
  },

  /**
   * Stop the currently active timer
   */
  stopTimer: async (notes?: string): Promise<{ success: boolean; data: TimeLog }> => {
    const body = notes ? { notes } : {};
    const response = await api.post('/time/stop', body);
    return response.data;
  },

  /**
   * Get the currently active timer, if any
   */
  getActiveTimer: async (): Promise<{ success: boolean; data: TimeLog | null }> => {
    const response = await api.get('/time/active');
    return response.data;
  },

  /**
   * Get time logs with optional filters
   */
  getLogs: async (options?: {
    taskId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<TimeLogsResponse> => {
    const params = new URLSearchParams();
    
    if (options?.taskId) params.append('task_id', options.taskId.toString());
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const response = await api.get(`/time/logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Delete a time log entry
   */
  deleteLog: async (logId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/time/logs/${logId}`);
    return response.data;
  },

  /**
   * Update a time log entry (notes only)
   */
  updateLog: async (logId: number, notes: string): Promise<{ success: boolean; data: TimeLog }> => {
    const response = await api.put(`/time/logs/${logId}`, { notes });
    return response.data;
  },

  /**
   * Get time tracking statistics for the dashboard
   */
  getStats: async (startDate?: string, endDate?: string): Promise<TimeStatsResponse> => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/time/stats?${params.toString()}`);
    return response.data;
  },

  /**
   * Get total time spent on a specific task
   */
  getTaskTotal: async (taskId: number): Promise<TaskTotalResponse> => {
    const response = await api.get(`/time/task/${taskId}/total`);
    return response.data;
  },
};

/**
 * Format duration in seconds to human-readable string (HH:MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format duration to short string (e.g., "2h 30m")
 */
export const formatDurationShort = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

/**
 * Format duration to detailed string (e.g., "2 hours, 30 minutes")
 */
export const formatDurationLong = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0 minutes';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  return parts.join(', ');
};

export default timeService;
