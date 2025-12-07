import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, VStack, Flex, IconButton, Input, Text, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Textarea } from '@chakra-ui/react';
import { AddIcon, CloseIcon, CheckIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/SubtaskCard.css';
import './CanvasSubtaskCard.css';

interface Subtask {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  priority?: { color: string; level: string } | string;
  category?: string;
  categoryIcon?: string;
  category_id?: number;
  deadline?: string;
  children: Subtask[];
  subtasks?: Subtask[];
  parent_id: number | null;
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

interface CanvasSubtaskCardProps {
  taskId: number;
  subtask: Subtask;
  categories?: Category[];
  priorities?: PriorityColor[];
  onDelete: (taskId: number, subtaskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId: number) => void;
  onToggleComplete: (taskId: number, subtaskId: number) => void;
  onUpdateName: (taskId: number, subtaskId: number, newName: string) => void;
  onUpdateTask?: (taskId: number, updates: any) => Promise<void>;
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
  newlyCreatedSubtaskId?: number | null;
}

const CanvasSubtaskCard: React.FC<CanvasSubtaskCardProps> = ({
  taskId,
  subtask,
  categories = [],
  priorities = [],
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onUpdateName,
  onUpdateTask,
  depth = 0,
  newlyCreatedSubtaskId,
}) => {
  const { isAotMode } = useTheme();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(subtask.name || '');
  
  // Modal state for description editing
  const { isOpen: isDescriptionModalOpen, onOpen: onDescriptionModalOpen, onClose: onDescriptionModalClose } = useDisclosure();
  const [editedDescription, setEditedDescription] = React.useState(subtask.description || '');

  // Update local state when subtask prop changes
  React.useEffect(() => {
    setEditedName(subtask.name || '');
    setEditedDescription(subtask.description || '');
  }, [subtask.name, subtask.description]);

  // Automatically enter edit mode if this is a newly created subtask
  React.useEffect(() => {
    if (subtask.id && newlyCreatedSubtaskId === subtask.id) {
      setIsEditing(true);
    }
  }, [newlyCreatedSubtaskId, subtask.id]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(subtask.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = () => {
    if (!subtask.id) {
      console.error('Cannot update subtask: subtask.id is undefined', subtask);
      // Don't exit edit mode - let user try again when data loads
      return;
    }
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

  /** Handle description modal open */
  const handleDescriptionOpen = () => {
    setEditedDescription(subtask.description || '');
    onDescriptionModalOpen();
  };

  /** Handle description save */
  const handleDescriptionSave = () => {
    if (onUpdateTask) {
      onUpdateTask(subtask.id, { description: editedDescription });
    }
    onDescriptionModalClose();
  };

  /** Handle description cancel */
  const handleDescriptionCancel = () => {
    setEditedDescription(subtask.description || '');
    onDescriptionModalClose();
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
            {/* Description Button */}
            <Tooltip 
              label={subtask.description || 'No description. Click to add one.'}
              placement="top"
            >
              <IconButton
                icon={<InfoOutlineIcon />}
                aria-label="Edit description"
                size="xs"
                onClick={handleDescriptionOpen}
                data-aot-mode={isAotMode}
                className="description-button"
                variant="solid"
              />
            </Tooltip>
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
              categories={categories}
              priorities={priorities}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleComplete={onToggleComplete}
              onUpdateName={onUpdateName}
              onUpdateTask={onUpdateTask}
              onDragStart={() => {}}
              onDrop={() => {}}
              dragState={null}
              depth={depth + 1}
              newlyCreatedSubtaskId={newlyCreatedSubtaskId}
            />
          ))}
        </VStack>
      )}

      {/* Description Edit Modal */}
      <Modal isOpen={isDescriptionModalOpen} onClose={handleDescriptionCancel} data-aot-mode={isAotMode}>
        <ModalOverlay />
        <ModalContent data-aot-mode={isAotMode}>
          <ModalHeader data-aot-mode={isAotMode}>Edit Subtask Description</ModalHeader>
          <ModalCloseButton data-aot-mode={isAotMode} />
          <ModalBody data-aot-mode={isAotMode}>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter subtask description..."
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
    </Box>
  );
};

export default CanvasSubtaskCard;

