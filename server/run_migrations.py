"""
Run database migrations manually
This script can be used to manually run migrations if needed
"""
import os
import sys

# Set the working directory to the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

from flask_migrate import upgrade, stamp
import sqlalchemy as sa

def run_migrations():
    """Run all pending database migrations"""
    try:
        # Import app factory to get the Flask app context
        from app import create_app
        
        print("🔄 Creating Flask app context...")
        print(f"   Working directory: {os.getcwd()}")
        print(f"   Script directory: {script_dir}")
        
        app = create_app()
        
        with app.app_context():
            print("🔄 Running database migrations...")
            
            # Import db to check tables
            from models.db import db
            
            # Check existing tables
            inspector = sa.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"📊 Existing tables: {', '.join(tables)}")
            
            if 'alembic_version' not in tables:
                print("⚠️  alembic_version table not found, running migrations for the first time...")
            else:
                # Check current version
                with db.engine.connect() as conn:
                    result = conn.execute(sa.text("SELECT version_num FROM alembic_version"))
                    current_version = result.fetchone()
                    if current_version:
                        print(f"📌 Current migration version: {current_version[0]}")
            
            # Upgrade to the latest migration
            print("🔄 Applying migrations...")
            upgrade()
            print("✅ Database migrations completed successfully!")
            
            # Verify the columns were added
            if 'users' in tables:
                columns = [col['name'] for col in inspector.get_columns('users')]
                print(f"📊 Users table columns: {', '.join(columns)}")
                
                if 'auth_provider' in columns:
                    print("✅ OAuth columns verified present!")
                else:
                    print("⚠️  OAuth columns NOT found - migration may not have applied")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    run_migrations()

