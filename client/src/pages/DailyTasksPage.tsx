import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Grid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import TaskCreationForm from '../components/tasks/TaskCreationForm';
import CategoryCreationForm from '../components/tasks/CategoryCreationForm';
import { useTasks } from '../hooks/useTasks';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTheme } from '../contexts/ThemeContext';
import { tagsService, Category } from '../services/tags';
import './styles/DailyTask.css';

/** PriorityColor is used to render & pick priority options. */
interface PriorityColor {
  level: string;
  color: string;
}

const DailyTasksPage: React.FC = () => {
  const toast = useToast();
  const { isAotMode } = useTheme();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // From your custom tasks hook
  const {
    tasks,
    createTask,
    deleteTask,
    toggleCollapse,
    addSubtask,
    toggleComplete,
    toggleSubtaskComplete,
    updateTaskName,
    updateSubtaskName,
    setTasks,
  } = useTasks();

  // Category & Priority arrays
  const [categories, setCategories] = useState<Category[]>([]); // Changed from string[] to Category[]
  const [priorities, setPriorities] = useState<PriorityColor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // For new category creation
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📋',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Handle emoji selection for category creation
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewCategory(prev => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  // For creating a new *root-level* task
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    category_id: undefined as number | undefined,
    priority: undefined as string | undefined,
    parent_id: null as number | null,
  });

  // Decide whether the modal is for a Task or Category
  const [isTaskMode, setIsTaskMode] = useState(true);

  // Drag-and-drop from your custom hook
  const { dragState, handleDragStart, handleDrop } = useDragAndDrop(tasks, setTasks);

  // Load categories & priorities
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const [fetchedCats, fetchedPriorities] = await Promise.all([
          tagsService.getCategories(),
          tagsService.getPriorities(),
        ]);

        setCategories(fetchedCats); // Store the full Category objects
        setPriorities(fetchedPriorities);

        if (fetchedCats.length === 0) {
          toast({
            title: 'No Categories Found',
            description: 'Add categories to better organize your tasks',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
        if (fetchedPriorities.length === 0) {
          toast({
            title: 'No Priority Levels Set',
            description: 'Set up priority levels to manage task importance',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error fetching categories/priorities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories & priorities',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, [toast]);

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) return;
    setIsLoading(true);

    try {
      await createTask({
        name: newTask.name,
        description: newTask.description,
        category_id: newTask.category_id,
        priority: newTask.priority,
        parent_id: null // root-level
      });
      
      setNewTask({
        name: '',
        description: '',
        category_id: undefined,
        priority: '',
        parent_id: null
      });
      
      toast({
        title: 'Task Created',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      onClose();
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

  /**
   * Create a new Category
   */
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    setIsLoading(true);

    try {
      const createdCat = await tagsService.createCategory({
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon,
      });

      setCategories((prev) => [...prev, createdCat]);
      setNewCategory({ name: '', description: '', icon: '📋' });

      toast({
        title: 'Category Created',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete Task or Subtask, then show a toast
   */
  const handleDeleteTask = (taskId: number, subtaskId?: number) => {
    deleteTask(taskId, subtaskId)
      .then(() => {
        toast({
          title: 'Task Deleted',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error('Error deleting task:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete task',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  return (
    <DashboardLayout>
      <Box
        className={`daily-tasks-page ${isAotMode ? 'aot-mode' : ''}`}
        data-aot-mode={isAotMode}
      >
        {/* HEADER */}
        <Flex justify="space-between" align="center" position="relative" zIndex={1}>
          <Box flex="1">
            <Heading className="daily-tasks-title" data-aot-mode={isAotMode}>
              ☑️ Today&apos;s Tasks
            </Heading>
          </Box>

          <Flex>
            <Button
              leftIcon={<AddIcon />}
              onClick={() => {
                setIsTaskMode(false);
                setNewCategory({ name: '', description: '', icon: '📋' });
                onOpen();
              }}
            >
              Add Category
            </Button>
            <Button
              leftIcon={<AddIcon />}
              ml={4}
              onClick={() => {
                setIsTaskMode(true);
                setNewTask({
                  name: '',
                  description: '',
                  category_id: categories.length > 0 ? categories[0].id : undefined,
                  priority: '',
                  parent_id: null
                });
                onOpen();
              }}
            >
              Create New Task
            </Button>
          </Flex>
        </Flex>

        {/* MAIN CONTENT */}
        <Box className="daily-tasks-container" flex="1" overflow="auto" mt={6}>
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                // This 'task' prop is correct for <TaskCard>, not for <TaskCreationForm>.
                task={task}
                onDelete={handleDeleteTask}
                onToggleCollapse={toggleCollapse}
                onAddSubtask={addSubtask}
                onToggleComplete={toggleComplete}
                onToggleSubtaskComplete={toggleSubtaskComplete}
                onUpdateName={updateTaskName}
                onUpdateSubtaskName={updateSubtaskName}
                // Drag
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                dragState={dragState}
              />
            ))}
          </Grid>
        </Box>
      </Box>

      {/* MODAL for either new Task or new Category */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent data-aot-mode={isAotMode}>
          <ModalHeader data-aot-mode={isAotMode}>
            {isTaskMode ? 'Create New Task' : 'Create New Category'}
          </ModalHeader>
          <ModalCloseButton data-aot-mode={isAotMode} />
          <ModalBody>
            {isTaskMode ? (
              <TaskCreationForm
                newTask={newTask}
                setNewTask={setNewTask}
                categories={categories}
                priorities={priorities}
                onClose={onClose}
              />
            ) : (
              <CategoryCreationForm
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                handleEmojiClick={handleEmojiClick}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button
              onClick={isTaskMode ? handleCreateTask : handleCreateCategory}
              isLoading={isLoading}
              isDisabled={
                (isTaskMode && !newTask.name.trim()) ||
                (!isTaskMode && !newCategory.name.trim())
              }
            >
              {isTaskMode ? 'Create Task' : 'Create Category'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default DailyTasksPage;
