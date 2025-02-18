import { Box, Heading, Button, Grid, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { TaskCategory } from '../types/task';
import TaskCategoriesSection from '../components/tags/TaskCategoriesSection';

const DailyTasksPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<string[]>([]);
  const [newTask, setNewTask] = useState({
    name: '',
    category: ''
  });

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

  // Update local tasks state when tasks from useTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const {
    dragState,
    handleDragStart,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(tasks, setTasks);


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

  return (
    <DashboardLayout>
      <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={6}>
          <Box flex="1">
            <Heading color="white" mb={4}>Today's Tasks</Heading>
            <TaskCategoriesSection categories={categories} setCategories={setCategories} />
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            onClick={onOpen}
            ml={4}
          >
            Create New Task
          </Button>
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
          <ModalHeader color="white">Create New Task</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
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
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="gray.300">
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleCreateTask}>
              Create Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default DailyTasksPage;