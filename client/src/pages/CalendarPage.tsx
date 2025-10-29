import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Grid,
  Text,
  IconButton,
  Select,
  Button,
  Badge
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import { useTheme } from '../contexts/ThemeContext';
import CalendarDayIcon from '../components/calendar/CalendarDayIcon';
import DashboardLayout from '../components/DashboardLayout';
import DayTasksModal from '../components/tasks/DayTasksModal';
import { tasksService, Task } from '../services/tasks';
import { tagsService, Category } from '../services/tags';
import './styles/CalendarPage.css'; // Import the CSS file

const CalendarPage = () => {
  const { isAotMode } = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, _setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<{level: string; color: string}[]>([]);
  const [statusLogoMap, setStatusLogoMap] = useState<Record<string, string>>({});
  
  // Fetch all tasks, categories, priorities, and status logos when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, categoriesData, prioritiesData, statusLogosData] = await Promise.all([
          tasksService.getTasks(),
          tagsService.getCategories(),
          tagsService.getPriorities(),
          tagsService.getStatusLogos()
        ]);
        setTasks(tasksData);
        setCategories(categoriesData);
        setPriorities(prioritiesData);
        setStatusLogoMap(statusLogosData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(event.target.value);
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(event.target.value);
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
  };

  // Get tasks for a specific day
  const getTasksForDay = async (date: Date) => {
    try {
      // Use local date for comparison
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const tasksForDay = tasks.filter(task => {
        // Split the date string and construct a local Date object
        const [year, month, day] = task.creation_date.split('-').map(Number);
        // Create date object in local timezone (month is 0-based in Date constructor)
        const taskDate = new Date(year, month - 1, day);
        
        return taskDate.getTime() === localDate.getTime();
      });
      
      setDayTasks(tasksForDay);
      return tasksForDay;
    } catch (error) {
      console.error('Error fetching tasks for day:', error);
      return [];
    }
  };
  
  // Handle day click to navigate to TasksPage
  const handleDayClick = (_day: number) => {
    // Just navigate to tasks page - the TasksPage will handle showing tasks for the selected date
    navigate('/tasks');
  };
  
  // Task CRUD operations
  const handleCreateTask = async (task: any) => {
    try {
      await tasksService.createTask(task);
      // Refresh tasks for the selected day
      if (selectedDate) {
        const updatedTasks = await getTasksForDay(selectedDate);
        setDayTasks(updatedTasks);
      }
      // Also refresh all tasks
      const allTasks = await tasksService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
  const handleDeleteTask = async (taskId: number) => {
    try {
      await tasksService.deleteTask(taskId);
      // Refresh tasks for the selected day
      if (selectedDate) {
        const updatedTasks = await getTasksForDay(selectedDate);
        setDayTasks(updatedTasks);
      }
      // Also refresh all tasks
      const allTasks = await tasksService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  const handleToggleTaskComplete = async (taskId: number) => {
    try {
      await tasksService.toggleTaskComplete(taskId, true);
      // Refresh tasks for the selected day
      if (selectedDate) {
        const updatedTasks = await getTasksForDay(selectedDate);
        setDayTasks(updatedTasks);
      }
      // Also refresh all tasks
      const allTasks = await tasksService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };
  
  const handleUpdateTaskName = async (taskId: number, newName: string) => {
    try {
      await tasksService.updateTaskName(taskId, newName);
      // Refresh tasks for the selected day
      if (selectedDate) {
        const updatedTasks = await getTasksForDay(selectedDate);
        setDayTasks(updatedTasks);
      }
      // Also refresh all tasks
      const allTasks = await tasksService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error updating task name:', error);
    }
  };
  
  // State to store task statistics for the current month
  const [monthStats, setMonthStats] = useState<Record<string, { totalTasks: number, completedTasks: number }>>({});

  // Fetch task statistics for the current month
  useEffect(() => {
    const fetchMonthStats = async () => {
      try {
        // Calculate first and last day of the current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month + 1, 0));
        
        // Format dates as YYYY-MM-DD using UTC components
        const startDate = `${firstDay.getUTCFullYear()}-${String(firstDay.getUTCMonth() + 1).padStart(2, '0')}-${String(firstDay.getUTCDate()).padStart(2, '0')}`;
        const endDate = `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, '0')}-${String(lastDay.getUTCDate()).padStart(2, '0')}`;
        
        // Fetch task statistics for the month
        const stats = await tasksService.getTaskStatsByDateRange(startDate, endDate);
        
        // Convert array of stats to a map keyed by date string
        const statsMap: Record<string, { totalTasks: number, completedTasks: number }> = {};
        stats.forEach(dayStat => {
          // Create a UTC date object for comparison
          const [year, month, day] = dayStat.date.split('-').map(Number);
          const statDate = new Date(Date.UTC(year, month - 1, day));
          
          // Only add to statsMap if the month and year match current view
          if (statDate.getUTCMonth() === currentDate.getMonth() && 
              statDate.getUTCFullYear() === currentDate.getFullYear()) {
            const day = statDate.getUTCDate();
            statsMap[day] = {
              totalTasks: dayStat.total_tasks,
              completedTasks: dayStat.completed_tasks
            };
          }
        });
        
        setMonthStats(statsMap);
      } catch (error) {
        console.error('Error fetching month statistics:', error);
      }
    };
    
    fetchMonthStats();
  }, [currentDate]); // Re-fetch when month/year changes

  // Get task stats for a specific day
  const getTaskStatsForDay = (day: number) => {
    // Check if we have stats for this day
    if (monthStats[day]) {
      return {
        totalTasks: monthStats[day].totalTasks,
        completedTasks: monthStats[day].completedTasks
      };
    }
    // Return empty stats if no data for this day
    return { totalTasks: 0, completedTasks: 0 };
  };

  // Get task count for a specific day
  const getTaskCountForDay = (day: number) => {
    return getTaskStatsForDay(day).totalTasks;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Fill empty cells before the first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <Box className="calendar-day-empty" key={`empty-${i}`} />
      );
    }

    // Fill actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        new Date().toDateString() ===
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      const taskCount = getTaskCountForDay(day);

      days.push(
        <Box
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <Text className="calendar-day-number">{day}</Text>
          {taskCount > 0 && (
            <Badge 
              colorScheme="blue" 
              borderRadius="full" 
              px="2" 
              fontSize="0.8em"
            >
              {taskCount}
            </Badge>
          )}
          <CalendarDayIcon 
            {...getTaskStatsForDay(day)}
            statusLogoMap={statusLogoMap}
          />
        </Box>
      );
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentYear = new Date().getFullYear();
  // Example: Show +/- 5 years from current year
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <DashboardLayout>
      {/* Full-page Box */}
      <Box className="calendar-page-wrapper" data-aot-mode={isAotMode ? "true" : "false"}>
        {/* Flex column that takes full height */}
        <Flex direction="column" height="100%" p={4}>
          
          {/* Header (Month/Year/Buttons) */}
          <Flex className="calendar-flex-header" mb={4}>
            <Flex className="calendar-flex-left">
              <Heading className="calendar-heading">
              📅 {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Heading>
              <Select
                className="calendar-select-month"
                value={currentDate.getMonth()}
                onChange={handleMonthChange}
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </Select>
              <Select
                className="calendar-select-year"
                value={currentDate.getFullYear()}
                onChange={handleYearChange}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </Flex>

            <Flex className="calendar-flex-right">
              <Button
                className="calendar-button-today"
                onClick={() => setCurrentDate(new Date())}
                leftIcon={<CalendarIcon />}
              >
                Today
              </Button>
              <IconButton
                aria-label="Previous month"
                icon={<ChevronLeftIcon />}
                className="calendar-icon-button"
                onClick={handlePreviousMonth}
              />
              <IconButton
                aria-label="Next month"
                icon={<ChevronRightIcon />}
                className="calendar-icon-button"
                onClick={handleNextMonth}
              />
            </Flex>
          </Flex>

          {/* Calendar Grid (fills remaining space) */}
          <Grid className="calendar-grid" flex="1">
            {dayNames.map((day) => (
              <Box key={day} className="calendar-day-name">
                {day}
              </Box>
            ))}
            {renderCalendarDays()}
          </Grid>
          
          {/* Day Tasks Modal */}
          {selectedDate && (
            <DayTasksModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              selectedDate={selectedDate}
              tasks={dayTasks}
              categories={categories}
              priorities={priorities}
              onCreateTask={handleCreateTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onUpdateTaskName={handleUpdateTaskName}
            />
          )}
        </Flex>
      </Box>
    </DashboardLayout>
  );
};

export default CalendarPage;
