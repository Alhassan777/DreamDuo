import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Box,
  Text,
} from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';

interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface PriorityColor {
  level: string;
  color: string;
}

interface Task {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  priority?: { color: string; level: string } | string;
  deadline?: string;
}

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  categories: Category[];
  priorities: PriorityColor[];
  onSave: (taskId: number, updates: {
    name?: string;
    description?: string;
    category_id?: number | null;
    priority?: string | null;
    deadline?: string | null;
  }) => Promise<void>;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  categories,
  priorities,
  onSave,
}) => {
  const { isAotMode } = useTheme();
  
  const [editedName, setEditedName] = useState(task.name);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedCategoryId, setEditedCategoryId] = useState<number | undefined>(task.category_id);
  const [editedPriority, setEditedPriority] = useState<string | undefined>(
    typeof task.priority === 'string' ? task.priority : task.priority?.level
  );
  const [editedDeadline, setEditedDeadline] = useState<string>('');

  // Initialize form values when modal opens or task changes
  useEffect(() => {
    setEditedName(task.name);
    setEditedDescription(task.description || '');
    setEditedCategoryId(task.category_id);
    setEditedPriority(
      typeof task.priority === 'string' ? task.priority : task.priority?.level
    );
    
    // Format deadline for datetime-local input
    if (task.deadline) {
      try {
        const date = new Date(task.deadline);
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setEditedDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
      } catch (e) {
        setEditedDeadline('');
      }
    } else {
      setEditedDeadline('');
    }
  }, [task]);

  const handleSave = async () => {
    const updates: any = {};

    // Only include changed fields
    if (editedName !== task.name) {
      updates.name = editedName.trim();
    }
    
    if (editedDescription !== (task.description || '')) {
      updates.description = editedDescription;
    }
    
    if (editedCategoryId !== task.category_id) {
      updates.category_id = editedCategoryId || null;
    }
    
    const currentPriority = typeof task.priority === 'string' ? task.priority : task.priority?.level;
    if (editedPriority !== currentPriority) {
      updates.priority = editedPriority || null;
    }
    
    // Handle deadline
    const currentDeadlineFormatted = task.deadline 
      ? (() => {
          try {
            const date = new Date(task.deadline);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          } catch {
            return '';
          }
        })()
      : '';
    
    if (editedDeadline !== currentDeadlineFormatted) {
      if (editedDeadline) {
        // Convert datetime-local string to ISO string
        updates.deadline = new Date(editedDeadline).toISOString();
      } else {
        updates.deadline = null;
      }
    }

    // Only save if there are actual changes
    if (Object.keys(updates).length > 0) {
      await onSave(task.id, updates);
    }
    
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedName(task.name);
    setEditedDescription(task.description || '');
    setEditedCategoryId(task.category_id);
    setEditedPriority(
      typeof task.priority === 'string' ? task.priority : task.priority?.level
    );
    
    if (task.deadline) {
      try {
        const date = new Date(task.deadline);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setEditedDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
      } catch {
        setEditedDeadline('');
      }
    } else {
      setEditedDeadline('');
    }
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="lg" data-aot-mode={isAotMode}>
      <ModalOverlay />
      <ModalContent data-aot-mode={isAotMode}>
        <ModalHeader data-aot-mode={isAotMode}>Edit Task</ModalHeader>
        <ModalCloseButton data-aot-mode={isAotMode} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Task Name */}
            <FormControl isRequired>
              <FormLabel>Task Name</FormLabel>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter task name"
                data-aot-mode={isAotMode}
              />
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                rows={4}
                data-aot-mode={isAotMode}
              />
            </FormControl>

            {/* Category */}
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={editedCategoryId || ''}
                onChange={(e) => setEditedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Select category (optional)"
                data-aot-mode={isAotMode}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Priority */}
            <FormControl>
              <FormLabel>Priority</FormLabel>
              <Select
                value={editedPriority || ''}
                onChange={(e) => setEditedPriority(e.target.value || undefined)}
                placeholder="Select priority (optional)"
                data-aot-mode={isAotMode}
              >
                {priorities.map((priority) => (
                  <option key={priority.level} value={priority.level}>
                    <HStack spacing={2}>
                      <Box
                        w="12px"
                        h="12px"
                        borderRadius="full"
                        bg={priority.color}
                        display="inline-block"
                      />
                      <Text display="inline">{priority.level}</Text>
                    </HStack>
                  </option>
                ))}
              </Select>
              {/* Show color preview for selected priority */}
              {editedPriority && (
                <HStack mt={2} spacing={2}>
                  <Box
                    w="20px"
                    h="20px"
                    borderRadius="full"
                    bg={priorities.find((p) => p.level === editedPriority)?.color}
                  />
                  <Text fontSize="sm">
                    {priorities.find((p) => p.level === editedPriority)?.level}
                  </Text>
                </HStack>
              )}
            </FormControl>

            {/* Deadline */}
            <FormControl>
              <FormLabel>Deadline</FormLabel>
              <Input
                type="datetime-local"
                value={editedDeadline}
                onChange={(e) => setEditedDeadline(e.target.value)}
                data-aot-mode={isAotMode}
              />
              {editedDeadline && (
                <Button
                  size="sm"
                  mt={2}
                  onClick={() => setEditedDeadline('')}
                  data-aot-mode={isAotMode}
                >
                  Clear Deadline
                </Button>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter data-aot-mode={isAotMode}>
          <Button mr={3} onClick={handleCancel} data-aot-mode={isAotMode}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isDisabled={!editedName.trim()}
            data-aot-mode={isAotMode}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskEditModal;

