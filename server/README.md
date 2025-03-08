# AOT To Do Server

A robust Flask-based backend for the AOT To Do application, providing RESTful API endpoints, WebSocket real-time updates, and a hierarchical task management system.

## Architecture Overview

The server follows a modern Flask architecture with the following key features:

- **Flask**: Core web framework for handling HTTP requests
- **SQLAlchemy**: ORM for database interactions
- **Flask-SocketIO**: WebSocket implementation for real-time updates
- **Flask-JWT-Extended**: Authentication and authorization
- **Flask-Migrate**: Database migration management

## Project Structure

```
server/
├── app.py                # Application entry point and configuration
├── models/               # Database models
│   ├── task.py           # Task model definition
│   ├── task_hierarchy.py # Task hierarchy implementation
│   ├── user.py           # User model and authentication
│   └── ...               # Other models
├── routes/               # API endpoints
│   ├── tasks.py          # Task-related endpoints
│   ├── auth.py           # Authentication endpoints
│   └── ...               # Other route modules
├── socket_events.py      # WebSocket event handlers
└── migrations/           # Database migration scripts
```

## Database Schema

### Task Model
```python
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    creation_date = db.Column(db.Date, nullable=False)
    deadline = db.Column(db.DateTime)
    priority_id = db.Column(db.Integer, db.ForeignKey('priority.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
```

### Task Hierarchy Implementation
- Self-referential relationship for parent-child tasks
- Recursive query support for nested task retrieval
- Efficient tree traversal algorithms
- Integrity constraints for hierarchy maintenance

## WebSocket Implementation

### Event Handlers
```python
@socketio.on('task_created')
def handle_task_created(task_data):
    # Broadcast to all connected clients
    emit('task_created', task_data, broadcast=True)

@socketio.on('task_updated')
def handle_task_updated(task_data):
    # Broadcast updates to all clients
    emit('task_updated', task_data, broadcast=True)
```

### Real-time Features
- Bidirectional communication
- Room-based event broadcasting
- Automatic reconnection handling
- Session management

## API Endpoints

### Task Management

#### Create Task
```
POST /api/tasks
Content-Type: application/json

Request:
{
    "name": "string",
    "parent_id": "number | null",
    "priority": "string",
    "category_id": "number",
    "deadline": "string (ISO date)"
}

Response:
{
    "id": "number",
    "name": "string",
    "completed": "boolean",
    "children": []
}
```

#### Move Task
```
PATCH /api/tasks/{taskId}/move
Content-Type: application/json

Request:
{
    "new_parent_id": "number"
}

Response:
{
    "success": "boolean",
    "message": "string"
}
```

## Authentication Flow

1. **Registration**:
   ```
   POST /api/auth/register
   Content-Type: application/json
   
   Request:
   {
       "username": "string",
       "email": "string",
       "password": "string"
   }
   ```

2. **Login**:
   ```
   POST /api/auth/login
   Content-Type: application/json
   
   Request:
   {
       "email": "string",
       "password": "string"
   }
   
   Response:
   {
       "access_token": "string",
       "refresh_token": "string"
   }
   ```

## Development Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
export DATABASE_URL=postgresql://localhost/aot_todo
export JWT_SECRET_KEY=your-secret-key
```

4. Initialize database:
```bash
flask db upgrade
```

5. Run development server:
```bash
flask run
```

## Deployment Considerations

### Database
- Use connection pooling
- Implement database indexing
- Regular backup strategy
- Migration planning

### Security
- CORS configuration
- Rate limiting
- Input validation
- XSS protection
- CSRF protection

### Performance
- Query optimization
- Caching strategy
- Connection pooling
- Load balancing

### Monitoring
- Error tracking
- Performance metrics
- Resource utilization
- User analytics