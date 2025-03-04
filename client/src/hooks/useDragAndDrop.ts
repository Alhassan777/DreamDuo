import { useState } from 'react';
import { Task } from '../services/tasks';
import { tasksService } from '../services/tasks';

interface DragState {
  // Allow dragging for tasks, subtasks, or deeper
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

  // Allow dragging tasks, subtasks, or deeper
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

  // Handles dropping a dragged subtask into a target task (or into a nested subtask).
  // targetTaskId: the task into which you are dropping.
  // targetParentId (optional): if provided, drop inside that subtask's children.
  const handleDrop = async (targetTaskId: number, targetParentId: number | null) => {
    if (!dragState) return;

    // Don't allow dropping onto itself
    if (dragState.itemId === targetTaskId || dragState.itemId === targetParentId) {
      setDragState(null);
      return;
    }
    
    // Don't allow dropping onto its current parent (no change needed)
    if ((targetParentId && targetParentId === dragState.sourceParentId) || 
        (!targetParentId && targetTaskId === dragState.sourceParentId)) {
      setDragState(null);
      return;
    }

    try {
      // Always use targetParentId if provided, otherwise use targetTaskId
      const newParentId = targetParentId || targetTaskId;
      
      // Update the backend using moveTask
      await tasksService.moveTask(dragState.itemId, newParentId);
      
      // Fetch updated tasks from the backend to reflect the changes
      const updatedTasks = await tasksService.getTasks();
      setTasks(updatedTasks);
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
