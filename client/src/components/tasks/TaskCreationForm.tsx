import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Button,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Category } from '../../services/tags';

interface PriorityColor {
  level: string;
  color: string;
}

interface TaskCreationFormProps {
  newTask: {
    name: string;
    description: string;
    category_id: number | undefined;
    priority: string | undefined;
    parent_id: number | null;
  };
  setNewTask: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      category_id: number | undefined;
      priority: string | undefined;
      parent_id: number | null;
    }>
  >;
  categories: Category[];
  priorities: PriorityColor[];
  onClose: () => void;
}

const TaskCreationForm: React.FC<TaskCreationFormProps> = ({
  newTask,
  setNewTask,
  categories,
  priorities,
  onClose,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel color="white">Task Name</FormLabel>
        <Input
          value={newTask.name}
          onChange={(e) =>
            setNewTask({ ...newTask, name: e.target.value })
          }
          placeholder="Enter task name"
          color="white"
        />
      </FormControl>

      <FormControl>
        <FormLabel color="white">Description</FormLabel>
        <Textarea
          value={newTask.description || ''}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          placeholder="Enter task description"
          resize="vertical"
          rows={3}
          color="white"
        />
      </FormControl>

      <FormControl>
        <FormLabel color="white">Category</FormLabel>
        <Select
          value={newTask.category_id || ''}
          onChange={(e) =>
            setNewTask({ ...newTask, category_id: e.target.value ? parseInt(e.target.value) : undefined })
          }
          color="white"
        >
          <option value="">No Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel color="white">Priority</FormLabel>
        {priorities.length > 0 ? (
          <Select
            value={newTask.priority || ''}
            onChange={(e) =>
              setNewTask({ ...newTask, priority: e.target.value || undefined })
            }
            color="white"
          >
            <option value="">No Priority</option>
            {priorities.map((p) => (
              <option key={p.level} value={p.level}>
                {p.level}
              </option>
            ))}
          </Select>
        ) : (
          <>
            <Text color="orange.300" mb={2}>
              No priority levels defined. Consider setting up priorities
              in the Tags section.
            </Text>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => {
                onClose();
                window.location.href = '/tags';
              }}
            >
              Set Up Priorities
            </Button>
          </>
        )}
      </FormControl>


    </VStack>
  );
};

export default TaskCreationForm;
