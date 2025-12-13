# Attack On Titan To-Do List

A full-stack task management application with hierarchical task organization, real-time multi-device synchronization, and an interactive canvas visualization. Built with React/TypeScript on the frontend and Flask/Python on the backend.

## Description

This project implements a task management system with unlimited subtask nesting, dependency graphs, and visual workflow representation. Tasks sync in real-time across devices through WebSocket connections. The application supports two views: a traditional list view with collapsible hierarchies and an interactive canvas where tasks become draggable nodes connected by dependency edges.

The system handles complex relationships: tasks can have parent-child hierarchies (for breaking down work), task-to-task dependencies (for workflow ordering), and category/priority assignments. A calendar view aggregates tasks by date, and a dashboard provides completion statistics.

## Interesting Techniques

The codebase demonstrates several noteworthy patterns:

**[Recursive React Components](https://react.dev/learn/rendering-lists#rendering-data-from-arrays)** - [`SubtaskCard.tsx`](client/src/components/SubtaskCard.tsx) renders itself recursively to support unlimited task nesting depth. Each subtask can contain more subtasks without modifying the component.

**[Custom React Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)** - Complex state logic is encapsulated in hooks like [`useTasks`](client/src/hooks/useTasks.ts) and [`useCanvasView`](client/src/hooks/useCanvasView.ts), keeping components focused on presentation.

**[WebSocket Real-Time Sync](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - The [`websocketService`](client/src/services/websocket.ts) maintains persistent connections for instant cross-device updates. Room-based broadcasting ensures users only receive their own task events.

**[CSS Custom Properties for Theming](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)** - Theme colors and typography are defined as CSS variables in [`theme-variables.css`](client/src/styles/theme-variables.css), enabling dynamic theme switching without CSS rebuilds.

**[Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)** - Native HTML5 drag-and-drop in [`SubtaskCard.tsx`](client/src/components/SubtaskCard.tsx) handles task reordering and hierarchy changes with `onDragStart`, `onDragOver`, and `onDrop` events.

**[Flask Application Factory Pattern](https://flask.palletsprojects.com/patterns/appfactories/)** - The [`app.py`](server/app.py) uses a factory function to create Flask instances with different configurations for testing, development, and production.

**[SQLAlchemy Self-Referential Relationships](https://docs.sqlalchemy.org/en/20/orm/self_referential.html)** - Tasks reference themselves through `parent_id` foreign keys, enabling the tree structure without fixed depth limits.

**[Depth-First Search for Cycle Detection](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** - Before creating task dependencies, the backend validates that no circular dependencies would be created using DFS graph traversal.

**[JWT Authentication with HTTP-Only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)** - Session tokens are stored in HTTP-only cookies to prevent XSS attacks while maintaining stateless authentication.

**[React Context API for State Management](https://react.dev/reference/react/useContext)** - Global state (authentication, theme, sidebar) uses Context providers in [`contexts/`](client/src/contexts/) rather than prop drilling.

## Technologies and Libraries

The project uses several libraries that handle complex functionality:

**[@xyflow/react](https://reactflow.dev/)** - Powers the interactive canvas view. Handles node positioning, edge routing, connection validation, and viewport controls with minimal configuration.

**[@hello-pangea/dnd](https://github.com/hello-pangea/dnd)** - Maintained fork of react-beautiful-dnd for drag-and-drop. Provides smooth animations and accessibility features out of the box.

**[@chakra-ui/react](https://chakra-ui.com/)** - Component library with built-in dark mode, responsive design, and accessibility. Reduces custom CSS while maintaining flexibility through the `sx` prop.

**[Framer Motion](https://www.framer.com/motion/)** - Animation library that powers Chakra UI's transitions. Handles enter/exit animations and gesture recognition.

**[Socket.IO](https://socket.io/)** - WebSocket library with automatic reconnection, room management, and fallback to long-polling when WebSocket isn't available.

**[Flask-SocketIO](https://flask-socketio.readthedocs.io/)** - Server-side Socket.IO implementation for Flask. Handles WebSocket connections, room broadcasting, and authentication.

**[SQLAlchemy](https://www.sqlalchemy.org/)** - ORM that maps Python classes to database tables. Handles connection pooling, query building, and relationship management.

**[Flask-Migrate](https://flask-migrate.readthedocs.io/)** - Database migration tool built on Alembic. Generates migration scripts automatically from model changes.

**[Supabase](https://supabase.com/)** - Provides OAuth authentication (Google, GitHub, Facebook) without implementing the OAuth flow manually.

**[Vite](https://vitejs.dev/)** - Build tool with near-instant hot module replacement during development. Uses native ES modules instead of bundling during dev.

**[date-fns](https://date-fns.org/)** - Date manipulation library used for calendar calculations and deadline formatting.

**[react-colorful](https://www.npmjs.com/package/react-colorful)** - Lightweight color picker component for the theme customization system.

**[Axios](https://axios-http.com/)** - HTTP client with interceptors for adding authentication headers and handling errors globally.

## Project Structure

```
Attack_On_Titan_To_Do_List/
├── client/                      # React frontend
│   ├── dist/                    # Production build output
│   │   └── assets/              # Bundled JS, CSS, and images
│   ├── src/
│   │   ├── assets/              # Images and audio files
│   │   │   ├── audio/           # Sound effects
│   │   │   └── styles/          # Global animation styles
│   │   ├── components/          # React components
│   │   │   ├── auth/            # OAuth buttons
│   │   │   ├── calendar/        # Calendar day icons
│   │   │   ├── canvas/          # Canvas view components
│   │   │   ├── dashboard/       # Dashboard filters
│   │   │   ├── tags/            # Category management
│   │   │   ├── tasks/           # Task list components
│   │   │   ├── theme/           # Theme customization UI
│   │   │   └── styles/          # Component-specific CSS
│   │   ├── config/              # Configuration (Supabase, themes)
│   │   ├── contexts/            # React Context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Top-level page components
│   │   ├── services/            # API and WebSocket clients
│   │   └── styles/              # Global styles and variables
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── server/                      # Flask backend
│   ├── config/                  # Server configuration
│   ├── migrations/              # Database migration scripts
│   │   └── versions/            # Individual migration files
│   ├── models/                  # SQLAlchemy ORM models
│   ├── routes/                  # API endpoint blueprints
│   ├── services/                # External service integrations
│   ├── testing/                 # Test suite
│   ├── app.py                   # Application factory
│   ├── requirements.txt         # Python dependencies
│   └── socket_events.py         # WebSocket event handlers
└── CAPSTONE_WORK_PRODUCT.md     # Detailed technical documentation
```

**Notable directories:**

- [`client/src/components/canvas/`](client/src/components/canvas/) - Contains the React Flow implementation with custom node types and edge styling controls
- [`client/src/hooks/`](client/src/hooks/) - Custom hooks that encapsulate business logic for tasks, filters, canvas, and drag-and-drop
- [`server/models/`](server/models/) - Database models with self-referential task hierarchy and dependency graph relationships
- [`server/migrations/versions/`](server/migrations/versions/) - Schema evolution history showing OAuth integration, theme support, and temporal task features
- [`server/testing/`](server/testing/) - Comprehensive test suite covering authentication, task CRUD, dependencies, and WebSocket events

