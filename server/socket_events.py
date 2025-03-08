from flask_socketio import SocketIO, emit
from flask_jwt_extended import decode_token
from flask import request
from datetime import datetime

# Initialize SocketIO instance
socketio = SocketIO()

# Store active connections
active_connections = {}

@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connections"""
    print('Client connected')
    # We'll authenticate users when they connect
    # This could be done with cookies or tokens

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnections"""
    print('Client disconnected')
    # Remove user from active connections if they were authenticated
    for user_id, sid in list(active_connections.items()):
        if sid == request.sid:
            del active_connections[user_id]
            break

@socketio.on('authenticate')
def handle_authenticate(data):
    """Authenticate a user via their JWT token from cookies"""
    try:
        # Extract the JWT token from the request cookies
        cookies = request.cookies
        token = cookies.get('access_token_cookie')
        
        if not token:
            print('No token found in cookies')
            return False
        
        # Decode the token to get the user_id
        decoded = decode_token(token)
        user_id = decoded['sub']
        
        # Store the user's connection
        active_connections[user_id] = request.sid
        print(f'User {user_id} authenticated via cookie')
        return True
    except Exception as e:
        print(f'Authentication error: {str(e)}')
        return False

def emit_task_created(task_data, user_id):
    """Emit a task_created event to the appropriate user"""
    # Extract date from task for filtering
    creation_date = None
    if 'creation_date' in task_data:
        try:
            dt = datetime.fromisoformat(task_data['creation_date'])
            creation_date = dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            pass
    
    # Emit to the specific user if they're connected
    if user_id in active_connections:
        socketio.emit('task_created', {
            'task': task_data,
            'date': creation_date
        }, room=active_connections[user_id])

def emit_task_updated(task_data, user_id):
    """Emit a task_updated event to the appropriate user"""
    # Extract date from task for filtering
    creation_date = None
    if 'creation_date' in task_data:
        try:
            dt = datetime.fromisoformat(task_data['creation_date'])
            creation_date = dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            pass
    
    # Emit to the specific user if they're connected
    if user_id in active_connections:
        socketio.emit('task_updated', {
            'task': task_data,
            'date': creation_date
        }, room=active_connections[user_id])

def emit_task_deleted(task_id, user_id, date=None):
    """Emit a task_deleted event to the appropriate user"""
    # Emit to the specific user if they're connected
    if user_id in active_connections:
        socketio.emit('task_deleted', {
            'taskId': task_id,
            'date': date
        }, room=active_connections[user_id])

def emit_task_completed(task_id, completed, user_id, date=None):
    """Emit a task_completed event to the appropriate user"""
    # Emit to the specific user if they're connected
    if user_id in active_connections:
        socketio.emit('task_completed', {
            'taskId': task_id,
            'completed': completed,
            'date': date
        }, room=active_connections[user_id])