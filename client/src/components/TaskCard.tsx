import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  Tag,
  IconButton,
  Collapse,
  Input,
  Circle,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import {
  AddIcon,
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
} from '@chakra-ui/icons';

import SubtaskCard from './SubtaskCard';
import './styles/TaskCard.css';

/** Interface for each Task,
    including an array of 'children' for subtasks. */
interface Task {
  id: number;
  name: string;
  completed: boolean;
  collapsed?: boolean;
  priority?: string;
  category?: string;
  categoryIcon?: string;
  parent_id: number | null;
  /** Nested subtasks for hierarchical structure */
  children: Task[];
  // Keep subtasks for backward compatibility
  subtasks?: Task[];
}

/** Props for drag-and-drop. Remove if you don't need them. */
interface DragProps {
  onDragStart: (
    type: 'task' | 'subtask' | 'sub-subtask',
    taskId: number,
    itemId: number,
    parentId: number | null
  ) => void;
  onDrop: (taskId: number, parentId: number | null) => void;
  dragState: {
    type: 'task' | 'subtask' | 'sub-subtask';
    sourceTaskId: number;
    sourceParentId?: number;
    itemId: number;
  } | null;
}

/** Props for TaskCard. */
interface TaskCardProps extends Partial<DragProps> {
  task: Task;
  onDelete: (taskId: number, subtaskId?: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId?: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onUpdateSubtaskName: (taskId: number, subtaskId: number, newName: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDelete,
  onToggleCollapse,
  onAddSubtask,
  onToggleComplete,
  onToggleSubtaskComplete,
  onUpdateName,
  onUpdateSubtaskName,
  onDragStart,
  onDrop,
  dragState,
}) => {
  const { isAotMode } = useTheme();
  // Local state for renaming this task
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);

  /** Double-click to start editing */
  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(task.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  /** Press Enter/blur to finish editing */
  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdateName(task.id, editedName.trim());
      setIsEditing(false);
    }
  };

  /** Handle keyboard for rename input */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(task.name);
    }
  };

  // Use children property if available, otherwise fall back to subtasks for compatibility
  const subtasks = task.children || task.subtasks || [];

  return (
    <Box
      className={`task-card ${task.completed ? 'completed' : ''}`}
      data-aot-mode={isAotMode}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.currentTarget.style.opacity = '0.5';
        onDragStart && onDragStart('task', task.id, task.id, task.parent_id);
      }}
      onDragEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.opacity = '1';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        if (dragState && dragState.itemId !== task.id) {
          onDrop && onDrop(task.id, task.parent_id);
        }
      }}
    >
      <VStack spacing={4} align="stretch">
        {/* HEADER: Delete button, Name, Collapse toggle, Add subtask */}
        <Flex justify="space-between" align="center">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Delete task"
            colorScheme="red"
            size="sm"
            onClick={() => onDelete(task.id)}
            data-aot-mode={isAotMode}
          />

          {/* Name (inline edit) */}
          {isEditing ? (
            <Input
              value={editedName}
              onChange={handleNameChange}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="task-input"
              autoFocus
              data-aot-mode={isAotMode}
            />
          ) : (
            <Text
              className={`task-name ${task.completed ? 'completed' : ''}`}
              onDoubleClick={handleDoubleClick}
              title="Double click to edit"
              data-aot-mode={isAotMode}
            >
              {task.name}
            </Text>
          )}

          {/* Right side: collapse + add subtask */}
          <Flex gap={2}>
            <IconButton
              icon={task.collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              aria-label="Toggle collapse"
              colorScheme={task.collapsed ? 'gray' : 'teal'}
              size="sm"
              onClick={() => onToggleCollapse(task.id)}
              data-aot-mode={isAotMode}
            />
            <IconButton
              icon={<AddIcon />}
              aria-label="Add subtask"
              colorScheme="blue"
              size="sm"
              onClick={() => onAddSubtask(task.id)}
              data-aot-mode={isAotMode}
            />
          </Flex>
        </Flex>

        {/* Category & Priority info */}
        <Flex align="center" gap={2}>
          {task.category && (
            <Tag size="sm" data-aot-mode={isAotMode}>
              {task.categoryIcon && (
                <span style={{ marginRight: '0.3rem' }}>{task.categoryIcon}</span>
              )}
              {task.category}
            </Tag>
          )}
          {task.priority && (
            <Circle size="24px" bg={task.priority} title="Priority Level" className="priority-indicator" data-aot-mode={isAotMode}>
              <StarIcon color="white" boxSize={4} />
            </Circle>
          )}
        </Flex>

        {/* SUBTASKS: expand/collapse. If you want infinite nesting, subtask is rendered below */}
        <Collapse in={!task.collapsed}>
          {subtasks && subtasks.length > 0 && (
            <VStack align="stretch" pl={4} spacing={2} className="subtasks-container" data-aot-mode={isAotMode}>
              {subtasks.map((sub) => (
                <SubtaskCard
                  key={sub.id}
                  taskId={task.id}
                  subtask={sub}
                  onDelete={onDelete}
                  onAddSubtask={(taskId, parentSubtaskId) => onAddSubtask(taskId, parentSubtaskId)}
                  onToggleComplete={onToggleSubtaskComplete}
                  onUpdateName={onUpdateSubtaskName}
                  /* Drag + drop optional */
                  onDragStart={onDragStart ? onDragStart : () => {}}
                  onDrop={onDrop ? onDrop : () => {}}
                  dragState={dragState || null}
                />
              ))}
            </VStack>
          )}
        </Collapse>
      </VStack>
    </Box>
  );
};

export default TaskCard;
