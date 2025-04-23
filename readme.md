# Advanced Task Management Application (AOT-Theme)




https://github.com/user-attachments/assets/47349081-100e-492d-80fb-d01036ffb772


## Project Overview

This task management application is built on principles of strategy, discipline, and adaptability. It helps users organize their tasks with precision while maintaining the flexibility to adjust to changing priorities.

The application's powerful infinite hierarchical structure helps break down massive goals into manageable pieces with no limit to nesting depth. Each task becomes a small step in your larger campaign for productivity, and the intuitive drag and drop interface makes reorganizing your workflow effortless.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 16 or higher
- **PostgreSQL** 12 or higher

## Getting Started

### 1. Clone the Repository

```sh
git clone <https://github.com/Alhassan777/Attack_On_Titan_To_Do_List>
```

## Backend Setup

### 2. Setup Virtual Environment

Navigate to the server directory:

```sh
cd server
```

Create and activate a virtual environment:

```sh
python -m venv venv
source venv/bin/activate  # On macOS
```

Install dependencies:

```sh
pip install -r requirements.txt
```

### PostgreSQL Database Setup (macOS)

### 3. Install and Start PostgreSQL

Install PostgreSQL using Homebrew:

```sh
brew install postgresql
```

Start PostgreSQL service:

```sh
brew services start postgresql
```

Verify PostgreSQL is running:

```sh
brew services list
```

### 4. Create a PostgreSQL Database and User

Access PostgreSQL interactive shell:

```sh
psql postgres
```

Create a new database:

```sql
CREATE DATABASE todo_app;
```

Create a new user and set a password:

```sql
CREATE USER todo_user WITH ENCRYPTED PASSWORD 'yourpassword';
```

Grant privileges to the new user:

```sql
GRANT ALL PRIVILEGES ON DATABASE todo_app TO todo_user;
```

Exit PostgreSQL:

```sh
\q
```

### 5. Configure Environment Variables

Create a `.env` file in the `server` directory and add the following:

```sh
DATABASE_URL=postgresql://todo_user:yourpassword@localhost:5432/todo_app
JWT_SECRET_KEY=your_secret_key_here
```

### 6. Initialize the Database

Apply database migrations:

```sh
flask db upgrade
```

### 7. Start the Backend Server

```sh
python app.py
```

The backend server will run on [http://localhost:3001](http://localhost:3001).

## Troubleshooting Common Database Issues

### 1. PostgreSQL Service Not Running
**Symptoms:**
- Connection refused errors
- 'psql: could not connect to server' messages
- Unable to connect to database when running the application

**Solutions:**
1. Restart PostgreSQL service:
```sh
brew services restart postgresql
```

2. Verify PostgreSQL is running:
```sh
pg_isready
# or
brew services list | grep postgresql
```

3. Check PostgreSQL logs for errors:
```sh
cat $(brew --prefix)/var/log/postgresql.log
```

### 2. Database User and Privileges Issues
**Symptoms:**
- Permission denied for database 'todo_app'
- Authentication failures
- "role todo_user does not exist"
- "database todo_app does not exist"

**Solutions:**
1. Verify user exists and has correct privileges:
```sql
SELECT rolname, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = 'todo_user';
```

2. If user doesn't exist or has incorrect privileges:
```sql
-- Drop user if exists with incorrect settings
DROP USER IF EXISTS todo_user;

-- Recreate user with correct privileges
CREATE USER todo_user WITH ENCRYPTED PASSWORD 'yourpassword' CREATEDB;

-- Recreate database
DROP DATABASE IF EXISTS todo_app;
CREATE DATABASE todo_app;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE todo_app TO todo_user;
\c todo_app
GRANT ALL ON SCHEMA public TO todo_user;
```

### 3. Environment Variable and Configuration Issues
**Symptoms:**
- "DATABASE_URL environment variable is not set"
- Database connection errors
- JWT token related errors

**Solutions:**
1. Verify .env file exists in server directory:
```sh
ls -la server/.env
```

2. Ensure .env file contains correct configuration:
```sh
# server/.env
DATABASE_URL=postgresql://todo_user:yourpassword@localhost:5432/todo_app
JWT_SECRET_KEY=your_secret_key_here  # Required for authentication
```

3. Validate environment variables are loaded:
```sh
echo $DATABASE_URL
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL'))"
```

### 4. Database Migration Issues
**Symptoms:**
- "Table does not exist" errors
- Missing columns or tables
- Alembic version errors

**Solutions:**
1. Clean migration setup (if having issues):
```sh
# Remove existing migration files if they're corrupted
rm -rf server/migrations/versions/*

# Initialize fresh migrations
flask db init
flask db migrate -m "initial migration"
flask db upgrade
```

2. If migrations fail or tables are out of sync:
```sh
# Reset migration state
flask db stamp head

# Create new migration
flask db migrate

# Apply migration
flask db upgrade
```

3. Verify database state:
```sql
-- Check existing tables
\dt

-- Check alembic version
SELECT * FROM alembic_version;
```

### 5. Python Environment and Dependency Issues
**Symptoms:**
- Import errors
- Module not found errors
- Version conflicts

**Solutions:**
1. Clean virtual environment setup:
```sh
# Remove existing venv if issues persist
rm -rf server/venv

# Create fresh venv
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

2. If dependency conflicts occur:
```sh
pip install -r requirements.txt --force-reinstall
```

3. Verify all required packages are installed:
```sh
pip freeze | grep -E "Flask|SQLAlchemy|psycopg2-binary|python-dotenv"
```

**Important Notes:**
- Always ensure PostgreSQL is running before attempting database operations
- Check PostgreSQL logs if connection issues persist
- Make sure to activate virtual environment before running any Python commands
- Keep track of migration files and don't modify them manually
- Backup your database before running migrations in production

## Frontend Setup

### 8. Install Dependencies

Open a new terminal and navigate to the `client` directory:

```sh
cd client
```

Install required dependencies:

```sh
npm install
```

### 9. Start the Frontend Development Server

```sh
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Features

### Task Management
- **Infinite Task Hierarchies**: Create unlimited nested task structures with no depth limitations
  - Break down complex projects into manageable sub-tasks
  - Organize related tasks with parent-child relationships
  - Navigate through multiple levels of task dependencies
  - Collapse and expand task trees for focused work
  - Automatically track completion status across hierarchy levels

- **Drag & Drop Interface**: Effortlessly reorganize tasks and hierarchies with intuitive drag and drop functionality
  - Reorder tasks by dragging them to new positions
  - Create parent-child relationships by dropping tasks onto others
  - Move entire task branches with a single drag operation
  - Visual indicators show valid drop zones during drag operations
  - Undo/redo support for all drag and drop actions

- **Priority Management**: Assign importance levels to focus on what matters most
  - Visual indicators for priority levels
  - Filter and sort tasks by priority

- **Categorization**: Group related tasks with custom tags for better organization
  - Create and manage custom categories
  - Assign multiple categories to tasks
  - Filter tasks by category

### User Experience
- **Profile Customization**: Edit your profile information, upload avatars, and manage personal preferences
  - Update personal information (name, email, bio)
  - Upload and crop profile pictures
  - Set language preferences
  - Configure accessibility options
  - Manage connected accounts and integrations

- **Theme Selection**: Choose between light, dark, and custom color themes to personalize your experience
  - System-based theme detection
  - Custom accent color selection
  - Font size and style preferences
  - High contrast mode for accessibility

- **Notification Settings**: Configure how and when you receive alerts about task updates and deadlines
  - Email notification preferences
  - Browser notifications
  - Reminder frequency and timing
  - Custom notification rules for specific projects

### Performance & Analytics
- **Progress Analytics**: Track completion rates and productivity patterns
  - Visual dashboards showing task completion metrics
  - Time tracking and productivity analysis
  - Historical performance data

- **Real-time Collaboration**: Instant updates across all connected clients
  - See changes from team members in real-time
  - Collaborative editing with conflict resolution

- **User Authentication**: Secure login and personalized task management
  - Multi-factor authentication
  - Session management
  - Password recovery

- **Customizable Settings**: Tailor the application to your workflow preferences
  - Default view configurations
  - Custom keyboard shortcuts
  - Workspace layout preferences

## Development Notes

- Backend API runs on port `3001`
- Frontend development server runs on port `5173`
- CORS is configured to allow communication between these ports

## Database Schema

The application uses PostgreSQL with the following main models:

- **Users**: Account information, authentication details, and profile data
- **Tasks**: Core task data including title, description, and status
- **Categories**: Custom groupings for task organization
- **Task Hierarchies**: Recursive parent-child relationships between tasks supporting infinite nesting
- **User Settings**: Personalization options including theme preferences and notification settings
- **User Profiles**: Extended user information including avatars, bios, and customization options

## Technical Implementation

### Infinite Task Hierarchy

The infinite task hierarchy system is implemented using a recursive relationship pattern in the database:

- **Adjacency List Model**: Each task record contains a reference to its parent task
- **Path Enumeration**: Tasks store their full hierarchical path for efficient querying
- **Materialized Path**: Optimized storage of hierarchical relationships for fast traversal
- **Recursive Queries**: PostgreSQL's Common Table Expressions (CTEs) enable efficient recursive queries

Performance considerations:

- Lazy loading of deep hierarchy levels to maintain responsiveness
- Caching of frequently accessed hierarchy branches
- Pagination of child tasks for large hierarchies
- Optimized database indexes on parent-child relationships

### Drag and Drop Implementation

The intuitive drag and drop interface is built using:

- **React DnD**: Provides the core drag and drop functionality
- **Custom Drop Zones**: Intelligent handling of valid drop targets
- **Optimistic UI Updates**: Interface updates immediately while changes sync to the backend
- **Hierarchy Validation**: Prevents invalid operations like creating circular references
- **Undo/Redo Stack**: Maintains history of drag operations for easy reversal

### Profile Customization

User profile customization is implemented with:

- **Secure Storage**: Profile data stored with proper encryption and access controls
- **Image Processing**: Server-side processing for avatar uploads with resizing and optimization
- **Theme Engine**: Dynamic CSS variable system for real-time theme switching
- **Preference Persistence**: User settings synchronized across devices and sessions
- **Notification System**: Event-driven architecture for customizable alerts and reminders
