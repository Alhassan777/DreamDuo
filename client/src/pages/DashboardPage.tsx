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
  Input
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
    assigned: number;
    completed: number;
  }[];
  monthlyStats: {
    day: string;
    assigned: number;
    completed: number;
  }[];
}

const DashboardPage: React.FC = () => {
  const { isAotMode } = useTheme();
  const toast = useToast();
  const calculateStreak = (data: any[]) => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort data by date in descending order
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const day of sortedData) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      // Break if we find a day that's not fully completed or if there's a gap in dates
      if (day.total_tasks === 0 || day.total_tasks !== day.completed_tasks) {
        break;
      }
      currentStreak++;
    }

    return currentStreak;
  };

  const calculateLongestStreak = (data: any[]) => {
    let longestStreak = 0;
    let currentStreak = 0;

    // Sort data by date in ascending order
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const day of sortedData) {
      if (day.total_tasks > 0 && day.total_tasks === day.completed_tasks) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  };

  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    streak: 0,
    longestStreak: 0,
    weeklyStats: [],
    monthlyStats: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'bar' | 'compound'>('bar');
  
  const toggleViewType = () => {
    setViewType(viewType === 'bar' ? 'compound' : 'bar');
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get current date for calculating ranges
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Format dates for API using UTC
        const startDate = `${firstDayOfMonth.getUTCFullYear()}-${String(firstDayOfMonth.getUTCMonth() + 1).padStart(2, '0')}-${String(firstDayOfMonth.getUTCDate()).padStart(2, '0')}`;
        const endDate = `${lastDayOfMonth.getUTCFullYear()}-${String(lastDayOfMonth.getUTCMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getUTCDate()).padStart(2, '0')}`;

        const monthlyData = await tasksService.getTaskStatsByDateRange(startDate, endDate);
        
        // Create a proper weekly data structure with all days of the week
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyStats = daysOfWeek.map(day => ({
          day,
          assigned: 0,
          completed: 0
        }));
        
        // Get the last 7 days of data based on actual date range
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6); // 6 days back + today = 7 days
        
        // Filter monthlyData to just the last 7 calendar days
        const recentData = monthlyData.filter(entry => {
          const [year, month, dayOfMonth] = entry.date.split('-').map(Number);
          const entryDate = new Date(year, month - 1, dayOfMonth);
          // Set time to midnight for proper date comparison
          entryDate.setHours(0, 0, 0, 0);
          const startDate = new Date(sevenDaysAgo);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        // Map the filtered data to the correct weekday
        recentData.forEach(day => {
          const [year, month, dayOfMonth] = day.date.split('-').map(Number);
          const date = new Date(year, month - 1, dayOfMonth);
          const weekdayIndex = date.getDay(); // Get local weekday
          // Convert Sunday (0) to 6, and other days to 0-5
          const adjustedIndex = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
          
          weeklyStats[adjustedIndex].assigned += day.total_tasks;
          weeklyStats[adjustedIndex].completed += day.completed_tasks;
        });
        
        // If we don't have data for all 7 days, we might need to request it
        if (recentData.length < 7) {
          console.log(`Only found ${recentData.length} days of data in the last 7 days window`);
        }

        setStats({
          totalTasks: monthlyData.reduce((sum, day) => sum + day.total_tasks, 0),
          completedTasks: monthlyData.reduce((sum, day) => sum + day.completed_tasks, 0),
          streak: calculateStreak(monthlyData),
          longestStreak: calculateLongestStreak(monthlyData),
          weeklyStats,
          monthlyStats: monthlyData.map(day => ({
            day: String(new Date(Date.UTC(Number(day.date.split('-')[0]), Number(day.date.split('-')[1]) - 1, Number(day.date.split('-')[2]))).getUTCDate()),
            assigned: day.total_tasks,
            completed: day.completed_tasks
          }))
        });
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
                  value={completionPercentage}
                  size="120px"
                  thickness="8px"
                  color={isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-accent)'}
                >
                  <CircularProgressLabel>
                    {stats.completedTasks}/{stats.totalTasks}
                  </CircularProgressLabel>
                </CircularProgress>
              </Box>
              <Text className="streak-info" data-aot-mode={isAotMode}>
                Current Streak: {stats.streak} days
              </Text>
              <Text className="streak-info" data-aot-mode={isAotMode}>
                Longest Streak: {stats.longestStreak} days
              </Text>

            </Box>

            {/* Weekly Stats Card */}
            <Box className="productivity-card" data-aot-mode={isAotMode}>
              <Flex justify="space-between" align="center" mb={4}>
                <Text className="stats-heading" data-aot-mode={isAotMode}>
                  Weekly Task Distribution
                </Text>
                <Button 
                  size="sm" 
                  onClick={toggleViewType}
                  colorScheme={isAotMode ? 'red' : 'blue'}
                  variant="outline"
                  data-aot-mode={isAotMode}
                >
                  {viewType === 'bar' ? 'Show Compound' : 'Show Simple'}
                </Button>
              </Flex>
              
              <Box className="weekly-chart">
                {stats.weeklyStats.map((day) => (
                  <Flex key={day.day} align="center" mb={2}>
                    <Text className="chart-label" data-aot-mode={isAotMode}>
                      {day.day}
                    </Text>
                    
                    {viewType === 'bar' ? (
                      /* Simple bar chart showing completed tasks */
                      <Box
                        className="chart-bar"
                        bg={isAotMode ? 'var(--aot-primary)' : 'var(--dashboard-chart-blue)'}
                        w={`${(day.completed / Math.max(...stats.weeklyStats.map(d => d.completed || 1))) * 100}%`}
                      />
                    ) : (
                      /* Compound bar chart showing assigned vs completed */
                      <Flex w="100%" h="20px" align="center">
                        <Box
                          className="chart-bar-assigned"
                          bg={isAotMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(66, 153, 225, 0.3)'}
                          w={`${(day.assigned / Math.max(...stats.weeklyStats.map(d => d.assigned || 1))) * 100}%`}
                          h="20px"
                          position="relative"
                        >
                          <Box
                            className="chart-bar-completed"
                            bg={isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-chart-blue)'}
                            w={`${(day.completed / day.assigned) * 100}%`}
                            h="20px"
                            position="absolute"
                            top="0"
                            left="0"
                          />
                        </Box>
                      </Flex>
                    )}
                    
                    <Text ml={2}>
                      {viewType === 'bar' ? 
                        day.completed : 
                        `${day.completed}/${day.assigned}`
                      }
                    </Text>
                  </Flex>
                ))}
              </Box>
            </Box>
          </Grid>
          
          {/* Monthly Stats Card */}
          <Box className="productivity-card" mt={6} data-aot-mode={isAotMode}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text className="stats-heading" data-aot-mode={isAotMode}>
                Monthly Task Distribution
              </Text>
            </Flex>
            
            <Grid templateColumns="repeat(7, 1fr)" gap={2} className="monthly-chart">
              {stats.monthlyStats.map((day) => (
                <Box key={day.day} p={2} textAlign="center" className="monthly-day-box" data-aot-mode={isAotMode}>
                  <Text fontSize="sm" fontWeight="bold">{day.day}</Text>
                  
                  {viewType === 'bar' ? (
                    <CircularProgress 
                      value={day.assigned > 0 ? (day.completed / day.assigned) * 100 : 0}
                      size="40px"
                      thickness="8px"
                      color={isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-accent)'}
                    >
                      <CircularProgressLabel fontSize="xs">
                        {day.completed}
                      </CircularProgressLabel>
                    </CircularProgress>
                  ) : (
                    <Flex direction="column" align="center">
                      <Text fontSize="xs">{day.completed}/{day.assigned}</Text>
                      <Box 
                        w="100%" 
                        h="8px" 
                        bg={isAotMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(66, 153, 225, 0.3)'}
                        borderRadius="full"
                        mt={1}
                      >
                        <Box 
                          w={`${day.assigned > 0 ? (day.completed / day.assigned) * 100 : 0}%`} 
                          h="8px"
                          bg={isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-chart-blue)'}
                          borderRadius="full"
                        />
                      </Box>
                    </Flex>
                  )}
                </Box>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default DashboardPage;