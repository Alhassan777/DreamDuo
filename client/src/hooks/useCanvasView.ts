import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { Task, tasksService, TaskDependency } from '../services/tasks';
import { TaskNodeData } from '../components/canvas/CustomTaskNode';
import { useToast } from '@chakra-ui/react';

interface Category {
  id?: number;
  name: string;
  icon?: string;
}

interface PriorityColor {
  level: string;
  color: string;
}

interface UseCanvasViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  categories?: Category[];
  priorities?: PriorityColor[];
  onRefresh?: () => void;
}

export const useCanvasView = ({ tasks, setTasks, categories = [], priorities = [], onRefresh }: UseCanvasViewProps) => {
  const [nodes, setNodes] = useState<Node<TaskNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState<number | null>(null);
  const [newlyCreatedSubtaskId, setNewlyCreatedSubtaskId] = useState<number | null>(null);
  const toast = useToast();

  // Helper function to find a task by ID recursively
  const findTaskById = useCallback((taskList: Task[], taskId: number): Task | null => {
    for (const task of taskList) {
      if (task.id === taskId) return task;
      if (task.children && task.children.length > 0) {
        const found = findTaskById(task.children, taskId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Handler: Delete task or subtask
  const handleDelete = useCallback(
    async (taskId: number, subtaskId?: number) => {
      try {
        const idToDelete = subtaskId || taskId;

        // Remove from local state immediately
        setTasks((prevTasks) => {
          const removeTask = (taskList: Task[]): Task[] => {
            return taskList
              .filter((t) => t.id !== idToDelete)
              .map((t) => ({
                ...t,
                children: t.children ? removeTask(t.children) : [],
              }));
          };
          return removeTask(prevTasks);
        });

        await tasksService.deleteTask(idToDelete);
        
        toast({
          title: subtaskId ? 'Subtask deleted' : 'Task deleted',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to delete:', error);
        toast({
          title: 'Failed to delete',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [toast, onRefresh, setTasks]
  );

  // Handler: Toggle task collapse
  const handleToggleCollapse = useCallback(
    (taskId: number) => {
      setTasks((prevTasks) => {
        const updateCollapse = (taskList: Task[]): Task[] => {
          return taskList.map((task) => {
            if (task.id === taskId) {
              return { ...task, collapsed: !task.collapsed };
            }
            return {
              ...task,
              children: task.children ? updateCollapse(task.children) : [],
            };
          });
        };
        return updateCollapse(prevTasks);
      });
    },
    [setTasks]
  );

  // Handler: Add subtask
  const handleAddSubtask = useCallback(
    async (taskId: number, parentSubtaskId?: number) => {
      try {
        const parentId = parentSubtaskId || taskId;
        const response = await tasksService.createTask({
          name: 'New Subtask',
          parent_id: parentId,
        });

        // Extract the actual task data from the response
        const newSubtaskData = response.data || response;
        
        if (!newSubtaskData.id) {
          console.error('No ID in subtask data!', newSubtaskData);
          toast({
            title: 'Error creating subtask',
            description: 'Subtask was created but no ID was returned',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          if (onRefresh) {
            onRefresh();
          }
          return;
        }

        // Convert TaskResponse to Task format
        const newSubtask: Task = {
          ...newSubtaskData,
          parent_id: newSubtaskData.parent_id ?? null,
          category: typeof newSubtaskData.category === 'string' 
            ? newSubtaskData.category 
            : newSubtaskData.category?.name,
          categoryIcon: typeof newSubtaskData.category === 'object' 
            ? newSubtaskData.category?.icon 
            : undefined,
          children: [],
          collapsed: false,
        };

        // Add to local state immediately
        setTasks((prevTasks) => {
          const addSubtaskToParent = (taskList: Task[]): Task[] => {
            return taskList.map((t) => {
              if (t.id === parentId) {
                return {
                  ...t,
                  children: [...(t.children || []), newSubtask],
                };
              }
              return {
                ...t,
                children: t.children ? addSubtaskToParent(t.children) : [],
              };
            });
          };
          return addSubtaskToParent(prevTasks);
        });

        // Set the newly created subtask ID to trigger auto-edit AFTER state update
        setTimeout(() => {
          setNewlyCreatedSubtaskId(newSubtaskData.id);
        }, 150);

        // Clear the newly created subtask ID after a delay
        setTimeout(() => {
          setNewlyCreatedSubtaskId(null);
        }, 2000);

        toast({
          title: 'Subtask added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to add subtask:', error);
        toast({
          title: 'Failed to add subtask',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [toast, onRefresh, setTasks]
  );

  // Handler: Toggle task complete
  const handleToggleComplete = useCallback(
    async (taskId: number) => {
      try {
        const task = findTaskById(tasks, taskId);
        if (!task) return;

        const newCompletedState = !task.completed;

        // Update locally first for immediate feedback
        setTasks((prevTasks) => {
          const updateTaskComplete = (taskList: Task[]): Task[] => {
            return taskList.map((t) => {
              if (t.id === taskId) {
                return { ...t, completed: newCompletedState };
              }
              return {
                ...t,
                children: t.children ? updateTaskComplete(t.children) : [],
              };
            });
          };
          return updateTaskComplete(prevTasks);
        });

        await tasksService.updateTask(taskId, {
          completed: newCompletedState,
        } as any);

        toast({
          title: newCompletedState ? 'Task completed' : 'Task marked incomplete',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to toggle complete:', error);
        toast({
          title: 'Failed to update task',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [tasks, findTaskById, toast, onRefresh, setTasks]
  );

  // Handler: Toggle subtask complete
  const handleToggleSubtaskComplete = useCallback(
    async (_taskId: number, subtaskId: number) => {
      try {
        const subtask = findTaskById(tasks, subtaskId);
        if (!subtask) return;

        const newCompletedState = !subtask.completed;

        // Update locally first for immediate feedback
        setTasks((prevTasks) => {
          const updateTaskComplete = (taskList: Task[]): Task[] => {
            return taskList.map((t) => {
              if (t.id === subtaskId) {
                return { ...t, completed: newCompletedState };
              }
              return {
                ...t,
                children: t.children ? updateTaskComplete(t.children) : [],
              };
            });
          };
          return updateTaskComplete(prevTasks);
        });

        await tasksService.updateTask(subtaskId, {
          completed: newCompletedState,
        } as any);

        toast({
          title: newCompletedState ? 'Subtask completed' : 'Subtask marked incomplete',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to toggle subtask complete:', error);
        toast({
          title: 'Failed to update subtask',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [tasks, findTaskById, toast, onRefresh, setTasks]
  );

  // Handler: Update task name
  const handleUpdateName = useCallback(
    async (taskId: number, newName: string) => {
      try {
        // Update locally first
        setTasks((prevTasks) => {
          const updateTaskName = (taskList: Task[]): Task[] => {
            return taskList.map((t) => {
              if (t.id === taskId) {
                return { ...t, name: newName };
              }
              return {
                ...t,
                children: t.children ? updateTaskName(t.children) : [],
              };
            });
          };
          return updateTaskName(prevTasks);
        });

        await tasksService.updateTask(taskId, {
          name: newName,
        });

        toast({
          title: 'Task name updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to update task name:', error);
        toast({
          title: 'Failed to update task name',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [toast, onRefresh, setTasks]
  );

  // Handler: Update subtask name
  const handleUpdateSubtaskName = useCallback(
    async (_taskId: number, subtaskId: number, newName: string) => {
      try {
        // Update locally first
        setTasks((prevTasks) => {
          const updateTaskName = (taskList: Task[]): Task[] => {
            return taskList.map((t) => {
              if (t.id === subtaskId) {
                return { ...t, name: newName };
              }
              return {
                ...t,
                children: t.children ? updateTaskName(t.children) : [],
              };
            });
          };
          return updateTaskName(prevTasks);
        });

        await tasksService.updateTask(subtaskId, {
          name: newName,
        });

        toast({
          title: 'Subtask name updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to update subtask name:', error);
        toast({
          title: 'Failed to update subtask name',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [toast, onRefresh, setTasks]
  );

  // Handler: Comprehensive task update
  const handleUpdateTask = useCallback(
    async (taskId: number, updates: any) => {
      try {
        await tasksService.updateTask(taskId, updates);
        
        // Refresh tasks after update
        if (onRefresh) {
          onRefresh();
        }

        toast({
          title: 'Task Updated',
          description: 'Task has been successfully updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to update task:', error);
        toast({
          title: 'Failed to update task',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Revert on error
        if (onRefresh) {
          onRefresh();
        }
      }
    },
    [toast, onRefresh]
  );

  // Convert tasks to nodes
  const tasksToNodes = useCallback((taskList: Task[], existingNodes: Node<TaskNodeData>[] = []): Node<TaskNodeData>[] => {
    const nodeList: Node<TaskNodeData>[] = [];
    
    // Create a map of existing positions
    const existingPositions = new Map<string, { x: number; y: number }>();
    existingNodes.forEach(node => {
      existingPositions.set(node.id, node.position);
    });

    // Only process top-level tasks (parent_id === null)
    // Children will be rendered inside the task cards
    taskList.forEach((task) => {
      if (task.parent_id === null) {
        const taskIdStr = task.id.toString();
        
        // Preserve existing position if available, otherwise use stored position or auto-layout
        const existingPos = existingPositions.get(taskIdStr);
        const xPos = existingPos?.x ?? task.position_x ?? (nodeList.length * 350 % 1200);
        const yPos = existingPos?.y ?? task.position_y ?? (Math.floor(nodeList.length / 4) * 250);

        nodeList.push({
          id: taskIdStr,
          type: 'customTask',
          position: { x: xPos, y: yPos },
          data: {
            task: task,
            categories: categories,
            priorities: priorities,
            onDelete: handleDelete,
            onToggleCollapse: handleToggleCollapse,
            onAddSubtask: handleAddSubtask,
            onToggleComplete: handleToggleComplete,
            onToggleSubtaskComplete: handleToggleSubtaskComplete,
            onUpdateName: handleUpdateName,
            onUpdateSubtaskName: handleUpdateSubtaskName,
            onUpdateTask: handleUpdateTask,
            newlyCreatedSubtaskId: newlyCreatedSubtaskId,
          },
        });
      }
    });

    return nodeList;
  }, [
    handleDelete,
    handleToggleCollapse,
    handleAddSubtask,
    handleToggleComplete,
    handleToggleSubtaskComplete,
    handleUpdateName,
    handleUpdateSubtaskName,
    handleUpdateTask,
    newlyCreatedSubtaskId,
    categories,
    priorities,
  ]);

  // Helper to find the root parent task for any task/subtask
  const findRootParent = useCallback((taskList: Task[], taskId: number): number => {
    const task = findTaskById(taskList, taskId);
    if (!task) return taskId;
    
    // Find the root parent by traversing up
    let currentTask = task;
    while (currentTask.parent_id !== null) {
      const parent = findTaskById(taskList, currentTask.parent_id);
      if (!parent) break;
      currentTask = parent;
    }
    return currentTask.id;
  }, [findTaskById]);

  // Convert dependencies to edges
  const dependenciesToEdges = useCallback((deps: TaskDependency[]): Edge[] => {
    return deps.map((dep) => {
      // Find root parents for source and target (for React Flow node IDs)
      const sourceRootId = findRootParent(tasks, dep.source_task_id);
      const targetRootId = findRootParent(tasks, dep.target_task_id);
      
      // Determine handle IDs based on whether it's a task or subtask
      const sourceTask = findTaskById(tasks, dep.source_task_id);
      const targetTask = findTaskById(tasks, dep.target_task_id);
      
      const sourceHandle = sourceTask?.parent_id === null 
        ? `task-${dep.source_task_id}-source`
        : `subtask-${dep.source_task_id}-source`;
        
      const targetHandle = targetTask?.parent_id === null
        ? `task-${dep.target_task_id}-target`
        : `subtask-${dep.target_task_id}-target`;

      // Use custom edge appearance if set, otherwise use defaults
      const edgeColor = dep.edge_color || 'var(--color-primary)';
      const edgeStyle = dep.edge_style || 'smoothstep';
      const edgeWidth = dep.edge_width || 2;
      // Ensure animated is always a boolean, not null
      const edgeAnimated = dep.edge_animated !== null && dep.edge_animated !== undefined 
        ? dep.edge_animated 
        : true;

      return {
        id: `e-${dep.id}`,
        source: sourceRootId.toString(),
        target: targetRootId.toString(),
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: edgeStyle,
        animated: edgeAnimated,
        style: { 
          stroke: edgeColor, 
          strokeWidth: edgeWidth 
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: edgeColor,
        },
        data: {
          dependencyId: dep.id,
        },
      };
    });
  }, [tasks, findRootParent, findTaskById]);

  // Load dependencies
  const loadDependencies = useCallback(async () => {
    try {
      const deps = await tasksService.getDependencies();
      setDependencies(deps);
      setEdges(dependenciesToEdges(deps));
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    }
  }, [dependenciesToEdges]);

  // Initialize nodes and load dependencies
  useEffect(() => {
    setNodes(prevNodes => tasksToNodes(tasks, prevNodes));
    loadDependencies();
  }, [tasks, tasksToNodes, loadDependencies]);

  // Handle node changes (drag, select, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as Node<TaskNodeData>[]);

      // Handle position changes - only save after drop (not during drag)
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // This fires when the drag ends (on drop)
          const nodeId = parseInt(change.id);
          const { x, y } = change.position;

          // Save immediately after drop - fire and forget, no loading state needed
          tasksService.updateTaskPosition(nodeId, x, y)
            .then(() => {
              console.log(`Position saved for task ${nodeId}: (${x.toFixed(0)}, ${y.toFixed(0)})`);
            })
            .catch((error) => {
              console.error('Failed to save position:', error);
              toast({
                title: 'Failed to save position',
                status: 'error',
                duration: 2000,
                isClosable: true,
              });
            });
        }

        // Handle selection
        if (change.type === 'select') {
          const nodeId = parseInt(change.id);
          setSelectedNodeIds((prev) => {
            if (change.selected) {
              return [...prev, nodeId];
            } else {
              return prev.filter((id) => id !== nodeId);
            }
          });
        }
      });
    },
    [toast]
  );

  // Delete dependency
  const deleteDependency = useCallback(
    async (dependencyId: number) => {
      try {
        await tasksService.deleteDependency(dependencyId);
        setDependencies((prev) => prev.filter((dep) => dep.id !== dependencyId));
        setEdges((prev) => prev.filter((edge) => edge.id !== `e-${dependencyId}`));
      } catch (error) {
        console.error('Failed to delete dependency:', error);
        throw error;
      }
    },
    []
  );

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      
      // Handle edge removal
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const edgeId = change.id;
          // Find the dependency that matches this edge
          const dependency = dependencies.find((dep) => `e-${dep.id}` === edgeId);
          if (dependency) {
            deleteDependency(dependency.id);
          }
        }
      });
    },
    [dependencies, deleteDependency]
  );

  // Helper to extract task ID from handle ID
  const extractTaskIdFromHandle = useCallback((nodeId: string, handleId: string | null | undefined): number => {
    // Handle IDs can be:
    // - "task-{id}-target" or "task-{id}-source" for main tasks
    // - "subtask-{id}-target" or "subtask-{id}-source" for subtasks
    // Node ID is the task ID as string
    
    if (handleId) {
      const match = handleId.match(/(?:task|subtask)-(\d+)-(?:target|source)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Fallback to node ID
    return parseInt(nodeId);
  }, []);

  // Handle new connection (drag from handle to handle)
  const onConnect = useCallback(
    async (connection: { source: string | null; target: string | null; sourceHandle?: string | null; targetHandle?: string | null }) => {
      if (!connection.source || !connection.target) return;
      
      // Prevent self-connections
      if (connection.source === connection.target) {
        toast({
          title: 'Invalid connection',
          description: 'Cannot connect a task to itself',
          status: 'warning',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      
      // Extract actual task/subtask IDs from handles
      const sourceId = extractTaskIdFromHandle(connection.source, connection.sourceHandle);
      const targetId = extractTaskIdFromHandle(connection.target, connection.targetHandle);
      
      console.log('Creating dependency via drag:', sourceId, '→', targetId);
      
      try {
        const newDep = await tasksService.createDependency(sourceId, targetId);
        console.log('Dependency created:', newDep);
        
        // Reload all dependencies to ensure consistency
        const allDeps = await tasksService.getDependencies();
        setDependencies(allDeps);
        setEdges(dependenciesToEdges(allDeps));
        
        const sourceName = findTaskById(tasks, sourceId)?.name || `Task ${sourceId}`;
        const targetName = findTaskById(tasks, targetId)?.name || `Task ${targetId}`;
        
        toast({
          title: 'Dependency created',
          description: `${sourceName} → ${targetName}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error: any) {
        console.error('Failed to create dependency:', error);
        toast({
          title: 'Failed to create dependency',
          description: error.response?.data?.error || 'An error occurred',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [dependenciesToEdges, toast, tasks, findTaskById, extractTaskIdFromHandle]
  );

  // Handle node click (for connect mode)
  const handleNodeClick = useCallback(
    async (taskId: number) => {
      console.log('Node clicked:', taskId, 'Connect mode:', connectMode, 'Source:', sourceNodeForConnection);
      
      if (connectMode && sourceNodeForConnection !== null && sourceNodeForConnection !== taskId) {
        try {
          console.log('Creating dependency:', sourceNodeForConnection, '→', taskId);
          const newDep = await tasksService.createDependency(sourceNodeForConnection, taskId);
          console.log('Dependency created:', newDep);
          
          // Update dependencies state
          setDependencies((prev) => {
            const updated = [...prev, newDep];
            // Also update edges immediately
            setEdges(dependenciesToEdges(updated));
            return updated;
          });
          
          toast({
            title: 'Dependency created',
            description: `Task ${sourceNodeForConnection} → Task ${taskId}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });

          // Reset connect mode
          setConnectMode(false);
          setSourceNodeForConnection(null);
        } catch (error: any) {
          console.error('Failed to create dependency:', error);
          toast({
            title: 'Failed to create dependency',
            description: error.response?.data?.error || 'An error occurred',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } else if (connectMode) {
        console.log('Cannot create dependency to same task or invalid state');
      }
    },
    [connectMode, sourceNodeForConnection, dependenciesToEdges, toast]
  );

  // Update nodes with click handler and connect mode
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onNodeClick: handleNodeClick,
          connectMode: connectMode,
        },
      }))
    );
  }, [handleNodeClick, connectMode]);

  // Toggle connect mode
  const toggleConnectMode = useCallback(() => {
    if (!connectMode && selectedNodeIds.length > 0) {
      setConnectMode(true);
      setSourceNodeForConnection(selectedNodeIds[0]);
      console.log('Connect mode enabled. Source task:', selectedNodeIds[0]);
      toast({
        title: 'Connect Mode Active',
        description: 'Click on another task to create a dependency',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else {
      setConnectMode(false);
      setSourceNodeForConnection(null);
      console.log('Connect mode disabled');
    }
  }, [connectMode, selectedNodeIds, toast]);

  // Customize tasks
  const customizeTasks = useCallback(
    async (taskIds: number[], color: string | null, shape: string | null) => {
      try {
        await Promise.all(
          taskIds.map((taskId) => tasksService.updateTaskAppearance(taskId, color, shape))
        );

        // Update nodes - fix: update node.data.task instead of node.data
        setNodes((nds) =>
          nds.map((node) => {
            if (taskIds.includes(parseInt(node.id))) {
              return {
                ...node,
                data: {
                  ...node.data,
                  task: {
                    ...node.data.task,
                    canvas_color: color,
                    canvas_shape: shape,
                  },
                },
              };
            }
            return node;
          })
        );

        // Update tasks in parent state - also update subtasks recursively
        setTasks((prevTasks) => {
          const updateTaskAppearance = (taskList: Task[]): Task[] => {
            return taskList.map((task) => {
              if (taskIds.includes(task.id)) {
                return {
                  ...task,
                  canvas_color: color,
                  canvas_shape: shape,
                  children: task.children ? updateTaskAppearance(task.children) : [],
                };
              }
              return {
                ...task,
                children: task.children ? updateTaskAppearance(task.children) : [],
              };
            });
          };
          return updateTaskAppearance(prevTasks);
        });

        toast({
          title: 'Customization applied',
          description: `Updated ${taskIds.length} task(s)`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to customize tasks:', error);
        toast({
          title: 'Failed to customize tasks',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        throw error;
      }
    },
    [setTasks, toast]
  );

  // Customize edges (dependencies)
  const customizeEdges = useCallback(
    async (
      dependencyIds: number[],
      appearance: {
        edge_color?: string | null;
        edge_style?: string | null;
        edge_width?: number | null;
        edge_animated?: boolean | null;
      }
    ) => {
      try {
        // Update all selected dependencies
        await Promise.all(
          dependencyIds.map((depId) =>
            tasksService.updateDependencyAppearance(depId, appearance)
          )
        );

        // Update dependencies state
        setDependencies((prev) => {
          const updated = prev.map((dep) => {
            if (dependencyIds.includes(dep.id)) {
              return {
                ...dep,
                ...appearance,
              };
            }
            return dep;
          });
          // Regenerate edges with new appearance
          setEdges(dependenciesToEdges(updated));
          return updated;
        });

        toast({
          title: 'Edge customization applied',
          description: `Updated ${dependencyIds.length} edge(s)`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Failed to customize edges:', error);
        toast({
          title: 'Failed to customize edges',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        throw error;
      }
    },
    [dependenciesToEdges, toast]
  );

  return {
    nodes,
    edges,
    dependencies,
    selectedNodeIds,
    setSelectedNodeIds,
    connectMode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    toggleConnectMode,
    customizeTasks,
    customizeEdges,
    deleteDependency,
  };
};


