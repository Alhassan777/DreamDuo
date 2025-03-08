from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, User, Category, Priority, TaskHierarchy

# Create a blueprint for debug routes
debug_bp = Blueprint('debug', __name__)

@debug_bp.route('/tables', methods=['GET'])
@jwt_required()
def list_tables():
    """List all available tables in the database"""
    # Get current user ID from JWT token
    user_id = get_jwt_identity()
    
    # Dictionary to store table names and their row counts
    tables = {
        'tasks': Task.query.filter_by(user_id=user_id).count(),
        'categories': Category.query.filter_by(user_id=user_id).count(),
        'priorities': Priority.query.filter_by(user_id=user_id).count(),
        'task_hierarchy': db.session.query(TaskHierarchy).join(Task, TaskHierarchy.descendant == Task.id)
                                .filter(Task.user_id == user_id).count()
    }
    
    return jsonify({
        'tables': tables,
        'message': 'Select a specific table to view its contents'
    })

@debug_bp.route('/tasks', methods=['GET'])
@jwt_required()
def view_tasks():
    """View all tasks for the current user"""
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()
    
    task_list = [{
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'parent_id': task.parent_id,
        'priority': task.priority,
        'category_id': task.category_id,
        'creation_date': task.creation_date.isoformat() if task.creation_date else None,
        'deadline': task.deadline.isoformat() if task.deadline else None
    } for task in tasks]
    
    return jsonify(task_list)

@debug_bp.route('/categories', methods=['GET'])
@jwt_required()
def view_categories():
    """View all categories for the current user"""
    user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=user_id).all()
    
    category_list = [{
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'icon': category.icon
    } for category in categories]
    
    return jsonify(category_list)

@debug_bp.route('/priorities', methods=['GET'])
@jwt_required()
def view_priorities():
    """View all priorities for the current user"""
    user_id = get_jwt_identity()
    priorities = Priority.query.filter_by(user_id=user_id).all()
    
    priority_list = [{
        'level': priority.level,
        'color': priority.color
    } for priority in priorities]
    
    return jsonify(priority_list)

@debug_bp.route('/hierarchy', methods=['GET'])
@jwt_required()
def view_hierarchy():
    """View task hierarchy relationships"""
    user_id = get_jwt_identity()
    
    # Join with tasks to filter by user_id
    hierarchy_query = db.session.query(TaskHierarchy, Task)\
        .join(Task, TaskHierarchy.descendant == Task.id)\
        .filter(Task.user_id == user_id)
    
    hierarchy_list = [{
        'ancestor': item.TaskHierarchy.ancestor,
        'descendant': item.TaskHierarchy.descendant,
        'depth': item.TaskHierarchy.depth,
        'task_name': item.Task.name
    } for item in hierarchy_query.all()]
    
    return jsonify(hierarchy_list)