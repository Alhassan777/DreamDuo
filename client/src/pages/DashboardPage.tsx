import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  CircularProgress,
  CircularProgressLabel,
  useToast,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  useDisclosure
} from '@chakra-ui/react';
import DashboardLayout from '../components/DashboardLayout';
import { useTheme } from '../contexts/ThemeContext';
import { tasksService } from '../services/tasks';
import './styles/DashboardPage.css';

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  streak: number;
  longestStreak: number;
  weeklyStats: {
    day: string;
    completed: number;
  }[];
}

const DashboardPage: React.FC = () => {
  const { isAotMode } = useTheme();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    streak: 0,
    longestStreak: 0,
    weeklyStats: []
  });
  const [dailyGoal, setDailyGoal] = useState(5);
  const [newGoal, setNewGoal] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await tasksService.getTaskStats();
        setStats(response);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching task stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard statistics',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };

    fetchStats();
  }, [toast]);

  const handleUpdateGoal = async () => {
    try {
      await tasksService.updateDailyGoal(newGoal);
      setDailyGoal(newGoal);
      onClose();
      toast({
        title: 'Success',
        description: 'Daily goal updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error updating daily goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update daily goal',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const completionPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <DashboardLayout>
      <Box className="dashboard-page" data-aot-mode={isAotMode}>
        <Container maxW="container.xl" className="dashboard-content">
          <Heading className="stats-heading" data-aot-mode={isAotMode}>
            📊 Your Productivity Dashboard
          </Heading>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mt={8}>
            {/* Daily Progress Card */}
            <Box className="productivity-card" data-aot-mode={isAotMode}>
              <Text className="stats-heading" data-aot-mode={isAotMode}>
                Daily Goal Progress
              </Text>
              <Box className="completion-circle" data-aot-mode={isAotMode}>
                <CircularProgress
                  value={(stats.completedTasks / dailyGoal) * 100}
                  size="120px"
                  thickness="8px"
                  color={isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-accent)'}
                >
                  <CircularProgressLabel>
                    {stats.completedTasks}/{dailyGoal}
                  </CircularProgressLabel>
                </CircularProgress>
              </Box>
              <Text className="streak-info" data-aot-mode={isAotMode}>
                Current Streak: {stats.streak} days
              </Text>
              <Text className="streak-info" data-aot-mode={isAotMode}>
                Longest Streak: {stats.longestStreak} days
              </Text>
              <Button
                className="edit-goal-button"
                data-aot-mode={isAotMode}
                onClick={onOpen}
              >
                Edit Goal
              </Button>
            </Box>

            {/* Weekly Stats Card */}
            <Box className="productivity-card" data-aot-mode={isAotMode}>
              <Text className="stats-heading" data-aot-mode={isAotMode}>
                Weekly Task Distribution
              </Text>
              <Box className="weekly-chart">
                {stats.weeklyStats.map((day) => (
                  <Flex key={day.day} align="center" mb={2}>
                    <Text className="chart-label" data-aot-mode={isAotMode}>
                      {day.day}
                    </Text>
                    <Box
                      className="chart-bar"
                      bg={isAotMode ? 'var(--aot-primary)' : 'var(--dashboard-chart-blue)'}
                      w={`${(day.completed / Math.max(...stats.weeklyStats.map(d => d.completed))) * 100}%`}
                    />
                    <Text ml={2}>{day.completed}</Text>
                  </Flex>
                ))}
              </Box>
            </Box>
          </Grid>
        </Container>

        {/* Edit Goal Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg={isAotMode ? 'var(--aot-background)' : 'var(--dashboard-bg)'}>
            <ModalHeader color={isAotMode ? 'var(--aot-text)' : 'var(--dashboard-text)'}>
              Edit Daily Goal
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
                min={1}
                max={20}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme={isAotMode ? 'red' : 'blue'}
                onClick={handleUpdateGoal}
              >
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </DashboardLayout>
  );
};

export default DashboardPage;