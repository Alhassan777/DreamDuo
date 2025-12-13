"""
Task Dependency and Cycle Detection Tests
=========================================

This module tests all task dependency functionality:
- API Endpoints:
  - GET /api/tasks/dependencies - Get all user dependencies
  - POST /api/tasks/dependencies - Create dependency
  - DELETE /api/tasks/dependencies/<id> - Delete dependency
  - GET /api/tasks/<id>/dependencies - Get task-specific dependencies
  - PUT /api/tasks/dependencies/<id>/customize - Customize dependency edge

- Utility Functions:
  - add_dependency - Create dependency with cycle check
  - remove_dependency - Delete dependency
  - get_user_dependencies - List all user dependencies
  - get_task_dependencies - Get dependencies for a task
  - would_create_cycle - DFS cycle detection

Test Categories:
1. Dependency Creation Tests - Creating valid dependencies
2. Cycle Detection Tests - DFS-based cycle prevention
3. Dependency Retrieval Tests - Listing dependencies
4. Dependency Deletion Tests - Removing dependencies
5. Edge Customization Tests - Styling dependency edges
6. Authorization Tests - User isolation

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json


class TestDependencyCreationAPI:
    """
    Test suite for dependency creation API endpoint.
    
    Endpoint: POST /api/tasks/dependencies
    
    Tests cover:
    - Creating valid dependency
    - Missing task IDs
    - Self-dependency prevention
    - Duplicate prevention
    """
    
    def test_create_dependency_success(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test creating a valid dependency between two tasks.
        
        Expected: 201 status, dependency data returned
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[1]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['success'] == True
            assert data['data']['source_task_id'] == task_ids[0]
            assert data['data']['target_task_id'] == task_ids[1]
    
    def test_create_dependency_missing_source(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test creating dependency fails without source_task_id.
        
        Expected: 400 status
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            response = client.post('/api/tasks/dependencies',
                json={'target_task_id': task_ids[1]},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_create_dependency_missing_target(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test creating dependency fails without target_task_id.
        
        Expected: 400 status
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            response = client.post('/api/tasks/dependencies',
                json={'source_task_id': task_ids[0]},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_create_dependency_same_task(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test creating self-dependency fails.
        
        Expected: 400 status
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[0]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'same task' in data['error'].lower()
    
    def test_create_dependency_duplicate(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test creating duplicate dependency fails.
        
        Expected: 400 status
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create first dependency
            client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[1]
                },
                headers=auth_headers
            )
            
            # Try to create duplicate
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[1]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'already exists' in data['error'].lower()


class TestCycleDetectionAPI:
    """
    Test suite for cycle detection via API.
    
    Endpoint: POST /api/tasks/dependencies
    
    Tests cover:
    - Simple 2-node cycle
    - 3-node cycle
    - Long chain cycle
    - Valid DAG (no cycle)
    """
    
    def test_detect_simple_cycle(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test detection of simple 2-node cycle: A -> B -> A
        
        Expected: Second dependency creation fails
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create A -> B
            client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[1]
                },
                headers=auth_headers
            )
            
            # Try B -> A (would create cycle)
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[1],
                    'target_task_id': task_ids[0]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'circular' in data['error'].lower()
    
    def test_detect_three_node_cycle(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test detection of 3-node cycle: A -> B -> C -> A
        
        Expected: Third dependency creation fails
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create A -> B
            client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[0],
                    'target_task_id': task_ids[1]
                },
                headers=auth_headers
            )
            
            # Create B -> C
            client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[1],
                    'target_task_id': task_ids[2]
                },
                headers=auth_headers
            )
            
            # Try C -> A (would create cycle)
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[2],
                    'target_task_id': task_ids[0]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'circular' in data['error'].lower()
    
    def test_detect_long_chain_cycle(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test detection of long chain cycle: A -> B -> C -> D -> E -> A
        
        Expected: Cycle detected across 5 nodes
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create chain: A -> B -> C -> D -> E
            for i in range(4):
                client.post('/api/tasks/dependencies',
                    json={
                    'source_task_id': task_ids[i],
                    'target_task_id': task_ids[i+1]
                    },
                    headers=auth_headers
                )
            
            # Try E -> A (would create cycle)
            response = client.post('/api/tasks/dependencies',
                json={
                    'source_task_id': task_ids[4],
                    'target_task_id': task_ids[0]
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'circular' in data['error'].lower()
    
    def test_valid_dag_structure(self, client, app, test_user, auth_headers, test_tasks_for_dependencies):
        """
        Test that valid DAG structures are allowed.
        
        Diamond pattern: A -> B, A -> C, B -> D, C -> D
        Expected: All dependencies created successfully
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            dependencies = [
                (0, 1),  # A -> B
                (0, 2),  # A -> C
                (1, 3),  # B -> D
                (2, 3),  # C -> D
            ]
            
            for source_idx, target_idx in dependencies:
                response = client.post('/api/tasks/dependencies',
                    json={
                        'source_task_id': task_ids[source_idx],
                        'target_task_id': task_ids[target_idx]
                    },
                    headers=auth_headers
                )
                assert response.status_code == 201


class TestDependencyRetrievalAPI:
    """
    Test suite for dependency retrieval endpoints.
    
    Endpoints:
    - GET /api/tasks/dependencies - All user dependencies
    - GET /api/tasks/<id>/dependencies - Task-specific dependencies
    
    Tests cover:
    - Empty results
    - With dependencies
    - Incoming/outgoing separation
    """
    
    def test_get_all_dependencies_empty(self, client, app, test_user, auth_headers):
        """
        Test getting dependencies when none exist.
        
        Expected: 200 status, empty data array
        """
        with app.app_context():
            response = client.get('/api/tasks/dependencies', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == True
            assert data['data'] == []
    
    def test_get_all_dependencies_with_data(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test getting dependencies when some exist.
        
        Expected: 200 status, dependencies returned
        """
        with app.app_context():
            dependency_id = test_dependency
            response = client.get('/api/tasks/dependencies', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert len(data['data']) >= 1
    
    def test_get_task_dependencies(self, client, app, test_user, auth_headers, test_tasks_for_dependencies, test_dependency):
        """
        Test getting dependencies for a specific task.
        
        Expected: 200 status, incoming/outgoing arrays
        """
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            dependency_id = test_dependency
            response = client.get(f'/api/tasks/{task_ids[0]}/dependencies', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'outgoing' in data['data']
            assert 'incoming' in data['data']


class TestDependencyDeletionAPI:
    """
    Test suite for dependency deletion endpoint.
    
    Endpoint: DELETE /api/tasks/dependencies/<id>
    
    Tests cover:
    - Successful deletion
    - Non-existent dependency
    - Authorization
    """
    
    def test_delete_dependency_success(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test deleting a dependency.
        
        Expected: 200 status, success message
        """
        with app.app_context():
            dependency_id = test_dependency
            response = client.delete(f'/api/tasks/dependencies/{dependency_id}',
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == True
    
    def test_delete_dependency_not_found(self, client, app, test_user, auth_headers):
        """
        Test deleting non-existent dependency.
        
        Expected: 404 status
        """
        with app.app_context():
            response = client.delete('/api/tasks/dependencies/99999',
                headers=auth_headers
            )
            
            assert response.status_code == 404


class TestDependencyCustomizationAPI:
    """
    Test suite for dependency customization endpoint.
    
    Endpoint: PUT /api/tasks/dependencies/<id>/customize
    
    Tests cover:
    - Setting edge color
    - Setting edge style
    - Setting edge width
    - Setting animated flag
    - Invalid style rejection
    """
    
    def test_customize_edge_color(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting custom edge color.
        
        Expected: 200 status, color updated
        """
        with app.app_context():
            dependency_id = test_dependency
            response = client.put(f'/api/tasks/dependencies/{dependency_id}/customize',
                json={'edge_color': '#FF5733'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_color'] == '#FF5733'
    
    def test_customize_edge_style_smoothstep(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting smoothstep edge style.
        
        Expected: 200 status, style updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={'edge_style': 'smoothstep'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_style'] == 'smoothstep'
    
    def test_customize_edge_style_straight(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting straight edge style.
        
        Expected: 200 status, style updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={'edge_style': 'straight'},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_style'] == 'straight'
    
    def test_customize_edge_style_invalid(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting invalid edge style fails.
        
        Expected: 400 status
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={'edge_style': 'invalid_style'},
                headers=auth_headers
            )
            
            assert response.status_code == 400
    
    def test_customize_edge_width(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting edge width.
        
        Expected: 200 status, width updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={'edge_width': 3.5},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_width'] == 3.5
    
    def test_customize_edge_animated(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting edge animated flag.
        
        Expected: 200 status, animated updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={'edge_animated': False},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_animated'] == False
    
    def test_customize_all_properties(self, client, app, test_user, auth_headers, test_dependency):
        """
        Test setting all edge properties at once.
        
        Expected: 200 status, all properties updated
        """
        with app.app_context():
            response = client.put(f'/api/tasks/dependencies/{test_dependency}/customize',
                json={
                    'edge_color': '#00FF00',
                    'edge_style': 'bezier',
                    'edge_width': 4.0,
                    'edge_animated': True
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['edge_color'] == '#00FF00'
            assert data['data']['edge_style'] == 'bezier'
            assert data['data']['edge_width'] == 4.0
            assert data['data']['edge_animated'] == True


class TestCycleDetectionFunction:
    """
    Test suite for would_create_cycle utility function.
    
    Direct tests of the DFS-based cycle detection algorithm.
    """
    
    def test_would_create_cycle_simple(self, app, test_user, db_session, test_tasks_for_dependencies):
        """
        Test cycle detection for A -> B -> A pattern.
        
        Expected: Returns True for B -> A when A -> B exists
        """
        from models.task_dependency import add_dependency, would_create_cycle
        
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create A -> B
            add_dependency(db_session, task_ids[0], task_ids[1], test_user.id)
            
            # Check if B -> A would create cycle
            result = would_create_cycle(db_session, task_ids[1], task_ids[0], test_user.id)
            assert result == True
    
    def test_would_not_create_cycle(self, app, test_user, db_session, test_tasks_for_dependencies):
        """
        Test that valid dependencies don't trigger false positives.
        
        Expected: Returns False for valid dependency
        """
        from models.task_dependency import add_dependency, would_create_cycle
        
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create A -> B
            add_dependency(db_session, task_ids[0], task_ids[1], test_user.id)
            
            # Check if B -> C would create cycle (it shouldn't)
            result = would_create_cycle(db_session, task_ids[1], task_ids[2], test_user.id)
            assert result == False
    
    def test_would_create_cycle_long_chain(self, app, test_user, db_session, test_tasks_for_dependencies):
        """
        Test cycle detection in long chain.
        
        Expected: Detects cycle across multiple nodes
        """
        from models.task_dependency import add_dependency, would_create_cycle
        
        with app.app_context():
            task_ids = test_tasks_for_dependencies
            
            # Create chain: A -> B -> C -> D
            for i in range(3):
                add_dependency(db_session, task_ids[i], task_ids[i+1], test_user.id)
            
            # Check if D -> A would create cycle
            result = would_create_cycle(db_session, task_ids[3], task_ids[0], test_user.id)
            assert result == True

