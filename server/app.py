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

            # Run migrations automatically if AUTO_MIGRATE is enabled (for deployment)
            auto_migrate = os.getenv('AUTO_MIGRATE', 'false').lower() == 'true'
            if auto_migrate:
                try:
                    from flask_migrate import upgrade
                    print('🔄 Auto-migration enabled, running migrations...')
                    upgrade()
                    print('✅ Migrations completed successfully')
                except Exception as migration_error:
                    print(f'⚠️  Migration error (continuing anyway): {str(migration_error)}')
                    # In production, you might want to raise here instead
                    if os.getenv('FLASK_ENV') == 'production':
                        raise

            # Create database tables (fallback if migrations not used)
            db.create_all()
            print('Database initialized successfully')
        except Exception as e:
            print(f'Error initializing database: {str(e)}')
            raise

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') != 'production'
    socketio.run(app, debug=debug, host='0.0.0.0', port=port)
