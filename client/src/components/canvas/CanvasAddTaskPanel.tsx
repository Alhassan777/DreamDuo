import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Collapse,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Category } from '../../services/tags';
import { TaskCreateRequest } from '../../services/tasks';

interface PriorityColor {
  level: string;
  color: string;
}

interface CanvasAddTaskPanelProps {
  categories: Category[];
  priorities: PriorityColor[];
  anchorDate: Date;
  onCreateTask: (task: TaskCreateRequest) => Promise<void>;
}

const CanvasAddTaskPanel: React.FC<CanvasAddTaskPanelProps> = ({
  categories,
  priorities,
  anchorDate,
  onCreateTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState<TaskCreateRequest>({
    name: '',
    description: '',
    category_id: undefined,
    priority: undefined,
    parent_id: null,
    creation_date: '',
  });
  const toast = useToast();

  const handleCreate = async () => {
    if (!newTask.name.trim()) {
      toast({
        title: 'Task name required',
        description: 'Please enter a task name',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const dateStr = `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, '0')}-${String(anchorDate.getDate()).padStart(2, '0')}`;
      
      await onCreateTask({
        ...newTask,
        creation_date: dateStr,
      });

      // Reset form
      setNewTask({
        name: '',
        description: '',
        category_id: undefined,
        priority: undefined,
        parent_id: null,
        creation_date: '',
      });
      
      setIsExpanded(false);
      
      toast({
        title: 'Task Created',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      bg="var(--color-card-background)"
      p={4}
      borderRadius="var(--border-radius-lg)"
      w="full"
      color="var(--color-text)"
      border="1px solid"
      borderColor="var(--color-border)"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="sm">Add New Task</Heading>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            color="var(--color-text)"
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{
              bg: 'var(--color-hover-overlay)'
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </HStack>

        <Collapse in={isExpanded} animateOpacity>
          <VStack spacing={3} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="sm" color="var(--color-text)">Task Name</FormLabel>
              <Input
                value={newTask.name}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter task name"
                size="sm"
                bg="var(--color-background)"
                borderColor="var(--color-border)"
                color="var(--color-text)"
                _hover={{ borderColor: 'var(--color-primary)' }}
                _focus={{ borderColor: 'var(--color-focus-ring)', boxShadow: `0 0 0 1px var(--color-focus-ring)` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" color="var(--color-text)">Category</FormLabel>
              <Select
                value={newTask.category_id ?? ''}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    category_id: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  }))
                }
                size="sm"
                bg="var(--color-background)"
                borderColor="var(--color-border)"
                color="var(--color-text)"
                _hover={{ borderColor: 'var(--color-primary)' }}
                _focus={{ borderColor: 'var(--color-focus-ring)', boxShadow: `0 0 0 1px var(--color-focus-ring)` }}
                sx={{
                  '& option': {
                    bg: 'var(--color-card-background)',
                    color: 'var(--color-text)',
                  }
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--color-card-background)', color: 'inherit' }}>No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ backgroundColor: 'var(--color-card-background)', color: 'inherit' }}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" color="var(--color-text)">Priority</FormLabel>
              <Select
                value={newTask.priority ?? ''}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    priority: e.target.value || undefined,
                  }))
                }
                size="sm"
                bg="var(--color-background)"
                borderColor="var(--color-border)"
                color="var(--color-text)"
                _hover={{ borderColor: 'var(--color-primary)' }}
                _focus={{ borderColor: 'var(--color-focus-ring)', boxShadow: `0 0 0 1px var(--color-focus-ring)` }}
                sx={{
                  '& option': {
                    bg: 'var(--color-card-background)',
                    color: 'var(--color-text)',
                  }
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--color-card-background)', color: 'inherit' }}>No Priority</option>
                {priorities.map((p) => (
                  <option key={p.level} value={p.level} style={{ backgroundColor: 'var(--color-card-background)', color: 'inherit' }}>
                    {p.level}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" color="var(--color-text)">Deadline</FormLabel>
              <Input
                type="datetime-local"
                value={newTask.deadline ?? ''}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    deadline: e.target.value || undefined,
                  }))
                }
                size="sm"
                bg="var(--color-background)"
                borderColor="var(--color-border)"
                color="var(--color-text)"
                _hover={{ borderColor: 'var(--color-primary)' }}
                _focus={{ borderColor: 'var(--color-focus-ring)', boxShadow: `0 0 0 1px var(--color-focus-ring)` }}
              />
            </FormControl>

            <Button
              onClick={handleCreate}
              isLoading={isLoading}
              isDisabled={!newTask.name.trim()}
              leftIcon={<AddIcon />}
              size="sm"
              bg="var(--color-button-primary)"
              color="var(--color-button-primary-text)"
              borderRadius="var(--border-radius-md)"
              transition={`all var(--animation-duration) var(--animation-timing)`}
              _hover={{ 
                bg: 'var(--color-button-primary-hover)',
                transform: 'translateY(-1px)',
                boxShadow: 'var(--shadow-md)'
              }}
              _active={{ bg: 'var(--color-active-state)' }}
            >
              Create Task
            </Button>
          </VStack>
        </Collapse>

        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            leftIcon={<AddIcon />}
            size="sm"
            variant="outline"
            borderColor="var(--color-border)"
            color="var(--color-text)"
            borderRadius="var(--border-radius-md)"
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{ 
              borderColor: 'var(--color-primary)',
              bg: 'var(--color-hover-overlay)',
              transform: 'translateY(-1px)'
            }}
          >
            Quick Add
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default CanvasAddTaskPanel;

