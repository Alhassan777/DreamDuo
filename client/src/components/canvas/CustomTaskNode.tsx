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

export interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  onDelete: (taskId: number, subtaskId?: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId?: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onUpdateSubtaskName: (taskId: number, subtaskId: number, newName: string) => void;
  onNodeClick?: (taskId: number) => void;
  connectMode?: boolean;
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
        onDelete={data.onDelete}
        onToggleCollapse={data.onToggleCollapse}
        onAddSubtask={data.onAddSubtask}
        onToggleComplete={data.onToggleComplete}
        onToggleSubtaskComplete={data.onToggleSubtaskComplete}
        onUpdateName={data.onUpdateName}
        onUpdateSubtaskName={data.onUpdateSubtaskName}
      />
    </div>
  );
};

export default memo(CustomTaskNode);


