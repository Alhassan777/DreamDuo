import { useState } from 'react';
import { Task } from '../services/tasks';
import { tasksService } from '../services/tasks';

interface DragState {
  type: 'task' | 'subtask' | 'sub-subtask';
  sourceTaskId: number;
  sourceParentId?: number;
  itemId: number;
}

export const useDragAndDrop = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleDragStart = (
    type: 'task' | 'subtask' | 'sub-subtask',
    sourceTaskId: number,
    itemId: number,
    parentId: number | null
  ) => {
    setDragState({
      type,
      sourceTaskId,
      sourceParentId: parentId ?? undefined,
      itemId,
    });
  };

  const handleDrop = async (targetTaskId: number, targetParentId: number | null) => {
    if (!dragState) return;

    if (dragState.itemId === targetTaskId || dragState.itemId === targetParentId) {
      setDragState(null);
      return;
    }
    
    if ((targetParentId && targetParentId === dragState.sourceParentId) || 
        (!targetParentId && targetTaskId === dragState.sourceParentId)) {
      setDragState(null);
      return;
    }

    try {
      const newParentId = targetParentId || targetTaskId;
      
      await tasksService.moveTask(dragState.itemId, newParentId);
      
      // Get the current date from the task's creation_date
      const movedTask = tasks.find(t => t.id === dragState.itemId);
      if (movedTask && movedTask.creation_date) {
        // Fetch tasks for the specific date
        const updatedTasks = await tasksService.getTasksByDate(movedTask.creation_date);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error moving task/subtask:', error);
    } finally {
      setDragState(null);
    }
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  return {
    dragState,
    handleDragStart,
    handleDrop,
    handleDragEnd,
  };
};
