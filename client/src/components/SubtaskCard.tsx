import { Box, VStack, Text, Flex, IconButton, Input } from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import './styles/SubtaskCard.css';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  subtasks?: Subtask[];
}

interface SubtaskCardProps {
  taskId: number;
  subtask: Subtask;
  onDelete: (taskId: number, subtaskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId: number) => void;
  onToggleComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, subtaskId: number, newName: string) => void;
  onDragStart: (type: 'task' | 'subtask' | 'sub-subtask', taskId: number, itemId: number, parentId?: number) => void;
  onDrop: (taskId: number, parentId?: number) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(subtask.name);

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

  return (
    <Box
      className="subtask-card"
      draggable
      onDragStart={(e) => {
        e.currentTarget.style.opacity = '0.5';
        onDragStart('subtask', taskId, subtask.id);
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('drag-over');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        onDrop(taskId, subtask.id);
      }}>
      <Flex
        className={`subtask-card-content ${subtask.completed ? 'completed' : ''}`}
      >
        <Flex className="subtask-card-left">
          <IconButton
            icon={subtask.completed ? <CheckIcon /> : undefined}
            aria-label={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
            colorScheme="green"
            variant={subtask.completed ? 'solid' : 'outline'}
            size="xs"
            onClick={() => onToggleComplete(taskId, subtask.id)}
            className={`subtask-complete-button ${subtask.completed ? 'completed' : ''}`}
          />
          {isEditing ? (
            <Input
              value={editedName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              className="subtask-input"
              size="sm"
              autoFocus
            />
          ) : (
            <Text
              className={`subtask-text ${subtask.completed ? 'completed' : ''}`}
              onDoubleClick={handleDoubleClick}
              title="Double click to edit"
            >
              {subtask.name}
            </Text>
          )}
        </Flex>
        <Flex className="subtask-card-right">
          <IconButton
            icon={<AddIcon />}
            aria-label="Add subtask"
            colorScheme="blue"
            size="xs"
            onClick={() => onAddSubtask(taskId, subtask.id)}
          />
          <IconButton
            icon={<CloseIcon />}
            aria-label="Delete subtask"
            colorScheme="red"
            size="xs"
            onClick={() => onDelete(taskId, subtask.id)}
          />
        </Flex>
      </Flex>
      
      {subtask.subtasks && subtask.subtasks.length > 0 && (
        <VStack className="subtask-nested">
          {subtask.subtasks.map((nestedSubtask) => (
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
