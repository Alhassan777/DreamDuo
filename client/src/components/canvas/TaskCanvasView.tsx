import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Flex } from '@chakra-ui/react';
import CustomTaskNode from './CustomTaskNode';
import TaskCustomizationPanel from './TaskCustomizationPanel';
import DependencyControls from './DependencyControls';
import CanvasAddTaskPanel from './CanvasAddTaskPanel';
import { Task, TaskCreateRequest } from '../../services/tasks';
import { Category } from '../../services/tags';
import { useCanvasView } from '../../hooks/useCanvasView';

interface PriorityColor {
  level: string;
  color: string;
}

interface TaskCanvasViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  categories: Category[];
  priorities: PriorityColor[];
  anchorDate: Date;
  onCreateTask: (task: TaskCreateRequest) => Promise<void>;
}

const TaskCanvasView: React.FC<TaskCanvasViewProps> = ({ 
  tasks, 
  setTasks,
  categories,
  priorities,
  anchorDate,
  onCreateTask,
}) => {
  const {
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
  } = useCanvasView({ tasks, setTasks });

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      customTask: CustomTaskNode as React.ComponentType<any>,
    }),
    []
  );

  return (
    <Flex w="100%" h="calc(100vh - 200px)" position="relative">
      {/* Main Canvas */}
      <Box 
        flex={1} 
        border="1px solid" 
        borderColor="var(--color-border)" 
        borderRadius="var(--border-radius-lg)" 
        overflow="hidden"
        bg="var(--color-background)"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          onPaneClick={() => setSelectedNodeIds([])}
          style={{
            background: 'var(--color-background)',
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--color-border)"
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.canvas_color) {
                return node.data.canvas_color as string;
              }
              return node.data?.completed ? 'var(--color-status-completed)' : 'var(--color-card-background)';
            }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          />
        </ReactFlow>
      </Box>

      {/* Right Sidebar - Unified Scrollable Panel */}
      <Box
        w="340px"
        ml={4}
        maxH="calc(100vh - 200px)"
        overflowY="auto"
        overflowX="hidden"
        bg="var(--color-surface)"
        borderRadius="var(--border-radius-lg)"
        border="1px solid"
        borderColor="var(--color-border)"
        boxShadow="lg"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--color-background)',
            borderRadius: 'var(--border-radius-md)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--color-border)',
            borderRadius: 'var(--border-radius-md)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--color-primary)',
          },
        }}
      >
        <Box display="flex" flexDirection="column" gap={4} p={4}>
          {/* Add New Task Panel */}
          <CanvasAddTaskPanel
            categories={categories}
            priorities={priorities}
            anchorDate={anchorDate}
            onCreateTask={onCreateTask}
          />

          {/* Task Customization Panel */}
          <TaskCustomizationPanel
            selectedTaskIds={selectedNodeIds}
            onCustomize={customizeTasks}
          />

          {/* Dependency Controls */}
          <DependencyControls
            selectedTaskIds={selectedNodeIds}
            dependencies={dependencies}
            tasks={tasks}
            connectMode={connectMode}
            onToggleConnectMode={toggleConnectMode}
            onDeleteDependency={deleteDependency}
          />
        </Box>
      </Box>
    </Flex>
  );
};

export default TaskCanvasView;


