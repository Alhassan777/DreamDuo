export interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  subtasks?: Subtask[];
}

export interface Task {
  id: number;
  name: string;
  category: string;
  completed: boolean;
  collapsed?: boolean;
  subtasks?: Subtask[];
}

export const TASK_CATEGORIES = [
  'Work',
  'Exercise',
  'Personal',
  'Shopping'
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];