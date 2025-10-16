from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, db
from models.task_utils import (
    add_task, get_root_tasks, get_task_with_subtasks,
    delete_task, move_subtask, toggle_task_completion,
    get_tasks_stats_by_date_range, get_tasks_with_filters
)
from . import tasks_bp
from datetime import datetime
from socket_events import emit_task_created, emit_task_updated, emit_task_deleted, emit_task_completed

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    date_str = request.args.get('date')
    
    # Get tasks filtered by date if provided
    query = Task.query.filter_by(user_id=user_id)
    
    if date_str:
        try:
            # Parse date without timezone information - treats date as local timezone
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(db.func.date(Task.creation_date) == filter_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD without timezone'}), 400
    
    # Get all tasks for the date and build hierarchy
    tasks = query.all()
    root_tasks = [t for t in tasks if t.parent_id is None]
    return jsonify([get_task_with_subtasks(db.session, task.id, user_id) for task in root_tasks])


@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'success': False, 'message': 'Task name is required'}), 200

    # Validate parent_id to prevent negative values
    parent_id = data.get('parent_id')
    if parent_id is not None and parent_id < 0:
        return jsonify({'success': False, 'message': 'Invalid parent_id: cannot be negative'}), 200

    try:
        # Parse creation date if provided, otherwise use current date
        creation_date_str = data.get('creation_date')
        creation_date_dt = None
        if creation_date_str:
            try:
                # Treat the incoming date as local time, store it as-is
                creation_date_dt = datetime.strptime(creation_date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD'}), 200

        # Parse deadline if provided
        deadline_str = data.get('deadline')
        deadline_dt = None
        if deadline_str:
            try:
                # Store deadline in local time as well
                deadline_dt = datetime.fromisoformat(deadline_str)
            except ValueError:
                return jsonify({'success': False, 'message': 'Invalid deadline format'}), 200

        new_task = add_task(
            session=db.session,
            name=data['name'],
            user_id=user_id,
            description=data.get('description'),
            parent_id=data.get('parent_id'),
            category_id=data.get('category_id'),
            priority=data.get('priority'),
            creation_date=creation_date_dt,
            deadline=deadline_dt
        )

        # Get the task with its subtasks for the response
        task_data = get_task_with_subtasks(db.session, new_task.id, user_id)
        
        # Emit WebSocket event for real-time updates
        emit_task_created(task_data, user_id)

        return jsonify({
            'success': True,
            'data': task_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()

    # If parent_id changes, move the subtask to a new parent
    if 'parent_id' in data:
        new_parent_id = data['parent_id']
        if not move_subtask(db.session, task_id, new_parent_id, user_id):
            return jsonify({'error': 'Failed to move task'}), 400
        # Refresh the task object after moving
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    # Update other fields
    if 'name' in data:
        task.name = data['name']
    if 'description' in data:
        task.description = data['description']
    if 'completed' in data:
        task.completed = data['completed']
    if 'priority' in data:
        task.priority = data['priority']
    if 'category_id' in data:
        task.category_id = data['category_id']

    db.session.commit()

    # Get the updated task with its subtasks
    task_data = get_task_with_subtasks(db.session, task.id, user_id)
    
    # Emit WebSocket event for real-time updates
    emit_task_updated(task_data, user_id)

    # Return the updated task with the full subtask tree
    return jsonify(task_data)


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task_route(task_id):
    user_id = get_jwt_identity()
    
    # Get the task's creation date before deleting it
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    date_str = None
    if task and task.creation_date:
        date_str = task.creation_date.strftime('%Y-%m-%d')

    if delete_task(db.session, task_id, user_id):
        # Emit WebSocket event for real-time updates
        emit_task_deleted(task_id, user_id, date_str)
        return jsonify({'message': 'Task and all subtasks deleted successfully'}), 200
    else:
        return jsonify({'error': 'Failed to delete task'}), 400


@tasks_bp.route('/<int:task_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_task_completion_route(task_id):
    user_id = get_jwt_identity()
    
    # Use the utility function from task_utils.py
    result = toggle_task_completion(db.session, task_id, user_id)
    
    if not result:
        return jsonify({'error': 'Task not found'}), 404
    
    # Get the task's creation date and completed status
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    date_str = None
    if task and task.creation_date:
        date_str = task.creation_date.strftime('%Y-%m-%d')
    
    # Emit WebSocket event for real-time updates
    emit_task_completed(task_id, task.completed, user_id, date_str)
        
    return jsonify(result)


@tasks_bp.route('/<int:task_id>/move', methods=['PUT', 'OPTIONS'])
@jwt_required()
def move_task_route(task_id):
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 200

    user_id = get_jwt_identity()
    data = request.get_json()
    new_parent_id = data.get('parent_id')

    if not move_subtask(db.session, task_id, new_parent_id, user_id):
        return jsonify({'error': 'Failed to move task'}), 400

    # Get the updated task with its subtasks
    task_data = get_task_with_subtasks(db.session, task_id, user_id)
    
    # Emit WebSocket event for real-time updates
    emit_task_updated(task_data, user_id)

    # Return the updated task with its subtasks
    return jsonify(task_data)


@tasks_bp.route('/search', methods=['GET'])
@jwt_required()
def search_tasks():
    """
    Search and filter tasks with comprehensive parameters.
    Query params:
    - time_scope: 'daily' | 'weekly' | 'monthly' | 'yearly'
    - anchor_date: YYYY-MM-DD (default: today)
    - search_query: text search
    - category_ids: comma-separated IDs
    - priority_levels: comma-separated levels
    - deadline_before: ISO date
    - deadline_after: ISO date
    - completion_status: 'all' | 'completed' | 'incomplete'
    """
    user_id = get_jwt_identity()
    
    # Get time scope and anchor date
    time_scope = request.args.get('time_scope', 'daily')
    anchor_date_str = request.args.get('anchor_date')
    
    try:
        # Parse anchor date or use today
        if anchor_date_str:
            anchor_date = datetime.strptime(anchor_date_str, '%Y-%m-%d')
        else:
            anchor_date = datetime.now()
        
        # Calculate date range based on time scope
        from datetime import timedelta
        
        if time_scope == 'daily':
            start_date = anchor_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = anchor_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif time_scope == 'weekly':
            # Get start of week (Monday)
            days_from_monday = anchor_date.weekday()
            start_date = (anchor_date - timedelta(days=days_from_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = (start_date + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=999999)
        elif time_scope == 'monthly':
            # Get start and end of month
            start_date = anchor_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Get last day of month
            if anchor_date.month == 12:
                end_date = anchor_date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            else:
                next_month = anchor_date.replace(month=anchor_date.month + 1, day=1)
                end_date = (next_month - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        elif time_scope == 'yearly':
            # Get start and end of year
            start_date = anchor_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = anchor_date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
        else:
            return jsonify({'error': 'Invalid time_scope. Use: daily, weekly, monthly, or yearly'}), 400
        
        # Get filter parameters
        search_query = request.args.get('search_query')
        category_ids_str = request.args.get('category_ids')
        priority_levels_str = request.args.get('priority_levels')
        deadline_before_str = request.args.get('deadline_before')
        deadline_after_str = request.args.get('deadline_after')
        completion_status = request.args.get('completion_status', 'all')
        
        # Parse filter parameters
        category_ids = None
        if category_ids_str:
            category_ids = [int(id.strip()) for id in category_ids_str.split(',') if id.strip()]
        
        priority_levels = None
        if priority_levels_str:
            priority_levels = [level.strip() for level in priority_levels_str.split(',') if level.strip()]
        
        deadline_before = None
        if deadline_before_str:
            deadline_before = datetime.fromisoformat(deadline_before_str)
        
        deadline_after = None
        if deadline_after_str:
            deadline_after = datetime.fromisoformat(deadline_after_str)
        
        # Get filtered tasks
        tasks = get_tasks_with_filters(
            session=db.session,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            search_query=search_query,
            category_ids=category_ids,
            priority_levels=priority_levels,
            deadline_before=deadline_before,
            deadline_after=deadline_after,
            completion_status=completion_status
        )
        
        return jsonify(tasks)
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_tasks_stats():
    user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_ids_str = request.args.get('category_ids')
    priority_levels_str = request.args.get('priority_levels')

    if not start_date or not end_date:
        return jsonify({'error': 'Both start_date and end_date are required'}), 400

    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        # For now, get all stats - filtering will be applied on frontend
        # TODO: Implement backend filtering for stats if needed for performance
        stats = get_tasks_stats_by_date_range(db.session, user_id, start_dt, end_dt)
        
        # If filters are provided, we could filter the stats here
        # This is a simplified implementation - full filtering would require updating the SQL query
        
        return jsonify(stats)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD without timezone'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
