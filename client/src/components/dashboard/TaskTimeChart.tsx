import React from 'react';
import {
  Box,
  Flex,
  Text,
  Progress,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { TaskTimeStats } from '../../services/time';
import { formatDurationShort } from '../../services/time';

interface TaskTimeChartProps {
  tasks: TaskTimeStats[];
  maxTasks?: number;
}

const TaskTimeChart: React.FC<TaskTimeChartProps> = ({
  tasks,
  maxTasks = 8,
}) => {
  const { isAotMode } = useTheme();
  
  // Sort by total time and take top N
  const topTasks = [...tasks]
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, maxTasks);
  
  const maxSeconds = topTasks.length > 0 ? topTasks[0].total_seconds : 0;
  
  // Generate colors for tasks
  const getTaskColor = (index: number): string => {
    if (isAotMode) {
      const colors = [
        'var(--aot-primary)',
        'var(--aot-accent)',
        'rgba(255, 59, 48, 0.7)',
        'rgba(255, 149, 0, 0.8)',
        'rgba(255, 204, 0, 0.8)',
        'rgba(52, 199, 89, 0.8)',
        'rgba(0, 122, 255, 0.8)',
        'rgba(175, 82, 222, 0.8)',
      ];
      return colors[index % colors.length];
    }
    
    const colors = [
      'blue.500',
      'purple.500',
      'teal.500',
      'orange.500',
      'pink.500',
      'cyan.500',
      'green.500',
      'yellow.500',
    ];
    return colors[index % colors.length];
  };
  
  if (topTasks.length === 0) {
    return (
      <Box
        className="productivity-card"
        data-aot-mode={isAotMode}
        p={6}
        borderRadius="lg"
      >
        <Flex align="center" mb={4}>
          <Icon
            as={FiBarChart2}
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
            Time by Task
          </Text>
        </Flex>
        
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="150px"
          color={isAotMode ? 'gray.500' : 'gray.400'}
        >
          <Text>No time tracked yet</Text>
          <Text fontSize="sm" mt={1}>
            Start tracking time to see your breakdown
          </Text>
        </Flex>
      </Box>
    );
  }
  
  return (
    <Box
      className="productivity-card"
      data-aot-mode={isAotMode}
      p={6}
      borderRadius="lg"
    >
      <Flex align="center" mb={4}>
        <Icon
          as={FiBarChart2}
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
          Time by Task
        </Text>
      </Flex>
      
      <Flex direction="column" gap={3}>
        {topTasks.map((task, index) => {
          const percentage = maxSeconds > 0 
            ? (task.total_seconds / maxSeconds) * 100 
            : 0;
          
          return (
            <Box key={task.task_id}>
              <Flex justify="space-between" mb={1}>
                <Tooltip label={task.task_name} placement="top">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    noOfLines={1}
                    maxW="200px"
                  >
                    {task.task_name}
                  </Text>
                </Tooltip>
                <Text
                  fontSize="sm"
                  color={isAotMode ? 'gray.400' : 'gray.600'}
                  fontWeight="500"
                >
                  {formatDurationShort(task.total_seconds)}
                </Text>
              </Flex>
              <Progress
                value={percentage}
                size="sm"
                borderRadius="full"
                colorScheme={
                  isAotMode
                    ? undefined
                    : getTaskColor(index).split('.')[0]
                }
                bg={isAotMode ? 'rgba(255, 59, 48, 0.2)' : 'gray.200'}
                sx={
                  isAotMode
                    ? {
                        '& > div': {
                          background: getTaskColor(index),
                        },
                      }
                    : undefined
                }
              />
            </Box>
          );
        })}
      </Flex>
      
      {tasks.length > maxTasks && (
        <Text
          fontSize="xs"
          color={isAotMode ? 'gray.500' : 'gray.500'}
          mt={3}
          textAlign="center"
        >
          Showing top {maxTasks} of {tasks.length} tasks
        </Text>
      )}
    </Box>
  );
};

export default TaskTimeChart;
