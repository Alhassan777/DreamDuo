import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  Text,
  List,
  ListItem,
  IconButton,
  HStack,
  Badge,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { DeleteIcon, LinkIcon } from '@chakra-ui/icons';
import { TaskDependency, Task } from '../../services/tasks';

interface DependencyControlsProps {
  selectedTaskIds: number[];
  dependencies: TaskDependency[];
  tasks: Task[];
  connectMode: boolean;
  onToggleConnectMode: () => void;
  onDeleteDependency: (dependencyId: number) => void;
  onClose?: () => void;
}

const DependencyControls: React.FC<DependencyControlsProps> = ({
  selectedTaskIds,
  dependencies,
  tasks,
  connectMode,
  onToggleConnectMode,
  onDeleteDependency,
  onClose,
}) => {
  const toast = useToast();

  const getSelectedTaskDependencies = () => {
    if (selectedTaskIds.length === 0) return [];
    
    return dependencies.filter(
      (dep) =>
        selectedTaskIds.includes(dep.source_task_id) ||
        selectedTaskIds.includes(dep.target_task_id)
    );
  };

  // Recursively find task by ID and build hierarchical path
  const findTaskWithPath = (taskList: Task[], taskId: number, path: string[] = []): { task: Task | null; path: string[] } => {
    for (const task of taskList) {
      if (task.id === taskId) {
        return { task, path: [...path, task.name] };
      }
      if (task.children && task.children.length > 0) {
        const result = findTaskWithPath(task.children, taskId, [...path, task.name]);
        if (result.task) {
          return result;
        }
      }
    }
    return { task: null, path: [] };
  };

  const getTaskName = (taskId: number): string => {
    const result = findTaskWithPath(tasks, taskId);
    if (result.task) {
      // If it's a subtask (path has more than one element), show hierarchy
      if (result.path.length > 1) {
        return result.path.join(' > ');
      }
      return result.task.name;
    }
    return `Task ${taskId}`;
  };

  const selectedDependencies = getSelectedTaskDependencies();

  const handleToggleConnectMode = () => {
    if (selectedTaskIds.length === 0) {
      toast({
        title: 'No task selected',
        description: 'Please select a task first',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    onToggleConnectMode();

    if (!connectMode) {
      toast({
        title: 'Connect mode enabled',
        description: 'Click another task to create a dependency',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteDependency = (depId: number) => {
    onDeleteDependency(depId);
    toast({
      title: 'Dependency deleted',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box
      bg="var(--color-card-background)"
      p={4}
      borderRadius="var(--border-radius-lg)"
      w="full"
      color="var(--color-text)"
      border="1px solid"
      borderColor="var(--color-border)"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="sm">Task Dependencies</Heading>

        {selectedTaskIds.length > 0 ? (
          <Text fontSize="sm" color="var(--color-text-secondary)">
            {selectedTaskIds.length} task(s) selected
          </Text>
        ) : (
          <Text fontSize="sm" color="var(--color-warning)">
            Select a task to manage dependencies
          </Text>
        )}

        {/* Connect Mode Toggle */}
        <Button
          leftIcon={<LinkIcon />}
          onClick={handleToggleConnectMode}
          isDisabled={selectedTaskIds.length === 0}
          bg={connectMode ? 'var(--color-success)' : 'var(--color-button-primary)'}
          color="var(--color-button-primary-text)"
          borderWidth={connectMode ? '0' : '1px'}
          borderColor={connectMode ? 'transparent' : 'var(--color-border)'}
          borderRadius="var(--border-radius-md)"
          transition={`all var(--animation-duration) var(--animation-timing)`}
          _hover={{
            bg: connectMode ? 'var(--color-success)' : 'var(--color-button-primary-hover)',
            opacity: 0.9,
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-md)'
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed'
          }}
        >
          {connectMode ? 'Cancel Connection' : 'Create Dependency'}
        </Button>

        {connectMode && (
          <Box 
            bg="var(--color-info)" 
            p={2} 
            borderRadius="var(--border-radius-md)" 
            opacity={0.9}
            border="1px solid"
            borderColor="var(--color-primary)"
          >
            <Text fontSize="sm" color="white">
              Click another task to create a dependency from the selected task(s)
            </Text>
          </Box>
        )}

        <Divider />

        {/* List of Dependencies */}
        <Box>
          <Heading size="xs" mb={2}>
            Related Dependencies
          </Heading>
          {selectedDependencies.length === 0 ? (
            <Text fontSize="sm" color="var(--color-text-secondary)">
              No dependencies for selected task(s)
            </Text>
          ) : (
            <List spacing={2}>
              {selectedDependencies.map((dep) => {
                const isOutgoing = selectedTaskIds.includes(dep.source_task_id);
                return (
                  <ListItem
                    key={dep.id}
                    bg="var(--color-card-background)"
                    p={2}
                    borderRadius="var(--border-radius-md)"
                    borderLeft="3px solid"
                    borderColor={isOutgoing ? 'var(--color-success)' : 'var(--color-info)'}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0} flex={1}>
                        <HStack>
                          <Badge 
                            bg={isOutgoing ? 'var(--color-success)' : 'var(--color-info)'}
                            color="white"
                            size="sm"
                            px={2}
                            py={1}
                            borderRadius="var(--border-radius-sm)"
                          >
                            {isOutgoing ? 'Outgoing' : 'Incoming'}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {getTaskName(dep.source_task_id)} → {getTaskName(dep.target_task_id)}
                        </Text>
                      </VStack>
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete dependency"
                        size="sm"
                        variant="ghost"
                        bg="transparent"
                        color="var(--color-error)"
                        borderRadius="var(--border-radius-md)"
                        transition={`all var(--animation-duration) var(--animation-timing)`}
                        _hover={{
                          bg: 'var(--color-error)',
                          color: 'white',
                          transform: 'scale(1.1)'
                        }}
                        onClick={() => handleDeleteDependency(dep.id)}
                      />
                    </HStack>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* All Dependencies Count */}
        <Box bg="var(--color-card-background)" p={2} borderRadius="var(--border-radius-md)">
          <Text fontSize="xs" color="var(--color-text-secondary)">
            Total dependencies: {dependencies.length}
          </Text>
        </Box>

        {onClose && (
          <Button 
            variant="ghost" 
            onClick={onClose} 
            size="sm"
            color="var(--color-text)"
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{
              bg: 'var(--color-hover-overlay)'
            }}
          >
            Close
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default DependencyControls;


