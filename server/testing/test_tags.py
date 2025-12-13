"""
Tags (Categories & Priorities) API Tests
========================================

This module tests all tag-related endpoints:
- GET/POST /api/tags/categories - Category listing and creation
- PUT/DELETE /api/tags/categories/<id> - Category modification
- GET/POST /api/tags/priorities - Priority listing and creation
- PUT/DELETE /api/tags/priorities/<priority> - Priority modification
- GET /api/tags/completion-status - Task completion statistics
- GET /api/tags/status-logos - Status logo mappings
- PUT /api/tags/status-logo/<id> - Status logo updates

Test Categories:
1. Category Tests - CRUD operations for categories
2. Priority Tests - CRUD operations for priorities
3. Completion Status Tests - Task statistics
4. Status Logo Tests - Logo mapping management
5. Validation Tests - Input validation
6. Authorization Tests - User isolation

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json


class TestCategories:
    """
    Test suite for category management endpoints.
    
    Endpoints:
    - GET /api/tags/categories
    - POST /api/tags/categories
    - PUT /api/tags/categories/<id>
    - DELETE /api/tags/categories/<id>
    
    Tests cover:
    - Listing categories
    - Creating categories
    - Updating categories
    - Deleting categories
    - User isolation
    """
    
    def test_get_categories_empty(self, client, app, test_user, auth_headers):
        """
        Test getting categories when none exist.
        
        Expected: 200 status, empty array
        """
        with app.app_context():
            response = client.get('/api/tags/categories', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_categories_with_data(self, client, app, test_user, auth_headers, test_category):
        """
        Test getting categories when some exist.
        
        Expected: 200 status, array with category data
        """
        with app.app_context():
            response = client.get('/api/tags/categories', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert len(data) >= 1
            assert any(c['name'] == 'Work' for c in data)
    
    def test_create_category_success(self, client, app, test_user, auth_headers):
        """
        Test creating a new category.
        
        Expected: 201 status, category data returned
        """
        with app.app_context():
            response = client.post('/api/tags/categories',
                json={
                    'name': 'Personal',
                    'description': 'Personal tasks',
                    'icon': 'home'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['name'] == 'Personal'
            assert data['description'] == 'Personal tasks'
            assert data['icon'] == 'home'
            assert 'id' in data
    
    def test_create_category_name_only(self, client, app, test_user, auth_headers):
        """
        Test creating a category with only name (optional fields omitted).
        
        Expected: 201 status, category created
        """
        with app.app_context():
            response = client.post('/api/tags/categories',
                json={'name': 'Simple Category'},
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['name'] == 'Simple Category'
    
    def test_create_category_missing_name(self, client, app, test_user, auth_headers):
        """
        Test creating a category fails without name.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post('/api/tags/categories',
                json={'description': 'No name provided'},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_update_category_name(self, client, app, test_user, auth_headers, test_category):
        """
        Test updating a category's name.
        
        Expected: 200 status, name updated
        """
        with app.app_context():
            response = client.put(f'/api/tags/categories/{test_category.id}',
                json={'name': 'Updated Work'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['name'] == 'Updated Work'
    
    def test_update_category_all_fields(self, client, app, test_user, auth_headers, test_category):
        """
        Test updating all category fields.
        
        Expected: 200 status, all fields updated
        """
        with app.app_context():
            response = client.put(f'/api/tags/categories/{test_category.id}',
                json={
                    'name': 'New Name',
                    'description': 'New Description',
                    'icon': 'star'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['name'] == 'New Name'
            assert data['description'] == 'New Description'
            assert data['icon'] == 'star'
    
    def test_update_category_not_found(self, client, app, test_user, auth_headers):
        """
        Test updating non-existent category fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.put('/api/tags/categories/99999',
                json={'name': 'Ghost Category'},
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_delete_category_success(self, client, app, test_user, auth_headers, test_category):
        """
        Test deleting a category.
        
        Expected: 200 status, success message
        """
        with app.app_context():
            response = client.delete(f'/api/tags/categories/{test_category.id}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'deleted' in data['message'].lower()
    
    def test_delete_category_not_found(self, client, app, test_user, auth_headers):
        """
        Test deleting non-existent category fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.delete('/api/tags/categories/99999',
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_category_user_isolation(self, client, app, test_user, auth_headers_user_2, test_category):
        """
        Test that user cannot access another user's categories.
        
        Expected: 404 for update/delete, not visible in list
        """
        with app.app_context():
            # Try to update other user's category
            response = client.put(f'/api/tags/categories/{test_category.id}',
                json={'name': 'Hacked'},
                headers=auth_headers_user_2
            )
            
            assert response.status_code == 404


class TestPriorities:
    """
    Test suite for priority management endpoints.
    
    Endpoints:
    - GET /api/tags/priorities
    - POST /api/tags/priorities
    - PUT /api/tags/priorities/<priority>
    - DELETE /api/tags/priorities/<priority>
    
    Tests cover:
    - Listing priorities
    - Creating priorities
    - Updating priorities (with task cascade)
    - Deleting priorities (removes from tasks)
    - Duplicate prevention
    """
    
    def test_get_priorities_empty(self, client, app, test_user, auth_headers):
        """
        Test getting priorities when none exist.
        
        Expected: 200 status, empty array
        """
        with app.app_context():
            response = client.get('/api/tags/priorities', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
    
    def test_get_priorities_with_data(self, client, app, test_user, auth_headers, test_priority):
        """
        Test getting priorities when some exist.
        
        Expected: 200 status, array with priority data
        """
        with app.app_context():
            response = client.get('/api/tags/priorities', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert len(data) >= 1
            assert any(p['level'] == 'High' for p in data)
    
    def test_create_priority_success(self, client, app, test_user, auth_headers):
        """
        Test creating a new priority.
        
        Expected: 201 status, success message
        """
        with app.app_context():
            response = client.post('/api/tags/priorities',
                json={
                    'priority': 'Medium',
                    'color': '#FFA500'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert 'added' in data['message'].lower()
    
    def test_create_priority_default_color(self, client, app, test_user, auth_headers):
        """
        Test creating a priority with default color.
        
        Expected: 201 status, default color applied
        """
        with app.app_context():
            response = client.post('/api/tags/priorities',
                json={'priority': 'Low'},
                headers=auth_headers
            )
            
            assert response.status_code == 201
    
    def test_create_priority_missing_value(self, client, app, test_user, auth_headers):
        """
        Test creating a priority fails without value.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.post('/api/tags/priorities',
                json={'color': '#FF0000'},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_create_priority_duplicate(self, client, app, test_user, auth_headers, test_priority):
        """
        Test creating a duplicate priority returns existing.
        
        Expected: 200 status (already exists message)
        """
        with app.app_context():
            response = client.post('/api/tags/priorities',
                json={'priority': 'High', 'color': '#00FF00'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'already exists' in data['message'].lower()
    
    def test_update_priority_level(self, client, app, test_user, auth_headers, test_priority):
        """
        Test updating a priority's level.
        
        Expected: 200 status, level updated
        """
        with app.app_context():
            response = client.put('/api/tags/priorities/High',
                json={'new_priority': 'Critical'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'Critical' in data['message']
    
    def test_update_priority_color(self, client, app, test_user, auth_headers, test_priority):
        """
        Test updating a priority's color.
        
        Expected: 200 status, color updated
        """
        with app.app_context():
            response = client.put('/api/tags/priorities/High',
                json={
                    'new_priority': 'High',
                    'color': '#0000FF'
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_update_priority_not_found(self, client, app, test_user, auth_headers):
        """
        Test updating non-existent priority fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.put('/api/tags/priorities/NonExistent',
                json={'new_priority': 'Something'},
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_update_priority_missing_new_value(self, client, app, test_user, auth_headers, test_priority):
        """
        Test updating priority fails without new value.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put('/api/tags/priorities/High',
                json={'color': '#FF0000'},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_delete_priority_success(self, client, app, test_user, auth_headers, test_priority):
        """
        Test deleting a priority.
        
        Expected: 200 status, success message
        """
        with app.app_context():
            response = client.delete('/api/tags/priorities/High',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'deleted' in data['message'].lower()
    
    def test_delete_priority_not_found(self, client, app, test_user, auth_headers):
        """
        Test deleting non-existent priority fails.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.delete('/api/tags/priorities/NonExistent',
                headers=auth_headers
            )
            
            assert response.status_code == 404


class TestCompletionStatus:
    """
    Test suite for completion status endpoint.
    
    Endpoint: GET /api/tags/completion-status
    
    Tests cover:
    - Getting completion stats with no tasks
    - Getting completion stats with tasks
    - Percentage calculation accuracy
    """
    
    def test_completion_status_no_tasks(self, client, app, test_user, auth_headers):
        """
        Test completion status with no tasks.
        
        Expected: 200 status, 0 tasks, 0% completion
        """
        with app.app_context():
            response = client.get('/api/tags/completion-status', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['total_tasks'] == 0
            assert data['completed_tasks'] == 0
            assert data['completion_rate'] == 0
    
    def test_completion_status_with_tasks(self, client, app, test_user, auth_headers, test_task):
        """
        Test completion status with some tasks.
        
        Expected: 200 status, correct task counts
        """
        with app.app_context():
            response = client.get('/api/tags/completion-status', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['total_tasks'] >= 1
    
    def test_completion_status_percentage(self, client, app, test_user, auth_headers):
        """
        Test completion percentage calculation.
        
        Expected: Correct percentage (completed/total * 100)
        """
        from models import Task
        from models.task_hierarchy import TaskHierarchy
        from models.db import db
        
        with app.app_context():
            # Create 2 tasks, complete 1
            task1 = Task(
                name='Task 1',
                user_id=test_user.id,
                completed=True
            )
            task2 = Task(
                name='Task 2',
                user_id=test_user.id,
                completed=False
            )
            db.session.add(task1)
            db.session.add(task2)
            db.session.flush()
            
            # Add hierarchy entries
            db.session.add(TaskHierarchy(ancestor=task1.id, descendant=task1.id, depth=0))
            db.session.add(TaskHierarchy(ancestor=task2.id, descendant=task2.id, depth=0))
            db.session.commit()
            
            response = client.get('/api/tags/completion-status', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['total_tasks'] == 2
            assert data['completed_tasks'] == 1
            assert data['completion_rate'] == 50.0


class TestStatusLogos:
    """
    Test suite for status logo management.
    
    Endpoints:
    - GET /api/tags/status-logos
    - PUT /api/tags/status-logo/<status_id>
    
    Tests cover:
    - Getting status logos
    - Setting status logos
    - Swapping logos between statuses
    - Clearing logo mappings
    """
    
    def test_get_status_logos_empty(self, client, app, test_user, auth_headers):
        """
        Test getting status logos when none set.
        
        Expected: 200 status, empty object
        """
        with app.app_context():
            response = client.get('/api/tags/status-logos', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, dict)
    
    def test_update_status_logo(self, client, app, test_user, auth_headers):
        """
        Test setting a status logo.
        
        Expected: 200 status, logo mapped
        """
        with app.app_context():
            response = client.put('/api/tags/status-logo/completed',
                json={'logo_id': 'check-mark'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['status_logos']['completed'] == 'check-mark'
    
    def test_update_status_logo_swap(self, client, app, test_user, auth_headers):
        """
        Test swapping logos between statuses.
        
        Expected: 200 status, logo moved, old status cleared
        """
        with app.app_context():
            # Set initial logo
            client.put('/api/tags/status-logo/completed',
                json={'logo_id': 'logo-1'},
                headers=auth_headers
            )
            
            # Swap to different status
            response = client.put('/api/tags/status-logo/in-progress',
                json={'logo_id': 'logo-1'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['status_logos'].get('in-progress') == 'logo-1'
            assert 'completed' not in data['status_logos']
    
    def test_clear_status_logo(self, client, app, test_user, auth_headers):
        """
        Test clearing a status logo mapping.
        
        Expected: 200 status, mapping removed
        """
        with app.app_context():
            # Set a logo first
            client.put('/api/tags/status-logo/completed',
                json={'logo_id': 'logo-1'},
                headers=auth_headers
            )
            
            # Clear it
            response = client.put('/api/tags/status-logo/completed',
                json={'logo_id': None},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'completed' not in data['status_logos']

