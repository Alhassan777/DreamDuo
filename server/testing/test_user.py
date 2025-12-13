"""
User Profile and Settings API Tests
====================================

This module tests all user-related endpoints:
- GET/PUT /api/user/profile - User profile management
- GET/PUT /api/user/theme - Theme preferences
- GET/POST /api/user/custom-themes - Custom theme management
- PUT/DELETE /api/user/custom-themes/<id> - Individual theme management
- GET/PUT /api/user/settings/overdue-threshold - Overdue settings

Test Categories:
1. Profile Tests - Get and update user profile
2. Theme Preference Tests - Theme settings management
3. Custom Theme Tests - Create, update, delete custom themes
4. Overdue Threshold Tests - Warning threshold settings
5. Validation Tests - Input validation for all endpoints
6. Authorization Tests - User isolation verification

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json


class TestUserProfile:
    """
    Test suite for user profile endpoints.
    
    Endpoint: GET/PUT /api/user/profile
    
    Tests cover:
    - Getting user profile
    - Updating profile fields
    - Validation of field types
    - Password change
    """
    
    def test_get_profile_success(self, client, app, test_user, auth_headers):
        """
        Test getting user profile data.
        
        Expected: 200 status, user data returned
        """
        with app.app_context():
            response = client.get('/api/user/profile', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == 'test@example.com'
            assert data['user']['first_name'] == 'Test'
            assert data['user']['last_name'] == 'User'
    
    def test_get_profile_no_auth(self, client, app):
        """
        Test getting profile fails without authentication.
        
        Expected: 401 status
        """
        with app.app_context():
            response = client.get('/api/user/profile')
            
            assert response.status_code == 401
    
    def test_update_profile_first_name(self, client, app, test_user, auth_headers):
        """
        Test updating user's first name.
        
        Expected: 200 status, first_name updated
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'first_name': 'Updated'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['user']['first_name'] == 'Updated'
    
    def test_update_profile_last_name(self, client, app, test_user, auth_headers):
        """
        Test updating user's last name.
        
        Expected: 200 status, last_name updated
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'last_name': 'NewLastName'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['user']['last_name'] == 'NewLastName'
    
    def test_update_profile_email(self, client, app, test_user, auth_headers):
        """
        Test updating user's email.
        
        Expected: 200 status, email updated
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'email': 'newemail@example.com'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['user']['email'] == 'newemail@example.com'
    
    def test_update_profile_photo(self, client, app, test_user, auth_headers):
        """
        Test updating user's profile photo URL.
        
        Expected: 200 status, profile_photo updated
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'profile_photo': 'https://example.com/avatar.jpg'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['user']['profile_photo'] == 'https://example.com/avatar.jpg'
    
    def test_update_profile_password(self, client, app, test_user, auth_headers):
        """
        Test updating user's password.
        
        Expected: 200 status, password changed (verified by login)
        """
        from models import User
        
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'new_password': 'NewSecurePassword456!'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            
            # Verify password was changed
            user = User.query.filter_by(email='test@example.com').first()
            assert user.check_password('NewSecurePassword456!')
    
    def test_update_profile_invalid_first_name_type(self, client, app, test_user, auth_headers):
        """
        Test profile update fails with invalid first_name type.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'first_name': 123},  # Should be string
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_profile_invalid_email_type(self, client, app, test_user, auth_headers):
        """
        Test profile update fails with invalid email type.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json={'email': ['list', 'of', 'emails']},  # Should be string
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_profile_no_data(self, client, app, test_user, auth_headers):
        """
        Test profile update fails with no data provided.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/profile',
                json=None,
                headers=auth_headers,
                content_type='application/json'
            )
            
            assert response.status_code == 400


class TestThemePreferences:
    """
    Test suite for theme preferences endpoints.
    
    Endpoint: GET/PUT /api/user/theme
    
    Tests cover:
    - Getting theme preferences
    - Updating theme preferences
    - Preset theme selection
    - Custom color validation
    - Typography validation
    """
    
    def test_get_theme_default(self, client, app, test_user, auth_headers):
        """
        Test getting theme when no preferences set.
        
        Expected: 200 status, empty or default theme object
        """
        with app.app_context():
            response = client.get('/api/user/theme', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'theme' in data
    
    def test_get_theme_with_settings(self, client, app, test_user, auth_headers, test_user_settings):
        """
        Test getting theme when preferences exist.
        
        Expected: 200 status, theme preferences returned
        """
        with app.app_context():
            response = client.get('/api/user/theme', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'theme' in data
    
    def test_update_theme_preset(self, client, app, test_user, auth_headers):
        """
        Test setting a preset theme.
        
        Expected: 200 status, presetId saved
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={'presetId': 'dark-mode'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['theme']['presetId'] == 'dark-mode'
    
    def test_update_theme_colors(self, client, app, test_user, auth_headers):
        """
        Test updating theme colors.
        
        Expected: 200 status, colors saved
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'colors': {
                        'primary': '#FF5733',
                        'secondary': '#3498DB',
                        'background': '#FFFFFF'
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['theme']['colors']['primary'] == '#FF5733'
    
    def test_update_theme_invalid_color(self, client, app, test_user, auth_headers):
        """
        Test theme update fails with invalid color format.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'colors': {
                        'primary': 'not-a-color'  # Invalid format
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_theme_typography(self, client, app, test_user, auth_headers):
        """
        Test updating theme typography.
        
        Expected: 200 status, typography saved
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'typography': {
                        'fontSize': 16,
                        'lineHeight': 1.5
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_update_theme_invalid_font_size(self, client, app, test_user, auth_headers):
        """
        Test theme update fails with font size out of range.
        
        Expected: 400 status (fontSize must be 8-40)
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'typography': {
                        'fontSize': 100  # Too large
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_theme_invalid_line_height(self, client, app, test_user, auth_headers):
        """
        Test theme update fails with line height out of range.
        
        Expected: 400 status (lineHeight must be 1.0-3.0)
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'typography': {
                        'lineHeight': 5.0  # Too large
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_theme_shapes(self, client, app, test_user, auth_headers):
        """
        Test updating theme shapes (border radius).
        
        Expected: 200 status, shapes saved
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                json={
                    'shapes': {
                        'buttonRadius': 8,
                        'cardRadius': 12
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_update_theme_no_data(self, client, app, test_user, auth_headers):
        """
        Test theme update fails with no data.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/theme',
                headers=auth_headers,
                content_type='application/json'
            )
            
            assert response.status_code == 400


class TestCustomThemes:
    """
    Test suite for custom theme management endpoints.
    
    Endpoints:
    - GET/POST /api/user/custom-themes
    - PUT/DELETE /api/user/custom-themes/<id>
    
    Tests cover:
    - Creating custom themes
    - Listing custom themes
    - Updating custom themes
    - Deleting custom themes
    - Validation
    """
    
    def test_get_custom_themes_empty(self, client, app, test_user, auth_headers):
        """
        Test getting custom themes when none exist.
        
        Expected: 200 status, empty customThemes object
        """
        with app.app_context():
            response = client.get('/api/user/custom-themes', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'customThemes' in data
    
    def test_create_custom_theme(self, client, app, test_user, auth_headers):
        """
        Test creating a new custom theme.
        
        Expected: 201 status, theme saved
        """
        with app.app_context():
            response = client.post('/api/user/custom-themes',
                json={
                    'id': 'my-theme',
                    'name': 'My Custom Theme',
                    'theme': {
                        'colors': {
                            'primary': '#FF0000'
                        }
                    }
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert 'my-theme' in data['customThemes']
    
    def test_create_custom_theme_missing_id(self, client, app, test_user, auth_headers):
        """
        Test creating theme fails without id.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post('/api/user/custom-themes',
                json={
                    'name': 'Theme Without ID',
                    'theme': {'colors': {'primary': '#FF0000'}}
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_create_custom_theme_missing_name(self, client, app, test_user, auth_headers):
        """
        Test creating theme fails without name.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post('/api/user/custom-themes',
                json={
                    'id': 'nameless-theme',
                    'theme': {'colors': {'primary': '#FF0000'}}
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_custom_theme(self, client, app, test_user, auth_headers):
        """
        Test updating an existing custom theme.
        
        Expected: 200 status, theme updated
        """
        with app.app_context():
            # First create a theme
            client.post('/api/user/custom-themes',
                json={
                    'id': 'update-test',
                    'name': 'Original Name',
                    'theme': {'colors': {'primary': '#000000'}}
                },
                headers=auth_headers
            )
            
            # Then update it
            response = client.put('/api/user/custom-themes/update-test',
                json={
                    'name': 'Updated Name',
                    'theme': {'colors': {'primary': '#FFFFFF'}}
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['customThemes']['update-test']['name'] == 'Updated Name'
    
    def test_update_custom_theme_not_found(self, client, app, test_user, auth_headers):
        """
        Test updating non-existent theme fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.put('/api/user/custom-themes/nonexistent',
                json={'name': 'New Name'},
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_delete_custom_theme(self, client, app, test_user, auth_headers):
        """
        Test deleting a custom theme.
        
        Expected: 200 status, theme removed
        """
        with app.app_context():
            # First create a theme
            client.post('/api/user/custom-themes',
                json={
                    'id': 'delete-test',
                    'name': 'To Be Deleted',
                    'theme': {'colors': {'primary': '#FF0000'}}
                },
                headers=auth_headers
            )
            
            # Then delete it
            response = client.delete('/api/user/custom-themes/delete-test',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'delete-test' not in data['customThemes']
    
    def test_delete_custom_theme_not_found(self, client, app, test_user, auth_headers):
        """
        Test deleting non-existent theme fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.delete('/api/user/custom-themes/nonexistent',
                headers=auth_headers
            )
            
            assert response.status_code == 404


class TestOverdueThreshold:
    """
    Test suite for overdue threshold settings.
    
    Endpoint: GET/PUT /api/user/settings/overdue-threshold
    
    Tests cover:
    - Getting threshold
    - Updating threshold
    - Validation (positive integer only)
    """
    
    def test_get_threshold_default(self, client, app, test_user, auth_headers):
        """
        Test getting threshold when no settings exist (default 7).
        
        Expected: 200 status, default threshold returned
        """
        with app.app_context():
            response = client.get('/api/user/settings/overdue-threshold',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'overdue_warning_threshold' in data
            assert data['overdue_warning_threshold'] == 7  # Default
    
    def test_update_threshold_success(self, client, app, test_user, auth_headers):
        """
        Test updating threshold to a valid value.
        
        Expected: 200 status, threshold updated
        """
        with app.app_context():
            response = client.put('/api/user/settings/overdue-threshold',
                json={'overdue_warning_threshold': 14},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['overdue_warning_threshold'] == 14
    
    def test_update_threshold_zero(self, client, app, test_user, auth_headers):
        """
        Test updating threshold to zero fails.
        
        Expected: 400 status (must be positive)
        """
        with app.app_context():
            response = client.put('/api/user/settings/overdue-threshold',
                json={'overdue_warning_threshold': 0},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_threshold_negative(self, client, app, test_user, auth_headers):
        """
        Test updating threshold to negative value fails.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/settings/overdue-threshold',
                json={'overdue_warning_threshold': -5},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_threshold_not_integer(self, client, app, test_user, auth_headers):
        """
        Test updating threshold with non-integer fails.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/settings/overdue-threshold',
                json={'overdue_warning_threshold': 7.5},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_threshold_missing_value(self, client, app, test_user, auth_headers):
        """
        Test updating threshold without value fails.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/user/settings/overdue-threshold',
                json={},
                headers=auth_headers
            )
            
            assert response.status_code == 400

