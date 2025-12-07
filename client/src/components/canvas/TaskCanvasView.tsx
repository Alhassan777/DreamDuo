import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './CanvasStyles.css';
import { Box, Flex } from '@chakra-ui/react';
import CustomTaskNode from './CustomTaskNode';
import TaskCustomizationPanel from './TaskCustomizationPanel';
import EdgeCustomizationPanel from './EdgeCustomizationPanel';
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
  onRefresh?: () => void;
}

const TaskCanvasView: React.FC<TaskCanvasViewProps> = ({ 
  tasks, 
  setTasks,
  categories,
  priorities,
  anchorDate,
  onCreateTask,
  onRefresh,
}) => {
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<number[]>([]);

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
    customizeEdges,
    deleteDependency,
  } = useCanvasView({ tasks, setTasks, categories, priorities, onRefresh });

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      customTask: CustomTaskNode as React.ComponentType<any>,
    }),
    []
  );

  // Handle edge selection
  const handleEdgeClick = (_event: React.MouseEvent, edge: any) => {
    const dependencyId = edge.data?.dependencyId;
    if (dependencyId) {
      setSelectedEdgeIds([dependencyId]);
      // Clear node selection when edge is selected
      setSelectedNodeIds([]);
    }
  };

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
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          onPaneClick={() => {
            setSelectedNodeIds([]);
            setSelectedEdgeIds([]);
          }}
          connectionRadius={30}
          connectionLineStyle={{ stroke: 'var(--color-primary)', strokeWidth: 3 }}
          elevateEdgesOnSelect={true}
          edgesReconnectable={true}
          deleteKeyCode={null}
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

          {/* Task Customization Panel - Only show when task(s) selected */}
          {selectedNodeIds.length > 0 && (
            <TaskCustomizationPanel
              selectedTaskIds={selectedNodeIds}
              onCustomize={customizeTasks}
            />
          )}

          {/* Edge Customization Panel - Only show when edge(s) selected */}
          {selectedEdgeIds.length > 0 && (
            <EdgeCustomizationPanel
              selectedEdgeIds={selectedEdgeIds}
              onCustomize={customizeEdges}
            />
          )}

          {/* Dependency Controls - Only show when task(s) or edge(s) selected */}
          {(selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) && (
            <DependencyControls
              selectedTaskIds={selectedNodeIds}
              selectedEdgeIds={selectedEdgeIds}
              dependencies={dependencies}
              tasks={tasks}
              connectMode={connectMode}
              onToggleConnectMode={toggleConnectMode}
              onDeleteDependency={deleteDependency}
            />
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default TaskCanvasView;


