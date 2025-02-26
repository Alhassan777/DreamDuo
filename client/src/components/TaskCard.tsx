import { Box, VStack, Text, Flex, Tag, IconButton, Collapse, Input, Circle } from '@chakra-ui/react';
import { AddIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
import SubtaskCard from './SubtaskCard';
import { useState } from 'react';
import './styles/TaskCard.css';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  subtasks?: Subtask[];
}

interface Task {
  id: number;
  name: string;
  category: string;
  completed: boolean;
  collapsed?: boolean;
  subtasks?: Subtask[];
  priority?: string;
}

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onUpdateSubtaskName: (taskId: number, subtaskId: number, newName: string) => void;
}

interface DragProps {
  onDragStart: (type: 'subtask' | 'sub-subtask', taskId: number, itemId: number, parentId?: number) => void;
  onDrop: (taskId: number, parentId?: number) => void;
  dragState: {
    type: 'subtask' | 'sub-subtask';
    sourceTaskId: number;
    sourceParentId?: number;
    itemId: number;
  } | null;
}

const TaskCard = ({
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
  dragState
}: TaskCardProps & DragProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(task.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdateName(task.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(task.name);
    }
  };

  // Passes subtask name updates down to the parent callback.
  const handleSubtaskNameUpdate = (taskId: number, subtaskId: number, newName: string) => {
    onUpdateSubtaskName(taskId, subtaskId, newName);
  };

  return (
    <Box
      className={`task-card ${task.completed ? 'completed' : ''} ${dragState ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        onDrop(task.id);
      }}
    >
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <IconButton
              icon={<CloseIcon />}
              aria-label="Delete task"
              colorScheme="red"
              size="sm"
              onClick={() => onDelete(task.id)}
            />
            {isEditing ? (
              <Input
                className="task-input"
                value={editedName}
                onChange={handleNameChange}
                onBlur={handleNameSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            ) : (
              <Text
                className={`task-name ${task.completed ? 'completed' : ''}`}
                onDoubleClick={handleDoubleClick}
                title="Double click to edit"
              >
                {task.name}
              </Text>
            )}
            <Flex gap={2}>
              <IconButton
                icon={task.collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                aria-label="Toggle collapse"
                colorScheme={task.collapsed ? "gray" : "teal"}
                variant="solid"
                size="sm"
                onClick={() => onToggleCollapse(task.id)}
              />
              <IconButton
                icon={<AddIcon />}
                aria-label="Add subtask"
                colorScheme="blue"
                size="sm"
                onClick={() => onAddSubtask(task.id)}
              />
            </Flex>
          </Flex>

          <Flex align="center" gap={2}>
            <Tag colorScheme="purple" size="sm" width="fit-content">
              {task.category}
            </Tag>
            {task.priority && (
              <Circle size="24px" bg={task.priority} title="Priority Level" className="priority-indicator">
                <StarIcon color="white" boxSize={4} />
              </Circle>
            )}
          </Flex>

          <Collapse
            in={!task.collapsed}
            className="subtasks-container"
            animateOpacity
          >
            {task.subtasks && task.subtasks.length > 0 && (
              <VStack align="stretch" pl={4} spacing={2}>
                {task.subtasks.map((subtask) => (
                  <SubtaskCard
                    key={subtask.id}
                    taskId={task.id}
                    subtask={subtask}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onToggleComplete={onToggleSubtaskComplete}
                    onUpdateName={handleSubtaskNameUpdate}
                    onDragStart={(type, taskId, itemId, parentId) => 
                      onDragStart(type as 'subtask' | 'sub-subtask', taskId, itemId, parentId)}
                    onDrop={onDrop}
                    dragState={dragState}
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
