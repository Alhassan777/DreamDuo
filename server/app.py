from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import timedelta
from dotenv import load_dotenv
import os
from models import db

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()

def create_app():
    # Load environment variables
    load_dotenv()

    # Initialize Flask app
    app = Flask(__name__)

    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"],
            "max_age": 3600
        }
    })

    # Configure SQLAlchemy
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Configure JWT
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if not jwt_secret:
        raise ValueError('JWT_SECRET_KEY environment variable is not set')
    
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    with app.app_context():
        try:
            # Import models and routes after app creation to avoid circular imports
            from models import User, Category, Task
            from routes import auth_bp, tasks_bp, categories_bp

            # Register blueprints
            app.register_blueprint(auth_bp, url_prefix='/api/auth')
            app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
            app.register_blueprint(categories_bp, url_prefix='/api/categories')

            # Create database tables
            db.create_all()
            print('Database initialized successfully')
        except Exception as e:
            print(f'Error initializing database: {str(e)}')
            raise

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=3001)