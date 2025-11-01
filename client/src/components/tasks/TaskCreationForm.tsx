import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Button,
  VStack,
  Textarea,
} from '@chakra-ui/react';
import { Category } from '../../services/tags';
import { TaskCreateRequest } from '../../services/tasks';

interface PriorityColor {
  level: string;
  color: string;
}

interface TaskCreationFormProps {
  /** Matches the TaskCreateRequest shape exactly */
  newTask: TaskCreateRequest;
  /** State setter also uses the same TaskCreateRequest type */
  setNewTask: React.Dispatch<React.SetStateAction<TaskCreateRequest>>;
  categories: Category[];
  priorities: PriorityColor[];
  /** Called when user cancels or finishes creating a task */
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
            setNewTask((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter task name"
          color="white"
        />
      </FormControl>

      <FormControl>
        <FormLabel color="white">Description</FormLabel>
        <Textarea
          value={newTask.description ?? ''}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
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
          value={newTask.category_id ?? ''}
          onChange={(e) =>
            setNewTask((prev) => ({
              ...prev,
              category_id: e.target.value
                ? parseInt(e.target.value, 10)
                : undefined,
            }))
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
            value={newTask.priority ?? ''}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                priority: e.target.value || undefined,
              }))
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

      <FormControl>
        <FormLabel color="white">Deadline</FormLabel>
        <Input
          type="datetime-local"
          value={newTask.deadline ?? ''}
          onChange={(e) =>
            setNewTask((prev) => ({
              ...prev,
              deadline: e.target.value || undefined,
            }))
          }
          color="white"
        />
      </FormControl>

      {/* If you want to show a date picker or handle creation_date, 
          you can add another FormControl here. */}
    </VStack>
  );
};

export default TaskCreationForm;
