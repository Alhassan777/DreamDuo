# AOT To Do Client

A modern, feature-rich task management application built with React, TypeScript, and Vite. This client application provides a robust user interface for managing hierarchical tasks with real-time updates and drag-and-drop functionality.

## Architecture Overview

The application follows a modern React architecture with the following key features:

- **TypeScript**: Full TypeScript support for enhanced type safety and developer experience
- **React Hooks**: Custom hooks for state management and business logic
- **WebSocket Integration**: Real-time updates using WebSocket connections
- **Component-Based Structure**: Modular components for maintainable and reusable code
- **Chakra UI**: Comprehensive UI component library for consistent design
- **React Router**: Client-side routing for seamless navigation

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts for state management
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API and WebSocket services
└── styles/         # Global styles and CSS modules
```

## Key Features

### Task Hierarchy System

The application implements a sophisticated task hierarchy system allowing:
- Main tasks
- Subtasks
- Sub-subtasks
- Infinite nesting capabilities

### Drag and Drop Implementation

The drag and drop functionality is implemented using the `useDragAndDrop` custom hook (`src/hooks/useDragAndDrop.ts`). Here's a detailed breakdown:

#### State Management
```typescript
interface DragState {
  type: 'task' | 'subtask' | 'sub-subtask';
  sourceTaskId: number;
  sourceParentId?: number;
  itemId: number;
}
```

#### Key Functions

1. **handleDragStart**:
   - Initializes drag operation
   - Captures source task information
   - Sets visual feedback

2. **handleDrop**:
   - Validates drop target
   - Prevents invalid operations (self-drop, same parent)
   - Updates task hierarchy via API
   - Refreshes task list with WebSocket sync

3. **handleDragEnd**:
   - Cleans up drag state
   - Resets visual feedback

### Real-time Updates

WebSocket integration provides seamless real-time updates:

#### Event Handling
- Task Creation: Instant notification when new tasks are added
- Task Updates: Real-time sync of task modifications
- Task Deletion: Immediate removal of deleted tasks
- Task Completion: Live status updates across clients

#### WebSocket Service
```typescript
websocketService.onTaskCreated((newTask) => {
  // Update local state
  // Refresh task list
});

websocketService.onTaskUpdated((updatedTask) => {
  // Sync changes
  // Update UI
});
```

## Component Architecture

### TaskCard Component
- Handles individual task rendering
- Manages drag and drop events
- Controls task collapse/expand
- Handles inline editing

### Task Management
- Uses `useTasks` hook for CRUD operations
- Implements optimistic updates
- Handles error states
- Maintains task hierarchy integrity

## State Management

### Custom Hooks
1. **useTasks**:
   - Manages task CRUD operations
   - Handles WebSocket updates
   - Maintains task hierarchy

2. **useDragAndDrop**:
   - Controls drag and drop state
   - Validates operations
   - Updates task positions

3. **useTheme**:
   - Manages application theme
   - Handles AOT mode toggle

## API Integration

### Task Service
```typescript
tasksService.moveTask(taskId, newParentId);
tasksService.getTasksByDate(date);
tasksService.createTask(taskData);
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Configuration

Create a `.env` file with:
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations
- Optimized re-renders using React.memo
- Efficient task tree updates
- Debounced real-time updates
- Lazy loading of components
