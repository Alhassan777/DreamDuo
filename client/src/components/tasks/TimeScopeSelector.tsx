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
import './TimeScopeSelector.css';

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

  // Check if a scope is selected
  const isSelected = (scope: TimeScope) => timeScope === scope;

  return (
    <Box className="time-scope-selector-container" data-aot-mode={isAotMode}>
      <Flex className="time-scope-controls">
        {/* Time Scope Buttons */}
        <Flex className="time-scope-button-group">
          <Button
            className={`time-scope-button ${isSelected('daily') ? 'selected' : ''}`}
            onClick={() => onTimeScopeChange('daily')}
            size="md"
          >
            Daily
          </Button>
          <Button
            className={`time-scope-button ${isSelected('weekly') ? 'selected' : ''}`}
            onClick={() => onTimeScopeChange('weekly')}
            size="md"
          >
            Weekly
          </Button>
          <Button
            className={`time-scope-button ${isSelected('monthly') ? 'selected' : ''}`}
            onClick={() => onTimeScopeChange('monthly')}
            size="md"
          >
            Monthly
          </Button>
          <Button
            className={`time-scope-button ${isSelected('yearly') ? 'selected' : ''}`}
            onClick={() => onTimeScopeChange('yearly')}
            size="md"
          >
            Yearly
          </Button>
        </Flex>

        {/* Date Picker */}
        <Flex className="time-scope-date-picker-container">
          <CalendarIcon className="time-scope-calendar-icon" />
          <Input
            className="time-scope-date-input"
            type="date"
            value={formatDateForInput(anchorDate)}
            onChange={handleDateChange}
            size="md"
          />
        </Flex>

        {/* Today Button */}
        <Button
          className="time-scope-today-button"
          size="md"
          onClick={handleToday}
          data-aot-mode={isAotMode}
        >
          Today
        </Button>
      </Flex>

      {/* Date Range Display */}
      <Text className="time-scope-date-range-text">
        {getDateRangeText()}
      </Text>
    </Box>
  );
};

export default TimeScopeSelector;

