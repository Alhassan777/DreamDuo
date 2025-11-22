"""
Database migration to add OAuth support to User model

Run this migration with:
    python migrations/add_oauth_to_users.py

Or use Flask-Migrate:
    flask db migrate -m "Add OAuth support to User model"
    flask db upgrade
"""

from models.db import db
from sqlalchemy import text

def upgrade():
    """Add OAuth fields to users table"""
    with db.engine.connect() as conn:
        # Add OAuth provider field
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email'
        """))
        
        # Add provider ID field
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)
        """))
        
        # Add provider data field (JSON)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS provider_data JSON
        """))
        
        # Make password_hash nullable for OAuth users
        conn.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN password_hash DROP NOT NULL
        """))
        
        conn.commit()
    
    print("✅ OAuth fields added to users table successfully!")

def downgrade():
    """Remove OAuth fields from users table"""
    with db.engine.connect() as conn:
        # Remove OAuth fields
        conn.execute(text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS auth_provider,
            DROP COLUMN IF EXISTS provider_id,
            DROP COLUMN IF EXISTS provider_data
        """))
        
        # Make password_hash NOT NULL again (only if all users have passwords)
        conn.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN password_hash SET NOT NULL
        """))
        
        conn.commit()
    
    print("✅ OAuth fields removed from users table successfully!")

if __name__ == '__main__':
    from app import create_app
    
    app = create_app()
    with app.app_context():
        try:
            upgrade()
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

