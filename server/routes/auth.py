from flask import request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, get_jwt_identity, jwt_required
from models import User, db
from . import auth_bp
from flask_cors import cross_origin
from services.supabase_auth import SupabaseAuthService


@auth_bp.route('/register', methods=['POST'])
@cross_origin(supports_credentials=True)
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
        access_token = create_access_token(identity=str(user.id))
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
        
        # Set JWT cookie in response
        set_access_cookies(response, access_token)
        return response, 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

from flask import request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, get_jwt_identity, jwt_required
from models import User, db
from . import auth_bp
from flask_cors import cross_origin

@auth_bp.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight OK'}), 200

    try:
        data = request.get_json()

        if not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400

        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # ✅ Create JWT token
        access_token = create_access_token(identity=str(user.id))

        # ✅ Set JWT token using Flask-JWT-Extended's set_access_cookies
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
        
        set_access_cookies(response, access_token)
        return response, 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-password', methods=['POST'])
@jwt_required()
@cross_origin(supports_credentials=True)
def verify_password():
    try:
        data = request.get_json()
        if 'password' not in data:
            return jsonify({'error': 'Password is required'}), 400

        # Get the current user's ID from the JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify the password against the stored hash
        is_valid = user.check_password(data['password'])
        
        if not is_valid:
            return jsonify({'error': 'Invalid password', 'valid': False}), 401
            
        return jsonify({'valid': True}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/oauth/callback', methods=['POST'])
@cross_origin(supports_credentials=True)
def oauth_callback():
    """Handle OAuth callback from Supabase frontend"""
    try:
        data = request.get_json()
        
        if not data or 'user' not in data or 'provider' not in data:
            return jsonify({'error': 'Missing user data or provider'}), 400
        
        supabase_user = data['user']
        provider = data['provider']
        
        # Process OAuth authentication
        result, status_code = SupabaseAuthService.handle_oauth_callback(provider, supabase_user)
        
        if status_code == 200:
            response = jsonify(result)
            # Set JWT cookie for our application
            set_access_cookies(response, result['access_token'])
            return response, 200
        else:
            return jsonify(result), status_code
            
    except Exception as e:
        return jsonify({'error': f'OAuth callback failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@cross_origin(supports_credentials=True)
def logout():
    """Logout and clear JWT cookies"""
    try:
        response = jsonify({'message': 'Logout successful'})
        unset_jwt_cookies(response)
        return response, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500