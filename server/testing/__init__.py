"""
Attack on Titan To-Do List - Backend Test Suite
================================================

This package contains comprehensive unit tests for the Flask backend API.

Test Modules:
- test_auth.py: Authentication tests (register, login, OAuth, logout)
- test_tasks.py: Task CRUD, search, statistics, and canvas tests
- test_user.py: User profile, theme preferences, and settings tests
- test_tags.py: Categories, priorities, and completion status tests
- test_task_utils.py: Task hierarchy utility function tests
- test_dependencies.py: Task dependency and cycle detection tests
- test_websocket.py: WebSocket event tests

Running Tests:
    cd server
    pytest testing/ -v --cov=. --cov-report=html

Test Configuration:
    - Uses in-memory SQLite database for isolation
    - JWT authentication is bypassed using test fixtures
    - Each test runs in its own transaction that is rolled back
"""

