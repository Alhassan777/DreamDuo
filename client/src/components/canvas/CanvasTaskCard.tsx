import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, VStack, Text, Flex, Tag, IconButton, Collapse, Input, Circle, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Textarea } from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  AddIcon,
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  TimeIcon,
  EditIcon,
  InfoOutlineIcon,
} from '@chakra-ui/icons';
import { format, isValid, parseISO } from 'date-fns';
import CanvasSubtaskCard from './CanvasSubtaskCard';
import TaskEditModal from '../tasks/TaskEditModal';
import '../styles/TaskCard.css';
import './CanvasTaskCard.css';

interface Task {
  id: number;
  name: string;
  completed: boolean;
  collapsed?: boolean;
  priority?: { color: string; level: string } | string;
  category?: string;
  categoryIcon?: string;
  category_id?: number;
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

interface CanvasTaskCardProps {
  task: Task;
  selected?: boolean;
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
  newlyCreatedSubtaskId?: number | null;
}

const CanvasTaskCard: React.FC<CanvasTaskCardProps> = ({
  task,
  selected,
  categories = [],
  priorities = [],
  onDelete,
  onToggleCollapse,
  onAddSubtask,
  onToggleComplete: _onToggleComplete,
  onToggleSubtaskComplete,
  onUpdateName,
  onUpdateSubtaskName,
  onUpdateTask,
  newlyCreatedSubtaskId,
}) => {
  const { isAotMode } = useTheme();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(task.name);
  
  // Modal state for description editing
  const { isOpen: isDescriptionModalOpen, onOpen: onDescriptionModalOpen, onClose: onDescriptionModalClose } = useDisclosure();
  const [editedDescription, setEditedDescription] = React.useState(task.description || '');
  
  // Modal state for comprehensive task editing
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

  // Update local state when task prop changes
  React.useEffect(() => {
    setEditedName(task.name);
    setEditedDescription(task.description || '');
  }, [task.name, task.description]);

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
    if (onUpdateTask) {
      onUpdateTask(task.id, { description: editedDescription });
    }
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

  const subtasks = task.children || task.subtasks || [];

  // Determine styling based on canvas customization
  const getBorderRadius = () => {
    switch (task.canvas_shape) {
      case 'rectangle':
        return '4px';
      case 'circle':
        return '50%';
      case 'rounded':
      default:
        return 'var(--border-radius-lg)';
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: task.canvas_color || undefined,
    borderRadius: getBorderRadius(),
    transition: 'all 0.3s ease',
  };

  return (
    <Box className={`canvas-task-card-wrapper ${selected ? 'selected' : ''}`}>
      {/* Top Handle - Target for incoming dependencies */}
      <Handle
        type="target"
        position={Position.Top}
        id={`task-${task.id}-target`}
        className="canvas-task-handle-top"
      />

      <Box
        className={`task-card canvas-task-card-inner ${task.completed ? 'completed' : ''}`}
        data-aot-mode={isAotMode}
        style={cardStyle}
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

            {/* Right side: edit, description, collapse + add subtask */}
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

          {/* SUBTASKS: expand/collapse with Canvas handles */}
          <Collapse in={!task.collapsed}>
            {subtasks && subtasks.length > 0 && (
              <VStack 
                align="stretch" 
                pl={6} 
                pr={5}
                spacing={2} 
                className="subtasks-container canvas-subtasks-container" 
                data-aot-mode={isAotMode}
              >
                {subtasks.map((sub) => (
                  <CanvasSubtaskCard
                    key={sub.id}
                    taskId={task.id}
                    subtask={sub}
                    categories={categories}
                    priorities={priorities}
                    onDelete={onDelete}
                    onAddSubtask={(taskId, parentSubtaskId) => onAddSubtask(taskId, parentSubtaskId)}
                    onToggleComplete={onToggleSubtaskComplete}
                    onUpdateName={onUpdateSubtaskName}
                    onUpdateTask={onUpdateTask}
                    onDragStart={() => {}}
                    onDrop={() => {}}
                    dragState={null}
                    newlyCreatedSubtaskId={newlyCreatedSubtaskId}
                  />
                ))}
              </VStack>
            )}
          </Collapse>
        </VStack>
      </Box>

      {/* Bottom Handle - Source for outgoing dependencies */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`task-${task.id}-source`}
        className="canvas-task-handle-bottom"
      />

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
          categories={categories}
          priorities={priorities}
          onSave={handleTaskUpdate}
        />
      )}
    </Box>
  );
};

export default CanvasTaskCard;

