import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { Task, tasksService, TaskDependency } from '../services/tasks';
import { TaskNodeData } from '../components/canvas/CustomTaskNode';
import { useToast } from '@chakra-ui/react';

interface UseCanvasViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const useCanvasView = ({ tasks, setTasks }: UseCanvasViewProps) => {
  const [nodes, setNodes] = useState<Node<TaskNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState<number | null>(null);
  const toast = useToast();

  // Convert tasks to nodes
  const tasksToNodes = useCallback((taskList: Task[]): Node<TaskNodeData>[] => {
    const nodeList: Node<TaskNodeData>[] = [];

    const processTask = (task: Task, depth: number = 0) => {
      // Calculate position with auto-layout if not set
      const xPos = task.position_x ?? (nodeList.length * 320 % 1200);
      const yPos = task.position_y ?? (Math.floor(nodeList.length / 4) * 200);

      nodeList.push({
        id: task.id.toString(),
        type: 'customTask',
        position: { x: xPos, y: yPos },
        data: {
          id: task.id,
          name: task.name,
          completed: task.completed,
          priority: task.priority,
          category: task.category,
          categoryIcon: task.categoryIcon,
          deadline: task.deadline,
          canvas_color: task.canvas_color,
          canvas_shape: task.canvas_shape,
          childrenCount: task.children?.length || 0,
        },
      });

      // Process children/subtasks
      if (task.children && task.children.length > 0) {
        task.children.forEach((child) => processTask(child, depth + 1));
      }
    };

    taskList.forEach((task) => processTask(task));
    return nodeList;
  }, []);

  // Convert dependencies to edges
  const dependenciesToEdges = useCallback((deps: TaskDependency[]): Edge[] => {
    return deps.map((dep) => ({
      id: `e-${dep.id}`,
      source: dep.source_task_id.toString(),
      target: dep.target_task_id.toString(),
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: 'var(--color-primary)', 
        strokeWidth: 2 
      },
      markerEnd: {
        type: 'arrowclosed' as const,
        color: 'var(--color-primary)',
      },
    }));
  }, []);

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
    setNodes(tasksToNodes(tasks));
    loadDependencies();
  }, [tasks, tasksToNodes, loadDependencies]);

  // Handle node changes (drag, select, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as Node<TaskNodeData>[]);

      // Handle position changes with debounced save
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          const nodeId = parseInt(change.id);
          const { x, y } = change.position;

          // Debounced save
          setTimeout(() => {
            tasksService.updateTaskPosition(nodeId, x, y).catch((error) => {
              console.error('Failed to save position:', error);
              toast({
                title: 'Failed to save position',
                status: 'error',
                duration: 2000,
                isClosable: true,
              });
            });
          }, 500);
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
    [dependencies]
  );

  // Handle new connection (drag from handle to handle)
  const onConnect = useCallback(
    async (connection: { source: string | null; target: string | null }) => {
      if (!connection.source || !connection.target) return;
      
      const sourceId = parseInt(connection.source);
      const targetId = parseInt(connection.target);
      
      console.log('Creating dependency via drag:', sourceId, '→', targetId);
      
      try {
        const newDep = await tasksService.createDependency(sourceId, targetId);
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
          description: `Task ${sourceId} → Task ${targetId}`,
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
    [dependenciesToEdges, toast]
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

        // Update nodes
        setNodes((nds) =>
          nds.map((node) => {
            if (taskIds.includes(parseInt(node.id))) {
              return {
                ...node,
                data: {
                  ...node.data,
                  canvas_color: color,
                  canvas_shape: shape,
                },
              };
            }
            return node;
          })
        );

        // Update tasks in parent state
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
      } catch (error) {
        console.error('Failed to customize tasks:', error);
        throw error;
      }
    },
    [setTasks]
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
    deleteDependency,
  };
};


