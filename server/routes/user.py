from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from models.user_settings import UserSettings
from flask_cors import cross_origin
import re

user_bp = Blueprint('user', __name__, url_prefix='/api')

@user_bp.route('/user/profile', methods=['GET', 'PUT', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'PUT', 'OPTIONS'])
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
                
            if 'new_password' in data and data['new_password']:
                user.set_password(data['new_password'])

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


def validate_hex_color(color):
    """Validate hex color format (#RGB or #RRGGBB or #RRGGBBAA)"""
    if not color:
        return True
    pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})$'
    return bool(re.match(pattern, color))


def validate_theme_preferences(theme_data):
    """Validate theme preferences data structure"""
    if not isinstance(theme_data, dict):
        return False, "Theme preferences must be an object"
    
    # Allow preset ID (just a string identifier)
    if 'presetId' in theme_data and isinstance(theme_data['presetId'], str):
        # If it's just a preset ID, that's valid
        return True, None
    
    # Validate colors if present
    if 'colors' in theme_data:
        colors = theme_data['colors']
        if not isinstance(colors, dict):
            return False, "Colors must be an object"
        
        for color_key, color_value in colors.items():
            if color_value and not validate_hex_color(color_value):
                return False, f"Invalid color format for {color_key}: {color_value}"
    
    # Validate typography if present
    if 'typography' in theme_data:
        typo = theme_data['typography']
        if not isinstance(typo, dict):
            return False, "Typography must be an object"
        
        if 'fontSize' in typo and typo['fontSize'] is not None:
            if not isinstance(typo['fontSize'], (int, float)) or typo['fontSize'] < 8 or typo['fontSize'] > 40:
                return False, f"Font size must be between 8 and 40, got {typo['fontSize']}"
        
        if 'lineHeight' in typo and typo['lineHeight'] is not None:
            if not isinstance(typo['lineHeight'], (int, float)) or typo['lineHeight'] < 1.0 or typo['lineHeight'] > 3.0:
                return False, f"Line height must be between 1.0 and 3.0, got {typo['lineHeight']}"
    
    # Validate shapes if present
    if 'shapes' in theme_data:
        shapes = theme_data['shapes']
        if not isinstance(shapes, dict):
            return False, "Shapes must be an object"
        
        for shape_key, shape_value in shapes.items():
            if shape_value is not None and (not isinstance(shape_value, (int, float)) or shape_value < 0 or shape_value > 50):
                return False, f"Border radius values must be between 0 and 50: {shape_key} = {shape_value}"
    
    # Validate spacing if present
    if 'spacing' in theme_data:
        spacing = theme_data['spacing']
        if not isinstance(spacing, dict):
            return False, "Spacing must be an object"
        
        if 'scale' in spacing and spacing['scale'] is not None:
            if not isinstance(spacing['scale'], (int, float)) or spacing['scale'] < 0.5 or spacing['scale'] > 2.0:
                return False, f"Spacing scale must be between 0.5 and 2.0, got {spacing['scale']}"
    
    # Validate effects if present
    if 'effects' in theme_data:
        effects = theme_data['effects']
        if not isinstance(effects, dict):
            return False, "Effects must be an object"
        
        if 'animationDuration' in effects and effects['animationDuration'] is not None:
            if not isinstance(effects['animationDuration'], (int, float)) or effects['animationDuration'] < 0 or effects['animationDuration'] > 2000:
                return False, f"Animation duration must be between 0 and 2000ms, got {effects['animationDuration']}"
    
    return True, None


@user_bp.route('/user/theme', methods=['GET', 'PUT', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'PUT', 'OPTIONS'])
def user_theme():
    """Get or update user theme preferences"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'message': 'CORS preflight OK'}), 200
        
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid or missing authentication token'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user settings
        user_settings = UserSettings.query.filter_by(user_id=current_user_id).first()
        if not user_settings:
            user_settings = UserSettings(user_id=current_user_id, theme_preferences={})
            db.session.add(user_settings)
            db.session.commit()
        
        if request.method == 'GET':
            return jsonify({
                'theme': user_settings.theme_preferences or {}
            }), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Validate theme preferences
            is_valid, error_message = validate_theme_preferences(data)
            if not is_valid:
                return jsonify({'error': error_message}), 400
            
            # Update theme preferences
            user_settings.theme_preferences = data
            
            try:
                db.session.commit()
                return jsonify({
                    'theme': user_settings.theme_preferences,
                    'message': 'Theme preferences updated successfully'
                }), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/user/custom-themes', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['GET', 'POST', 'OPTIONS'])
def manage_custom_themes():
    """Get all custom themes or create a new one"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'message': 'CORS preflight OK'}), 200
        
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid or missing authentication token'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user settings
        user_settings = UserSettings.query.filter_by(user_id=current_user_id).first()
        if not user_settings:
            user_settings = UserSettings(user_id=current_user_id, custom_themes={})
            db.session.add(user_settings)
            db.session.commit()
        
        if request.method == 'GET':
            custom_themes = user_settings.custom_themes or {}
            return jsonify({'customThemes': custom_themes}), 200
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            theme_id = data.get('id')
            theme_name = data.get('name')
            theme_data = data.get('theme')
            
            if not theme_id or not theme_name or not theme_data:
                return jsonify({'error': 'Missing required fields: id, name, theme'}), 400
            
            # Validate theme data
            is_valid, error_message = validate_theme_preferences(theme_data)
            if not is_valid:
                return jsonify({'error': error_message}), 400
            
            # Initialize custom_themes if None
            if user_settings.custom_themes is None:
                user_settings.custom_themes = {}
            
            # Add the new custom theme
            custom_themes = user_settings.custom_themes.copy()
            custom_themes[theme_id] = {
                'id': theme_id,
                'name': theme_name,
                'theme': theme_data,
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            user_settings.custom_themes = custom_themes
            
            try:
                db.session.commit()
                return jsonify({
                    'customThemes': user_settings.custom_themes,
                    'message': 'Custom theme created successfully'
                }), 201
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/user/custom-themes/<theme_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
@cross_origin(supports_credentials=True, methods=['PUT', 'DELETE', 'OPTIONS'])
def update_delete_custom_theme(theme_id):
    """Update or delete a specific custom theme"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'message': 'CORS preflight OK'}), 200
        
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid or missing authentication token'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_settings = UserSettings.query.filter_by(user_id=current_user_id).first()
        if not user_settings or not user_settings.custom_themes:
            return jsonify({'error': 'No custom themes found'}), 404
        
        custom_themes = user_settings.custom_themes.copy()
        
        if theme_id not in custom_themes:
            return jsonify({'error': 'Custom theme not found'}), 404
        
        if request.method == 'DELETE':
            del custom_themes[theme_id]
            user_settings.custom_themes = custom_themes
            
            try:
                db.session.commit()
                return jsonify({
                    'customThemes': user_settings.custom_themes,
                    'message': 'Custom theme deleted successfully'
                }), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500
        
        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Update theme name if provided
            if 'name' in data:
                custom_themes[theme_id]['name'] = data['name']
            
            # Update theme data if provided
            if 'theme' in data:
                is_valid, error_message = validate_theme_preferences(data['theme'])
                if not is_valid:
                    return jsonify({'error': error_message}), 400
                custom_themes[theme_id]['theme'] = data['theme']
            
            custom_themes[theme_id]['updatedAt'] = datetime.utcnow().isoformat()
            user_settings.custom_themes = custom_themes
            
            try:
                db.session.commit()
                return jsonify({
                    'customThemes': user_settings.custom_themes,
                    'message': 'Custom theme updated successfully'
                }), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500