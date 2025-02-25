import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Grid,
  Text,
  IconButton,
  Select,
  Button
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import { useTheme } from '../contexts/ThemeContext';
import DashboardLayout from '../components/DashboardLayout';
import './styles/calendarPage.css'; // Import the CSS file

const CalendarPage = () => {
  const { isAotMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

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

      days.push(
        <Box
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''}`}
          onClick={() => {
            console.log(
              `Clicked on ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`
            );
          }}
        >
          <Text className="calendar-day-number">{day}</Text>
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
        </Flex>
      </Box>
    </DashboardLayout>
  );
};

export default CalendarPage;
