from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Category, Task
from . import tags_bp
from flask_cors import cross_origin

# Category Management
@tags_bp.route('/categories', methods=['GET', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'OPTIONS'])
def get_user_categories():
    user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': category.id,
        'name': category.name,
        'color': category.color,
        'icon': category.icon
    } for category in categories])

@tags_bp.route('/categories', methods=['POST', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['POST', 'OPTIONS'])
def create_user_category():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400

    category = Category(
        name=data['name'],
        color=data.get('color'),
        icon=data.get('icon'),
        user_id=user_id
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color,
        'icon': category.icon
    }), 201

@tags_bp.route('/categories/<int:category_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['PUT', 'OPTIONS'])
def update_user_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()
    if 'name' in data:
        category.name = data['name']
    if 'color' in data:
        category.color = data['color']
    if 'icon' in data:
        category.icon = data['icon']

    db.session.commit()

    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color,
        'icon': category.icon
    })

@tags_bp.route('/categories/<int:category_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['DELETE', 'OPTIONS'])
def delete_user_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Category deleted successfully'}), 200

# Priority Levels Management
@tags_bp.route('/priorities', methods=['GET', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'OPTIONS'])
def get_user_priorities():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).with_entities(Task.priority).distinct().all()
    priorities = [task[0] for task in tasks if task[0]]
    return jsonify(priorities)

@tags_bp.route('/priorities/<string:priority>', methods=['PUT', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['PUT', 'OPTIONS'])
def update_tasks_priority(priority):
    user_id = get_jwt_identity()
    data = request.get_json()
    new_priority = data.get('new_priority')

    if not new_priority:
        return jsonify({'error': 'New priority value is required'}), 400

    tasks = Task.query.filter_by(user_id=user_id, priority=priority).all()
    for task in tasks:
        task.priority = new_priority

    db.session.commit()
    return jsonify({'message': f'Updated all tasks with priority {priority} to {new_priority}'})

# Completion Status Management
@tags_bp.route('/completion-status', methods=['GET', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'OPTIONS'])
def get_completion_status():
    user_id = get_jwt_identity()
    total_tasks = Task.query.filter_by(user_id=user_id).count()
    completed_tasks = Task.query.filter_by(user_id=user_id, completed=True).count()
    
    return jsonify({
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    })

# Status Logo Management
@tags_bp.route('/status-logos', methods=['GET', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'OPTIONS'])
def get_status_logos():
    user_id = get_jwt_identity()
    # Get user preferences from database
    # For now, we'll use a simple approach with the user's settings table
    # In a real implementation, you would have a dedicated table for this
    from models import UserSettings
    
    user_settings = UserSettings.query.filter_by(user_id=user_id).first()
    
    if user_settings and user_settings.status_logos:
        return jsonify(user_settings.status_logos)
    else:
        # Return empty mapping if no preferences are set
        return jsonify({})

@tags_bp.route('/status-logo/<string:status_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['PUT', 'OPTIONS'])
def update_status_logo(status_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    logo_id = data.get('logo_id')
    
    from models import UserSettings
    
    # Get or create user settings
    user_settings = UserSettings.query.filter_by(user_id=user_id).first()
    
    if not user_settings:
        user_settings = UserSettings(user_id=user_id, status_logos={})
        db.session.add(user_settings)
    
    # Create a new dictionary with the current status_logos
    current_logos = dict(user_settings.status_logos or {})
    
    # If logo_id is provided, check if it's used by another status
    if logo_id is not None:
        # Find if the logo is used by another status
        for existing_status, existing_logo in list(current_logos.items()):
            if existing_logo == logo_id and existing_status != status_id:
                # Remove the logo from the previous status
                del current_logos[existing_status]
        # Assign the logo to the new status
        current_logos[status_id] = logo_id
    else:
        # Remove the mapping if logo_id is null
        current_logos.pop(status_id, None)
    
    # Assign the entire new dictionary to force SQLAlchemy to detect the change
    user_settings.status_logos = current_logos
    
    db.session.commit()
    
    return jsonify({'message': 'Status logo updated successfully', 'status_logos': current_logos})