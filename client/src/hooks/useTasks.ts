import { useState, useEffect } from 'react';
import { tasksService, Task, TaskCreateRequest, mapTaskResponseToTask } from '../services/tasks';
import { websocketService } from '../services/websocket';

/**
 * Hook for managing tasks in a hierarchical system (with nesting).
 * 
 * Assumes tasksService.getTasks() returns Task[] objects 
 * already nested properly (children instead of subtasks).
 * @param dateFilter Optional date filter in YYYY-MM-DD format
 */
export const useTasks = (dateFilter?: string) => {
  /**
   * React state holding the entire tree of tasks.
   * Each `Task` can have `children: Task[]` for nested subtasks.
   */
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Store the current date filter
  const [currentDateFilter, setCurrentDateFilter] = useState<string | undefined>(dateFilter);

  // Update currentDateFilter when dateFilter prop changes
  useEffect(() => {
    setCurrentDateFilter(dateFilter);
  }, [dateFilter]);

  // Load initial tasks and connect to WebSocket when the hook is initialized
  useEffect(() => {
    // Load initial tasks
    const loadInitialTasks = async () => {
      try {
        let initialTasks;
        if (currentDateFilter) {
          initialTasks = await tasksService.getTasksByDate(currentDateFilter);
        } else {
          initialTasks = await tasksService.getTasks();
        }
        setTasks(initialTasks);
      } catch (error) {
        console.error('Error loading initial tasks:', error);
      }
    };
    
    loadInitialTasks();

    // Initialize WebSocket connection
    websocketService.connect();
    
    // Set up listeners for real-time updates
    const taskCreatedUnsubscribe = websocketService.onTaskCreated(async (newTask) => {
      console.log('Task created via WebSocket:', newTask);
      // Refetch all tasks to ensure consistency
      try {
        let updatedTasks;
        if (currentDateFilter) {
          updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
        } else {
          updatedTasks = await tasksService.getTasks();
        }
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error refetching tasks after WebSocket task creation:', error);
      }
    });
    
    const taskUpdatedUnsubscribe = websocketService.onTaskUpdated(async (updatedTask) => {
      console.log('Task updated via WebSocket:', updatedTask);
      // Refetch all tasks to ensure consistency
      try {
        let updatedTasks;
        if (currentDateFilter) {
          updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
        } else {
          updatedTasks = await tasksService.getTasks();
        }
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error refetching tasks after WebSocket task update:', error);
      }
    });
    
    const taskDeletedUnsubscribe = websocketService.onTaskDeleted(async (taskId) => {
      console.log('Task deleted via WebSocket:', taskId);
      // Refetch all tasks to ensure consistency
      try {
        let updatedTasks;
        if (currentDateFilter) {
          updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
        } else {
          updatedTasks = await tasksService.getTasks();
        }
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error refetching tasks after WebSocket task deletion:', error);
      }
    });
    
    const taskCompletedUnsubscribe = websocketService.onTaskCompleted(async (taskId, completed) => {
      console.log('Task completion toggled via WebSocket:', taskId, completed);
      // Refetch all tasks to ensure consistency
      try {
        let updatedTasks;
        if (currentDateFilter) {
          updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
        } else {
          updatedTasks = await tasksService.getTasks();
        }
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error refetching tasks after WebSocket task completion toggle:', error);
      }
    });
    
    // Clean up WebSocket listeners when the component unmounts
    return () => {
      taskCreatedUnsubscribe();
      taskUpdatedUnsubscribe();
      taskDeletedUnsubscribe();
      taskCompletedUnsubscribe();
      websocketService.disconnect();
    };
  }, [currentDateFilter]);

  /**
   * Create a new task (top-level or subtask).
   * The backend automatically sets `creation_date`.
   * Uses WebSockets for real-time updates instead of re-fetching tasks.
   * Returns the created task from the server for ID remapping.
   */
  const createTask = async (newTask: TaskCreateRequest): Promise<Task> => {
    try {
      const createdTaskResponse = await tasksService.createTask({
        name: newTask.name,
        priority: newTask.priority,
        parent_id: newTask.parent_id ?? null,
        category_id: newTask.category_id,
        deadline: newTask.deadline,
        creation_date: newTask.creation_date
      });

      // Refetch tasks with date filter if available
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);

      // Return the created task
      return mapTaskResponseToTask(createdTaskResponse);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: number, subtaskId?: number) => {
    try {
      if (subtaskId === undefined) {
        await tasksService.deleteTask(taskId);
      } else {
        await tasksService.deleteTask(subtaskId);
      }
      
      // Refetch all tasks after deletion
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleComplete = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await tasksService.toggleTaskComplete(taskId, !task.completed);
      
      // Refetch all tasks after toggling completion
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  const toggleSubtaskComplete = async (taskId: number, subtaskId: number) => {
    try {
      const parentTask = tasks.find(t => t.id === taskId);
      if (!parentTask) return;

      const subtask = findSubtaskRecursively(parentTask, subtaskId);
      if (!subtask) return;

      await tasksService.toggleTaskComplete(subtaskId, !subtask.completed);
      
      // Refetch all tasks after toggling completion
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      throw error;
    }
  };

  const updateTaskName = async (taskId: number, newName: string) => {
    try {
      await tasksService.updateTask(taskId, { name: newName });
      
      // Refetch all tasks after updating name
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task name:', error);
      throw error;
    }
  };

  const updateSubtaskName = async (_taskId: number, subtaskId: number, newName: string) => {
    try {
      await tasksService.updateTask(subtaskId, { name: newName });
      
      // Refetch all tasks after updating name
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating subtask name:', error);
      throw error;
    }
  };

  /**
   * Add a new subtask (or sub-subtask) under a given parent.
   * Uses WebSockets for real-time updates instead of optimistic updates with negative IDs.
   */
  const addSubtask = async (taskId: number, parentSubtaskId?: number) => {
    try {
      // If parentSubtaskId is provided, create a subtask under that subtask
      // Otherwise, create a subtask directly under the task
      const parentId = parentSubtaskId !== undefined ? parentSubtaskId : taskId;
      
      const newSubtaskData = {
        name: 'New Subtask'
        // Don't include parent_id here as it's passed directly to addSubtask
      };
      
      // Make the API call
      await tasksService.addSubtask(parentId, newSubtaskData);
      
      // Refetch tasks with date filter if available
      let updatedTasks;
      if (currentDateFilter) {
        updatedTasks = await tasksService.getTasksByDate(currentDateFilter);
      } else {
        updatedTasks = await tasksService.getTasks();
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  };

  /**
   * Helper function to recursively find a subtask in the task tree.
   * @param parentTask The task to search within
   * @param subtaskId The ID of the subtask to find
   * @returns The found subtask or undefined
   */
  const findSubtaskRecursively = (parentTask: Task, subtaskId: number): Task | undefined => {
    // Check if the current task is the one we're looking for
    if (parentTask.id === subtaskId) {
      return parentTask;
    }
  
    // Search through children recursively
    for (const child of parentTask.children || []) {
      const found = findSubtaskRecursively(child, subtaskId);
      if (found) return found;
    }
  
    return undefined;
  };

  /**
   * Toggle collapse state for a task.
   * This is a UI-only operation that doesn't need backend persistence.
   */
  const toggleCollapse = (taskId: number) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, collapsed: !task.collapsed };
        }
        if (task.children) {
          return {
            ...task,
            children: task.children.map(child => {
              if (child.id === taskId) {
                return { ...child, collapsed: !child.collapsed };
              }
              return child;
            })
          };
        }
        return task;
      });
    });
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
