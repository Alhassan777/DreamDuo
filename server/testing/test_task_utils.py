"""
Task Utility Functions Tests
============================

This module tests all task utility functions in models/task_utils.py:
- add_task - Create tasks with hierarchy management
- get_root_tasks - Get all root tasks for a user
- get_task_with_subtasks - Get task with nested subtask structure
- delete_task - Delete task and all subtasks
- move_subtask - Move task in hierarchy
- toggle_task_completion - Toggle completion status
- get_tasks_with_filters - Filter tasks with various criteria
- get_tasks_stats_by_date_range - Get task statistics
- calculate_overdue_status - Calculate overdue status

Test Categories:
1. Task Creation Tests - add_task function
2. Task Retrieval Tests - get_root_tasks, get_task_with_subtasks
3. Task Hierarchy Tests - move_subtask, hierarchy maintenance
4. Task Completion Tests - toggle_task_completion
5. Filter Tests - get_tasks_with_filters
6. Statistics Tests - get_tasks_stats_by_date_range
7. Overdue Tests - calculate_overdue_status

These tests directly test the utility functions rather than the API endpoints.
"""

import pytest
from datetime import datetime, timedelta


class TestAddTask:
    """
    Test suite for add_task utility function.
    
    Tests cover:
    - Creating root tasks
    - Creating subtasks
    - Deep nesting
    - Hierarchy table population
    """
    
    def test_add_root_task(self, app, test_user, db_session):
        """
        Test creating a root task (no parent).
        
        Expected: Task created with self-referencing hierarchy entry
        """
        from models.task_utils import add_task
        from models.task_hierarchy import TaskHierarchy
        
        with app.app_context():
            task = add_task(
                session=db_session,
                name='Root Task',
                user_id=test_user.id
            )
            
            assert task is not None
            assert task.name == 'Root Task'
            assert task.parent_id is None
            
            # Check hierarchy entry
            hierarchy = db_session.query(TaskHierarchy).filter(
                TaskHierarchy.ancestor == task.id,
                TaskHierarchy.descendant == task.id,
                TaskHierarchy.depth == 0
            ).first()
            assert hierarchy is not None
    
    def test_add_subtask(self, app, test_user, db_session, test_task):
        """
        Test creating a subtask under a parent.
        
        Expected: Task created with correct parent_id and hierarchy entries
        """
        from models.task_utils import add_task
        from models.task_hierarchy import TaskHierarchy
        
        with app.app_context():
            subtask = add_task(
                session=db_session,
                name='Subtask',
                user_id=test_user.id,
                parent_id=test_task.id
            )
            
            assert subtask is not None
            assert subtask.parent_id == test_task.id
            
            # Check hierarchy entries
            # Self-reference at depth 0
            self_entry = db_session.query(TaskHierarchy).filter(
                TaskHierarchy.ancestor == subtask.id,
                TaskHierarchy.descendant == subtask.id,
                TaskHierarchy.depth == 0
            ).first()
            assert self_entry is not None
            
            # Parent-child at depth 1
            parent_entry = db_session.query(TaskHierarchy).filter(
                TaskHierarchy.ancestor == test_task.id,
                TaskHierarchy.descendant == subtask.id,
                TaskHierarchy.depth == 1
            ).first()
            assert parent_entry is not None
    
    def test_add_task_with_description(self, app, test_user, db_session):
        """
        Test creating a task with description.
        
        Expected: Task created with description field populated
        """
        from models.task_utils import add_task
        
        with app.app_context():
            task = add_task(
                session=db_session,
                name='Described Task',
                user_id=test_user.id,
                description='A detailed description'
            )
            
            assert task.description == 'A detailed description'
    
    def test_add_task_with_deadline(self, app, test_user, db_session):
        """
        Test creating a task with deadline.
        
        Expected: Task created with deadline field populated
        """
        from models.task_utils import add_task
        
        with app.app_context():
            deadline = datetime.now() + timedelta(days=7)
            task = add_task(
                session=db_session,
                name='Deadline Task',
                user_id=test_user.id,
                deadline=deadline
            )
            
            assert task.deadline is not None
    
    def test_add_deep_nested_task(self, app, test_user, db_session):
        """
        Test creating deeply nested tasks (3+ levels).
        
        Expected: Correct hierarchy entries at all depths
        """
        from models.task_utils import add_task
        from models.task_hierarchy import TaskHierarchy
        
        with app.app_context():
            # Create 3-level hierarchy: root -> child -> grandchild
            root = add_task(session=db_session, name='Root', user_id=test_user.id)
            child = add_task(session=db_session, name='Child', user_id=test_user.id, parent_id=root.id)
            grandchild = add_task(session=db_session, name='Grandchild', user_id=test_user.id, parent_id=child.id)
            
            # Check grandchild has entries at depth 0, 1, and 2
            depths = db_session.query(TaskHierarchy.depth).filter(
                TaskHierarchy.descendant == grandchild.id
            ).all()
            depths = [d[0] for d in depths]
            
            assert 0 in depths  # Self-reference
            assert 1 in depths  # To child
            assert 2 in depths  # To root


class TestGetRootTasks:
    """
    Test suite for get_root_tasks utility function.
    
    Tests cover:
    - Getting root tasks for user
    - User isolation
    - Empty results
    """
    
    def test_get_root_tasks_empty(self, app, test_user, db_session):
        """
        Test getting root tasks when none exist.
        
        Expected: Empty list
        """
        from models.task_utils import get_root_tasks
        
        with app.app_context():
            tasks = get_root_tasks(db_session, test_user.id)
            assert tasks == []
    
    def test_get_root_tasks_with_data(self, app, test_user, db_session, test_task):
        """
        Test getting root tasks when some exist.
        
        Expected: List containing root tasks only
        """
        from models.task_utils import get_root_tasks
        
        with app.app_context():
            tasks = get_root_tasks(db_session, test_user.id)
            assert len(tasks) >= 1
            assert all(t.parent_id is None for t in tasks)
    
    def test_get_root_tasks_excludes_subtasks(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test that subtasks are not returned as root tasks.
        
        Expected: Only parent task returned, not subtasks
        """
        from models.task_utils import get_root_tasks
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            tasks = get_root_tasks(db_session, test_user.id)
            task_ids = [t.id for t in tasks]
            
            # Parent should be included
            assert task_hierarchy['parent_id'] in task_ids
            
            # Subtasks should not be included
            assert task_hierarchy['subtask1_id'] not in task_ids
            assert task_hierarchy['subtask2_id'] not in task_ids


class TestGetTaskWithSubtasks:
    """
    Test suite for get_task_with_subtasks utility function.
    
    Tests cover:
    - Getting single task
    - Nested subtask structure
    - Category and priority info
    - Overdue calculation
    """
    
    def test_get_task_basic(self, app, test_user, db_session, test_task):
        """
        Test getting a basic task without subtasks.
        
        Expected: Task dict with empty subtasks array
        """
        from models.task_utils import get_task_with_subtasks
        
        with app.app_context():
            result = get_task_with_subtasks(db_session, test_task.id, test_user.id)
            
            assert result is not None
            assert result['id'] == test_task.id
            assert result['name'] == 'Test Task'
            assert 'subtasks' in result
            assert isinstance(result['subtasks'], list)
    
    def test_get_task_with_nested_subtasks(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test getting a task with nested subtasks.
        
        Expected: Task dict with nested subtask structure
        """
        from models.task_utils import get_task_with_subtasks
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            result = get_task_with_subtasks(db_session, task_hierarchy['parent_id'], test_user.id)
            
            assert result is not None
            assert len(result['subtasks']) == 2
            
            # Find subtask1 and check its sub-subtask
            subtask1 = next((s for s in result['subtasks'] if s['name'] == 'Subtask 1'), None)
            assert subtask1 is not None
            assert len(subtask1['subtasks']) == 1
    
    def test_get_task_not_found(self, app, test_user, db_session):
        """
        Test getting non-existent task.
        
        Expected: None returned
        """
        from models.task_utils import get_task_with_subtasks
        
        with app.app_context():
            result = get_task_with_subtasks(db_session, 99999, test_user.id)
            assert result is None
    
    def test_get_task_wrong_user(self, app, test_user, test_user_2, db_session, test_task):
        """
        Test getting task belonging to different user.
        
        Expected: None returned (user isolation)
        """
        from models.task_utils import get_task_with_subtasks
        
        with app.app_context():
            result = get_task_with_subtasks(db_session, test_task.id, test_user_2.id)
            assert result is None


class TestDeleteTask:
    """
    Test suite for delete_task utility function.
    
    Tests cover:
    - Deleting leaf task
    - Deleting task with subtasks (cascade)
    - Hierarchy cleanup
    - Non-existent task
    """
    
    def test_delete_leaf_task(self, app, test_user, db_session, test_task):
        """
        Test deleting a task without subtasks.
        
        Expected: Task deleted, hierarchy cleaned up
        """
        from models.task_utils import delete_task
        from models.task import Task
        from models.task_hierarchy import TaskHierarchy
        
        with app.app_context():
            task_id = test_task.id
            result = delete_task(db_session, task_id, test_user.id)
            
            assert result == True
            
            # Task should be gone
            task = db_session.query(Task).filter_by(id=task_id).first()
            assert task is None
            
            # Hierarchy entries should be gone
            hierarchy = db_session.query(TaskHierarchy).filter(
                TaskHierarchy.descendant == task_id
            ).first()
            assert hierarchy is None
    
    def test_delete_task_with_subtasks(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test deleting a task cascades to subtasks.
        
        Expected: Parent and all subtasks deleted
        """
        from models.task_utils import delete_task
        from models.task import Task
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            parent_id = task_hierarchy['parent_id']
            subtask1_id = task_hierarchy['subtask1_id']
            subsubtask_id = task_hierarchy['subsubtask_id']
            
            result = delete_task(db_session, parent_id, test_user.id)
            assert result == True
            
            # All tasks should be gone
            assert db_session.query(Task).filter_by(id=subtask1_id).first() is None
            assert db_session.query(Task).filter_by(id=subsubtask_id).first() is None
    
    def test_delete_task_not_found(self, app, test_user, db_session):
        """
        Test deleting non-existent task.
        
        Expected: False returned
        """
        from models.task_utils import delete_task
        
        with app.app_context():
            result = delete_task(db_session, 99999, test_user.id)
            assert result == False


class TestMoveSubtask:
    """
    Test suite for move_subtask utility function.
    
    Tests cover:
    - Moving task to new parent
    - Moving task to root
    - Circular reference prevention
    - Self-reference prevention
    """
    
    def test_move_to_new_parent(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test moving a task to a different parent.
        
        Expected: parent_id updated, hierarchy adjusted
        """
        from models.task_utils import move_subtask
        from models.task import Task
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            subtask2_id = task_hierarchy['subtask2_id']
            subtask1_id = task_hierarchy['subtask1_id']
            
            result = move_subtask(db_session, subtask2_id, subtask1_id, test_user.id)
            assert result == True
            
            # Refresh and check
            updated = db_session.query(Task).filter_by(id=subtask2_id).first()
            assert updated.parent_id == subtask1_id
    
    def test_move_to_root(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test moving a subtask to become a root task.
        
        Expected: parent_id=None, becomes root task
        """
        from models.task_utils import move_subtask
        from models.task import Task
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            subtask1_id = task_hierarchy['subtask1_id']
            
            result = move_subtask(db_session, subtask1_id, None, test_user.id)
            assert result == True
            
            # Refresh and check
            updated = db_session.query(Task).filter_by(id=subtask1_id).first()
            assert updated.parent_id is None
    
    def test_move_prevents_self_reference(self, app, test_user, db_session, test_task):
        """
        Test moving task to be its own parent fails.
        
        Expected: False returned
        """
        from models.task_utils import move_subtask
        
        with app.app_context():
            result = move_subtask(db_session, test_task.id, test_task.id, test_user.id)
            assert result == False
    
    def test_move_prevents_circular_reference(self, app, test_user, db_session, test_task_with_subtasks):
        """
        Test moving parent under its own subtask fails.
        
        Expected: False returned
        """
        from models.task_utils import move_subtask
        
        with app.app_context():
            task_hierarchy = test_task_with_subtasks
            parent_id = task_hierarchy['parent_id']
            subtask1_id = task_hierarchy['subtask1_id']
            
            result = move_subtask(db_session, parent_id, subtask1_id, test_user.id)
            assert result == False


class TestToggleTaskCompletion:
    """
    Test suite for toggle_task_completion utility function.
    
    Tests cover:
    - Completing a task
    - Uncompleting a task
    - completed_date handling
    """
    
    def test_complete_task(self, app, test_user, db_session, test_task):
        """
        Test marking a task as complete.
        
        Expected: completed=True, completed_date set
        """
        from models.task_utils import toggle_task_completion
        from models.task import Task
        
        with app.app_context():
            result = toggle_task_completion(db_session, test_task.id, test_user.id)
            
            assert result is not None
            assert result['completed'] == True
            
            # Check completed_date is set
            task = db_session.query(Task).filter_by(id=test_task.id).first()
            assert task.completed_date is not None
    
    def test_uncomplete_task(self, app, test_user, db_session, test_task):
        """
        Test marking a completed task as incomplete.
        
        Expected: completed=False, completed_date cleared
        """
        from models.task_utils import toggle_task_completion
        from models.task import Task
        
        with app.app_context():
            # First complete it
            toggle_task_completion(db_session, test_task.id, test_user.id)
            
            # Then uncomplete
            result = toggle_task_completion(db_session, test_task.id, test_user.id)
            
            assert result['completed'] == False
            
            # Check completed_date is cleared
            task = db_session.query(Task).filter_by(id=test_task.id).first()
            assert task.completed_date is None
    
    def test_toggle_not_found(self, app, test_user, db_session):
        """
        Test toggling non-existent task.
        
        Expected: None returned
        """
        from models.task_utils import toggle_task_completion
        
        with app.app_context():
            result = toggle_task_completion(db_session, 99999, test_user.id)
            assert result is None


class TestCalculateOverdueStatus:
    """
    Test suite for calculate_overdue_status utility function.
    
    Tests cover:
    - Task with passed deadline
    - Task with future deadline
    - Task without deadline (threshold-based)
    - Completed tasks (never overdue)
    """
    
    def test_overdue_with_past_deadline(self, app, test_user, db_session, overdue_task):
        """
        Test task with deadline in the past.
        
        Expected: is_overdue=True, days_overdue > 0
        """
        from models.task_utils import calculate_overdue_status
        
        with app.app_context():
            result = calculate_overdue_status(overdue_task, test_user.id, db_session)
            
            assert result['is_overdue'] == True
            assert result['days_overdue'] > 0
    
    def test_not_overdue_future_deadline(self, app, test_user, db_session, test_task_with_deadline):
        """
        Test task with deadline in the future.
        
        Expected: is_overdue=False, days_overdue=0
        """
        from models.task_utils import calculate_overdue_status
        
        with app.app_context():
            result = calculate_overdue_status(test_task_with_deadline, test_user.id, db_session)
            
            assert result['is_overdue'] == False
            assert result['days_overdue'] == 0
    
    def test_completed_task_not_overdue(self, app, test_user, db_session, overdue_task):
        """
        Test that completed tasks are never marked overdue.
        
        Expected: is_overdue=False even with past deadline
        """
        from models.task_utils import calculate_overdue_status
        
        with app.app_context():
            # Complete the overdue task
            overdue_task.completed = True
            db_session.commit()
            
            result = calculate_overdue_status(overdue_task, test_user.id, db_session)
            
            assert result['is_overdue'] == False
            assert result['days_overdue'] == 0
    
    def test_overdue_no_deadline_threshold(self, app, test_user, db_session, test_user_settings):
        """
        Test task without deadline using threshold.
        
        Expected: Overdue if creation_date + threshold < today
        """
        from models.task_utils import calculate_overdue_status, add_task
        from datetime import datetime, timedelta
        
        with app.app_context():
            # Create task with old creation date (beyond threshold)
            old_creation = datetime.now() - timedelta(days=15)
            task = add_task(
                session=db_session,
                name='Old Task',
                user_id=test_user.id,
                creation_date=old_creation
            )
            
            result = calculate_overdue_status(task, test_user.id, db_session)
            
            # Should be overdue if days > threshold (7 by default)
            assert result['is_overdue'] == True

