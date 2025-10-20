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
import DashboardFilters from '../components/dashboard/DashboardFilters';
import { useTheme } from '../contexts/ThemeContext';
import { tasksService } from '../services/tasks';
import { tagsService, Category } from '../services/tags';
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

interface PriorityColor {
  level: string;
  color: string;
}

const DashboardPage: React.FC = () => {
  const { isAotMode } = useTheme();
  const toast = useToast();
  
  // Filter state
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<PriorityColor[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedPriorityLevels, setSelectedPriorityLevels] = useState<string[]>([]);
  
  const calculateStreak = (data: any[]) => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // Sort data by date in descending order (most recent first)
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Check if today has any tasks and if they're all completed
    const todayData = sortedData.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });
  
    // If today has tasks but they're not all completed, streak is 0
    if (todayData && todayData.total_tasks > 0 && todayData.total_tasks !== todayData.completed_tasks) {
      return 0;
    }
    
    // Start checking from yesterday (or today if no tasks today)
    let lastCheckedDate = today;
    if (!todayData || todayData.total_tasks === 0) {
      // If no tasks today, start from today
    } else {
      // If tasks today and all completed, include today in streak
      currentStreak = 1;
      // Move to yesterday for next check
      lastCheckedDate = new Date(today);
      lastCheckedDate.setDate(lastCheckedDate.getDate() - 1);
    }
    
    // Calculate streak by checking consecutive days backwards
    for (let i = 0; i < sortedData.length; i++) {
      const day = sortedData[i];
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      // Skip today as we've already handled it
      if (dayDate.getTime() === today.getTime()) {
        continue;
      }
      
      // Check if this day is consecutive with the last checked date
      const expectedDate = new Date(lastCheckedDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
      
      if (dayDate.getTime() !== expectedDate.getTime()) {
        // Not consecutive, break the streak
        break;
      }
      
      // Check if all tasks were completed for this day
      if (day.total_tasks === 0 || day.total_tasks !== day.completed_tasks) {
        break;
      }
      
      // This day counts toward the streak
      currentStreak++;
      lastCheckedDate = dayDate;
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
      }
    };
    fetchTags();
  }, []);

  // Refresh stats every minute to keep streak updated
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

        // Format today's date for daily stats
        const todayFormatted = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

        // Get monthly data for the streak and monthly view
        const monthlyData = await tasksService.getTaskStatsByDateRange(startDate, endDate);
        
        // Get today's data for daily goal progress
        const todayData = monthlyData.find(day => day.date === todayFormatted) || {
          date: todayFormatted,
          total_tasks: 0,
          completed_tasks: 0,
          completion_percentage: 0
        };
        
        // Create a proper weekly data structure with all days of the week
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyStats = daysOfWeek.map(day => ({
          day,
          assigned: 0,
          completed: 0
        }));
        
        // Calculate the start of the current week (Monday)
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert to 0 = Monday, ..., 6 = Sunday
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Filter monthlyData to get the current week (Monday-Sunday)
        const currentWeekData = monthlyData.filter(entry => {
          const [year, month, dayOfMonth] = entry.date.split('-').map(Number);
          const entryDate = new Date(year, month - 1, dayOfMonth);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= startOfWeek && entryDate <= endOfWeek;
        });
        
        // Map the filtered data to the correct weekday
        currentWeekData.forEach(day => {
          const [year, month, dayOfMonth] = day.date.split('-').map(Number);
          const date = new Date(year, month - 1, dayOfMonth);
          const weekdayIndex = date.getDay(); // Get local weekday
          // Convert Sunday (0) to 6, and other days to 0-5
          const adjustedIndex = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
          
          weeklyStats[adjustedIndex].assigned += day.total_tasks;
          weeklyStats[adjustedIndex].completed += day.completed_tasks;
        });

        setStats({
          // Use today's data for daily goal progress
          totalTasks: todayData.total_tasks,
          completedTasks: todayData.completed_tasks,
          // Keep using monthly data for streaks
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

          {/* Dashboard Filters */}
          <Box mt={6}>
            <DashboardFilters
              categories={categories}
              priorities={priorities}
              selectedCategoryIds={selectedCategoryIds}
              selectedPriorityLevels={selectedPriorityLevels}
              onCategoryChange={setSelectedCategoryIds}
              onPriorityChange={setSelectedPriorityLevels}
              onClearAll={() => {
                setSelectedCategoryIds([]);
                setSelectedPriorityLevels([]);
              }}
            />
          </Box>

          <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={6} mt={8}>
            {/* Daily Progress Card */}
            <Box className="productivity-card" data-aot-mode={isAotMode} maxW="400px">
              <Text className="stats-heading" data-aot-mode={isAotMode}>
                Today's Goal Progress
              </Text>
              <Flex justify="center" align="center" className="completion-circle" data-aot-mode={isAotMode}>
                <CircularProgress
                  value={completionPercentage}
                  size="120px"
                  thickness="8px"
                  color={isAotMode ? (stats.completedTasks === stats.totalTasks ? 'var(--aot-accent)' : 'var(--aot-primary)') : (stats.completedTasks === stats.totalTasks ? 'var(--dashboard-chart-purple)' : '#3182ce')}
                >
                  <CircularProgressLabel>
                    {stats.completedTasks}/{stats.totalTasks}
                  </CircularProgressLabel>
                </CircularProgress>
              </Flex>
              <Flex align="center" justify="center" className="streak-info" data-aot-mode={isAotMode}>
                <Text mr={2}>Current Streak: {stats.streak} days</Text>
                {stats.streak > 0 && <span role="img" aria-label="flame">🔥</span>}
              </Flex>
              <Flex align="center" justify="center" className="streak-info" data-aot-mode={isAotMode}>
                <Text mr={2}>Longest Streak: {stats.longestStreak} days</Text>
                {stats.longestStreak > 0 && <span role="img" aria-label="flame">🔥</span>}
              </Flex>
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
                  {viewType === 'bar' ? 'Detailed View' : 'Summary View'}
                </Button>
              </Flex>
              
              <Box className="weekly-chart">
                {stats.weeklyStats.map((day) => (
                  <Flex key={day.day} align="center" mb={2} width="100%">
                    <Text className="chart-label" data-aot-mode={isAotMode} width="60px">
                      {day.day}
                    </Text>
                    
                    {viewType === 'bar' ? (
                      <Box flex="1" position="relative" ml={2}>
                        <Box
                          className="chart-bar-background"
                          bg={isAotMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(66, 153, 225, 0.3)'}
                          w="100%"
                          h="20px"
                          borderRadius="4px"
                        >
                          <Box
                            className="chart-bar"
                            bg={isAotMode
                              ? (day.completed === day.assigned ? 'var(--aot-accent)' : 'rgba(255, 59, 48, 0.7)')
                              : (day.completed === day.assigned ? 'var(--dashboard-chart-purple)' : '#3182ce')
                            }
                            w={`${(day.assigned > 0 ? (day.completed / day.assigned) * 100 : 0)}%`}
                            h="20px"
                            borderRadius="4px"
                            position="absolute"
                            top="0"
                            left="0"
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box flex="1" position="relative" ml={2}>
                        <Box
                          className="chart-bar-assigned"
                          bg={isAotMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(66, 153, 225, 0.3)'}
                          w="100%"
                          h="20px"
                          borderRadius="4px"
                        >
                          <Box
                            className="chart-bar-completed"
                            bg={isAotMode ? (day.completed === day.assigned ? 'var(--aot-accent)' : 'rgba(255, 59, 48, 0.7)') : (day.completed === day.assigned ? 'var(--dashboard-chart-purple)' : '#3182ce')}

                            w={`${(day.completed / day.assigned) * 100}%`}
                            h="20px"
                            borderRadius="4px"
                            position="absolute"
                            top="0"
                            left="0"
                          />
                        </Box>
                      </Box>
                    )}
                    
                    <Text ml={4} width="70px" textAlign="right">
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
            
            <Grid templateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={4} className="monthly-chart" maxW="100%" overflowX="auto" p={4}>
              {stats.monthlyStats.map((day) => (
                <Box key={day.day} p={3} textAlign="center" className="monthly-day-box" data-aot-mode={isAotMode} borderRadius="md" boxShadow="sm">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>{day.day}</Text>
                  
                  {viewType === 'bar' ? (
                    <CircularProgress 
                      value={day.assigned > 0 ? (day.completed / day.assigned) * 100 : 0}
                      size="50px"
                      thickness="8px"
                      color={isAotMode ? (day.completed === day.assigned ? 'var(--aot-accent)' : 'var(--aot-primary)') : (day.completed === day.assigned ? 'var(--dashboard-chart-purple)' : '#3182ce')}
                    >
                      <CircularProgressLabel fontSize="xs">
                        {day.completed}
                      </CircularProgressLabel>
                    </CircularProgress>
                  ) : (
                    <Flex direction="column" align="center" mt={2}>
                      <Text fontSize="sm" mb={2}>{day.completed}/{day.assigned}</Text>
                      <Box 
                        w="100%" 
                        h="8px" 
                        bg={isAotMode ? 'var(--aot-primary)' : 'rgba(66, 153, 225, 0.3)'}
                        borderRadius="full"
                      >
                        <Box 
                          w={`${day.assigned > 0 ? (day.completed / day.assigned) * 100 : 0}%`} 
                          h="8px"
                          bg={isAotMode ? (day.completed === day.assigned ? 'var(--aot-accent)' : 'rgba(255, 59, 48, 0.7)') : (day.completed === day.assigned ? 'var(--dashboard-chart-purple)' : '#3182ce')}
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