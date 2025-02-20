import { Box, Heading, Button, Grid, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, Textarea, Center, Text, Popover, PopoverTrigger, PopoverContent, PopoverBody, Portal } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { TaskCategory } from '../types/task';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { VStack } from '@chakra-ui/react';

const DailyTasksPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<string[]>([]);
  const [newTask, setNewTask] = useState({
    name: '',
    category: ''
  });

  // New state for category creation
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📋'
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const {
    dragState,
    handleDragStart,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(tasks, setTasks);

  const [isTaskMode, setIsTaskMode] = useState(true);

  const handleCreateTask = () => {
    if (newTask.name.trim()) {
      createTask({
        name: newTask.name,
        category: newTask.category
      });
      setNewTask({ name: '', category: categories[0] || '' });
      onClose();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewCategory(prev => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  const handleCreateCategory = () => {
    if (newCategory.name.trim()) {
      setCategories(prev => [...prev, newCategory.name]);
      setNewCategory({ name: '', description: '', icon: '📋' });
      onClose();
    }
  };

  return (
    <DashboardLayout>
      <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={6}>
          <Box flex="1">
            <Heading color="white" mb={4}>Today's Tasks</Heading>
          </Box>
          <Flex gap={2}>
            <Button
              leftIcon={<AddIcon />}
              variant="outline"
              size="sm"
              colorScheme="purple"
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
              colorScheme="purple"
              onClick={() => {
                setIsTaskMode(true);
                setNewTask({ name: '', category: categories[0] || '' });
                onOpen();
              }}
              ml={4}
            >
              Create New Task
            </Button>
          </Flex>
        </Flex>

        <Box flex="1" overflow="auto" px={4} pb={8}>
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">
            {isTaskMode ? 'Create New Task' : 'Create New Category'}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            {!isTaskMode ? (
              // Category Creation Form
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.300">Category Name</FormLabel>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    bg="gray.700"
                    color="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.300">Description (Optional)</FormLabel>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                    bg="gray.700"
                    color="white"
                    resize="vertical"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.300">Icon</FormLabel>
                  <Flex justify="center" align="center">
                    <Popover
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      placement="bottom"
                    >
                      <PopoverTrigger>
                        <Center
                          w="60px"
                          h="60px"
                          bg="gray.700"
                          borderRadius="full"
                          cursor="pointer"
                          _hover={{ transform: 'scale(1.1)', bg: 'gray.600' }}
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Text fontSize="3xl">{newCategory.icon}</Text>
                        </Center>
                      </PopoverTrigger>
                      <Portal>
                        <PopoverContent width="320px" maxHeight="400px" overflowY="auto" boxShadow="xl">
                          <PopoverBody p={0}>
                            <EmojiPicker onEmojiClick={handleEmojiClick} width="320px" height="400px" />
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
                  <FormLabel color="gray.300">Task Name</FormLabel>
                  <Input
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Enter task name"
                    bg="gray.700"
                    color="white"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.300">Category</FormLabel>
                  <Select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                    bg="gray.700"
                    color="white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="gray.300">
              Cancel
            </Button>
            <Button
              colorScheme="purple"
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