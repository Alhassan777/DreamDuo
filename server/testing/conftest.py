"""
Pytest Configuration and Shared Fixtures
========================================

This module provides shared fixtures for all test modules including:
- Flask application configuration for testing
- Test database setup with in-memory SQLite
- JWT authentication bypass for protected endpoints
- Factory fixtures for creating test data (users, tasks, categories, etc.)

The fixtures ensure test isolation by:
1. Using an in-memory SQLite database
2. Rolling back transactions after each test
3. Providing fresh test data for each test function
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables BEFORE importing the app
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test_secret_key_for_unit_testing_only'
os.environ['FLASK_ENV'] = 'testing'
os.environ['FRONTEND_URL'] = 'http://localhost:5173'

import pytest
from flask import Flask
from flask_jwt_extended import create_access_token

from app import create_app
from models.db import db
from models.user import User
from models.task import Task
from models.category import Category
from models.priority import Priority
from models.task_dependency import TaskDependency
from models.task_hierarchy import TaskHierarchy
from models.user_settings import UserSettings


# =============================================================================
# APPLICATION FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def app():
    """
    Create a Flask application configured for testing.
    
    Configuration:
    - TESTING mode enabled
    - In-memory SQLite database for isolation
    - JWT cookies disabled for easier testing
    - CSRF protection disabled
    
    Yields:
        Flask: Configured Flask application instance
    """
    test_app = create_app()
    test_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_COOKIE_CSRF_PROTECT': False,
        'JWT_TOKEN_LOCATION': ['headers', 'cookies'],  # Allow both for flexibility
        'WTF_CSRF_ENABLED': False,
    })
    
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """
    Create a test client for making HTTP requests.
    
    Args:
        app: Flask application fixture
        
    Returns:
        FlaskClient: Test client for making requests
    """
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """
    Provide a database session for direct database operations in tests.
    
    Args:
        app: Flask application fixture
        
    Yields:
        SQLAlchemy session: Database session
    """
    with app.app_context():
        yield db.session


# =============================================================================
# USER FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def test_user(app):
    """
    Create a standard test user for authentication tests.
    
    Returns:
        User: A user with email 'test@example.com' and password 'TestPassword123!'
    """
    with app.app_context():
        user = User(
            first_name='Test',
            last_name='User',
            email='test@example.com'
        )
        user.set_password('TestPassword123!')
        db.session.add(user)
        db.session.commit()
        
        # Refresh to get the ID
        db.session.refresh(user)
        return user


@pytest.fixture(scope='function')
def test_user_2(app):
    """
    Create a second test user for testing user isolation.
    
    Returns:
        User: A different user for testing cross-user access restrictions
    """
    with app.app_context():
        user = User(
            first_name='Another',
            last_name='User',
            email='another@example.com'
        )
        user.set_password('AnotherPassword123!')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


@pytest.fixture(scope='function')
def oauth_user(app):
    """
    Create a test user authenticated via OAuth (no password).
    
    Returns:
        User: OAuth user with auth_provider set to 'google'
    """
    with app.app_context():
        user = User(
            first_name='OAuth',
            last_name='User',
            email='oauth@example.com',
            auth_provider='google',
            provider_id='google_123456',
            password_hash=None
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


# =============================================================================
# AUTHENTICATION FIXTURES (JWT BYPASS)
# =============================================================================

@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """
    Generate JWT authentication headers for the test user.
    
    This fixture bypasses normal login flow by directly creating
    a valid JWT token for the test user.
    
    Args:
        app: Flask application fixture
        test_user: Test user fixture
        
    Returns:
        dict: Headers containing 'Authorization: Bearer <token>'
    """
    with app.app_context():
        access_token = create_access_token(identity=str(test_user.id))
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }


@pytest.fixture(scope='function')
def auth_headers_user_2(app, test_user_2):
    """
    Generate JWT authentication headers for the second test user.
    
    Used for testing user isolation and cross-user access attempts.
    
    Args:
        app: Flask application fixture
        test_user_2: Second test user fixture
        
    Returns:
        dict: Headers containing 'Authorization: Bearer <token>'
    """
    with app.app_context():
        access_token = create_access_token(identity=str(test_user_2.id))
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }


@pytest.fixture(scope='function')
def authenticated_client(client, auth_headers):
    """
    Provide a test client with authentication headers pre-configured.
    
    This is a convenience fixture that wraps the client's request methods
    to automatically include authentication headers.
    
    Args:
        client: Flask test client
        auth_headers: Authentication headers fixture
        
    Returns:
        tuple: (client, headers) for making authenticated requests
    """
    return client, auth_headers


# =============================================================================
# TASK FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def test_category(app, test_user):
    """
    Create a test category for task tests.
    
    Returns:
        Category: A category named 'Work' belonging to test_user
    """
    with app.app_context():
        category = Category(
            name='Work',
            description='Work-related tasks',
            icon='briefcase',
            user_id=test_user.id
        )
        db.session.add(category)
        db.session.commit()
        db.session.refresh(category)
        return category


@pytest.fixture(scope='function')
def test_priority(app, test_user):
    """
    Create a test priority level for task tests.
    
    Returns:
        Priority: A 'High' priority level with red color
    """
    with app.app_context():
        priority = Priority(
            level='High',
            color='#FF0000',
            user_id=test_user.id
        )
        db.session.add(priority)
        db.session.commit()
        db.session.refresh(priority)
        return priority


@pytest.fixture(scope='function')
def test_task(app, test_user):
    """
    Create a basic test task.
    
    Returns:
        Task: A simple task named 'Test Task' with today's creation date
    """
    with app.app_context():
        task = Task(
            name='Test Task',
            description='A test task description',
            user_id=test_user.id,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(task)
        db.session.flush()
        
        # Add to task hierarchy
        hierarchy = TaskHierarchy(
            ancestor=task.id,
            descendant=task.id,
            depth=0
        )
        db.session.add(hierarchy)
        db.session.commit()
        db.session.refresh(task)
        return task


@pytest.fixture(scope='function')
def test_task_with_subtasks(app, test_user):
    """
    Create a task with nested subtasks for hierarchy testing.
    
    Structure:
    - Parent Task
      - Subtask 1
        - Sub-subtask 1.1
      - Subtask 2
    
    Returns:
        dict: Contains IDs - 'parent_id', 'subtask1_id', 'subtask2_id', 'subsubtask_id'
    """
    with app.app_context():
        # Create parent task
        parent = Task(
            name='Parent Task',
            description='Parent task description',
            user_id=test_user.id,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(parent)
        db.session.flush()
        
        # Add parent to hierarchy
        db.session.add(TaskHierarchy(ancestor=parent.id, descendant=parent.id, depth=0))
        
        # Create subtask 1
        subtask1 = Task(
            name='Subtask 1',
            user_id=test_user.id,
            parent_id=parent.id,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(subtask1)
        db.session.flush()
        
        # Add subtask1 to hierarchy
        db.session.add(TaskHierarchy(ancestor=subtask1.id, descendant=subtask1.id, depth=0))
        db.session.add(TaskHierarchy(ancestor=parent.id, descendant=subtask1.id, depth=1))
        
        # Create subtask 2
        subtask2 = Task(
            name='Subtask 2',
            user_id=test_user.id,
            parent_id=parent.id,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(subtask2)
        db.session.flush()
        
        # Add subtask2 to hierarchy
        db.session.add(TaskHierarchy(ancestor=subtask2.id, descendant=subtask2.id, depth=0))
        db.session.add(TaskHierarchy(ancestor=parent.id, descendant=subtask2.id, depth=1))
        
        # Create sub-subtask
        subsubtask = Task(
            name='Sub-subtask 1.1',
            user_id=test_user.id,
            parent_id=subtask1.id,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(subsubtask)
        db.session.flush()
        
        # Add subsubtask to hierarchy
        db.session.add(TaskHierarchy(ancestor=subsubtask.id, descendant=subsubtask.id, depth=0))
        db.session.add(TaskHierarchy(ancestor=subtask1.id, descendant=subsubtask.id, depth=1))
        db.session.add(TaskHierarchy(ancestor=parent.id, descendant=subsubtask.id, depth=2))
        
        db.session.commit()
        
        # Return IDs to avoid detached instance errors
        return {
            'parent_id': parent.id,
            'subtask1_id': subtask1.id,
            'subtask2_id': subtask2.id,
            'subsubtask_id': subsubtask.id
        }


@pytest.fixture(scope='function')
def test_task_with_deadline(app, test_user):
    """
    Create a task with a deadline set to tomorrow.
    
    Returns:
        Task: Task with deadline field populated
    """
    with app.app_context():
        tomorrow = datetime.now() + timedelta(days=1)
        task = Task(
            name='Task with Deadline',
            description='This task has a deadline',
            user_id=test_user.id,
            deadline=tomorrow,
            creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(task)
        db.session.flush()
        
        # Add to task hierarchy
        hierarchy = TaskHierarchy(
            ancestor=task.id,
            descendant=task.id,
            depth=0
        )
        db.session.add(hierarchy)
        db.session.commit()
        db.session.refresh(task)
        return task


@pytest.fixture(scope='function')
def overdue_task(app, test_user):
    """
    Create an overdue task (deadline in the past).
    
    Returns:
        Task: Task with deadline 7 days ago
    """
    with app.app_context():
        past_date = datetime.now() - timedelta(days=7)
        task = Task(
            name='Overdue Task',
            description='This task is overdue',
            user_id=test_user.id,
            deadline=past_date,
            creation_date=(datetime.now() - timedelta(days=14)).replace(hour=0, minute=0, second=0, microsecond=0)
        )
        db.session.add(task)
        db.session.flush()
        
        hierarchy = TaskHierarchy(
            ancestor=task.id,
            descendant=task.id,
            depth=0
        )
        db.session.add(hierarchy)
        db.session.commit()
        db.session.refresh(task)
        return task


# =============================================================================
# USER SETTINGS FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def test_user_settings(app, test_user):
    """
    Create user settings for the test user.
    
    Returns:
        UserSettings: Settings with default theme and threshold
    """
    with app.app_context():
        settings = UserSettings(
            user_id=test_user.id,
            theme_preferences={'presetId': 'default'},
            overdue_warning_threshold=7
        )
        db.session.add(settings)
        db.session.commit()
        db.session.refresh(settings)
        return settings


# =============================================================================
# DEPENDENCY FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def test_tasks_for_dependencies(app, test_user):
    """
    Create multiple tasks for dependency testing.
    
    Returns:
        list: List of 5 task IDs for creating dependency chains
    """
    with app.app_context():
        task_ids = []
        for i in range(5):
            task = Task(
                name=f'Task {i+1}',
                user_id=test_user.id,
                creation_date=datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            )
            db.session.add(task)
            db.session.flush()
            
            hierarchy = TaskHierarchy(
                ancestor=task.id,
                descendant=task.id,
                depth=0
            )
            db.session.add(hierarchy)
            task_ids.append(task.id)
        
        db.session.commit()
        return task_ids


@pytest.fixture(scope='function')
def test_dependency(app, test_user, test_tasks_for_dependencies):
    """
    Create a basic dependency between two tasks.
    
    Returns:
        int: Dependency ID
    """
    with app.app_context():
        task_ids = test_tasks_for_dependencies
        dependency = TaskDependency(
            source_task_id=task_ids[0],
            target_task_id=task_ids[1],
            user_id=test_user.id
        )
        db.session.add(dependency)
        db.session.commit()
        return dependency.id


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def create_test_user(app, email='unique@example.com', first_name='Test', last_name='User', password='Password123!'):
    """
    Helper function to create a user with custom attributes.
    
    Args:
        app: Flask application
        email: User email
        first_name: User's first name
        last_name: User's last name
        password: User's password
        
    Returns:
        User: Created user instance
    """
    with app.app_context():
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


def create_test_task(app, user_id, name='Test Task', parent_id=None, **kwargs):
    """
    Helper function to create a task with custom attributes.
    
    Args:
        app: Flask application
        user_id: Owner user ID
        name: Task name
        parent_id: Optional parent task ID
        **kwargs: Additional task attributes
        
    Returns:
        Task: Created task instance
    """
    with app.app_context():
        task = Task(
            name=name,
            user_id=user_id,
            parent_id=parent_id,
            creation_date=kwargs.get('creation_date', datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)),
            **{k: v for k, v in kwargs.items() if k != 'creation_date'}
        )
        db.session.add(task)
        db.session.flush()
        
        # Add hierarchy entry
        hierarchy = TaskHierarchy(
            ancestor=task.id,
            descendant=task.id,
            depth=0
        )
        db.session.add(hierarchy)
        
        if parent_id:
            # Add parent-child hierarchy entries
            parent_hierarchies = db.session.query(TaskHierarchy).filter(
                TaskHierarchy.descendant == parent_id
            ).all()
            for ph in parent_hierarchies:
                child_hierarchy = TaskHierarchy(
                    ancestor=ph.ancestor,
                    descendant=task.id,
                    depth=ph.depth + 1
                )
                db.session.add(child_hierarchy)
        
        db.session.commit()
        db.session.refresh(task)
        return task

