import { useState } from 'react';
import { tasksService, Task, TaskCreateRequest } from '../services/tasks';

/**
 * Hook for managing tasks in a hierarchical system (with nesting).
 * 
 * Assumes tasksService.getTasks() returns Task[] objects 
 * already nested properly (children instead of subtasks).
 */
export const useTasks = () => {
  /**
   * React state holding the entire tree of tasks.
   * Each `Task` can have `children: Task[]` for nested subtasks.
   */
  const [tasks, setTasks] = useState<Task[]>([]);

  /**
   * Create a new task (top-level or subtask).
   * The backend automatically sets `creation_date`.
   */
  const createTask = async (
    newTask: TaskCreateRequest
  ) => {
    try {
      // Build the request body for the backend.
      // If parent_id is null or undefined, pass null to create a root task.
      await tasksService.createTask({
        name: newTask.name,
        priority: newTask.priority,
        parent_id: newTask.parent_id ?? null,
        category_id: newTask.category_id,
        creation_date: newTask.creation_date
      });

      // Fetch the updated list of tasks for the specific date
      const updatedTasks = await tasksService.getTasksByDate(newTask.creation_date || new Date().toISOString());
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  /**
   * Delete a task (either root or subtask).
   */
  const deleteTask = async (taskId: number, subtaskId?: number) => {
    try {
      if (subtaskId === undefined) {
        // Deleting a root task
        await tasksService.deleteTask(taskId);
        // Optionally do an optimistic update for root-level tasks:
        setTasks(prev => prev.filter(t => t.id !== taskId));
        return;
      }

      // Deleting a subtask
      await tasksService.deleteTask(subtaskId);
      // Re-fetch tasks for the current date
      // Find a task to get its creation_date to use for filtering
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const dateStr = task.creation_date.split('T')[0];
        const updatedTasks = await tasksService.getTasksByDate(dateStr);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  /**
   * Toggle a task's collapse/expand state in the UI only.
   * No server call needed — purely local UI state.
   */
  const toggleCollapse = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, collapsed: !task.collapsed }
          : task
      )
    );
  };

  /**
   * Add a new subtask (or sub-subtask) under a given parent.
   */
  const addSubtask = async (taskId: number, parentSubtaskId?: number) => {
    try {
      // If parentSubtaskId is provided, create a subtask under that subtask
      // Otherwise, create a subtask directly under the task
      const parentId = parentSubtaskId !== undefined ? parentSubtaskId : taskId;
      
      const newSubtaskData = {
        name: 'New Subtask',
        parent_id: parentId
      };
      
      // The actual API call should use the correct parent ID
      await tasksService.addSubtask(parentId, newSubtaskData);
      
      // Find the parent task to get its creation_date
      const parentTask = tasks.find(t => t.id === parentId || t.children.some(c => c.id === parentId));
      if (parentTask) {
        // Re-fetch tasks for the specific date
        const dateStr = parentTask.creation_date.split('T')[0];
        const updatedTasks = await tasksService.getTasksByDate(dateStr);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  };

  /**
   * Toggle completion of a top-level task.
   */
  const toggleComplete = async (taskId: number) => {
    try {
      // Find the local copy of the task
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Call the backend route that toggles completion
      await tasksService.toggleTaskComplete(taskId, !task.completed);
      // Re-fetch tasks for the specific date
      const dateStr = task.creation_date.split('T')[0];
      const updatedTasks = await tasksService.getTasksByDate(dateStr);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  /**
   * Toggle completion of a subtask.
   */
  const findSubtaskRecursively = (task: Task, subtaskId: number): Task | undefined => {
    // Check direct children first
    const directChild = task.children.find(s => s.id === subtaskId);
    if (directChild) return directChild;

    // If not found, recursively check children's children
    for (const child of task.children) {
      const found = findSubtaskRecursively(child, subtaskId);
      if (found) return found;
    }
    return undefined;
  };

  const toggleSubtaskComplete = async (taskId: number, subtaskId: number) => {
    try {
      // Find the parent task
      const parentTask = tasks.find(t => t.id === taskId);
      if (!parentTask) return;

      // Find the subtask recursively through all levels
      const subtask = findSubtaskRecursively(parentTask, subtaskId);
      if (!subtask) return;

      await tasksService.toggleTaskComplete(subtaskId, !subtask.completed);
      // Find the creation date from the parent task
      const dateStr = parentTask.creation_date.split('T')[0];
      const updatedTasks = await tasksService.getTasksByDate(dateStr);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      throw error;
    }
  };

  /**
   * Rename a task (root or otherwise).
   */
  const updateTaskName = async (taskId: number, newName: string) => {
    try {
      await tasksService.updateTask(taskId, { name: newName });
      // Find the task to get its creation_date
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const dateStr = task.creation_date.split('T')[0];
        const updatedTasks = await tasksService.getTasksByDate(dateStr);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error updating task name:', error);
      throw error;
    }
  };

  /**
   * Rename a subtask (convenience method).
   */
  const updateSubtaskName = async (taskId: number, subtaskId: number, newName: string) => {
    try {
      await tasksService.updateTask(subtaskId, { name: newName });
      // Find the task to get its creation_date to use for filtering
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const dateStr = task.creation_date.split('T')[0];
        const updatedTasks = await tasksService.getTasksByDate(dateStr);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error updating subtask name:', error);
      throw error;
    }
  };

  return {
    tasks,
    setTasks,
    createTask,
    deleteTask,
    toggleCollapse,
    addSubtask,
    toggleComplete,
    toggleSubtaskComplete,
    updateTaskName,
    updateSubtaskName
  };
};
