from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, db
from models.task_utils import (
    add_task, get_root_tasks, get_task_with_subtasks,
    delete_task, move_subtask, toggle_task_completion,
    get_tasks_stats_by_date_range, get_tasks_with_filters
)
from models.task_dependency import (
    add_dependency, remove_dependency, get_user_dependencies, get_task_dependencies
)
from . import tasks_bp
from datetime import datetime
from socket_events import emit_task_created, emit_task_updated, emit_task_deleted, emit_task_completed

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    from sqlalchemy import or_, and_
    
    user_id = get_jwt_identity()
    date_str = request.args.get('date')
    
    # Use client's today if provided, otherwise fall back to server's today
    client_today_str = request.args.get('client_today')
    if client_today_str:
        try:
            today = datetime.strptime(client_today_str, '%Y-%m-%d').date()
        except ValueError:
            today = datetime.now().date()
    else:
        today = datetime.now().date()
    
    # Get tasks filtered by date if provided
    query = Task.query.filter_by(user_id=user_id)
    
    if date_str:
        try:
            # Parse date without timezone information - treats date as local timezone
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # A task is active on a date based on these rules:
            # - Tasks WITH deadline: Active from creation_date to deadline
            # - Tasks WITHOUT deadline (not completed): Only active on TODAY (rolls forward daily)
            # - Tasks WITHOUT deadline (completed): No longer active
            query = query.filter(
                db.func.date(Task.creation_date) <= filter_date,
                or_(
                    # Tasks with deadline - show in their date range
                    and_(
                        Task.deadline != None,
                        db.func.date(Task.deadline) >= filter_date
                    ),
                    # Tasks without deadline and not completed - only show on today
                    and_(
                        Task.deadline == None,
                        Task.completed == False,
                        filter_date == today
                    )
                )
            )
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
    if 'deadline' in data:
        deadline_str = data['deadline']
        if deadline_str:
            try:
                task.deadline = datetime.fromisoformat(deadline_str)
            except ValueError:
                return jsonify({'error': 'Invalid deadline format'}), 400
        else:
            # Allow setting deadline to None/null
            task.deadline = None

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
    
    # Validate that we're not trying to move a task to be its own child
    if new_parent_id == task_id:
        return jsonify({'error': 'Cannot move a task to be its own child'}), 400

    result = move_subtask(db.session, task_id, new_parent_id, user_id)
    if not result:
        return jsonify({'error': 'Failed to move task. The task may not exist or would create a circular reference.'}), 400

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
    - client_today: YYYY-MM-DD (client's local today for timezone support)
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
    client_today_str = request.args.get('client_today')
    
    try:
        # Parse anchor date or use today
        if anchor_date_str:
            anchor_date = datetime.strptime(anchor_date_str, '%Y-%m-%d')
        else:
            anchor_date = datetime.now()
        
        # Use client's today if provided, otherwise fall back to server's today
        if client_today_str:
            client_today = datetime.strptime(client_today_str, '%Y-%m-%d').date()
        else:
            client_today = datetime.now().date()
        
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
            completion_status=completion_status,
            client_today=client_today
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
    client_today_str = request.args.get('client_today')

    if not start_date or not end_date:
        return jsonify({'error': 'Both start_date and end_date are required'}), 400

    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        # Use client's today if provided, otherwise fall back to server's today
        if client_today_str:
            client_today = datetime.strptime(client_today_str, '%Y-%m-%d').date()
        else:
            client_today = datetime.now().date()
        
        # Parse category IDs if provided
        category_ids = None
        if category_ids_str:
            category_ids = [int(cid.strip()) for cid in category_ids_str.split(',') if cid.strip()]
        
        # Parse priority levels if provided
        priority_levels = None
        if priority_levels_str:
            priority_levels = [p.strip() for p in priority_levels_str.split(',') if p.strip()]
        
        # Get stats with optional filters
        stats = get_tasks_stats_by_date_range(
            db.session,
            user_id,
            start_dt,
            end_dt,
            category_ids=category_ids,
            priority_levels=priority_levels,
            client_today=client_today
        )
        
        return jsonify(stats)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD without timezone'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Canvas View Endpoints

@tasks_bp.route('/<int:task_id>/position', methods=['POST'])
@jwt_required()
def update_task_position(task_id):
    """Update task position on canvas"""
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    
    # Validate that x and y are provided
    if 'x' not in data or 'y' not in data:
        return jsonify({'error': 'Both x and y coordinates are required'}), 400
    
    try:
        # Update position
        task.position_x = float(data['x'])
        task.position_y = float(data['y'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': task.id,
                'position_x': task.position_x,
                'position_y': task.position_y
            }
        }), 200
    except (ValueError, TypeError) as e:
        db.session.rollback()
        return jsonify({'error': 'Invalid coordinate values'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/<int:task_id>/customize', methods=['POST'])
@jwt_required()
def customize_task(task_id):
    """Update task appearance (color, shape) on canvas"""
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    
    try:
        if 'color' in data:
            task.canvas_color = data['color']
        if 'shape' in data:
            task.canvas_shape = data['shape']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': task.id,
                'canvas_color': task.canvas_color,
                'canvas_shape': task.canvas_shape
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/dependencies', methods=['GET'])
@jwt_required()
def get_dependencies():
    """Get all task dependencies for the current user"""
    user_id = get_jwt_identity()
    
    try:
        dependencies = get_user_dependencies(db.session, user_id)
        return jsonify({'success': True, 'data': dependencies}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/dependencies', methods=['POST'])
@jwt_required()
def create_dependency():
    """Create a new task dependency"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    source_id = data.get('source_task_id')
    target_id = data.get('target_task_id')
    
    if not source_id or not target_id:
        return jsonify({'error': 'Both source_task_id and target_task_id are required'}), 400
    
    try:
        dependency = add_dependency(db.session, source_id, target_id, user_id)
        return jsonify({
            'success': True,
            'data': dependency.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/dependencies/<int:dependency_id>', methods=['DELETE'])
@jwt_required()
def delete_dependency(dependency_id):
    """Delete a task dependency"""
    user_id = get_jwt_identity()
    
    try:
        remove_dependency(db.session, dependency_id, user_id)
        return jsonify({
            'success': True,
            'message': 'Dependency deleted successfully'
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/<int:task_id>/dependencies', methods=['GET'])
@jwt_required()
def get_task_dependencies_route(task_id):
    """Get all dependencies for a specific task"""
    user_id = get_jwt_identity()
    
    try:
        dependencies = get_task_dependencies(db.session, task_id, user_id)
        return jsonify({'success': True, 'data': dependencies}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/dependencies/<int:dependency_id>/customize', methods=['PUT'])
@jwt_required()
def customize_dependency(dependency_id):
    """Update dependency edge appearance (color, style, width, animated)"""
    user_id = get_jwt_identity()
    
    from models.task_dependency import TaskDependency
    
    dependency = db.session.query(TaskDependency).filter_by(
        id=dependency_id,
        user_id=user_id
    ).first()
    
    if not dependency:
        return jsonify({'error': 'Dependency not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update edge customization fields
        if 'edge_color' in data:
            dependency.edge_color = data['edge_color']
        if 'edge_style' in data:
            # Validate edge style
            valid_styles = ['smoothstep', 'straight', 'step', 'bezier']
            if data['edge_style'] not in valid_styles:
                return jsonify({'error': f'Invalid edge style. Must be one of: {", ".join(valid_styles)}'}), 400
            dependency.edge_style = data['edge_style']
        if 'edge_width' in data:
            dependency.edge_width = float(data['edge_width'])
        if 'edge_animated' in data:
            dependency.edge_animated = bool(data['edge_animated'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': dependency.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500