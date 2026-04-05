import React from 'react';
import {
  Box,
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { FiClock, FiTrendingUp } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDurationShort, formatDurationLong } from '../../services/time';

interface TimeTrackingCardProps {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  todayGoalSeconds?: number;
}

const TimeTrackingCard: React.FC<TimeTrackingCardProps> = ({
  todaySeconds,
  weekSeconds,
  monthSeconds,
  todayGoalSeconds = 8 * 3600, // Default 8 hours
}) => {
  const { isAotMode } = useTheme();
  
  const todayProgress = Math.min((todaySeconds / todayGoalSeconds) * 100, 100);
  const hasMetGoal = todaySeconds >= todayGoalSeconds;
  
  return (
    <Box
      className="productivity-card"
      data-aot-mode={isAotMode}
      p={6}
      borderRadius="lg"
    >
      <Flex align="center" mb={4}>
        <Icon
          as={FiClock}
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
          Time Tracked
        </Text>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        {/* Today's Progress Circle */}
        <Flex direction="column" align="center" flex="1">
          <CircularProgress
            value={todayProgress}
            size="100px"
            thickness="8px"
            color={
              isAotMode
                ? hasMetGoal
                  ? 'var(--aot-accent)'
                  : 'var(--aot-primary)'
                : hasMetGoal
                ? 'var(--dashboard-chart-purple)'
                : 'blue.500'
            }
            trackColor={isAotMode ? 'rgba(255, 59, 48, 0.2)' : 'gray.200'}
          >
            <CircularProgressLabel>
              <Text fontSize="sm" fontWeight="600">
                {formatDurationShort(todaySeconds)}
              </Text>
            </CircularProgressLabel>
          </CircularProgress>
          <Text
            fontSize="sm"
            color={isAotMode ? 'gray.400' : 'gray.600'}
            mt={2}
          >
            Today
          </Text>
          {todayGoalSeconds > 0 && (
            <Text
              fontSize="xs"
              color={isAotMode ? 'gray.500' : 'gray.500'}
            >
              Goal: {formatDurationShort(todayGoalSeconds)}
            </Text>
          )}
        </Flex>

        {/* Week & Month Stats */}
        <Flex direction="column" flex="1" justify="center" gap={4}>
          <Stat>
            <StatLabel color={isAotMode ? 'gray.400' : 'gray.600'}>
              This Week
            </StatLabel>
            <StatNumber
              fontSize="xl"
              color={isAotMode ? 'var(--aot-primary)' : 'blue.600'}
            >
              {formatDurationShort(weekSeconds)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {formatDurationLong(weekSeconds)}
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel color={isAotMode ? 'gray.400' : 'gray.600'}>
              This Month
            </StatLabel>
            <StatNumber
              fontSize="xl"
              color={isAotMode ? 'var(--aot-accent)' : 'purple.600'}
            >
              {formatDurationShort(monthSeconds)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {formatDurationLong(monthSeconds)}
            </StatHelpText>
          </Stat>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TimeTrackingCard;
