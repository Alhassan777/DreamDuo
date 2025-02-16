import { Box, Heading, Button, Grid, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TaskCard from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { TASK_CATEGORIES, TaskCategory } from '../types/task';

const DailyTasksPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newTask, setNewTask] = useState({
    name: '',
    category: TASK_CATEGORIES[0]
  });

  const {
    tasks,
    createTask,
    deleteTask,
    toggleCollapse,
    addSubtask,
    toggleComplete,
    toggleSubtaskComplete
  } = useTasks();

  const handleCreateTask = () => {
    if (newTask.name.trim()) {
      createTask({
        name: newTask.name,
        category: newTask.category
      });
      setNewTask({ name: '', category: TASK_CATEGORIES[0] });
      onClose();
    }
  };

  return (
    <DashboardLayout>
      <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color="white">Today's Tasks</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            onClick={onOpen}
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
                {TASK_CATEGORIES.map(category => (
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