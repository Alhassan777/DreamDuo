"""
Task API Tests
==============

This module tests all task-related endpoints:
- GET /api/tasks/ - Get all tasks (with optional date filter)
- POST /api/tasks/ - Create a new task
- PUT /api/tasks/<id> - Update an existing task
- DELETE /api/tasks/<id> - Delete a task
- PUT /api/tasks/<id>/toggle - Toggle task completion
- PUT /api/tasks/<id>/move - Move task to new parent
- GET /api/tasks/search - Search and filter tasks
- GET /api/tasks/stats - Get task statistics
- POST /api/tasks/<id>/position - Update canvas position
- POST /api/tasks/<id>/customize - Customize task appearance

Test Categories:
1. Task Creation Tests - Valid/invalid task creation
2. Task Retrieval Tests - Getting tasks with various filters
3. Task Update Tests - Modifying task properties
4. Task Deletion Tests - Deleting tasks and cascading
5. Task Completion Tests - Toggling completion status
6. Task Movement Tests - Moving tasks in hierarchy
7. Search and Filter Tests - Comprehensive filtering
8. Statistics Tests - Task stats by date range
9. Canvas Tests - Position and customization
10. Authorization Tests - User isolation verification

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json
from datetime import datetime, timedelta


class TestTaskCreation:
    """
    Test suite for task creation endpoint.
    
    Endpoint: POST /api/tasks/
    
    Tests cover:
    - Successful task creation
    - Task with parent (subtask)
    - Task with category and priority
    - Task with deadline
    - Validation errors
    """
    
    def test_create_task_basic(self, client, app, test_user, auth_headers):
        """
        Test creating a basic task with just a name.
        
        Expected: 201 status, task data returned with ID
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={'name': 'New Task'},
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['success'] == True
            assert data['data']['name'] == 'New Task'
            assert 'id' in data['data']
    
    def test_create_task_with_description(self, client, app, test_user, auth_headers):
        """
        Test creating a task with name and description.
        
        Expected: 201 status, description saved correctly
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={
                    'name': 'Described Task',
                    'description': 'This is a detailed description'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['data']['description'] == 'This is a detailed description'
    
    def test_create_subtask(self, client, app, test_user, auth_headers, test_task):
        """
        Test creating a subtask under an existing task.
        
        Expected: 201 status, parent_id set correctly
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={
                    'name': 'Subtask',
                    'parent_id': test_task.id
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['data']['parent_id'] == test_task.id
    
    def test_create_task_with_category(self, client, app, test_user, auth_headers, test_category):
        """
        Test creating a task with a category.
        
        Expected: 201 status, category info returned
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={
                    'name': 'Categorized Task',
                    'category_id': test_category.id
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['data']['category_id'] == test_category.id
    
    def test_create_task_with_priority(self, client, app, test_user, auth_headers, test_priority):
        """
        Test creating a task with a priority level.
        
        Expected: 201 status, priority info returned
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={
                    'name': 'Priority Task',
                    'priority': 'High'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['data']['name'] == 'Priority Task'
    
    def test_create_task_with_deadline(self, client, app, test_user, auth_headers):
        """
        Test creating a task with a deadline.
        
        Expected: 201 status, deadline saved correctly
        """
        with app.app_context():
            deadline = (datetime.now() + timedelta(days=7)).isoformat()
            response = client.post('/api/tasks/',
                json={
                    'name': 'Deadline Task',
                    'deadline': deadline
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['data']['deadline'] is not None
    
    def test_create_task_with_creation_date(self, client, app, test_user, auth_headers):
        """
        Test creating a task with a specific creation date.
        
        Expected: 201 status, creation_date set to specified value
        """
        with app.app_context():
            creation_date = '2024-01-15'
            response = client.post('/api/tasks/',
                json={
                    'name': 'Dated Task',
                    'creation_date': creation_date
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert '2024-01-15' in data['data']['creation_date']
    
    def test_create_task_missing_name(self, client, app, test_user, auth_headers):
        """
        Test creating a task fails without a name.
        
        Expected: 200 status with success=False (application error handling)
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={'description': 'No name provided'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == False
            assert 'name' in data['message'].lower()
    
    def test_create_task_negative_parent_id(self, client, app, test_user, auth_headers):
        """
        Test creating a task fails with negative parent_id.
        
        Expected: 200 status with success=False
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={
                    'name': 'Invalid Parent Task',
                    'parent_id': -1
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == False
    
    def test_create_task_no_auth(self, client, app):
        """
        Test creating a task fails without authentication.
        
        Expected: 401 status
        """
        with app.app_context():
            response = client.post('/api/tasks/',
                json={'name': 'Unauthorized Task'},
                content_type='application/json'
            )
            
            assert response.status_code == 401


class TestTaskRetrieval:
    """
    Test suite for task retrieval endpoint.
    
    Endpoint: GET /api/tasks/
    
    Tests cover:
    - Getting all tasks
    - Filtering by date
    - Timezone handling with client_today
    """
    
    def test_get_tasks_empty(self, client, app, test_user, auth_headers):
        """
        Test getting tasks when user has no tasks.
        
        Expected: 200 status, empty array
        """
        with app.app_context():
            response = client.get('/api/tasks/', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_tasks_with_data(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting tasks when user has tasks.
        
        Expected: 200 status, array with task data
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(f'/api/tasks/?date={today}', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_tasks_by_date(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting tasks filtered by a specific date.
        
        Expected: 200 status, only tasks visible on that date
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(f'/api/tasks/?date={today}', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_tasks_future_date(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting tasks for a future date.
        
        Expected: 200 status, respects visibility logic
        """
        with app.app_context():
            future_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            response = client.get(f'/api/tasks/?date={future_date}', headers=auth_headers)
            
            assert response.status_code == 200
    
    def test_get_tasks_past_date(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting tasks for a past date.
        
        Expected: 200 status, shows completed tasks from that period
        """
        with app.app_context():
            past_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            response = client.get(f'/api/tasks/?date={past_date}', headers=auth_headers)
            
            assert response.status_code == 200
    
    def test_get_tasks_invalid_date_format(self, client, app, test_user, auth_headers):
        """
        Test getting tasks with invalid date format.
        
        Expected: 400 status, error about invalid format
        """
        with app.app_context():
            response = client.get('/api/tasks/?date=invalid-date', headers=auth_headers)
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'error' in data
    
    def test_get_tasks_with_client_today(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting tasks with client's timezone date.
        
        Expected: 200 status, uses client_today for visibility logic
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/?date={today}&client_today={today}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_get_tasks_no_auth(self, client, app):
        """
        Test getting tasks fails without authentication.
        
        Expected: 401 status
        """
        with app.app_context():
            response = client.get('/api/tasks/')
            
            assert response.status_code == 401


class TestTaskUpdate:
    """
    Test suite for task update endpoint.
    
    Endpoint: PUT /api/tasks/<id>
    
    Tests cover:
    - Updating task name
    - Updating description
    - Changing priority
    - Changing category
    - Setting/clearing deadline
    - Moving to different parent
    """
    
    def test_update_task_name(self, client, app, test_user, auth_headers, test_task):
        """
        Test updating a task's name.
        
        Expected: 200 status, name updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}',
                json={'name': 'Updated Name'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['name'] == 'Updated Name'
    
    def test_update_task_description(self, client, app, test_user, auth_headers, test_task):
        """
        Test updating a task's description.
        
        Expected: 200 status, description updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}',
                json={'description': 'New description'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['description'] == 'New description'
    
    def test_update_task_priority(self, client, app, test_user, auth_headers, test_task, test_priority):
        """
        Test updating a task's priority.
        
        Expected: 200 status, priority updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}',
                json={'priority': 'High'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_update_task_set_deadline(self, client, app, test_user, auth_headers, test_task):
        """
        Test setting a deadline on a task.
        
        Expected: 200 status, deadline set
        """
        with app.app_context():
            deadline = (datetime.now() + timedelta(days=5)).isoformat()
            response = client.put(f'/api/tasks/{test_task.id}',
                json={'deadline': deadline},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['deadline'] is not None
    
    def test_update_task_clear_deadline(self, client, app, test_user, auth_headers, test_task_with_deadline):
        """
        Test clearing a deadline from a task.
        
        Expected: 200 status, deadline set to null
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task_with_deadline.id}',
                json={'deadline': None},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['deadline'] is None
    
    def test_update_task_not_found(self, client, app, test_user, auth_headers):
        """
        Test updating a non-existent task.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.put('/api/tasks/99999',
                json={'name': 'Ghost Task'},
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_update_task_other_user(self, client, app, test_user, auth_headers_user_2, test_task):
        """
        Test updating another user's task (should fail).
        
        Expected: 404 status (user isolation)
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}',
                json={'name': 'Hacked Name'},
                headers=auth_headers_user_2
            )
            
            assert response.status_code == 404


class TestTaskDeletion:
    """
    Test suite for task deletion endpoint.
    
    Endpoint: DELETE /api/tasks/<id>
    
    Tests cover:
    - Deleting a single task
    - Deleting task with subtasks (cascade)
    - Deleting non-existent task
    - Authorization checks
    """
    
    def test_delete_task_success(self, client, app, test_user, auth_headers, test_task):
        """
        Test successfully deleting a task.
        
        Expected: 200 status, success message
        """
        with app.app_context():
            response = client.delete(f'/api/tasks/{test_task.id}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'deleted' in data['message'].lower()
    
    def test_delete_task_with_subtasks(self, client, app, test_user, auth_headers, test_task_with_subtasks):
        """
        Test deleting a task also deletes its subtasks.
        
        Expected: 200 status, parent and all subtasks deleted
        """
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            parent_id = task_hierarchy['parent_id']
            response = client.delete(f'/api/tasks/{parent_id}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_delete_task_not_found(self, client, app, test_user, auth_headers):
        """
        Test deleting a non-existent task.
        
        Expected: 400 status (delete_task returns False)
        """
        with app.app_context():
            response = client.delete('/api/tasks/99999',
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_delete_task_other_user(self, client, app, test_user, auth_headers_user_2, test_task):
        """
        Test deleting another user's task (should fail).
        
        Expected: 400 status (task not found for this user)
        """
        with app.app_context():
            response = client.delete(f'/api/tasks/{test_task.id}',
                headers=auth_headers_user_2
            )
            
            assert response.status_code == 400


class TestTaskToggleCompletion:
    """
    Test suite for task completion toggle endpoint.
    
    Endpoint: PUT /api/tasks/<id>/toggle
    
    Tests cover:
    - Completing a task
    - Uncompleting a task
    - completed_date handling
    """
    
    def test_toggle_task_complete(self, client, app, test_user, auth_headers, test_task):
        """
        Test marking a task as complete.
        
        Expected: 200 status, completed=True
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}/toggle',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['completed'] == True
    
    def test_toggle_task_uncomplete(self, client, app, test_user, auth_headers, test_task):
        """
        Test marking a completed task as incomplete.
        
        Expected: 200 status, completed toggled back to False
        """
        with app.app_context():
            # First complete it
            client.put(f'/api/tasks/{test_task.id}/toggle', headers=auth_headers)
            
            # Then uncomplete it
            response = client.put(f'/api/tasks/{test_task.id}/toggle',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['completed'] == False
    
    def test_toggle_task_not_found(self, client, app, test_user, auth_headers):
        """
        Test toggling a non-existent task.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.put('/api/tasks/99999/toggle',
                headers=auth_headers
            )
            
            assert response.status_code == 404


class TestTaskMove:
    """
    Test suite for task movement endpoint.
    
    Endpoint: PUT /api/tasks/<id>/move
    
    Tests cover:
    - Moving task to new parent
    - Moving task to root level
    - Circular reference prevention
    - Self-reference prevention
    """
    
    def test_move_task_to_new_parent(self, client, app, test_user, auth_headers, test_task_with_subtasks):
        """
        Test moving a task to a different parent.
        
        Expected: 200 status, parent_id updated
        """
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            subtask2_id = task_hierarchy['subtask2_id']
            subtask1_id = task_hierarchy['subtask1_id']
            
            response = client.put(f'/api/tasks/{subtask2_id}/move',
                json={'parent_id': subtask1_id},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_move_task_to_root(self, client, app, test_user, auth_headers, test_task_with_subtasks):
        """
        Test moving a subtask to become a root task.
        
        Expected: 200 status, parent_id=None
        """
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            subtask1_id = task_hierarchy['subtask1_id']
            
            response = client.put(f'/api/tasks/{subtask1_id}/move',
                json={'parent_id': None},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_move_task_self_reference(self, client, app, test_user, auth_headers, test_task):
        """
        Test moving a task to be its own parent (should fail).
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put(f'/api/tasks/{test_task.id}/move',
                json={'parent_id': test_task.id},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_move_task_circular_reference(self, client, app, test_user, auth_headers, test_task_with_subtasks):
        """
        Test moving a parent task under its own subtask (circular, should fail).
        
        Expected: 400 status
        """
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            parent_id = task_hierarchy['parent_id']
            subtask1_id = task_hierarchy['subtask1_id']
            
            response = client.put(f'/api/tasks/{parent_id}/move',
                json={'parent_id': subtask1_id},
                headers=auth_headers
            )
            
            assert response.status_code == 400


class TestTaskSearch:
    """
    Test suite for task search endpoint.
    
    Endpoint: GET /api/tasks/search
    
    Tests cover:
    - Search by text query
    - Filter by category
    - Filter by priority
    - Filter by completion status
    - Filter by date range
    - Time scope (daily, weekly, monthly, yearly)
    """
    
    def test_search_tasks_daily(self, client, app, test_user, auth_headers, test_task):
        """
        Test searching tasks with daily time scope.
        
        Expected: 200 status, tasks for today
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=daily&anchor_date={today}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_search_tasks_weekly(self, client, app, test_user, auth_headers, test_task):
        """
        Test searching tasks with weekly time scope.
        
        Expected: 200 status, tasks for current week
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=weekly&anchor_date={today}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_search_tasks_monthly(self, client, app, test_user, auth_headers, test_task):
        """
        Test searching tasks with monthly time scope.
        
        Expected: 200 status, tasks for current month
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=monthly&anchor_date={today}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_search_tasks_with_query(self, client, app, test_user, auth_headers, test_task):
        """
        Test searching tasks by text query.
        
        Expected: 200 status, matching tasks returned
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=daily&anchor_date={today}&search_query=Test',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_search_tasks_completed_only(self, client, app, test_user, auth_headers, test_task):
        """
        Test filtering for completed tasks only.
        
        Expected: 200 status, only completed tasks
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=monthly&anchor_date={today}&completion_status=completed',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_search_tasks_incomplete_only(self, client, app, test_user, auth_headers, test_task):
        """
        Test filtering for incomplete tasks only.
        
        Expected: 200 status, only incomplete tasks
        """
        with app.app_context():
            today = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/search?time_scope=monthly&anchor_date={today}&completion_status=incomplete',
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_search_invalid_time_scope(self, client, app, test_user, auth_headers):
        """
        Test search with invalid time scope.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.get(
                '/api/tasks/search?time_scope=invalid',
                headers=auth_headers
            )
            
            assert response.status_code == 400


class TestTaskStats:
    """
    Test suite for task statistics endpoint.
    
    Endpoint: GET /api/tasks/stats
    
    Tests cover:
    - Getting stats for date range
    - Filtering by category
    - Filtering by priority
    - Missing date parameters
    """
    
    def test_get_stats_basic(self, client, app, test_user, auth_headers, test_task):
        """
        Test getting task statistics for a date range.
        
        Expected: 200 status, stats array with daily data
        """
        with app.app_context():
            start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            end = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/stats?start_date={start}&end_date={end}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_stats_missing_start_date(self, client, app, test_user, auth_headers):
        """
        Test stats fails without start_date.
        
        Expected: 400 status
        """
        with app.app_context():
            end = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/stats?end_date={end}',
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_get_stats_missing_end_date(self, client, app, test_user, auth_headers):
        """
        Test stats fails without end_date.
        
        Expected: 400 status
        """
        with app.app_context():
            start = datetime.now().strftime('%Y-%m-%d')
            response = client.get(
                f'/api/tasks/stats?start_date={start}',
                headers=auth_headers
            )
            
            assert response.status_code == 400


class TestTaskCanvasPosition:
    """
    Test suite for task canvas position endpoint.
    
    Endpoint: POST /api/tasks/<id>/position
    
    Tests cover:
    - Setting valid coordinates
    - Missing coordinates
    - Invalid coordinate values
    """
    
    def test_update_position_success(self, client, app, test_user, auth_headers, test_task):
        """
        Test updating task position with valid coordinates.
        
        Expected: 200 status, coordinates saved
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/position',
                json={'x': 100.5, 'y': 200.5},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == True
            assert data['data']['position_x'] == 100.5
            assert data['data']['position_y'] == 200.5
    
    def test_update_position_missing_x(self, client, app, test_user, auth_headers, test_task):
        """
        Test position update fails without x coordinate.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/position',
                json={'y': 200},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_position_missing_y(self, client, app, test_user, auth_headers, test_task):
        """
        Test position update fails without y coordinate.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/position',
                json={'x': 100},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_position_not_found(self, client, app, test_user, auth_headers):
        """
        Test position update fails for non-existent task.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.post('/api/tasks/99999/position',
                json={'x': 100, 'y': 200},
                headers=auth_headers
            )
            
            assert response.status_code == 404


class TestTaskCustomization:
    """
    Test suite for task customization endpoint.
    
    Endpoint: POST /api/tasks/<id>/customize
    
    Tests cover:
    - Setting custom color
    - Setting custom shape
    - Both color and shape
    """
    
    def test_customize_color(self, client, app, test_user, auth_headers, test_task):
        """
        Test setting custom color for a task.
        
        Expected: 200 status, color saved
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/customize',
                json={'color': '#FF5733'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['canvas_color'] == '#FF5733'
    
    def test_customize_shape(self, client, app, test_user, auth_headers, test_task):
        """
        Test setting custom shape for a task.
        
        Expected: 200 status, shape saved
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/customize',
                json={'shape': 'circle'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['canvas_shape'] == 'circle'
    
    def test_customize_both(self, client, app, test_user, auth_headers, test_task):
        """
        Test setting both color and shape.
        
        Expected: 200 status, both saved
        """
        with app.app_context():
            response = client.post(f'/api/tasks/{test_task.id}/customize',
                json={'color': '#00FF00', 'shape': 'rectangle'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['canvas_color'] == '#00FF00'
            assert data['data']['canvas_shape'] == 'rectangle'

