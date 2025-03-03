import { useState } from 'react';
import { Task } from '../services/tasks';
import { tasksService } from '../services/tasks';

interface DragState {
  // Only allow dragging for subtasks (or deeper)
  type: 'subtask' | 'sub-subtask';
  sourceTaskId: number;
  sourceParentId?: number | undefined;
  itemId: number;
}

export const useDragAndDrop = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Only allow dragging subtasks or deeper – never top-level tasks.
  const handleDragStart = (
    type: 'subtask' | 'sub-subtask',
    sourceTaskId: number,
    itemId: number,
    parentId?: number
  ) => {
    setDragState({
      type,
      sourceTaskId,
      sourceParentId: parentId,
      itemId,
    });
  };

  // Handles dropping a dragged subtask into a target task (or into a nested subtask).
  // targetTaskId: the task into which you are dropping.
  // targetParentId (optional): if provided, drop inside that subtask's children.
  const handleDrop = async (targetTaskId: number, targetParentId?: number) => {
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
      // Update the backend using moveTask
      await tasksService.moveTask(dragState.itemId, targetParentId || targetTaskId);
      
      // Fetch updated tasks from the backend to reflect the changes
      // This ensures we get the correct hierarchy after the move
      const updatedTasks = await tasksService.getTasks();
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error moving subtask:', error);
      // You might want to show a user-friendly error message here
    } finally {
      // Always clear the drag state, whether the operation succeeded or failed
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
