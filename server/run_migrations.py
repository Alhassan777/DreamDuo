"""
Run database migrations manually
This script can be used to manually run migrations if needed
"""
import os
import sys
from flask import Flask
from flask_migrate import upgrade, stamp
import sqlalchemy as sa

def run_migrations():
    """Run all pending database migrations"""
    try:
        # Import app factory to get the Flask app context
        from app import create_app
        
        print("🔄 Creating Flask app context...")
        app = create_app()
        
        with app.app_context():
            print("🔄 Running database migrations...")
            
            # Import db to check tables
            from models.db import db
            
            # Check existing tables
            inspector = sa.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"📊 Existing tables: {tables}")
            
            if 'alembic_version' not in tables:
                print("⚠️  alembic_version table not found, running migrations for the first time...")
            
            # Upgrade to the latest migration
            upgrade()
            print("✅ Database migrations completed successfully!")
            
            # Verify the columns were added
            columns = [col['name'] for col in inspector.get_columns('users')]
            print(f"📊 Users table columns: {columns}")
            
            if 'auth_provider' in columns:
                print("✅ OAuth columns verified!")
            else:
                print("⚠️  OAuth columns not found, migration may not have applied correctly")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    run_migrations()

