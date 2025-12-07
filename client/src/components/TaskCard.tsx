import React, { useState,useEffect } from 'react';
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
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import {
  AddIcon,
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  TimeIcon,
  InfoOutlineIcon,
  EditIcon,
} from '@chakra-ui/icons';
import { format, isValid, parseISO } from 'date-fns';

import SubtaskCard from './SubtaskCard';
import TaskEditModal from './tasks/TaskEditModal';
import './styles/TaskCard.css';

/** Interface for each Task,
    including an array of 'children' for subtasks. */
interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  collapsed?: boolean;
  priority?: { color: string; level: string; } | string; // Support both new object format and legacy string format
  category?: string;
  categoryIcon?: string;
  category_id?: number;
  parent_id: number | null;
  deadline?: string;
  /** Nested subtasks for hierarchical structure */
  children: Task[];
  // Keep subtasks for backward compatibility
  subtasks?: Task[];
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
  categories?: Category[];
  priorities?: PriorityColor[];
  onDelete: (taskId: number, subtaskId?: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId?: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, newName: string) => void;
  onUpdateSubtaskName: (taskId: number, subtaskId: number, newName: string) => void;
  onUpdateDescription: (taskId: number, description: string) => void;
  onUpdateSubtaskDescription: (taskId: number, subtaskId: number, description: string) => void;
  onUpdateTask?: (taskId: number, updates: any) => Promise<void>;
  newlyCreatedSubtaskId?: number | null;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  categories = [],
  priorities = [],
  onDelete,
  onToggleCollapse,
  onAddSubtask,
  onToggleComplete: _onToggleComplete,
  onToggleSubtaskComplete,
  onUpdateName,
  onUpdateSubtaskName,
  onUpdateDescription,
  onUpdateSubtaskDescription,
  onUpdateTask,
  newlyCreatedSubtaskId,
  onDragStart,
  onDrop,
  dragState,
}) => {
  const { isAotMode } = useTheme();
  // Local state for renaming this task
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  
  // Modal state for description editing
  const { isOpen: isDescriptionModalOpen, onOpen: onDescriptionModalOpen, onClose: onDescriptionModalClose } = useDisclosure();
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  
  // Modal state for comprehensive task editing
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  
  // Update local state when task prop changes
  useEffect(() => {
    setEditedName(task.name);
    setEditedDescription(task.description || '');
  }, [task.name, task.description]);

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

  /** Handle description modal open */
  const handleDescriptionOpen = () => {
    setEditedDescription(task.description || '');
    onDescriptionModalOpen();
  };

  /** Handle description save */
  const handleDescriptionSave = () => {
    onUpdateDescription(task.id, editedDescription);
    onDescriptionModalClose();
  };

  /** Handle description cancel */
  const handleDescriptionCancel = () => {
    setEditedDescription(task.description || '');
    onDescriptionModalClose();
  };

  /** Handle comprehensive task update */
  const handleTaskUpdate = async (taskId: number, updates: any) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, updates);
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
        {/* HEADER: Delete button, Name, Collapse toggle, Description, Add subtask */}
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

          {/* Right side: edit, description, collapse, add subtask */}
          <Flex gap={2}>
            {/* Edit button for comprehensive task editing */}
            {onUpdateTask && (
              <Tooltip label="Edit task" placement="top">
                <IconButton
                  icon={<EditIcon />}
                  aria-label="Edit task"
                  size="sm"
                  onClick={onEditModalOpen}
                  data-aot-mode={isAotMode}
                  colorScheme="purple"
                  variant="solid"
                />
              </Tooltip>
            )}
            {/* Description button with tooltip */}
            <Tooltip 
              label={task.description || 'No description. Click to add one.'}
              placement="top"
            >
              <IconButton
                icon={<InfoOutlineIcon />}
                aria-label="Edit description"
                size="sm"
                onClick={handleDescriptionOpen}
                data-aot-mode={isAotMode}
                className="description-button"
                variant="solid"
              />
            </Tooltip>
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
        <Flex align="center" gap={3} flexWrap="wrap" mt={2} mb={2}>
          {task.category && (
            <Tag size="sm" data-aot-mode={isAotMode}>
              {task.categoryIcon && (
                <span style={{ marginRight: '0.3rem' }}>{task.categoryIcon}</span>
              )}
              {task.category}
            </Tag>
          )}
          {task.priority && (
            <Tooltip label={typeof task.priority === 'string' ? `Priority: ${task.priority}` : `Priority: ${task.priority.level}`}>
              <Circle 
                size="24px" 
                bg={typeof task.priority === 'string' ? task.priority : task.priority.color}
                className="priority-indicator" 
                data-aot-mode={isAotMode}
              >
                <StarIcon color="white" boxSize={4} />
              </Circle>
            </Tooltip>
          )}
          {task.deadline && (() => {
            const deadlineDate = parseISO(task.deadline);
            if (isValid(deadlineDate)) {
              return (
                <Tooltip label={format(deadlineDate, "PPpp")}>
                  <Tag size="sm" colorScheme="blue" className="deadline-tag" data-aot-mode={isAotMode}>
                    <TimeIcon className="deadline-time-icon" />
                    {format(deadlineDate, "MMM do, h:mm a")}
                  </Tag>
                </Tooltip>
              );
            }
            return null;
          })()}
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
                  categories={categories}
                  priorities={priorities}
                  onDelete={onDelete}
                  onAddSubtask={(taskId, parentSubtaskId) => onAddSubtask(taskId, parentSubtaskId)}
                  onToggleComplete={onToggleSubtaskComplete}
                  onUpdateName={onUpdateSubtaskName}
                  onUpdateDescription={onUpdateSubtaskDescription}
                  onUpdateTask={onUpdateTask}
                  /* Drag + drop optional */
                  onDragStart={onDragStart ? onDragStart : () => {}}
                  onDrop={onDrop ? onDrop : () => {}}
                  dragState={dragState || null}
                  newlyCreatedSubtaskId={newlyCreatedSubtaskId}
                />
              ))}
            </VStack>
          )}
        </Collapse>
      </VStack>

      {/* Description Edit Modal */}
      <Modal isOpen={isDescriptionModalOpen} onClose={handleDescriptionCancel} data-aot-mode={isAotMode}>
        <ModalOverlay />
        <ModalContent data-aot-mode={isAotMode}>
          <ModalHeader data-aot-mode={isAotMode}>Edit Task Description</ModalHeader>
          <ModalCloseButton data-aot-mode={isAotMode} />
          <ModalBody data-aot-mode={isAotMode}>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={6}
              data-aot-mode={isAotMode}
            />
          </ModalBody>
          <ModalFooter data-aot-mode={isAotMode}>
            <Button mr={3} onClick={handleDescriptionCancel} data-aot-mode={isAotMode}>
              Cancel
            </Button>
            <Button onClick={handleDescriptionSave} data-aot-mode={isAotMode}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Comprehensive Task Edit Modal */}
      {onUpdateTask && (
        <TaskEditModal
          isOpen={isEditModalOpen}
          onClose={onEditModalClose}
          task={task}
          categories={categories.filter((cat): cat is Category & { id: number } => cat.id !== undefined)}
          priorities={priorities}
          onSave={handleTaskUpdate}
        />
      )}
    </Box>
  );
};

export default TaskCard;
