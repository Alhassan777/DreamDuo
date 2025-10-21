import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { EmojiClickData } from 'emoji-picker-react';

import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import TaskCreationForm from '../components/tasks/TaskCreationForm';
import CategoryCreationForm from '../components/tasks/CategoryCreationForm';
import ViewToggleButton, { ViewMode } from '../components/ViewToggleButton';
import TaskCanvasView from '../components/canvas/TaskCanvasView';
import { useTasks } from '../hooks/useTasks';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTheme } from '../contexts/ThemeContext';
import { tagsService, Category } from '../services/tags';
import { tasksService, Task } from '../services/tasks';
import './styles/DailyTask.css';
import { TaskCreateRequest } from '../services/tasks';

/** PriorityColor is used to render & pick priority options. */
interface PriorityColor {
  level: string;
  color: string;
}

const DailyTasksPage: React.FC = () => {
  const toast = useToast();
  const { isAotMode } = useTheme();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  
  // Parse the date from URL or use today's date
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (date) {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    const today = new Date();
    const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    navigate(`/daily-tasks/${formattedDate}`);
    return new Date();
  });

  // Update selectedDate when URL parameter changes
  useEffect(() => {
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      if (!isNaN(localDate.getTime())) {
        setSelectedDate(localDate);
      }
    }
  }, [date]);

  // From your custom tasks hook - pass the selected date as filter
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
  } = useTasks(selectedDate.toISOString().split('T')[0]);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
  const [newTask, setNewTask] = useState<TaskCreateRequest>({
    name: '',
    description: '',
    category_id: undefined,
    priority: undefined,
    parent_id: null,
    creation_date: ''
  });

  // Decide whether the modal is for a Task or Category
  const [isTaskMode, setIsTaskMode] = useState(true);

  // Drag-and-drop from your custom hook
  const { dragState, handleDragStart, handleDrop } = useDragAndDrop(tasks, setTasks);

  // Load categories and priorities
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
  }, [toast]); // Remove selectedDate from dependency array

  // Load tasks when selectedDate changes
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const fetchedTasks = await tasksService.getTasksByDate(selectedDate.toISOString().split('T')[0]);
        setTasks(fetchedTasks); // Initialize tasks when date changes
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [selectedDate, toast, setTasks]); // Only fetch tasks when date changes

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) return;
    setIsLoading(true);
  
    try {
      // Create the date string in YYYY-MM-DD format for the selected date
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
      // Make the API call
      await createTask({
        name: newTask.name,
        description: newTask.description,
        category_id: newTask.category_id,
        priority: newTask.priority,
        deadline: newTask.deadline,
        parent_id: newTask.parent_id,
        creation_date: dateStr
      });

      // Fetch the updated task list
      const fetchedTasks = await tasksService.getTasksByDate(selectedDate.toISOString().split('T')[0]);
      setTasks(fetchedTasks);
  
      setNewTask({
        name: '',
        description: '',
        category_id: undefined,
        priority: '',
        parent_id: null,
        deadline: undefined
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
  const handleDeleteTask = async (taskId: number, subtaskId?: number) => {
    try {
      await deleteTask(taskId, subtaskId);
      
      // Fetch the updated task list
      const fetchedTasks = await tasksService.getTasksByDate(selectedDate.toISOString().split('T')[0]);
      setTasks(fetchedTasks);
      
      toast({
        title: 'Task Deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
              ☑️ {date ? (
                <>
                  Tasks for {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </>
              ) : (
                "Today's Tasks"
              )}
            </Heading>
            {date && (
              <Button 
                className='back-to-today'
                data-aot-mode={isAotMode}
                onClick={() => {
                  const today = new Date();
                  const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                  navigate(`/daily-tasks/${formattedDate}`);
                }}
              >
                Back to Today's Tasks
              </Button>
            )}
          </Box>

          <Flex>
            <Button
              leftIcon={<AddIcon />}
              onClick={() => {
                setIsTaskMode(false);
                setNewCategory({ name: '', description: '', icon: '📋' });
                onOpen();
              }}
              className={`secondary-button ${isAotMode ? 'aot-mode' : ''}`}
              data-aot-mode={isAotMode}
            >
              Add Category
            </Button>
            <ViewToggleButton viewMode={viewMode} onToggle={setViewMode} />
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
                  parent_id: null,
                  deadline: undefined,
                  // Format the creation date using local timezone
                  creation_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                });
                onOpen();
              }}
              className={`primary-button ${isAotMode ? 'aot-mode' : ''}`}
              data-aot-mode={isAotMode}
            >
              Create New Task
            </Button>
          </Flex>
        </Flex>

        {/* MAIN CONTENT */}
        <Box className="daily-tasks-container" flex="1" overflow="auto" mt={6}>
          {viewMode === 'list' ? (
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
          ) : (
            <TaskCanvasView tasks={tasks} setTasks={setTasks} />
          )}
        </Box>
      </Box>

      {/* MODAL for either new Task or new Category */}
      <Modal isOpen={isOpen} onClose={onClose} data-aot-mode={isAotMode}>
        <ModalOverlay />
        <ModalContent className="daily-tasks-modal" data-aot-mode={isAotMode}>
          <ModalHeader className="daily-tasks-modal-header" data-aot-mode={isAotMode}>
            {isTaskMode ? 'Create New Task' : 'Create New Category'}
          </ModalHeader>
          <ModalCloseButton className="daily-tasks-modal-close" data-aot-mode={isAotMode} />
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
            <Button
              onClick={onClose}
              mr={3}
              className="cancel-button"
              data-aot-mode={isAotMode}
            >
              Cancel
            </Button>
            <Button
              onClick={isTaskMode ? handleCreateTask : handleCreateCategory}
              isLoading={isLoading}
              isDisabled={
                (isTaskMode && !newTask.name.trim()) ||
                (!isTaskMode && !newCategory.name.trim())
              }
              className={`${isTaskMode ? 'create-button-primary' : 'create-button-secondary'} ${isAotMode ? 'aot-mode' : ''}`}
              data-aot-mode={isAotMode}
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
