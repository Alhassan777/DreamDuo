from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, db
from models.task_utils import (
    add_task, get_root_tasks, get_task_with_subtasks,
    delete_task, move_subtask, toggle_task_completion
)
from . import tasks_bp
from datetime import datetime

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    date_str = request.args.get('date')
    
    # Get tasks filtered by date if provided
    query = Task.query.filter_by(user_id=user_id)
    
    if date_str:
        try:
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(db.func.date(Task.creation_date) == filter_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
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
        return jsonify({'error': 'Task name is required'}), 400

    try:
        # Parse if your front-end sends an ISO string
        creation_date_str = data.get('creation_date')
        creation_date_dt = None
        if creation_date_str:
            try:
                creation_date_dt = datetime.fromisoformat(creation_date_str)
            except ValueError:
                # Fallback to strptime if not in ISO format
                creation_date_dt = datetime.strptime(creation_date_str, '%Y-%m-%dT%H:%M:%S')

        new_task = add_task(
            session=db.session,
            name=data['name'],
            user_id=user_id,
            description=data.get('description'),
            parent_id=data.get('parent_id'),
            category_id=data.get('category_id'),
            priority=data.get('priority'),
            creation_date=creation_date_dt  # pass the parsed datetime
        )

        return jsonify(get_task_with_subtasks(db.session, new_task.id, user_id)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


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

    # Return the updated task with the full subtask tree
    return jsonify(get_task_with_subtasks(db.session, task.id, user_id))


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task_route(task_id):
    user_id = get_jwt_identity()

    if delete_task(db.session, task_id, user_id):
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

    # Return the updated task with its subtasks
    return jsonify(get_task_with_subtasks(db.session, task_id, user_id))
