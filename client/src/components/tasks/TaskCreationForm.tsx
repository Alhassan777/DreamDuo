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
import { useTheme } from '../../contexts/ThemeContext';
import './TaskCreationForm.css';

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
  const { isAotMode } = useTheme();
  
  return (
    <VStack spacing={4} align="stretch" data-aot-mode={isAotMode}>
      <FormControl isRequired>
        <FormLabel color="white">Task Name</FormLabel>
        <Input
          value={newTask.name}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter task name"
          className="task-creation-form-input"
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
          className="task-creation-form-textarea"
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
          className="task-creation-form-select"
          sx={{
            option: {
              bg: isAotMode ? 'rgba(139, 69, 19, 0.3)' : 'var(--color-surface)',
              color: isAotMode ? 'var(--aot-text)' : 'var(--color-text)',
            },
          }}
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
            className="task-creation-form-select"
            sx={{
              option: {
                bg: isAotMode ? 'rgba(139, 69, 19, 0.3)' : 'var(--color-surface)',
                color: isAotMode ? 'var(--aot-text)' : 'var(--color-text)',
              },
            }}
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
          className="task-creation-form-input"
        />
      </FormControl>

      {/* If you want to show a date picker or handle creation_date, 
          you can add another FormControl here. */}
    </VStack>
  );
};

export default TaskCreationForm;
