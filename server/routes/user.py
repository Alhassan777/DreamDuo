from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from flask_cors import cross_origin

user_bp = Blueprint('user', __name__, url_prefix='/api')

@user_bp.route('/profile', methods=['GET', 'PUT','OPTIONS'])
@jwt_required()
@cross_origin()
def user_profile():
    try:
        if request.method == 'OPTIONS':
            return jsonify({'message': 'CORS preflight OK'}), 200

        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid or missing authentication token'}), 401
        
        # Query the database for the user
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if request.method == 'GET':
            return jsonify({
                'user': {
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'profile_photo': user.profile_photo
                }
            }), 200

        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate data types
            if 'profile_photo' in data and not isinstance(data['profile_photo'], str):
                return jsonify({'error': 'Profile photo must be a string'}), 400

            if 'first_name' in data and not isinstance(data['first_name'], str):
                return jsonify({'error': 'First name must be a string'}), 400

            if 'last_name' in data and not isinstance(data['last_name'], str):
                return jsonify({'error': 'Last name must be a string'}), 400

            if 'email' in data and not isinstance(data['email'], str):
                return jsonify({'error': 'Email must be a string'}), 400

            # Update user data
            if 'profile_photo' in data:
                user.profile_photo = data['profile_photo']

            if 'first_name' in data:
                user.first_name = data['first_name']

            if 'last_name' in data:
                user.last_name = data['last_name']

            if 'email' in data:
                user.email = data['email']

            try:
                db.session.commit()
                return jsonify({
                    'user': {
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'profile_photo': user.profile_photo
                    },
                    'message': 'Profile updated successfully'
                }), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500