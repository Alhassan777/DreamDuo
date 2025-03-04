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
import DashboardLayout from '../components/DashboardLayout';
import DayTasksModal from '../components/tasks/DayTasksModal';
import { tasksService, Task } from '../services/tasks';
import { tagsService, Category } from '../services/tags';
import './styles/calendarPage.css'; // Import the CSS file

const CalendarPage = () => {
  const { isAotMode } = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<{level: string; color: string}[]>([]);
  
  // Fetch all tasks, categories, and priorities when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, categoriesData, prioritiesData] = await Promise.all([
          tasksService.getTasks(),
          tagsService.getCategories(),
          tagsService.getPriorities()
        ]);
        setTasks(tasksData);
        setCategories(categoriesData);
        setPriorities(prioritiesData);
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
      // Filter tasks by the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tasksForDay = tasks.filter(task => {
        const taskDate = new Date(task.creation_date);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      });
      
      setDayTasks(tasksForDay);
      return tasksForDay;
    } catch (error) {
      console.error('Error fetching tasks for day:', error);
      return [];
    }
  };
  
  // Handle day click to navigate to DailyTasksPage with the selected date
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format date as YYYY-MM-DD for the URL
    const formattedDate = clickedDate.toISOString().split('T')[0];
    // Navigate to DailyTasksPage with the selected date using React Router
    navigate(`/daily-tasks/${formattedDate}`);
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
  
  // Count tasks for each day in the current month
  const getTaskCountForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.creation_date);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    }).length;
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
