import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import CanvasTaskCard from './CanvasTaskCard';

interface Task {
  id: number;
  name: string;
  completed: boolean;
  collapsed?: boolean;
  priority?: { color: string; level: string } | string;
  category?: string;
  categoryIcon?: string;
  parent_id: number | null;
  deadline?: string;
  children: Task[];
  subtasks?: Task[];
  canvas_color?: string | null;
  canvas_shape?: string | null;
}

interface Category {
  id?: number;
  name: string;
  icon?: string;
}

interface PriorityColor {
  level: string;
  color: string;
}

export interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  categories?: Category[];
  priorities?: PriorityColor[];
  onDelete: (taskId: number, subtaskId?: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId?: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onUpdateSubtaskName: (taskId: number, subtaskId: number, newName: string) => void;
  onUpdateTask?: (taskId: number, updates: any) => Promise<void>;
  onNodeClick?: (taskId: number) => void;
  connectMode?: boolean;
  newlyCreatedSubtaskId?: number | null;
}

const CustomTaskNode = ({ data: rawData, selected }: NodeProps) => {
  // Type assert and guard against missing data
  const data = rawData as unknown as TaskNodeData;
  if (!data || !data.task) {
    return null;
  }

  const isConnectMode = data.connectMode || false;

  const handleClick = (e: React.MouseEvent) => {
    console.log('CustomTaskNode clicked:', data.task.id);
    // Only use custom handler in connect mode for dependency creation
    if (data?.onNodeClick && isConnectMode) {
      e.stopPropagation();
      data.onNodeClick(data.task.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: isConnectMode ? 'crosshair' : 'grab',
        border: isConnectMode ? '2px dashed var(--color-info)' : undefined,
        borderRadius: 'var(--border-radius-lg)',
      }}
    >
      <CanvasTaskCard
        task={data.task}
        selected={selected}
        categories={data.categories}
        priorities={data.priorities}
        onDelete={data.onDelete}
        onToggleCollapse={data.onToggleCollapse}
        onAddSubtask={data.onAddSubtask}
        onToggleComplete={data.onToggleComplete}
        onToggleSubtaskComplete={data.onToggleSubtaskComplete}
        onUpdateName={data.onUpdateName}
        onUpdateSubtaskName={data.onUpdateSubtaskName}
        onUpdateTask={data.onUpdateTask}
        newlyCreatedSubtaskId={data.newlyCreatedSubtaskId}
      />
    </div>
  );
};

export default memo(CustomTaskNode);


