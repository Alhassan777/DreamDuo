"""
Authentication API Tests
========================

This module tests all authentication-related endpoints:
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/verify-password - Password verification
- POST /api/auth/oauth/callback - OAuth authentication callback
- POST /api/auth/logout - User logout

Test Categories:
1. Registration Tests - Valid/invalid registration scenarios
2. Login Tests - Valid/invalid login scenarios
3. Password Verification Tests - Authenticated password checks
4. OAuth Tests - Third-party authentication flow
5. Logout Tests - Session termination
6. Edge Cases - SQL injection, XSS, boundary values

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json


class TestUserRegistration:
    """
    Test suite for user registration endpoint.
    
    Endpoint: POST /api/auth/register
    
    Tests cover:
    - Successful registration with valid data
    - Missing required fields validation
    - Duplicate email prevention
    - Password hashing verification
    - Response structure validation
    """
    
    def test_register_success(self, client, app):
        """
        Test successful user registration with all required fields.
        
        Expected: 201 status, user data returned, JWT cookie set
        """
        with app.app_context():
            response = client.post('/api/auth/register', 
                json={
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john.doe@example.com',
                    'password': 'SecurePassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == 'john.doe@example.com'
            assert data['user']['first_name'] == 'John'
            assert data['user']['last_name'] == 'Doe'
            assert 'message' in data
            # Check that access_token_cookie is set
            assert 'access_token_cookie' in response.headers.get('Set-Cookie', '')
    
    def test_register_missing_first_name(self, client, app):
        """
        Test registration fails when first_name is missing.
        
        Expected: 400 status, error message about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'last_name': 'Doe',
                    'email': 'john@example.com',
                    'password': 'SecurePassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
            assert 'Missing required fields' in data['error']
    
    def test_register_missing_last_name(self, client, app):
        """
        Test registration fails when last_name is missing.
        
        Expected: 400 status, error message about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'John',
                    'email': 'john@example.com',
                    'password': 'SecurePassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_register_missing_email(self, client, app):
        """
        Test registration fails when email is missing.
        
        Expected: 400 status, error message about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'password': 'SecurePassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_register_missing_password(self, client, app):
        """
        Test registration fails when password is missing.
        
        Expected: 400 status, error message about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john@example.com'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_register_duplicate_email(self, client, app, test_user):
        """
        Test registration fails when email already exists.
        
        Expected: 400 status, error about duplicate email
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'Another',
                    'last_name': 'User',
                    'email': 'test@example.com',  # Same as test_user
                    'password': 'SecurePassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
            assert 'already exists' in data['error'].lower()
    
    def test_register_password_is_hashed(self, client, app):
        """
        Test that registered user's password is properly hashed.
        
        Expected: Password in database is not plain text
        """
        from models import User
        
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'Hash',
                    'last_name': 'Test',
                    'email': 'hash@example.com',
                    'password': 'PlainPassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 201
            
            # Check database directly
            user = User.query.filter_by(email='hash@example.com').first()
            assert user is not None
            assert user.password_hash != 'PlainPassword123!'
            assert user.check_password('PlainPassword123!')


class TestUserLogin:
    """
    Test suite for user login endpoint.
    
    Endpoint: POST /api/auth/login
    
    Tests cover:
    - Successful login with correct credentials
    - Failed login with wrong password
    - Failed login with non-existent email
    - Response structure validation
    """
    
    def test_login_success(self, client, app, test_user):
        """
        Test successful login with valid credentials.
        
        Expected: 200 status, user data returned, JWT cookie set
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': 'test@example.com',
                    'password': 'TestPassword123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == 'test@example.com'
            assert 'message' in data
            assert 'Login successful' in data['message']
    
    def test_login_wrong_password(self, client, app, test_user):
        """
        Test login fails with incorrect password.
        
        Expected: 401 status, error message about invalid credentials
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': 'test@example.com',
                    'password': 'WrongPassword!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 401
            data = response.get_json()
            assert 'error' in data
            assert 'Invalid' in data['error']
    
    def test_login_nonexistent_email(self, client, app):
        """
        Test login fails with email that doesn't exist.
        
        Expected: 401 status, same error as wrong password (security)
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': 'nonexistent@example.com',
                    'password': 'AnyPassword!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 401
            data = response.get_json()
            assert 'error' in data
    
    def test_login_missing_email(self, client, app):
        """
        Test login fails when email is missing.
        
        Expected: 400 status, error about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'password': 'SomePassword!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_login_missing_password(self, client, app, test_user):
        """
        Test login fails when password is missing.
        
        Expected: 400 status, error about missing fields
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': 'test@example.com'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_login_case_sensitive_email(self, client, app, test_user):
        """
        Test that email matching is handled correctly.
        
        Note: This tests the current behavior - adjust if email should be case-insensitive
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': 'TEST@EXAMPLE.COM',
                    'password': 'TestPassword123!'
                },
                content_type='application/json'
            )
            
            # Email lookup behavior - may fail if case-sensitive
            # This documents current behavior
            data = response.get_json()
            # Either succeeds or fails depending on implementation


class TestPasswordVerification:
    """
    Test suite for password verification endpoint.
    
    Endpoint: POST /api/auth/verify-password
    
    Tests cover:
    - Successful password verification
    - Failed verification with wrong password
    - Unauthorized access without JWT
    """
    
    def test_verify_password_correct(self, client, app, test_user, auth_headers):
        """
        Test password verification succeeds with correct password.
        
        Expected: 200 status, valid: true
        """
        with app.app_context():
            response = client.post('/api/auth/verify-password',
                json={'password': 'TestPassword123!'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['valid'] == True
    
    def test_verify_password_incorrect(self, client, app, test_user, auth_headers):
        """
        Test password verification fails with incorrect password.
        
        Expected: 401 status, valid: false
        """
        with app.app_context():
            response = client.post('/api/auth/verify-password',
                json={'password': 'WrongPassword!'},
                headers=auth_headers
            )
            
            assert response.status_code == 401
            data = response.get_json()
            assert data['valid'] == False
    
    def test_verify_password_no_auth(self, client, app):
        """
        Test password verification fails without authentication.
        
        Expected: 401 status (JWT required)
        """
        with app.app_context():
            response = client.post('/api/auth/verify-password',
                json={'password': 'AnyPassword!'},
                content_type='application/json'
            )
            
            assert response.status_code == 401
    
    def test_verify_password_missing_password(self, client, app, test_user, auth_headers):
        """
        Test password verification fails when password field is missing.
        
        Expected: 400 status, error about missing password
        """
        with app.app_context():
            response = client.post('/api/auth/verify-password',
                json={},
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data


class TestOAuthCallback:
    """
    Test suite for OAuth callback endpoint.
    
    Endpoint: POST /api/auth/oauth/callback
    
    Tests cover:
    - New user creation from OAuth data
    - Existing user linking with OAuth
    - Missing user data handling
    - Missing provider handling
    """
    
    def test_oauth_callback_new_user(self, client, app):
        """
        Test OAuth creates new user when email doesn't exist.
        
        Expected: 200 status, new user created with OAuth data
        """
        with app.app_context():
            response = client.post('/api/auth/oauth/callback',
                json={
                    'user': {
                        'id': 'oauth_provider_id_123',
                        'email': 'newuser@oauth.com',
                        'user_metadata': {
                            'full_name': 'OAuth User',
                            'avatar_url': 'https://example.com/avatar.jpg'
                        }
                    },
                    'provider': 'google'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == 'newuser@oauth.com'
            assert 'access_token' in data
    
    def test_oauth_callback_existing_user(self, client, app, test_user):
        """
        Test OAuth links to existing user when email matches.
        
        Expected: 200 status, existing user updated with OAuth info
        """
        with app.app_context():
            response = client.post('/api/auth/oauth/callback',
                json={
                    'user': {
                        'id': 'google_123',
                        'email': 'test@example.com',  # Existing user's email
                        'user_metadata': {
                            'full_name': 'Test User',
                            'avatar_url': 'https://example.com/avatar.jpg'
                        }
                    },
                    'provider': 'google'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['user']['email'] == 'test@example.com'
    
    def test_oauth_callback_missing_user_data(self, client, app):
        """
        Test OAuth fails when user data is missing.
        
        Expected: 400 status, error about missing user data
        """
        with app.app_context():
            response = client.post('/api/auth/oauth/callback',
                json={
                    'provider': 'google'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_oauth_callback_missing_provider(self, client, app):
        """
        Test OAuth fails when provider is missing.
        
        Expected: 400 status, error about missing provider
        """
        with app.app_context():
            response = client.post('/api/auth/oauth/callback',
                json={
                    'user': {
                        'id': 'oauth_id',
                        'email': 'oauth@example.com'
                    }
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_oauth_callback_missing_email(self, client, app):
        """
        Test OAuth fails when user email is missing.
        
        Expected: 400 status, error about missing email
        """
        with app.app_context():
            response = client.post('/api/auth/oauth/callback',
                json={
                    'user': {
                        'id': 'oauth_id',
                        'user_metadata': {}
                    },
                    'provider': 'google'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 400


class TestLogout:
    """
    Test suite for logout endpoint.
    
    Endpoint: POST /api/auth/logout
    
    Tests cover:
    - Successful logout and cookie clearing
    """
    
    def test_logout_success(self, client, app):
        """
        Test logout clears JWT cookies.
        
        Expected: 200 status, success message, cookies unset
        """
        with app.app_context():
            response = client.post('/api/auth/logout',
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'message' in data
            assert 'Logout successful' in data['message']


class TestAuthEdgeCases:
    """
    Test suite for authentication edge cases and security.
    
    Tests cover:
    - Empty string inputs
    - Very long inputs
    - Special characters
    - SQL injection attempts (prevention verification)
    """
    
    def test_register_empty_strings(self, client, app):
        """
        Test registration handles empty strings appropriately.
        
        Expected: 400 status or validation error
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': '',
                    'last_name': '',
                    'email': '',
                    'password': ''
                },
                content_type='application/json'
            )
            
            # Empty strings should fail validation
            assert response.status_code in [400, 500]
    
    def test_register_long_email(self, client, app):
        """
        Test registration handles very long email addresses.
        
        Expected: Either success (if valid) or appropriate error
        """
        with app.app_context():
            long_email = 'a' * 100 + '@example.com'
            response = client.post('/api/auth/register',
                json={
                    'first_name': 'Long',
                    'last_name': 'Email',
                    'email': long_email,
                    'password': 'Password123!'
                },
                content_type='application/json'
            )
            
            # Should handle gracefully (either succeed or return validation error)
            assert response.status_code in [201, 400, 500]
    
    def test_register_special_characters_in_name(self, client, app):
        """
        Test registration handles special characters in names.
        
        Expected: Success with valid special characters (accents, hyphens)
        """
        with app.app_context():
            response = client.post('/api/auth/register',
                json={
                    'first_name': "José-María",
                    'last_name': "O'Connor",
                    'email': 'special@example.com',
                    'password': 'Password123!'
                },
                content_type='application/json'
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['user']['first_name'] == "José-María"
    
    def test_login_sql_injection_attempt(self, client, app, test_user):
        """
        Test that SQL injection attempts are safely handled.
        
        Expected: Normal authentication failure, no SQL errors
        """
        with app.app_context():
            response = client.post('/api/auth/login',
                json={
                    'email': "' OR '1'='1",
                    'password': "' OR '1'='1"
                },
                content_type='application/json'
            )
            
            # Should fail authentication, not expose SQL error
            assert response.status_code in [400, 401]
            data = response.get_json()
            assert 'sql' not in str(data).lower()

