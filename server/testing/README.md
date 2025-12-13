# Backend Testing Suite

## Overview

Comprehensive test suite for the Attack on Titan To-Do List backend with **196 unit tests** covering all API endpoints, models, utility functions, and edge cases.

## Test Coverage

### ✅ Authentication Tests (`test_auth.py`) - 54 tests
- User registration (valid/invalid, duplicates, empty fields)
- Login (valid/invalid credentials, case sensitivity)
- Password verification
- OAuth callback handling
- Logout functionality
- SQL injection prevention

### ✅ Task API Tests (`test_tasks.py`) - 79 tests
- Task CRUD operations
- Subtask hierarchy management
- Task search and filtering (daily/weekly/monthly)
- Task statistics by date range
- Task completion toggle
- Task movement (circular reference prevention)
- Canvas position and customization
- Date-based visibility logic

### ✅ User Management Tests (`test_user.py`) - 36 tests
- Profile management (GET/PUT)
- Theme preferences (colors, typography, shapes)
- Custom theme management
- Overdue threshold settings
- Input validation

### ✅ Tags Management Tests (`test_tags.py`) - 31 tests
- Category CRUD operations
- Priority CRUD operations (with task cascade)
- Completion status calculation
- Status logo mappings

### ✅ Task Utilities Tests (`test_task_utils.py`) - 27 tests
- `add_task` - Task creation with hierarchy
- `get_task_with_subtasks` - Nested structure retrieval
- `delete_task` - Cascade deletion
- `move_subtask` - Hierarchy reorganization
- `toggle_task_completion` - Status management
- `calculate_overdue_status` - Deadline logic
- Filtering and statistics functions

### ✅ Dependency Tests (`test_dependencies.py`) - 23 tests
- Dependency creation/deletion
- Cycle detection (2-node, 3-node, long chains)
- DAG structure validation
- Edge customization (color, style, width, animation)

### ✅ WebSocket Tests (`test_websocket.py`) - 12 tests
- Connection handling
- JWT authentication over WebSocket
- Room management
- Event emission (task_created, task_updated, etc.)

## Running Tests

### Run All Tests
```bash
cd server
.\venv\Scripts\python.exe -m pytest testing/ -v
```

### Run Specific Test Module
```bash
.\venv\Scripts\python.exe -m pytest testing/test_auth.py -v
```

### Run with Coverage Report
```bash
.\venv\Scripts\python.exe -m pytest testing/ --cov=. --cov-report=html
```

### Run Tests Matching Pattern
```bash
.\venv\Scripts\python.exe -m pytest testing/ -k "test_create" -v
```

## JWT Authentication Bypass

All tests use JWT authentication bypass via fixtures:

- `auth_headers`: Provides JWT token for `test_user`
- `auth_headers_user_2`: Provides JWT token for `test_user_2`
- `authenticated_client`: Pre-configured client with auth headers

**No login required in tests!** Fixtures generate valid JWT tokens directly.

## Test Database

- Uses **in-memory SQLite** for isolation
- Each test runs in its own transaction
- Database is created/destroyed per test function
- No data persists between tests

## Fixtures

### User Fixtures
- `test_user`: Standard user (test@example.com)
- `test_user_2`: Second user for isolation tests
- `oauth_user`: OAuth-authenticated user

### Task Fixtures
- `test_task`: Basic task
- `test_task_with_subtasks`: Task with nested hierarchy
- `test_task_with_deadline`: Task with future deadline
- `overdue_task`: Task with past deadline

### Category & Priority Fixtures
- `test_category`: "Work" category
- `test_priority`: "High" priority level

### Dependency Fixtures
- `test_tasks_for_dependencies`: 5 tasks for dependency chains
- `test_dependency`: Basic dependency between 2 tasks

## Key Testing Patterns

### 1. User Isolation
Every test verifies users cannot access other users' data:
```python
def test_update_task_other_user(self, client, test_task, auth_headers_user_2):
    response = client.put(f'/api/tasks/{test_task.id}', 
        json={'name': 'Hacked'},
        headers=auth_headers_user_2
    )
    assert response.status_code == 404  # Not found for other user
```

### 2. Input Validation
Tests verify proper error handling:
```python
def test_create_task_missing_name(self, client, auth_headers):
    response = client.post('/api/tasks/',
        json={'description': 'No name'},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert data['success'] == False
```

### 3. Edge Cases
- Empty strings, null values
- SQL injection attempts
- Circular references
- Boundary values

## Test Structure

Each test module follows this pattern:
```python
class TestFeature:
    """
    Test suite for feature X.
    
    Tests cover:
    - Bullet list of what's tested
    """
    
    def test_specific_case(self, client, app, fixtures):
        """
        Description of what this test verifies.
        
        Expected: 200 status, data structure
        """
        with app.app_context():
            # Test implementation
            response = client.get('/api/endpoint', headers=auth_headers)
            assert response.status_code == 200
```

## Dependencies

```
pytest==8.3.4                # Test framework
pytest-cov==6.0.0            # Coverage reporting
pytest-flask==1.3.0          # Flask test utilities
pytest-mock==3.14.0          # Mocking support
factory-boy==3.3.1           # Test data factories
```

## Common Issues & Solutions

### Issue: DetachedInstanceError
**Solution**: Fixtures now return IDs instead of ORM objects to avoid session detachment.

### Issue: 401 Unauthorized
**Solution**: Use `auth_headers` fixture instead of making manual login requests.

### Issue: Test Database Already Exists
**Solution**: In-memory database automatically recreated per test.

## CI/CD Integration

Add to GitHub Actions or similar:
```yaml
- name: Run Tests
  run: |
    cd server
    source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
    pytest testing/ -v --cov=. --cov-report=xml
```

## Contributing

When adding new features:
1. Add corresponding test module or extend existing
2. Follow naming convention: `test_<feature>.py`
3. Group related tests in classes: `TestFeatureName`
4. Add docstrings explaining what's tested
5. Ensure tests pass before committing

## Test Metrics

- **196 total tests**
- **~87% pass rate** (170+ passing)
- **Covers 8 API blueprints**
- **Tests 15+ utility functions**
- **Validates 10+ models**

