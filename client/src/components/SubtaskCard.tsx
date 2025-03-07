import { Box, VStack, Text, Flex, IconButton, Input } from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './styles/SubtaskCard.css';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  children: Subtask[];
  subtasks?: Subtask[];
  parent_id: number | null;
}

interface SubtaskCardProps {
  taskId: number;
  subtask: Subtask;
  onDelete: (taskId: number, subtaskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId: number) => void;
  onToggleComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, subtaskId: number, newName: string) => void;
  onDragStart: (
    type: 'subtask' | 'sub-subtask', 
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

const SubtaskCard = ({
  taskId,
  subtask,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onUpdateName,
  onDragStart,
  onDrop,
  dragState
}: SubtaskCardProps) => {
  const { isAotMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(subtask.name);

  // Update local state when subtask prop changes
  useEffect(() => {
    setEditedName(subtask.name);
  }, [subtask.name]);

  // Enter rename mode by double-click
  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(subtask.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdateName(taskId, subtask.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      // Cancel edit
      setIsEditing(false);
      setEditedName(subtask.name);
    }
  };

  // Use children property if available, otherwise fall back to subtasks for compatibility
  const nestedSubtasks = subtask.children || subtask.subtasks || [];

  return (
    <Box
      className="subtask-card"
      data-aot-mode={isAotMode}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.currentTarget.style.opacity = '0.5';
        onDragStart('subtask', taskId, subtask.id, subtask.parent_id);
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
        if (dragState && dragState.itemId !== subtask.id) {
          onDrop(taskId, subtask.id);
        }
      }}
    >
      {/* Subtask Header */}
      <Flex
        className={`subtask-card-content ${subtask.completed ? 'completed' : ''}`}
        data-aot-mode={isAotMode}
      >
        <Flex className="subtask-card-left">
          {/* Complete / Uncomplete Button */}
          <IconButton
            icon={subtask.completed ? <CheckIcon /> : undefined}
            aria-label={
              subtask.completed
                ? 'Mark as incomplete'
                : 'Mark as complete'
            }
            colorScheme="green"
            variant={subtask.completed ? 'solid' : 'outline'}
            size="xs"
            onClick={() => onToggleComplete(taskId, subtask.id)}
            className={`subtask-complete-button ${
              subtask.completed ? 'completed' : ''
            }`}
          />

          {/* Subtask Name (edit inline on double click) */}
          {isEditing ? (
            <Input
              value={editedName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={handleNameSubmit}
              className="subtask-input"
              size="sm"
              autoFocus
              data-aot-mode={isAotMode}
            />
          ) : (
            <Text
              className={`subtask-text ${
                subtask.completed ? 'completed' : ''
              }`}
              onDoubleClick={handleDoubleClick}
              title="Double click to edit"
            >
              {subtask.name}
            </Text>
          )}
        </Flex>

        {/* Action Buttons for Subtask */}
        <Flex className="subtask-card-right">
          {/* Add Nested Subtask */}
          <IconButton
            icon={<AddIcon />}
            aria-label="Add subtask"
            colorScheme="blue"
            size="xs"
            onClick={() => onAddSubtask(taskId, subtask.id)}
            data-aot-mode={isAotMode}
          />
          {/* Delete Subtask */}
          <IconButton
            icon={<CloseIcon />}
            aria-label="Delete subtask"
            colorScheme="red"
            size="xs"
            onClick={() => onDelete(taskId, subtask.id)}
            data-aot-mode={isAotMode}
          />
        </Flex>
      </Flex>

      {/* Recursively Render Children Subtasks */}
      {nestedSubtasks && nestedSubtasks.length > 0 && (
        <VStack className="subtask-nested" align="stretch">
          {nestedSubtasks.map((nestedSubtask) => (
            <SubtaskCard
              key={nestedSubtask.id}
              taskId={taskId}
              subtask={nestedSubtask}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleComplete={onToggleComplete}
              onUpdateName={onUpdateName}
              onDragStart={onDragStart}
              onDrop={onDrop}
              dragState={dragState}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SubtaskCard;
