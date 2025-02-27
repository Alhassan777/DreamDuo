from flask import request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies
from models import User, db
from . import auth_bp

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ['first_name', 'last_name', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user
        user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email']
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        # Create access token and response
        access_token = create_access_token(identity=user.id)
        response = jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'profile_photo': user.profile_photo
            }
        })

        # Set JWT cookie
        set_access_cookies(response, access_token)
        return response, 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400

        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create access token and response
        access_token = create_access_token(identity=user.id)
        response = jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'profile_photo': user.profile_photo
            }
        })

        # Set JWT cookie
        set_access_cookies(response, access_token)
        return response, 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500