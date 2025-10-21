import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text, Badge, Flex, Circle, Tooltip } from '@chakra-ui/react';
import { StarIcon, TimeIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { format, parseISO, isValid } from 'date-fns';

export interface TaskNodeData extends Record<string, unknown> {
  id: number;
  name: string;
  completed: boolean;
  priority?: { color: string; level: string; } | string;
  category?: string;
  categoryIcon?: string;
  deadline?: string;
  canvas_color?: string | null;
  canvas_shape?: string | null;
  childrenCount?: number;
  onNodeClick?: (taskId: number) => void;
  connectMode?: boolean;
}

const CustomTaskNode = ({ data: rawData, selected }: NodeProps) => {
  // Type assert and guard against missing data
  const data = rawData as unknown as TaskNodeData;
  if (!data) {
    return null;
  }

  const shape = data.canvas_shape || 'rounded';
  const customColor = data.canvas_color;
  const isConnectMode = data.connectMode || false;
  
  // Determine border radius based on shape
  const getBorderRadius = () => {
    switch (shape) {
      case 'circle':
        return '50%';
      case 'rectangle':
        return '4px';
      case 'rounded':
      default:
        return '12px';
    }
  };

  // Get priority color
  const getPriorityColor = () => {
    if (!data.priority) return null;
    if (typeof data.priority === 'string') return data.priority;
    return data.priority.color;
  };

  const priorityColor = getPriorityColor();

  const handleClick = (e: React.MouseEvent) => {
    console.log('CustomTaskNode clicked:', data?.id);
    // Don't stop propagation - let React Flow handle selection
    if (data?.onNodeClick && isConnectMode) {
      // Only use custom handler in connect mode
      e.stopPropagation();
      data.onNodeClick(data.id);
    }
    // Otherwise let React Flow handle the click for selection
  };

  return (
    <Box
      onClick={handleClick}
      cursor={isConnectMode ? 'crosshair' : 'pointer'}
      bg={customColor || (data.completed ? 'var(--color-status-completed)' : 'var(--color-card-background)')}
      border={selected ? '2px solid' : isConnectMode ? '2px dashed' : '1px solid'}
      borderColor={selected ? 'var(--color-focus-ring)' : isConnectMode ? 'var(--color-info)' : 'var(--color-border)'}
      borderRadius={getBorderRadius()}
      p={4}
      minW="200px"
      maxW="300px"
      boxShadow={selected ? 'lg' : 'md'}
      transition="all var(--animation-duration, 200ms)"
      _hover={{
        boxShadow: 'xl',
        transform: 'translateY(-2px)',
        bg: customColor || 'var(--color-hover-overlay)',
        borderColor: isConnectMode ? 'var(--color-primary)' : undefined,
      }}
      position="relative"
      opacity={data.completed ? 0.7 : 1}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'var(--color-accent)',
          width: 10,
          height: 10,
        }}
      />

      {/* Task Name */}
      <Text
        fontWeight="bold"
        fontSize="md"
        color="var(--color-text)"
        mb={2}
        textDecoration={data.completed ? 'line-through' : 'none'}
        opacity={data.completed ? 0.6 : 1}
        noOfLines={2}
      >
        {data.name}
      </Text>

      {/* Metadata Section */}
      <Flex gap={2} flexWrap="wrap" align="center">
        {/* Category Badge */}
        {data.category && (
          <Badge colorScheme="purple" size="sm">
            {data.categoryIcon && <span style={{ marginRight: '4px' }}>{data.categoryIcon}</span>}
            {data.category}
          </Badge>
        )}

        {/* Priority Indicator */}
        {priorityColor && (
          <Tooltip label={`Priority: ${typeof data.priority === 'string' ? data.priority : data.priority?.level}`}>
            <Circle size="20px" bg={priorityColor}>
              <StarIcon color="white" boxSize={3} />
            </Circle>
          </Tooltip>
        )}

        {/* Completed Indicator */}
        {data.completed && (
          <CheckCircleIcon color="green.400" boxSize={5} />
        )}

        {/* Children Count */}
        {data.childrenCount && data.childrenCount > 0 && (
          <Badge colorScheme="blue" size="sm">
            {data.childrenCount} subtask{data.childrenCount > 1 ? 's' : ''}
          </Badge>
        )}
      </Flex>

      {/* Deadline */}
      {data.deadline && (() => {
        const deadlineDate = parseISO(data.deadline);
        if (isValid(deadlineDate)) {
          return (
            <Flex mt={2} align="center" gap={1}>
              <TimeIcon color="blue.300" boxSize={3} />
              <Text fontSize="xs" color="blue.300">
                {format(deadlineDate, "MMM do, h:mm a")}
              </Text>
            </Flex>
          );
        }
        return null;
      })()}

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--color-accent)',
          width: 10,
          height: 10,
        }}
      />
    </Box>
  );
};

export default memo(CustomTaskNode);


