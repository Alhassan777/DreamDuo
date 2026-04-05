import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { WeeklyTimeStats, formatDurationShort } from '../../services/time';

interface WeeklyTimeChartProps {
  weeklyStats: WeeklyTimeStats[];
}

const WeeklyTimeChart: React.FC<WeeklyTimeChartProps> = ({ weeklyStats }) => {
  const { isAotMode } = useTheme();
  
  // Find max time for scaling bars
  const maxSeconds = Math.max(...weeklyStats.map(d => d.total_seconds), 1);
  
  // Calculate total for the week
  const weekTotal = weeklyStats.reduce((sum, d) => sum + d.total_seconds, 0);
  
  return (
    <Box
      className="productivity-card"
      data-aot-mode={isAotMode}
      p={6}
      borderRadius="lg"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center">
          <Icon
            as={FiCalendar}
            boxSize={5}
            color={isAotMode ? 'var(--aot-primary)' : 'blue.500'}
            mr={2}
          />
          <Text
            className="stats-heading"
            data-aot-mode={isAotMode}
            fontSize="lg"
            fontWeight="600"
          >
            Weekly Time Distribution
          </Text>
        </Flex>
        <Text
          fontSize="sm"
          fontWeight="600"
          color={isAotMode ? 'var(--aot-accent)' : 'purple.600'}
        >
          Total: {formatDurationShort(weekTotal)}
        </Text>
      </Flex>
      
      <Flex direction="column" gap={2}>
        {weeklyStats.map((day) => {
          const barWidth = maxSeconds > 0 
            ? Math.max((day.total_seconds / maxSeconds) * 100, 0)
            : 0;
          const hasTime = day.total_seconds > 0;
          
          // Determine bar color based on amount
          const getBarColor = () => {
            if (!hasTime) return isAotMode ? 'gray.600' : 'gray.300';
            if (day.total_seconds >= 6 * 3600) {
              return isAotMode ? 'var(--aot-accent)' : 'var(--dashboard-chart-purple)';
            }
            if (day.total_seconds >= 4 * 3600) {
              return isAotMode ? 'var(--aot-primary)' : 'blue.500';
            }
            return isAotMode ? 'rgba(255, 59, 48, 0.6)' : 'blue.300';
          };
          
          return (
            <Flex
              key={day.day}
              align="center"
              opacity={hasTime ? 1 : 0.5}
            >
              <Text
                className="chart-label"
                data-aot-mode={isAotMode}
                width="50px"
                fontSize="sm"
                fontWeight="500"
              >
                {day.day}
              </Text>
              
              <Box flex="1" position="relative" mx={2}>
                <Box
                  bg={isAotMode ? 'rgba(255, 59, 48, 0.15)' : 'gray.100'}
                  w="100%"
                  h="24px"
                  borderRadius="4px"
                  position="relative"
                  overflow="hidden"
                >
                  {hasTime && (
                    <Box
                      bg={getBarColor()}
                      w={`${barWidth}%`}
                      h="24px"
                      borderRadius="4px"
                      position="absolute"
                      top="0"
                      left="0"
                      transition="width 0.3s ease"
                    />
                  )}
                </Box>
              </Box>
              
              <Text
                width="60px"
                textAlign="right"
                fontSize="sm"
                fontWeight={hasTime ? '500' : '400'}
                color={
                  hasTime
                    ? isAotMode
                      ? 'white'
                      : 'gray.700'
                    : isAotMode
                    ? 'gray.500'
                    : 'gray.400'
                }
              >
                {hasTime ? formatDurationShort(day.total_seconds) : '-'}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
};

export default WeeklyTimeChart;
