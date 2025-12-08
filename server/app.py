from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import timedelta
from dotenv import load_dotenv
import os
from models.db import db
import secrets
from socket_events import socketio
# Initialize extensions
migrate = Migrate()
jwt = JWTManager()

def create_app():
    # Load environment variables
    load_dotenv()

    # Initialize Flask app
    app = Flask(__name__)

    # Get allowed origins from environment variable
    allowed_origins = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    # Support multiple origins (comma-separated)
    allowed_origins_list = [origin.strip() for origin in allowed_origins.split(',')]
    
    # ✅ Enable CORS Globally with proper configuration
    CORS(app, 
         resources={r"/api/*": {"origins": allowed_origins_list}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # ✅ Ensure CORS Headers in Responses
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        if origin in allowed_origins_list:
            response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = "true"
        response.headers['Access-Control-Allow-Methods'] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers['Access-Control-Allow-Headers'] = "Content-Type, Authorization"
        return response
    
    # Configure SQLAlchemy
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Configure JWT
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if not jwt_secret:
        if os.getenv('FLASK_ENV') == 'production':
            raise ValueError('JWT_SECRET_KEY must be set in production')
        jwt_secret = secrets.token_hex(32)
        print('WARNING: Using auto-generated JWT_SECRET_KEY for development')
    
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']  # ✅ Read token from cookies
    # Set cookie secure to True in production (requires HTTPS)
    app.config['JWT_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
    app.config['JWT_COOKIE_SAMESITE'] = 'None' if os.getenv('FLASK_ENV') == 'production' else 'lax'
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Disable CSRF protection for now
    app.config['JWT_COOKIE_DOMAIN'] = None  # Allow the browser to handle cookie domain automatically

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins=allowed_origins_list)

    with app.app_context():
        try:
            # Import models and routes after app creation to avoid circular imports
            from models import User, Category, Task, TaskDependency
            from routes import auth_bp, tasks_bp, user_bp, tags_bp

            # Register blueprints
            app.register_blueprint(auth_bp, url_prefix='/api/auth')
            app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
            app.register_blueprint(user_bp)
            app.register_blueprint(tags_bp, url_prefix='/api/tags')

            # Run migrations automatically in production
            auto_migrate = os.getenv('AUTO_MIGRATE', 'false').lower() == 'true'
            is_production = os.getenv('FLASK_ENV') == 'production'
            # Also detect production by DATABASE_URL (Render, Heroku, etc. use postgres://)
            database_url = os.getenv('DATABASE_URL', '')
            is_postgres = 'postgres' in database_url.lower()
            migration_success = False
            
            print(f'🔍 Environment Check:')
            print(f'   - FLASK_ENV: {os.getenv("FLASK_ENV")}')
            print(f'   - AUTO_MIGRATE: {auto_migrate}')
            print(f'   - Database: {"PostgreSQL" if is_postgres else "SQLite"}')
            
            # Always attempt migrations in production, or if AUTO_MIGRATE is explicitly enabled
            # Also run if using PostgreSQL (production database)
            should_migrate = auto_migrate or is_production or is_postgres
            
            if should_migrate:
                print('🔄 Attempting to run database migrations...')
                print(f'   Database URL: {database_url[:30]}...')
                try:
                    from flask_migrate import upgrade, stamp
                    import sqlalchemy as sa
                    
                    # Check if alembic_version table exists
                    inspector = sa.inspect(db.engine)
                    tables = inspector.get_table_names()
                    
                    print(f'📊 Existing tables: {", ".join(tables)}')
                    
                    # Check if OAuth columns exist
                    if 'users' in tables:
                        user_columns = [col['name'] for col in inspector.get_columns('users')]
                        print(f'📊 Users table columns: {", ".join(user_columns)}')
                        
                        if 'auth_provider' not in user_columns:
                            print('⚠️  OAuth columns missing! Running migrations...')
                    
                    if 'alembic_version' not in tables:
                        print('⚠️  alembic_version table not found, creating and running migrations...')
                        # Run migrations - this will create alembic_version table
                        upgrade()
                        print('✅ Migrations completed successfully (first time)')
                        migration_success = True
                    else:
                        # Check current migration version
                        with db.engine.connect() as conn:
                            result = conn.execute(sa.text("SELECT version_num FROM alembic_version"))
                            current_version = result.fetchone()
                            if current_version:
                                print(f'📌 Current migration version: {current_version[0]}')
                        
                        print('📌 Running upgrade to latest...')
                        try:
                            upgrade()
                            print('✅ Migrations completed successfully')
                            migration_success = True
                        except Exception as upgrade_error:
                            print(f'⚠️  Upgrade error: {str(upgrade_error)}')
                            # If upgrade fails but columns already exist, that's okay
                            if 'already exists' in str(upgrade_error).lower():
                                print('✅ Columns already exist, marking as success')
                                migration_success = True
                            else:
                                raise
                        
                        # Verify OAuth columns were added
                        if 'users' in tables:
                            user_columns = [col['name'] for col in inspector.get_columns('users')]
                            if 'auth_provider' in user_columns:
                                print('✅ OAuth columns verified!')
                            else:
                                print('❌ OAuth columns still missing after migration!')
                        
                except Exception as migration_error:
                    error_str = str(migration_error)
                    print(f'❌ Migration error: {error_str}')
                    
                    # If error is due to duplicate columns/tables, database is likely already up to date
                    if 'already exists' in error_str.lower() or 'duplicate' in error_str.lower():
                        print('⚠️  Database appears to already have the schema, trying to stamp...')
                        try:
                            from flask_migrate import stamp
                            stamp(revision='head')
                            print('✅ Database stamped with latest migration version')
                            migration_success = True
                        except Exception as stamp_error:
                            print(f'❌ Could not stamp database: {str(stamp_error)}')
                            # Try db.create_all as last resort
                            print('⚠️  Falling back to db.create_all()...')
                    else:
                        print(f'❌ Migration failed with unexpected error: {error_str}')
                        print('⚠️  Falling back to db.create_all()...')
            else:
                print('ℹ️  Auto-migration disabled, using db.create_all()')

            # Create database tables (fallback if migrations not used or failed)
            if not migration_success:
                db.create_all()
                print('✅ Database initialized successfully using db.create_all()')
            else:
                print('✅ Database initialized with migrations')
        except Exception as e:
            print(f'Error initializing database: {str(e)}')
            raise

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') != 'production'
    socketio.run(app, debug=debug, host='0.0.0.0', port=port)
