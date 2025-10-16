import React from 'react';
import {
  Box,
  Flex,
  Button,
  Input,
  Text,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TimeScope } from '../../hooks/useTaskFilters';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface TimeScopeSelectorProps {
  timeScope: TimeScope;
  anchorDate: Date;
  onTimeScopeChange: (scope: TimeScope) => void;
  onAnchorDateChange: (date: Date) => void;
}

const TimeScopeSelector: React.FC<TimeScopeSelectorProps> = ({
  timeScope,
  anchorDate,
  onTimeScopeChange,
  onAnchorDateChange,
}) => {
  const { isAotMode } = useTheme();

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Get date range display text
  const getDateRangeText = () => {
    switch (timeScope) {
      case 'daily':
        return format(anchorDate, 'MMMM d, yyyy');
      case 'weekly': {
        const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
        const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      case 'monthly':
        return format(anchorDate, 'MMMM yyyy');
      case 'yearly':
        return format(anchorDate, 'yyyy');
      default:
        return '';
    }
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onAnchorDateChange(newDate);
    }
  };

  // Quick action: Go to today
  const handleToday = () => {
    onAnchorDateChange(new Date());
  };

  // Button style helper
  const getButtonStyle = (scope: TimeScope) => {
    const isSelected = timeScope === scope;
    
    if (isSelected) {
      return {
        bg: isAotMode ? '#8B0000' : 'purple.600',
        color: 'white',
        borderColor: isAotMode ? '#8B0000' : 'purple.600',
        _hover: {
          bg: isAotMode ? '#a00' : 'purple.700',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        fontWeight: 'semibold',
        boxShadow: isSelected ? 'sm' : 'none',
      };
    }
    
    return {
      bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
      color: isAotMode ? '#c89a5a' : 'white',
      borderColor: isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)',
      _hover: {
        bg: isAotMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
        borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
        transform: 'translateY(-1px)',
      },
      fontWeight: 'normal',
    };
  };

  return (
    <Box>
      <Flex gap={3} align="center" flexWrap="wrap">
        {/* Time Scope Buttons */}
        <Flex gap={0}>
          <Button
            onClick={() => onTimeScopeChange('daily')}
            size="md"
            borderRadius="md"
            borderRightRadius={0}
            borderWidth="1px"
            transition="all 0.2s"
            {...getButtonStyle('daily')}
          >
            Daily
          </Button>
          <Button
            onClick={() => onTimeScopeChange('weekly')}
            size="md"
            borderRadius={0}
            borderWidth="1px"
            borderLeftWidth={0}
            transition="all 0.2s"
            {...getButtonStyle('weekly')}
          >
            Weekly
          </Button>
          <Button
            onClick={() => onTimeScopeChange('monthly')}
            size="md"
            borderRadius={0}
            borderWidth="1px"
            borderLeftWidth={0}
            transition="all 0.2s"
            {...getButtonStyle('monthly')}
          >
            Monthly
          </Button>
          <Button
            onClick={() => onTimeScopeChange('yearly')}
            size="md"
            borderRadius="md"
            borderLeftRadius={0}
            borderWidth="1px"
            borderLeftWidth={0}
            transition="all 0.2s"
            {...getButtonStyle('yearly')}
          >
            Yearly
          </Button>
        </Flex>

        {/* Date Picker */}
        <Flex align="center" gap={2} ml={2}>
          <CalendarIcon color={isAotMode ? '#c89a5a' : 'white'} />
          <Input
            type="date"
            value={formatDateForInput(anchorDate)}
            onChange={handleDateChange}
            size="md"
            width="auto"
            bg={isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'}
            borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
            color={isAotMode ? '#c89a5a' : 'white'}
            _hover={{
              borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
            }}
            _focus={{
              borderColor: isAotMode ? '#dca253' : 'purple.500',
              boxShadow: isAotMode ? '0 0 0 1px #dca253' : '0 0 0 1px purple.500',
            }}
            sx={{
              colorScheme: isAotMode ? 'dark' : 'dark',
              '&::-webkit-calendar-picker-indicator': {
                filter: isAotMode ? 'invert(0.7) sepia(1) saturate(2) hue-rotate(15deg)' : 'invert(1)',
                cursor: 'pointer',
              }
            }}
          />
        </Flex>

        {/* Today Button */}
        <Button
          size="md"
          onClick={handleToday}
          bg="transparent"
          color={isAotMode ? '#dca253' : 'purple.400'}
          borderWidth="1px"
          borderColor={isAotMode ? '#dca253' : 'purple.500'}
          _hover={{
            bg: isAotMode ? 'rgba(220, 162, 83, 0.1)' : 'rgba(159, 122, 234, 0.1)',
            transform: 'translateY(-1px)',
          }}
          fontWeight="medium"
          transition="all 0.2s"
        >
          Today
        </Button>
      </Flex>

      {/* Date Range Display */}
      <Text 
        mt={3} 
        fontSize="sm" 
        fontWeight="medium" 
        color={isAotMode ? '#c89a5a' : 'gray.400'}
        opacity={0.9}
      >
        {getDateRangeText()}
      </Text>
    </Box>
  );
};

export default TimeScopeSelector;

