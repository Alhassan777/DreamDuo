"""
Run database migrations automatically on startup
This script ensures all migrations are applied before the app starts
"""
import os
import sys
from flask import Flask
from flask_migrate import upgrade

def run_migrations():
    """Run all pending database migrations"""
    try:
        # Import app factory to get the Flask app context
        from app import create_app
        
        app = create_app()
        
        with app.app_context():
            print("🔄 Running database migrations...")
            # Upgrade to the latest migration
            upgrade()
            print("✅ Database migrations completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Migration error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    run_migrations()

