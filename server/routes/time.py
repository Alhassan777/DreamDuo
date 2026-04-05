from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import TimeLog, Task, db
from . import time_bp
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from socket_events import emit_timer_started, emit_timer_stopped, emit_time_log_deleted


@time_bp.route('/start', methods=['POST'])
@jwt_required()
def start_timer():
    """Start a timer for a task. Only one timer can be active at a time."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    task_id = data.get('task_id')
    if not task_id:
        return jsonify({'error': 'task_id is required'}), 400
    
    # Verify task exists and belongs to user
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Check if there's already an active timer for this user
    active_timer = TimeLog.query.filter_by(
        user_id=user_id,
        end_time=None
    ).first()
    
    if active_timer:
        return jsonify({
            'error': 'A timer is already running',
            'active_timer': active_timer.to_dict()
        }), 409
    
    # Create new time log entry
    time_log = TimeLog(
        task_id=task_id,
        user_id=user_id,
        start_time=datetime.now(),
        notes=data.get('notes'),
        source=data.get('source', 'web'),
        active_url=data.get('active_url')
    )
    
    db.session.add(time_log)
    db.session.commit()
    
    # Emit WebSocket event for real-time updates
    emit_timer_started(time_log.to_dict(), user_id)
    
    return jsonify({
        'success': True,
        'data': time_log.to_dict()
    }), 201


@time_bp.route('/stop', methods=['POST'])
@jwt_required()
def stop_timer():
    """Stop the currently active timer."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    # Find active timer
    active_timer = TimeLog.query.filter_by(
        user_id=user_id,
        end_time=None
    ).first()
    
    if not active_timer:
        return jsonify({'error': 'No active timer found'}), 404
    
    # Stop the timer
    active_timer.stop_timer()
    
    # Update notes if provided
    if 'notes' in data:
        active_timer.notes = data['notes']
    
    db.session.commit()
    
    # Emit WebSocket event for real-time updates
    emit_timer_stopped(active_timer.to_dict(), user_id)
    
    return jsonify({
        'success': True,
        'data': active_timer.to_dict()
    }), 200


@time_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_timer():
    """Get the currently active timer, if any."""
    user_id = get_jwt_identity()
    
    active_timer = TimeLog.query.filter_by(
        user_id=user_id,
        end_time=None
    ).first()
    
    if not active_timer:
        return jsonify({
            'success': True,
            'data': None
        }), 200
    
    # Calculate current elapsed time
    timer_data = active_timer.to_dict()
    elapsed = int((datetime.now() - active_timer.start_time).total_seconds())
    timer_data['elapsed_seconds'] = elapsed
    
    return jsonify({
        'success': True,
        'data': timer_data
    }), 200


@time_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_time_logs():
    """Get time logs with optional filters."""
    user_id = get_jwt_identity()
    
    # Query parameters
    task_id = request.args.get('task_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # Build query
    query = TimeLog.query.filter_by(user_id=user_id)
    
    # Filter by task if specified
    if task_id:
        query = query.filter_by(task_id=task_id)
    
    # Filter by date range
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(TimeLog.start_time >= start_dt)
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(TimeLog.start_time <= end_dt)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
    
    # Order by most recent first and paginate
    total = query.count()
    logs = query.order_by(TimeLog.start_time.desc()).offset(offset).limit(limit).all()
    
    return jsonify({
        'success': True,
        'data': [log.to_dict() for log in logs],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200


@time_bp.route('/logs/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_time_log(log_id):
    """Delete a time log entry."""
    user_id = get_jwt_identity()
    
    time_log = TimeLog.query.filter_by(id=log_id, user_id=user_id).first()
    
    if not time_log:
        return jsonify({'error': 'Time log not found'}), 404
    
    db.session.delete(time_log)
    db.session.commit()
    
    # Emit WebSocket event for real-time updates
    emit_time_log_deleted(log_id, user_id)
    
    return jsonify({
        'success': True,
        'message': 'Time log deleted successfully'
    }), 200


@time_bp.route('/logs/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_time_log(log_id):
    """Update a time log entry (notes only for completed entries)."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    time_log = TimeLog.query.filter_by(id=log_id, user_id=user_id).first()
    
    if not time_log:
        return jsonify({'error': 'Time log not found'}), 404
    
    if 'notes' in data:
        time_log.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': time_log.to_dict()
    }), 200


@time_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_time_stats():
    """Get time tracking statistics for the dashboard."""
    user_id = get_jwt_identity()
    
    # Query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Default to current month if no dates provided
    now = datetime.now()
    if not start_date:
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    
    if not end_date:
        # Last day of current month
        next_month = start_dt.replace(day=28) + timedelta(days=4)
        end_dt = next_month.replace(day=1) - timedelta(days=1)
        end_dt = end_dt.replace(hour=23, minute=59, second=59)
    else:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
    
    # Get completed time logs in date range
    logs = TimeLog.query.filter(
        TimeLog.user_id == user_id,
        TimeLog.end_time != None,
        TimeLog.start_time >= start_dt,
        TimeLog.start_time <= end_dt
    ).all()
    
    # Calculate total time
    total_seconds = sum(log.duration_seconds or 0 for log in logs)
    
    # Group by task
    task_times = {}
    for log in logs:
        if log.task_id not in task_times:
            task_times[log.task_id] = {
                'task_id': log.task_id,
                'task_name': log.task.name if log.task else 'Unknown',
                'total_seconds': 0,
                'log_count': 0
            }
        task_times[log.task_id]['total_seconds'] += log.duration_seconds or 0
        task_times[log.task_id]['log_count'] += 1
    
    # Sort tasks by total time (descending)
    tasks_sorted = sorted(task_times.values(), key=lambda x: x['total_seconds'], reverse=True)
    
    # Group by date for daily breakdown
    daily_times = {}
    for log in logs:
        date_str = log.start_time.strftime('%Y-%m-%d')
        if date_str not in daily_times:
            daily_times[date_str] = {
                'date': date_str,
                'total_seconds': 0,
                'log_count': 0
            }
        daily_times[date_str]['total_seconds'] += log.duration_seconds or 0
        daily_times[date_str]['log_count'] += 1
    
    # Sort daily breakdown by date
    daily_sorted = sorted(daily_times.values(), key=lambda x: x['date'])
    
    # Calculate weekly stats (Mon-Sun)
    weekly_stats = []
    days_of_week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    # Get start of current week (Monday)
    current_day = now.weekday()
    week_start = now - timedelta(days=current_day)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    for i, day_name in enumerate(days_of_week):
        day_date = week_start + timedelta(days=i)
        day_str = day_date.strftime('%Y-%m-%d')
        
        day_data = daily_times.get(day_str, {'total_seconds': 0, 'log_count': 0})
        weekly_stats.append({
            'day': day_name,
            'date': day_str,
            'total_seconds': day_data['total_seconds'],
            'log_count': day_data.get('log_count', 0)
        })
    
    # Today's stats
    today_str = now.strftime('%Y-%m-%d')
    today_data = daily_times.get(today_str, {'total_seconds': 0, 'log_count': 0})
    
    return jsonify({
        'success': True,
        'data': {
            'total_time_seconds': total_seconds,
            'today_seconds': today_data['total_seconds'],
            'today_log_count': today_data.get('log_count', 0),
            'tasks': tasks_sorted,
            'daily_breakdown': daily_sorted,
            'weekly_stats': weekly_stats,
            'date_range': {
                'start': start_dt.strftime('%Y-%m-%d'),
                'end': end_dt.strftime('%Y-%m-%d')
            }
        }
    }), 200


@time_bp.route('/task/<int:task_id>/total', methods=['GET'])
@jwt_required()
def get_task_total_time(task_id):
    """Get total time spent on a specific task."""
    user_id = get_jwt_identity()
    
    # Verify task exists and belongs to user
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Get all completed time logs for this task
    logs = TimeLog.query.filter(
        TimeLog.task_id == task_id,
        TimeLog.user_id == user_id,
        TimeLog.end_time != None
    ).all()
    
    total_seconds = sum(log.duration_seconds or 0 for log in logs)
    
    return jsonify({
        'success': True,
        'data': {
            'task_id': task_id,
            'task_name': task.name,
            'total_seconds': total_seconds,
            'log_count': len(logs),
            'formatted_time': format_duration(total_seconds)
        }
    }), 200


def format_duration(seconds):
    """Format seconds into a human-readable string."""
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}m {secs}s"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}h {minutes}m"
