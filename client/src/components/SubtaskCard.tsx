import { Box, VStack, Text, Flex, IconButton } from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface Subtask {
  id: number;
  name: string;
  completed: boolean;
  subtasks?: Subtask[];
}

interface SubtaskCardProps {
  taskId: number;
  subtask: Subtask;
  onDelete: (taskId: number, subtaskId: number) => void;
  onAddSubtask: (taskId: number, parentSubtaskId: number) => void;
  onToggleComplete: (taskId: number, subtaskId: number) => void;
}

const SubtaskCard = ({
  taskId,
  subtask,
  onDelete,
  onAddSubtask,
  onToggleComplete
}: SubtaskCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        bg="gray.700"
        p={2}
        borderRadius="md"
      >
        <Text
          color="white"
          fontSize="sm"
          textDecoration={subtask.completed ? 'line-through' : 'none'}
          cursor="pointer"
          onClick={() => onToggleComplete(taskId, subtask.id)}
        >
          {subtask.name}
        </Text>
        <Flex gap={2}>
          <IconButton
            icon={<AddIcon />}
            aria-label="Add subtask"
            colorScheme="green"
            size="xs"
            onClick={() => onAddSubtask(taskId, subtask.id)}
          />
          <IconButton
            icon={<CloseIcon />}
            aria-label="Delete subtask"
            colorScheme="red"
            size="xs"
            onClick={() => onDelete(taskId, subtask.id)}
          />
          <IconButton
            icon={subtask.completed ? <CheckIcon /> : undefined}
            aria-label={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
            colorScheme="green"
            variant={subtask.completed ? 'solid' : 'outline'}
            size="xs"
            onClick={() => onToggleComplete(taskId, subtask.id)}
          />
        </Flex>
      </Flex>
      
      {subtask.subtasks && subtask.subtasks.length > 0 && (
        <VStack align="stretch" pl={4} spacing={2} mt={2}>
          {subtask.subtasks.map((nestedSubtask) => (
            <SubtaskCard
              key={nestedSubtask.id}
              taskId={taskId}
              subtask={nestedSubtask}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SubtaskCard;