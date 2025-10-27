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
  Text,
  VStack,
  CircularProgress,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { EmojiClickData } from 'emoji-picker-react';

import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import TaskCreationForm from '../components/tasks/TaskCreationForm';
import CategoryCreationForm from '../components/tasks/CategoryCreationForm';
import TimeScopeSelector from '../components/tasks/TimeScopeSelector';
import SearchBar from '../components/tasks/SearchBar';
import FilterPanel from '../components/tasks/FilterPanel';
import FilterChips from '../components/tasks/FilterChips';
import ViewToggleButton, { ViewMode } from '../components/ViewToggleButton';
import TaskCanvasView from '../components/canvas/TaskCanvasView';
import AddTaskCard from '../components/tasks/AddTaskCard';

import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useTheme } from '../contexts/ThemeContext';
import { tagsService, Category } from '../services/tags';
import { tasksService, Task, TaskCreateRequest } from '../services/tasks';
import './styles/Tasks.css';

/** PriorityColor is used to render & pick priority options. */
interface PriorityColor {
  level: string;
  color: string;
}

const TasksPage: React.FC = () => {
  const toast = useToast();
  const { isAotMode } = useTheme();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Use task filters hook
  const {
    filters,
    activeFilterCount,
    setTimeScope,
    setAnchorDate,
    setSearchQuery,
    setCategoryIds,
    setPriorityLevels,
    setDeadlineBefore,
    setDeadlineAfter,
    setCompletionStatus,
    clearAllFilters,
    clearFilter,
  } = useTaskFilters();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<PriorityColor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // For new category creation
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📋',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  // Drag-and-drop
  const { dragState, handleDragStart, handleDrop } = useDragAndDrop(tasks, setTasks);

  // Handle emoji selection for category creation
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewCategory(prev => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  // Load categories and priorities
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const [fetchedCats, fetchedPriorities] = await Promise.all([
          tagsService.getCategories(),
          tagsService.getPriorities(),
        ]);

        setCategories(fetchedCats);
        setPriorities(fetchedPriorities);
      } catch (error) {
        console.error('Error fetching categories/priorities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories & priorities',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchTags();
  }, [toast]);

  // Fetch tasks function (memoized for passing to components)
  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Format anchor date
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      
      // Prepare filter parameters
      const params: any = {
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      };

      if (filters.searchQuery.trim()) {
        params.searchQuery = filters.searchQuery.trim();
      }
      if (filters.categoryIds.length > 0) {
        params.categoryIds = filters.categoryIds;
      }
      if (filters.priorityLevels.length > 0) {
        params.priorityLevels = filters.priorityLevels;
      }
      if (filters.deadlineBefore) {
        params.deadlineBefore = filters.deadlineBefore.toISOString();
      }
      if (filters.deadlineAfter) {
        params.deadlineAfter = filters.deadlineAfter.toISOString();
      }
      // Always send completion status
      params.completionStatus = filters.completionStatus;

      const fetchedTasks = await tasksService.searchTasksWithFilters(params);
      setTasks(fetchedTasks);
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
  }, [
    filters.timeScope,
    filters.anchorDate.getTime(), // Use timestamp to detect date changes
    filters.searchQuery,
    filters.categoryIds.join(','), // Convert array to string for comparison
    filters.priorityLevels.join(','), // Convert array to string for comparison
    filters.deadlineBefore?.getTime(),
    filters.deadlineAfter?.getTime(),
    filters.completionStatus,
    toast
  ]);

  // Fetch tasks whenever filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData?: TaskCreateRequest) => {
    const taskToCreate = taskData || newTask;
    if (!taskToCreate.name.trim()) return;
    setIsLoading(true);
  
    try {
      // Use the current anchor date for task creation
      const dateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
    
      await tasksService.createTask({
        name: taskToCreate.name,
        description: taskToCreate.description,
        category_id: taskToCreate.category_id,
        priority: taskToCreate.priority,
        deadline: taskToCreate.deadline,
        parent_id: taskToCreate.parent_id,
        creation_date: taskToCreate.creation_date || dateStr
      });

      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
  
      // Only reset newTask and close modal if called from modal (no taskData parameter)
      if (!taskData) {
        setNewTask({
          name: '',
          description: '',
          category_id: undefined,
          priority: '',
          parent_id: null,
          deadline: undefined
        });
        onClose();
      }
  
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

  const handleDeleteTask = async (taskId: number, subtaskId?: number) => {
    try {
      const idToDelete = subtaskId !== undefined ? subtaskId : taskId;
      await tasksService.deleteTask(idToDelete);
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
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

  const toggleCollapse = (taskId: number) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, collapsed: !task.collapsed };
        }
        if (task.children) {
          return {
            ...task,
            children: task.children.map(child => {
              if (child.id === taskId) {
                return { ...child, collapsed: !child.collapsed };
              }
              return child;
            })
          };
        }
        return task;
      });
    });
  };

  const addSubtask = async (taskId: number, parentSubtaskId?: number) => {
    try {
      const parentId = parentSubtaskId !== undefined ? parentSubtaskId : taskId;
      await tasksService.addSubtask(parentId, { name: 'New Subtask' });
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleComplete = async (taskId: number) => {
    try {
      await tasksService.toggleTaskComplete(taskId, false);
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const toggleSubtaskComplete = async (_taskId: number, subtaskId: number) => {
    try {
      await tasksService.toggleTaskComplete(subtaskId, false);
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
    }
  };

  const updateTaskName = async (taskId: number, newName: string) => {
    try {
      await tasksService.updateTask(taskId, { name: newName });
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error updating task name:', error);
    }
  };

  const updateSubtaskName = async (_taskId: number, subtaskId: number, newName: string) => {
    try {
      await tasksService.updateTask(subtaskId, { name: newName });
      
      // Refresh tasks
      const anchorDateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
      const fetchedTasks = await tasksService.searchTasksWithFilters({
        timeScope: filters.timeScope,
        anchorDate: anchorDateStr,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error updating subtask name:', error);
    }
  };

  return (
    <DashboardLayout>
      <Box
        className={`tasks-page ${isAotMode ? 'aot-mode' : ''}`}
        data-aot-mode={isAotMode}
      >
        {/* HEADER - Organized in 4 clear rows */}
        <VStack 
          spacing={6} 
          align="stretch" 
          position="relative" 
          zIndex={10} 
          className="tasks-header"
          px={{ base: 4, md: 6 }}
          py={6}
          mb={4}
        >
          {/* Row 1: Title + Action Buttons */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Heading 
              className="tasks-title" 
              data-aot-mode={isAotMode}
              fontSize={{ base: "2xl", md: "3xl" }}
              color={isAotMode ? '#c89a5a' : 'white'}
            >
              📋 Tasks
            </Heading>

            <Flex gap={3}>
              <Button
                leftIcon={<AddIcon />}
                onClick={() => {
                  setIsTaskMode(false);
                  setNewCategory({ name: '', description: '', icon: '📋' });
                  onOpen();
                }}
                size="md"
                bg="var(--color-button-secondary)"
                color="var(--color-button-secondary-text)"
                borderWidth="1px"
                borderColor="var(--color-border)"
                borderRadius="var(--border-radius-md)"
                transition={`all var(--animation-duration) var(--animation-timing)`}
                _hover={{
                  bg: 'var(--color-button-secondary-hover)',
                  borderColor: 'var(--color-primary)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Add Category
              </Button>
              <ViewToggleButton viewMode={viewMode} onToggle={setViewMode} />
            </Flex>
          </Flex>

          {/* Row 2: Time Scope Selector */}
          <Box>
            <TimeScopeSelector
              timeScope={filters.timeScope}
              anchorDate={filters.anchorDate}
              onTimeScopeChange={setTimeScope}
              onAnchorDateChange={setAnchorDate}
            />
          </Box>

          {/* Row 3: Search + Filters */}
          <Flex gap={4} flexWrap="wrap" align="center" className="tasks-controls">
            <SearchBar
              searchQuery={filters.searchQuery}
              onSearchChange={setSearchQuery}
            />
            <FilterPanel
              categories={categories}
              priorities={priorities}
              selectedCategoryIds={filters.categoryIds}
              selectedPriorityLevels={filters.priorityLevels}
              deadlineBefore={filters.deadlineBefore}
              deadlineAfter={filters.deadlineAfter}
              completionStatus={filters.completionStatus}
              onCategoryChange={setCategoryIds}
              onPriorityChange={setPriorityLevels}
              onDeadlineBeforeChange={setDeadlineBefore}
              onDeadlineAfterChange={setDeadlineAfter}
              onCompletionStatusChange={setCompletionStatus}
              onClearAll={clearAllFilters}
              activeFilterCount={activeFilterCount}
            />
          </Flex>

          {/* Row 4: Active Filter Chips */}
          <FilterChips
            searchQuery={filters.searchQuery}
            selectedCategoryIds={filters.categoryIds}
            selectedPriorityLevels={filters.priorityLevels}
            deadlineBefore={filters.deadlineBefore}
            deadlineAfter={filters.deadlineAfter}
            completionStatus={filters.completionStatus}
            categories={categories}
            priorities={priorities}
            onRemoveSearch={() => clearFilter('search')}
            onRemoveCategory={(id) => clearFilter('category', id)}
            onRemovePriority={(priority) => clearFilter('priority', priority)}
            onRemoveDeadlineBefore={() => clearFilter('deadlineBefore')}
            onRemoveDeadlineAfter={() => clearFilter('deadlineAfter')}
            onRemoveCompletionStatus={() => clearFilter('completionStatus')}
            onClearAll={clearAllFilters}
          />
        </VStack>

        {/* MAIN CONTENT */}
        <Box className="tasks-container" flex="1" overflow="auto" px={{ base: 2, md: 4 }}>
          {isLoading ? (
            <VStack spacing={4} py={12}>
              <CircularProgress 
                isIndeterminate 
                color={isAotMode ? '#dca253' : 'blue.500'}
                size="60px"
                thickness="4px"
              />
              <Text 
                textAlign="center" 
                fontSize={{ base: "md", md: "lg" }}
                color={isAotMode ? '#c89a5a' : 'white'}
                fontWeight="medium"
              >
                Loading tasks...
              </Text>
            </VStack>
          ) : tasks.length === 0 && activeFilterCount > 0 ? (
            <VStack 
              className="tasks-empty-state" 
              data-aot-mode={isAotMode} 
              spacing={6}
              py={12}
              px={6}
              mx="auto"
              maxW="600px"
            >
              <Box
                fontSize="6xl"
                opacity={0.6}
                mb={2}
              >
                📭
              </Box>
              <VStack spacing={2}>
                <Text 
                  fontSize={{ base: "xl", md: "2xl" }} 
                  fontWeight="bold"
                  color={isAotMode ? '#dca253' : 'white'}
                  textAlign="center"
                >
                  No tasks match your filters for this period
                </Text>
                <Text 
                  fontSize={{ base: "sm", md: "md" }}
                  color={isAotMode ? 'rgba(200, 154, 90, 0.7)' : 'rgba(255, 255, 255, 0.6)'}
                  textAlign="center"
                >
                  Try adjusting your filters or time scope
                </Text>
              </VStack>
              <Flex gap={3} flexWrap="wrap" justify="center" mt={4}>
                <Button
                  size="md"
                  onClick={clearAllFilters}
                  variant="outline"
                  borderColor={isAotMode ? '#dca253' : 'blue.400'}
                  color={isAotMode ? '#dca253' : 'blue.400'}
                  _hover={{
                    bg: isAotMode ? 'rgba(220, 162, 83, 0.1)' : 'rgba(66, 153, 225, 0.1)',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                >
                  Clear All Filters
                </Button>
              </Flex>
            </VStack>
          ) : viewMode === 'canvas' ? (
            <TaskCanvasView 
              tasks={tasks} 
              setTasks={setTasks}
              categories={categories}
              priorities={priorities}
              anchorDate={filters.anchorDate}
              onCreateTask={handleCreateTask}
              onRefresh={fetchTasks}
            />
          ) : (
            <Grid 
              templateColumns={{
                base: "1fr",              // Mobile: 1 column
                md: "repeat(2, 1fr)",     // Tablet: 2 columns
                lg: "repeat(3, 1fr)"      // Desktop: 3 columns
              }} 
              gap={{ base: 4, md: 5, lg: 6 }}
              px={{ base: 4, md: 6 }}
              py={4}
            >
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteTask}
                  onToggleCollapse={toggleCollapse}
                  onAddSubtask={addSubtask}
                  onToggleComplete={toggleComplete}
                  onToggleSubtaskComplete={toggleSubtaskComplete}
                  onUpdateName={updateTaskName}
                  onUpdateSubtaskName={updateSubtaskName}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  dragState={dragState}
                />
              ))}
              <AddTaskCard
                onClick={() => {
                  setIsTaskMode(true);
                  const dateStr = `${filters.anchorDate.getFullYear()}-${String(filters.anchorDate.getMonth() + 1).padStart(2, '0')}-${String(filters.anchorDate.getDate()).padStart(2, '0')}`;
                  setNewTask({
                    name: '',
                    description: '',
                    category_id: categories.length > 0 ? categories[0].id : undefined,
                    priority: '',
                    parent_id: null,
                    deadline: undefined,
                    creation_date: dateStr
                  });
                  onOpen();
                }}
              />
            </Grid>
          )}
        </Box>
      </Box>

      {/* MODAL for either new Task or new Category */}
      <Modal isOpen={isOpen} onClose={onClose} data-aot-mode={isAotMode}>
        <ModalOverlay />
        <ModalContent className="tasks-modal" data-aot-mode={isAotMode}>
          <ModalHeader className="tasks-modal-header" data-aot-mode={isAotMode}>
            {isTaskMode ? 'Create New Task' : 'Create New Category'}
          </ModalHeader>
          <ModalCloseButton className="tasks-modal-close" data-aot-mode={isAotMode} />
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
              onClick={isTaskMode ? () => handleCreateTask() : handleCreateCategory}
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

export default TasksPage;

