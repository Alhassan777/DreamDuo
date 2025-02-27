from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Category, db
from . import categories_bp

@categories_bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': category.id,
        'name': category.name,
        'color': category.color
    } for category in categories])

@categories_bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400

    category = Category(
        name=data['name'],
        color=data.get('color'),
        user_id=user_id
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color
    }), 201

@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()
    if 'name' in data:
        category.name = data['name']
    if 'color' in data:
        category.color = data['color']

    db.session.commit()

    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color
    })

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Category deleted successfully'}), 200