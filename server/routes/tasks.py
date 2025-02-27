from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, db
from . import tasks_bp
from datetime import datetime

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id, parent_id=None).all()
    return jsonify([{
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'priority': task.priority,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'category_id': task.category_id,
        'subtasks': [{
            'id': subtask.id,
            'name': subtask.name,
            'completed': subtask.completed
        } for subtask in task.subtasks]
    } for task in tasks])

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Task name is required'}), 400

    task = Task(
        name=data['name'],
        description=data.get('description'),
        priority=data.get('priority'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        category_id=data.get('category_id'),
        user_id=user_id,
        parent_id=data.get('parent_id')
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'priority': task.priority,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'category_id': task.category_id
    }), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    if 'name' in data:
        task.name = data['name']
    if 'description' in data:
        task.description = data['description']
    if 'completed' in data:
        task.completed = data['completed']
    if 'priority' in data:
        task.priority = data['priority']
    if 'due_date' in data:
        task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
    if 'category_id' in data:
        task.category_id = data['category_id']

    db.session.commit()

    return jsonify({
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'priority': task.priority,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'category_id': task.category_id
    })

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({'message': 'Task deleted successfully'}), 200

@tasks_bp.route('/<int:task_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_task_completion(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    task.completed = not task.completed
    db.session.commit()

    return jsonify({
        'id': task.id,
        'completed': task.completed
    })