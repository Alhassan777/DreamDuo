import { useState } from 'react';
import { Task, Subtask } from '../types/task';

interface DragState {
  // Only allow dragging for subtasks (or deeper)
  type: 'subtask' | 'sub-subtask';
  sourceTaskId: number;
  sourceParentId?: number;
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

  // A recursive helper to remove a subtask from a list of subtasks.
  // Returns a tuple of the removed subtask (if found) and the updated list.
  const findAndRemoveSubtask = (
    subtasks: Subtask[],
    subtaskId: number
  ): [Subtask | null, Subtask[]] => {
    let removedSubtask: Subtask | null = null;
    const updatedSubtasks = subtasks.filter((subtask) => {
      if (subtask.id === subtaskId) {
        removedSubtask = subtask;
        return false;
      }
      if (subtask.subtasks) {
        const [removed, updated] = findAndRemoveSubtask(subtask.subtasks, subtaskId);
        if (removed) {
          removedSubtask = removed;
          subtask = { ...subtask, subtasks: updated };
        }
      }
      return true;
    });
    return [removedSubtask, updatedSubtasks];
  };

  // Handles dropping a dragged subtask into a target task (or into a nested subtask).
  // targetTaskId: the task into which you are dropping.
  // targetParentId (optional): if provided, drop inside that subtask’s children.
  const handleDrop = (targetTaskId: number, targetParentId?: number) => {
    if (!dragState) return;

    // We know we are only dragging subtasks/sub-subtasks (never tasks)

    setTasks((prevTasks) => {
      // Make a shallow copy of the tasks array.
      const updatedTasks = [...prevTasks];

      // --- 1. Remove the dragged subtask from its source task ---
      const sourceTaskIndex = updatedTasks.findIndex(
        (task) => task.id === dragState.sourceTaskId
      );
      if (sourceTaskIndex === -1) return prevTasks;

      const sourceTask = updatedTasks[sourceTaskIndex];
      if (!sourceTask.subtasks) return prevTasks;

      const [removed, newSourceSubtasks] = findAndRemoveSubtask(
        sourceTask.subtasks,
        dragState.itemId
      );
      if (!removed) return prevTasks; // nothing was found to move

      // Update only the source task with its updated subtasks.
      updatedTasks[sourceTaskIndex] = {
        ...sourceTask,
        subtasks: newSourceSubtasks,
      };

      // Clone the removed subtask to avoid reference issues.
      const itemToMove: Subtask = { ...removed };

      // --- 2. Insert the dragged subtask into the target task ---
      const targetTaskIndex = updatedTasks.findIndex(
        (task) => task.id === targetTaskId
      );
      if (targetTaskIndex === -1) return prevTasks;

      const targetTask = updatedTasks[targetTaskIndex];

      if (!targetParentId) {
        // Drop as a direct subtask of the target task.
        updatedTasks[targetTaskIndex] = {
          ...targetTask,
          subtasks: [...(targetTask.subtasks || []), itemToMove],
        };
      } else {
        // Drop inside a specific subtask of the target task.
        if (!targetTask.subtasks) return prevTasks;
        const newTargetSubtasks = targetTask.subtasks.map((subtask) => {
          if (subtask.id === targetParentId) {
            return {
              ...subtask,
              subtasks: [...(subtask.subtasks || []), itemToMove],
            };
          }
          return subtask;
        });
        updatedTasks[targetTaskIndex] = {
          ...targetTask,
          subtasks: newTargetSubtasks,
        };
      }

      return updatedTasks;
    });

    // Clear the drag state.
    setDragState(null);
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
