import { Box, VStack, Text, Flex, IconButton, Input } from '@chakra-ui/react';
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
  onUpdateName: (taskId: number, subtaskId: number, newName: string) => void;
}

const SubtaskCard = ({
  taskId,
  subtask,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onUpdateName
}: SubtaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(subtask.name);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(subtask.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdateName(taskId, subtask.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(subtask.name);
    }
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        bg="gray.700"
        p={2}
        borderRadius="md"
        transition="all 0.3s ease-in-out"
        transform={subtask.completed ? "scale(0.98)" : "scale(1)"}
        position="relative"
        _after={subtask.completed ? {
          content: '""',
          position: "absolute",
          top: "-1px",
          right: "-1px",
          bottom: "-1px",
          left: "-1px",
          background: "green.500",
          opacity: 0.1,
          borderRadius: "md",
          zIndex: -1,
          transition: "opacity 0.3s ease-in-out"
        } : undefined}
      >
        <Flex align="center" gap={2}>
          <IconButton
            icon={subtask.completed ? <CheckIcon /> : undefined}
            aria-label={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
            colorScheme="green"
            variant={subtask.completed ? 'solid' : 'outline'}
            size="xs"
            onClick={() => onToggleComplete(taskId, subtask.id)}
            transition="all 0.3s ease-in-out"
            transform={subtask.completed ? "scale(1.1)" : "scale(1)"}
          />
          {isEditing ? (
            <Input
              value={editedName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              color="white"
              bg="gray.700"
              fontSize="sm"
              flex="1"
              size="sm"
              autoFocus
              _focus={{
                borderColor: "purple.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)"
              }}
            />
          ) : (
            <Text
              color="white"
              fontSize="sm"
              textDecoration={subtask.completed ? 'line-through' : 'none'}
              opacity={subtask.completed ? 0.7 : 1}
              cursor="text"
              onDoubleClick={handleDoubleClick}
              title="Double click to edit"
              transition="all 0.3s ease-in-out"
              transform={subtask.completed ? "translateX(-4px)" : "translateX(0)"}
              _hover={{
                bg: "gray.700",
                borderRadius: "sm",
                px: 2,
                mx: -2
              }}
            >
              {subtask.name}
            </Text>
          )}
        </Flex>
        <Flex gap={2}>
          <IconButton
            icon={<AddIcon />}
            aria-label="Add subtask"
            colorScheme="blue"
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
              onUpdateName={onUpdateName}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SubtaskCard;
