import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  useToast,
  IconButton,
  Checkbox,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Task } from '../../services/tasks';
import { Category } from '../../services/tags';

interface DayTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  tasks: Task[];
  categories: Category[];
  priorities: { level: string; color: string }[];
  onCreateTask: (task: any) => Promise<void>;
  onDeleteTask: (taskId: number) => void;
  onToggleTaskComplete: (taskId: number) => void;
  onUpdateTaskName: (taskId: number, newName: string) => void;
}

const DayTasksModal: React.FC<DayTasksModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  tasks,
  categories,
  priorities,
  onCreateTask,
  onDeleteTask,
  onToggleTaskComplete,
  onUpdateTaskName,
}) => {
  const [newTask, setNewTask] = React.useState({
    name: '',
    category_id: undefined as number | undefined,
    priority: undefined as string | undefined,
  });
  const [editingTask, setEditingTask] = React.useState<{ id: number; name: string } | null>(null);
  const toast = useToast();

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) return;

    try {
      await onCreateTask({
        name: newTask.name,
        category_id: newTask.category_id,
        priority: newTask.priority,
        parent_id: null,
      });

      setNewTask({
        name: '',
        category_id: undefined,
        priority: undefined,
      });

      toast({
        title: 'Task Created',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateTask = async (taskId: number) => {
    if (!editingTask || !editingTask.name.trim()) return;

    try {
      await onUpdateTaskName(taskId, editingTask.name);
      setEditingTask(null);

      toast({
        title: 'Task Updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Tasks for {selectedDate.toLocaleDateString()}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* New Task Form */}
            <HStack>
              <Input
                placeholder="New task name"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              />
              <Select
                placeholder="Category"
                value={newTask.category_id}
                onChange={(e) => setNewTask({ ...newTask, category_id: Number(e.target.value) })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="Priority"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                {priorities.map((priority) => (
                  <option key={priority.level} value={priority.level}>
                    {priority.level}
                  </option>
                ))}
              </Select>
              <Button colorScheme="blue" onClick={handleCreateTask}>
                Add
              </Button>
            </HStack>

            {/* Tasks List */}
            {tasks.map((task) => (
              <HStack key={task.id} spacing={4}>
                <Checkbox
                  isChecked={task.completed}
                  onChange={() => onToggleTaskComplete(task.id)}
                />
                {editingTask?.id === task.id ? (
                  <Input
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    onBlur={() => handleUpdateTask(task.id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateTask(task.id)}
                    autoFocus
                  />
                ) : (
                  <Text flex="1" textDecoration={task.completed ? 'line-through' : 'none'}>
                    {task.name}
                  </Text>
                )}
                <Text fontSize="sm" color="gray.500">
                  {task.category && `${task.categoryIcon} ${task.category}`}
                </Text>
                {task.priority && (
                  <Text fontSize="sm" color="gray.500">
                    Priority: {task.priority}
                  </Text>
                )}
                <IconButton
                  aria-label="Edit task"
                  icon={<EditIcon />}
                  size="sm"
                  onClick={() => setEditingTask({ id: task.id, name: task.name })}
                />
                <IconButton
                  aria-label="Delete task"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => onDeleteTask(task.id)}
                />
              </HStack>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DayTasksModal;