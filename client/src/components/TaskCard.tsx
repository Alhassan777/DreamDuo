import { Box, VStack, Text, Flex, Tag, IconButton, Collapse } from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import SubtaskCard from './SubtaskCard';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  subtasks?: Subtask[];
}

interface Task {
  id: number;
  name: string;
  category: string;
  completed: boolean;
  collapsed?: boolean;
  subtasks?: Subtask[];
}

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: number) => void;
  onToggleCollapse: (taskId: number) => void;
  onAddSubtask: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
  onToggleSubtaskComplete: (taskId: number, subtaskId: number) => void;
}

const TaskCard = ({
  task,
  onDelete,
  onToggleCollapse,
  onAddSubtask,
  onToggleComplete,
  onToggleSubtaskComplete
}: TaskCardProps) => {
  return (
    <Box
      bg={task.completed ? "gray.700" : "gray.800"}
      p={5}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={task.completed ? "green.500" : "gray.700"}
      position="relative"
      height="fit-content"
      transition="all 0.3s ease-in-out"
      transform={task.completed ? "scale(0.98)" : "scale(1)"}
      _after={task.completed ? {
        content: '""',
        position: "absolute",
        top: "-1px",
        right: "-1px",
        bottom: "-1px",
        left: "-1px",
        background: "green.500",
        opacity: 0.1,
        borderRadius: "lg",
        zIndex: -1,
        transition: "opacity 0.3s ease-in-out"
      } : undefined}
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Delete task"
            colorScheme="red"
            size="sm"
            onClick={() => onDelete(task.id)}
          />
          <Text
            color="white"
            fontSize="lg"
            textDecoration={task.completed ? 'line-through' : 'none'}
            opacity={task.completed ? 0.6 : 1}
            flex="1"
            mx={4}
            onClick={() => onToggleComplete(task.id)}
            cursor="pointer"
          >
            {task.name}
          </Text>
          <Flex gap={2}>
            <IconButton
              icon={task.collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              aria-label="Toggle collapse"
              colorScheme={task.collapsed ? "gray" : "teal"}
              variant="solid"
              size="sm"
              onClick={() => onToggleCollapse(task.id)}
            />
            <IconButton
              icon={<AddIcon />}
              aria-label="Add subtask"
              colorScheme="blue"
              size="sm"
              onClick={() => onAddSubtask(task.id)}
            />
          </Flex>
        </Flex>
        
        <Tag colorScheme="purple" size="sm" width="fit-content">
          {task.category}
        </Tag>

        <Collapse
          in={!task.collapsed}
          style={{
            transformOrigin: 'top',
            position: 'relative',
            width: '100%'
          }}
          animateOpacity
        >
        {task.subtasks && task.subtasks.length > 0 && (
          <VStack align="stretch" pl={4} spacing={2}>
            {task.subtasks.map((subtask) => (
              <SubtaskCard
                key={subtask.id}
                taskId={task.id}
                subtask={subtask}
                onDelete={onDelete}
                onAddSubtask={onAddSubtask}
                onToggleComplete={onToggleSubtaskComplete}
              />
            ))}
          </VStack>
        )}
        </Collapse>
      </VStack>
    </Box>
  );
};

export default TaskCard;