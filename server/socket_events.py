from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from flask import request
from functools import wraps
import logging

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="http://localhost:5173")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def socket_jwt_required(f):
    """Decorator to require JWT authentication for socket events"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get the token from cookies (since we're using cookie-based auth)
            token = None
            if 'access_token' in request.cookies:
                token = request.cookies['access_token']
            
            if not token:
                emit('error', {'message': 'No token provided'})
                return False
            
            # Verify the token
            try:
                decoded_token = decode_token(token)
                current_user_id = decoded_token['sub']
                return f(current_user_id, *args, **kwargs)
            except Exception as e:
                logger.error(f"Token verification failed: {str(e)}")
                emit('error', {'message': 'Invalid token'})
                return False
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            emit('error', {'message': 'Authentication failed'})
            return False
    return decorated_function

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('authenticate')
@socket_jwt_required
def handle_authenticate(current_user_id):
    """Handle client authentication"""
    logger.info(f"Client authenticated: {current_user_id}")
    
    # Join user to their personal room
    join_room(f"user_{current_user_id}")
    emit('authenticated', {'message': 'Authentication successful', 'user_id': current_user_id})

@socketio.on('join_room')
@socket_jwt_required
def handle_join_room(current_user_id, data):
    """Handle joining a specific room"""
    room = data.get('room')
    if room:
        join_room(room)
        emit('joined_room', {'room': room})
        logger.info(f"User {current_user_id} joined room {room}")

@socketio.on('leave_room')
@socket_jwt_required
def handle_leave_room(current_user_id, data):
    """Handle leaving a specific room"""
    room = data.get('room')
    if room:
        leave_room(room)
        emit('left_room', {'room': room})
        logger.info(f"User {current_user_id} left room {room}")

# Task-related socket events
def emit_task_created(task, user_id=None):
    """Emit task created event"""
    if user_id:
        socketio.emit('task_created', {'task': task}, room=f"user_{user_id}")
    else:
        socketio.emit('task_created', {'task': task})

def emit_task_updated(task, user_id=None):
    """Emit task updated event"""
    if user_id:
        socketio.emit('task_updated', {'task': task}, room=f"user_{user_id}")
    else:
        socketio.emit('task_updated', {'task': task})

def emit_task_deleted(task_id, user_id=None, date_str=None):
    """Emit task deleted event"""
    if user_id:
        socketio.emit('task_deleted', {'taskId': task_id, 'date': date_str}, room=f"user_{user_id}")
    else:
        socketio.emit('task_deleted', {'taskId': task_id, 'date': date_str})

def emit_task_completed(task_id, completed, user_id=None, date_str=None):
    """Emit task completed event"""
    if user_id:
        socketio.emit('task_completed', {'taskId': task_id, 'completed': completed, 'date': date_str}, room=f"user_{user_id}")
    else:
        socketio.emit('task_completed', {'taskId': task_id, 'completed': completed, 'date': date_str})

# Error handling
@socketio.on_error_default
def default_error_handler(e):
    """Default error handler for socket events"""
    logger.error(f"Socket error: {str(e)}")
    emit('error', {'message': 'An error occurred'})
