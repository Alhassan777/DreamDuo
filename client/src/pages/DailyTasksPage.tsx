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
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Center,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  VStack
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTheme } from '../contexts/ThemeContext';
import { TaskCategory } from '../types/task';
import './styles/DailyTask.css';

const DailyTasksPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAotMode } = useTheme();

  // Categories stored in local state
  const [categories, setCategories] = useState<string[]>([]);

  // For creating a new task
  const [newTask, setNewTask] = useState({
    name: '',
    category: '',
    priority: ''
  });

  // For creating a new category
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📋'
  });

  // Show/hide the emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Task management from custom hook
  const {
    tasks: initialTasks,
    createTask,
    deleteTask,
    toggleCollapse,
    addSubtask,
    toggleComplete,
    toggleSubtaskComplete,
    updateTaskName,
    updateSubtaskName
  } = useTasks();

  const [tasks, setTasks] = useState(initialTasks);

  // Whenever initialTasks updates (e.g., from context or storage), sync local tasks
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Drag-and-drop management from custom hook
  const { dragState, handleDragStart, handleDrop, handleDragEnd } = useDragAndDrop(tasks, setTasks);

  // Toggle between creating a Task or a Category in the modal
  const [isTaskMode, setIsTaskMode] = useState(true);

  const handleCreateTask = () => {
    if (newTask.name.trim()) {
      createTask({
        name: newTask.name,
        category: newTask.category,
        priority: newTask.priority
      });
      // Reset the task form, defaulting to the first category if any
      setNewTask({
        name: '',
        category: categories[0] || '',
        priority: ''
      });
      onClose();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewCategory((prev) => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  const handleCreateCategory = () => {
    if (newCategory.name.trim()) {
      setCategories((prev) => [...prev, newCategory.name]);
      setNewCategory({
        name: '',
        description: '',
        icon: '📋'
      });
      onClose();
    }
  };

  return (
    <DashboardLayout>
      {/* Outer container with AOT class toggling */}
      <Box
        className={`daily-tasks-page ${isAotMode ? 'aot-mode' : ''}`}
        data-aot-mode={isAotMode}
      >
        <Flex
          className="daily-tasks-header"
          justify="space-between"
          align="center"
          position="relative"
          zIndex={1}
        >
          <Box flex="1">
            <Heading
              className="daily-tasks-title"
              data-aot-mode={isAotMode}
            >
              ☑️ Today&apos;s Tasks
            </Heading>
          </Box>

          {/* Action buttons */}
          <Flex className="daily-tasks-buttons">
            <Button
              className="secondary-button"
              data-aot-mode={isAotMode}
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
              className="primary-button"
              data-aot-mode={isAotMode}
              leftIcon={<AddIcon />}
              onClick={() => {
                setIsTaskMode(true);
                setNewTask({ name: '', category: categories[0] || '', priority: '' });
                onOpen();
              }}
            >
              Create New Task
            </Button>
          </Flex>
        </Flex>

        {/* Task cards grid */}
        <Box className="daily-tasks-container" flex="1" overflow="auto">
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={deleteTask}
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
          </Grid>
        </Box>
      </Box>

      {/* Creation Modal: Reused for either new task or new category */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          className="daily-tasks-modal"
          data-aot-mode={isAotMode}
        >
          <ModalHeader
            className="daily-tasks-modal-header"
            data-aot-mode={isAotMode}
          >
            {isTaskMode ? 'Create New Task' : 'Create New Category'}
          </ModalHeader>

          <ModalCloseButton
            className="daily-tasks-modal-close"
            data-aot-mode={isAotMode}
          />

          <ModalBody>
            {!isTaskMode ? (
              // Category Creation Form
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel className="daily-tasks-form-label">
                    Category Name
                  </FormLabel>
                  <Input
                    className="daily-tasks-form-input"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter category name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel className="daily-tasks-form-label">
                    Description (Optional)
                  </FormLabel>
                  <Textarea
                    className="daily-tasks-form-input"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Enter category description"
                    resize="vertical"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel className="daily-tasks-form-label">Icon</FormLabel>
                  <Flex justify="center" align="center">
                    <Popover
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      placement="bottom"
                    >
                      <PopoverTrigger>
                        <Center
                          className="daily-tasks-emoji-picker"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Text fontSize="3xl">{newCategory.icon}</Text>
                        </Center>
                      </PopoverTrigger>

                      <Portal>
                        <PopoverContent
                          width="320px"
                          maxHeight="400px"
                          overflowY="auto"
                          boxShadow="xl"
                        >
                          <PopoverBody p={0}>
                            <EmojiPicker
                              onEmojiClick={handleEmojiClick}
                              width="320px"
                              height="400px"
                            />
                          </PopoverBody>
                        </PopoverContent>
                      </Portal>
                    </Popover>
                  </Flex>
                </FormControl>
              </VStack>
            ) : (
              // Task Creation Form
              <>
                <FormControl mb={4}>
                  <FormLabel className="daily-tasks-form-label">Task Name</FormLabel>
                  <Input
                    className="daily-tasks-form-input"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Enter task name"
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel className="daily-tasks-form-label">Category</FormLabel>
                  <Select
                    className="daily-tasks-form-input"
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask({ ...newTask, category: e.target.value as TaskCategory })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel className="daily-tasks-form-label">Priority</FormLabel>
                  <Select
                    className="daily-tasks-form-input"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                  >
                    <option value="">No Priority</option>
                    <option value="red.500">High</option>
                    <option value="yellow.500">Medium</option>
                    <option value="green.500">Low</option>
                  </Select>
                </FormControl>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button className="daily-tasks-modal-cancel" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="primary-button"
              data-aot-mode={isAotMode}
              onClick={isTaskMode ? handleCreateTask : handleCreateCategory}
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
