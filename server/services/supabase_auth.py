from typing import Dict, Optional, Tuple
from flask import jsonify
from models import User, db
from flask_jwt_extended import create_access_token
import logging

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    """Service for handling Supabase OAuth authentication"""
    
    @staticmethod
    def handle_oauth_callback(provider: str, supabase_user: Dict) -> Tuple[Dict, int]:
        """
        Handle OAuth callback from Supabase
        
        Args:
            provider: OAuth provider name (google, github, etc.)
            supabase_user: User data from Supabase
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Extract user information from Supabase user object
            email = supabase_user.get('email')
            provider_id = supabase_user.get('id')
            user_metadata = supabase_user.get('user_metadata', {})
            
            if not email:
                return {'error': 'Email not provided by OAuth provider'}, 400
            
            # Check if user exists
            user = User.query.filter_by(email=email).first()
            
            if user:
                # Update existing user with OAuth info if they signed up with email/password
                if user.auth_provider == 'email' and not user.provider_id:
                    user.auth_provider = provider
                    user.provider_id = provider_id
                    user.provider_data = user_metadata
                    
                    # Update profile photo if available
                    if user_metadata.get('avatar_url'):
                        user.profile_photo = user_metadata.get('avatar_url')
                    
                    db.session.commit()
                    logger.info(f"Linked OAuth provider {provider} to existing user {email}")
                    
            else:
                # Create new user from OAuth data
                first_name = user_metadata.get('full_name', '').split()[0] if user_metadata.get('full_name') else 'User'
                last_name = ' '.join(user_metadata.get('full_name', '').split()[1:]) if user_metadata.get('full_name') else ''
                
                user = User(
                    first_name=first_name or 'User',
                    last_name=last_name or '',
                    email=email,
                    auth_provider=provider,
                    provider_id=provider_id,
                    provider_data=user_metadata,
                    profile_photo=user_metadata.get('avatar_url'),
                    password_hash=None  # OAuth users don't have password
                )
                
                db.session.add(user)
                db.session.commit()
                logger.info(f"Created new user from {provider} OAuth: {email}")
            
            # Create JWT token for our application
            access_token = create_access_token(identity=str(user.id))
            
            return {
                'message': 'OAuth authentication successful',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'profile_photo': user.profile_photo,
                    'auth_provider': user.auth_provider
                },
                'access_token': access_token
            }, 200
            
        except Exception as e:
            db.session.rollback()
            error_str = str(e)
            logger.error(f"OAuth callback error: {error_str}")
            
            # Check if error is due to missing database columns
            if 'auth_provider' in error_str or 'does not exist' in error_str.lower():
                return {
                    'error': 'Database migration required. Please run database migrations to add OAuth support columns (auth_provider, provider_id, provider_data) to the users table.',
                    'details': error_str
                }, 500
            
            return {'error': f'OAuth authentication failed: {error_str}'}, 500
    
    @staticmethod
    def verify_supabase_token(access_token: str) -> Optional[Dict]:
        """
        Verify Supabase JWT token and return user data
        
        Args:
            access_token: Supabase JWT token
            
        Returns:
            User data if valid, None otherwise
        """
        try:
            from config.supabase import get_supabase_client
            supabase = get_supabase_client()
            
            # Get user from Supabase using the access token
            response = supabase.auth.get_user(access_token)
            return response.user if response else None
            
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            return None

