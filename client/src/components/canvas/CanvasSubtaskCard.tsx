import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, VStack, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { AddIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/SubtaskCard.css';
import './CanvasSubtaskCard.css';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  children: Subtask[];
  subtasks?: Subtask[];
  parent_id: number | null;
}

interface CanvasSubtaskCardProps {
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
  depth?: number;
}

const CanvasSubtaskCard: React.FC<CanvasSubtaskCardProps> = ({
  taskId,
  subtask,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onUpdateName,
  depth = 0,
}) => {
  const { isAotMode } = useTheme();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(subtask.name);

  // Update local state when subtask prop changes
  React.useEffect(() => {
    setEditedName(subtask.name);
  }, [subtask.name]);

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
      setIsEditing(false);
      setEditedName(subtask.name);
    }
  };

  // Use children property if available, otherwise fall back to subtasks for compatibility
  const nestedSubtasks = subtask.children || subtask.subtasks || [];

  return (
    <Box className="canvas-subtask-wrapper">
      <Box className="canvas-subtask-inner subtask-card" data-aot-mode={isAotMode}>
        {/* Connection handles for this subtask - positioned at vertical midpoint */}
        <Handle
          type="target"
          position={Position.Left}
          id={`subtask-${subtask.id}-target`}
          className="canvas-subtask-handle-target"
        />

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

        <Handle
          type="source"
          position={Position.Right}
          id={`subtask-${subtask.id}-source`}
          className="canvas-subtask-handle-source"
        />
      </Box>

      {/* Recursively Render Children Subtasks with handles */}
      {nestedSubtasks && nestedSubtasks.length > 0 && (
        <VStack className="subtask-nested canvas-subtask-nested" align="stretch" pl={4} mt={2} spacing={0}>
          {nestedSubtasks.map((nestedSubtask) => (
            <CanvasSubtaskCard
              key={nestedSubtask.id}
              taskId={taskId}
              subtask={nestedSubtask}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleComplete={onToggleComplete}
              onUpdateName={onUpdateName}
              onDragStart={() => {}}
              onDrop={() => {}}
              dragState={null}
              depth={depth + 1}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default CanvasSubtaskCard;

