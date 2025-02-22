import { Box, Container, Heading, Grid, Text, IconButton, Flex, useColorModeValue, Select, Button } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

const CalendarPage = () => {
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <Box
          key={`empty-${i}`}
          bg="gray.800"
          borderWidth="1px"
          borderColor="gray.700"
          p={4}
          minH="120px"
        />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <Box
          key={day}
          bg="gray.800"
          borderWidth="1px"
          borderColor={isToday ? "purple.500" : "gray.700"}
          p={4}
          minH="120px"
          cursor="pointer"
          position="relative"
          transition="all 0.2s"
          _hover={{
            borderColor: "purple.500",
            transform: "scale(1.02)",
            zIndex: 1
          }}
          onClick={() => {
            // Will be implemented when backend is ready
            console.log(`Clicked on ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`);
          }}
        >
          <Text
            position="absolute"
            top={2}
            right={2}
            fontSize="sm"
            fontWeight={isToday ? "bold" : "normal"}
            color={isToday ? "purple.500" : "gray.400"}
          >
            {day}
          </Text>
        </Box>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate array of years (e.g., from 2020 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={8}>
            <Flex align="center" gap={4}>
              <Heading color="white" mr={4}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Heading>
              <Select
                value={currentDate.getMonth()}
                onChange={handleMonthChange}
                width="150px"
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "purple.500" }}
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </Select>
              <Select
                value={currentDate.getFullYear()}
                onChange={handleYearChange}
                width="120px"
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "purple.500" }}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </Flex>
            <Flex gap={2}>
              <Button
                onClick={() => setCurrentDate(new Date())}
                colorScheme="purple"
                size="md"
                fontWeight="bold"
                leftIcon={<CalendarIcon />}
              >
                Today
              </Button>
              <IconButton
                aria-label="Previous month"
                icon={<ChevronLeftIcon />}
                onClick={handlePreviousMonth}
                colorScheme="purple"
                variant="outline"
              />
              <IconButton
                aria-label="Next month"
                icon={<ChevronRightIcon />}
                onClick={handleNextMonth}
                colorScheme="purple"
                variant="outline"
              />
            </Flex>
          </Flex>

          <Grid templateColumns="repeat(7, 1fr)" gap={4}>
            {/* Render day names */}
            {dayNames.map(day => (
              <Box
                key={day}
                p={4}
                textAlign="center"
                fontWeight="bold"
                color="gray.400"
              >
                {day}
              </Box>
            ))}

            {/* Render calendar days */}
            {renderCalendarDays()}
          </Grid>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default CalendarPage;