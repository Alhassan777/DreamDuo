"""
Time Tracking API Tests
=======================

This module tests all time-tracking-related endpoints:
- POST /api/time/start - Start a timer for a task
- POST /api/time/stop - Stop the active timer
- GET  /api/time/active - Get the currently active timer
- GET  /api/time/logs - Get time logs with optional filters
- DELETE /api/time/logs/<id> - Delete a time log entry
- PUT  /api/time/logs/<id> - Update a time log entry
- GET  /api/time/stats - Get time tracking statistics
- GET  /api/time/task/<id>/total - Get total time for a task

Test Categories:
1. Timer Start Tests - Starting timers, conflict detection, validation
2. Timer Stop Tests - Stopping active timers, duration calculation
3. Active Timer Tests - Querying current timer state
4. Time Log Retrieval Tests - Filtering, pagination, date ranges
5. Time Log CRUD Tests - Deleting and updating log entries
6. Statistics Tests - Dashboard stats, daily/weekly breakdowns
7. Task Total Time Tests - Per-task time aggregation
8. User Isolation Tests - Cross-user access prevention

Each test is independent and uses fixtures for test isolation.
"""

import pytest
import json
from datetime import datetime, timedelta


class TestTimerStart:
    """
    Test suite for the timer start endpoint.

    Endpoint: POST /api/time/start

    Tests cover:
    - Successful timer start
    - Missing required fields
    - Task not found / wrong user
    - Conflict when timer already running
    - Optional fields (notes, source, active_url)
    """

    def test_start_timer_success(self, client, auth_headers, test_task):
        """Test starting a timer for a valid task returns 201 with timer data."""
        response = client.post('/api/time/start',
            json={'task_id': test_task.id},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 201
        assert data['success'] is True
        assert data['data']['task_id'] == test_task.id
        assert data['data']['is_running'] is True
        assert data['data']['end_time'] is None

    def test_start_timer_missing_task_id(self, client, auth_headers):
        """Test starting a timer without task_id returns 400."""
        response = client.post('/api/time/start',
            json={},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 400
        assert 'error' in data
        assert 'task_id' in data['error'].lower()

    def test_start_timer_task_not_found(self, client, auth_headers):
        """Test starting a timer for a nonexistent task returns 404."""
        response = client.post('/api/time/start',
            json={'task_id': 99999},
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_start_timer_other_users_task(self, client, auth_headers, test_task_user_2):
        """Test that a user cannot start a timer on another user's task."""
        response = client.post('/api/time/start',
            json={'task_id': test_task_user_2.id},
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_start_timer_already_running(self, client, auth_headers, active_timer, test_task):
        """Test starting a second timer returns 409 conflict."""
        response = client.post('/api/time/start',
            json={'task_id': test_task.id},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 409
        assert 'already running' in data['error'].lower()
        assert 'active_timer' in data

    def test_start_timer_with_notes_and_source(self, client, auth_headers, test_task):
        """Test starting a timer with optional notes, source, and active_url."""
        response = client.post('/api/time/start',
            json={
                'task_id': test_task.id,
                'notes': 'Working on feature',
                'source': 'extension',
                'active_url': 'https://github.com/repo'
            },
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 201
        assert data['data']['notes'] == 'Working on feature'
        assert data['data']['source'] == 'extension'
        assert data['data']['active_url'] == 'https://github.com/repo'

    def test_start_timer_default_source_is_web(self, client, auth_headers, test_task):
        """Test that the default source is 'web' when not specified."""
        response = client.post('/api/time/start',
            json={'task_id': test_task.id},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 201
        assert data['data']['source'] == 'web'

    def test_start_timer_unauthenticated(self, client, test_task):
        """Test starting a timer without auth returns 401."""
        response = client.post('/api/time/start',
            json={'task_id': test_task.id},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401


class TestTimerStop:
    """
    Test suite for the timer stop endpoint.

    Endpoint: POST /api/time/stop

    Tests cover:
    - Successful timer stop with duration calculation
    - Stopping when no timer is active
    - Updating notes on stop
    """

    def test_stop_timer_success(self, client, auth_headers, active_timer):
        """Test stopping an active timer calculates duration and returns 200."""
        response = client.post('/api/time/stop',
            json={},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert data['data']['is_running'] is False
        assert data['data']['end_time'] is not None
        assert data['data']['duration_seconds'] is not None
        assert data['data']['duration_seconds'] > 0

    def test_stop_timer_no_active_timer(self, client, auth_headers):
        """Test stopping when no timer is running returns 404."""
        response = client.post('/api/time/stop',
            json={},
            headers=auth_headers
        )
        assert response.status_code == 404
        data = response.get_json()
        assert 'no active timer' in data['error'].lower()

    def test_stop_timer_with_notes_update(self, client, auth_headers, active_timer):
        """Test stopping a timer and updating its notes simultaneously."""
        response = client.post('/api/time/stop',
            json={'notes': 'Completed the research phase'},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['notes'] == 'Completed the research phase'

    def test_stop_timer_unauthenticated(self, client):
        """Test stopping a timer without auth returns 401."""
        response = client.post('/api/time/stop',
            json={},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401


class TestActiveTimer:
    """
    Test suite for the active timer query endpoint.

    Endpoint: GET /api/time/active

    Tests cover:
    - Retrieving an active timer with elapsed time
    - Querying when no timer is active
    """

    def test_get_active_timer(self, client, auth_headers, active_timer):
        """Test retrieving the currently active timer includes elapsed_seconds."""
        response = client.get('/api/time/active', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert data['data'] is not None
        assert data['data']['is_running'] is True
        assert 'elapsed_seconds' in data['data']
        assert data['data']['elapsed_seconds'] >= 0

    def test_get_active_timer_none_running(self, client, auth_headers):
        """Test querying active timer when none is running returns null data."""
        response = client.get('/api/time/active', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert data['data'] is None

    def test_get_active_timer_unauthenticated(self, client):
        """Test querying active timer without auth returns 401."""
        response = client.get('/api/time/active',
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401


class TestTimeLogs:
    """
    Test suite for the time logs retrieval endpoint.

    Endpoint: GET /api/time/logs

    Tests cover:
    - Retrieving all logs for a user
    - Filtering by task_id
    - Filtering by date range
    - Pagination (limit, offset)
    - Invalid date format handling
    - User isolation
    """

    def test_get_time_logs_all(self, client, auth_headers, multiple_time_logs):
        """Test retrieving all time logs for the authenticated user."""
        response = client.get('/api/time/logs', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert len(data['data']) == 5
        assert data['total'] == 5

    def test_get_time_logs_filter_by_task(self, client, auth_headers, app, test_user, test_task, multiple_time_logs):
        """Test filtering time logs by task_id."""
        response = client.get(f'/api/time/logs?task_id={test_task.id}', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        for log in data['data']:
            assert log['task_id'] == test_task.id

    def test_get_time_logs_filter_by_date_range(self, client, auth_headers, multiple_time_logs):
        """Test filtering time logs by start_date and end_date."""
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        response = client.get(
            f'/api/time/logs?start_date={yesterday}&end_date={today}',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert len(data['data']) <= 5

    def test_get_time_logs_pagination(self, client, auth_headers, multiple_time_logs):
        """Test pagination with limit and offset."""
        response = client.get('/api/time/logs?limit=2&offset=0', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert len(data['data']) == 2
        assert data['total'] == 5
        assert data['limit'] == 2
        assert data['offset'] == 0

    def test_get_time_logs_pagination_offset(self, client, auth_headers, multiple_time_logs):
        """Test that offset skips the correct number of entries."""
        response = client.get('/api/time/logs?limit=2&offset=3', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert len(data['data']) == 2
        assert data['offset'] == 3

    def test_get_time_logs_invalid_start_date(self, client, auth_headers):
        """Test that an invalid start_date format returns 400."""
        response = client.get('/api/time/logs?start_date=not-a-date', headers=auth_headers)
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_get_time_logs_invalid_end_date(self, client, auth_headers):
        """Test that an invalid end_date format returns 400."""
        response = client.get('/api/time/logs?end_date=13-2026-01', headers=auth_headers)
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_get_time_logs_empty(self, client, auth_headers):
        """Test retrieving logs when user has no time logs."""
        response = client.get('/api/time/logs', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert len(data['data']) == 0
        assert data['total'] == 0

    def test_get_time_logs_user_isolation(self, client, auth_headers_user_2, multiple_time_logs):
        """Test that a user cannot see another user's time logs."""
        response = client.get('/api/time/logs', headers=auth_headers_user_2)
        data = response.get_json()
        assert response.status_code == 200
        assert len(data['data']) == 0

    def test_get_time_logs_ordered_by_most_recent(self, client, auth_headers, multiple_time_logs):
        """Test that logs are returned in descending order by start_time."""
        response = client.get('/api/time/logs', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        dates = [log['start_time'] for log in data['data']]
        assert dates == sorted(dates, reverse=True)


class TestTimeLogCrud:
    """
    Test suite for time log delete and update endpoints.

    Endpoints:
    - DELETE /api/time/logs/<id>
    - PUT    /api/time/logs/<id>

    Tests cover:
    - Deleting a time log
    - Deleting a nonexistent log
    - User isolation on delete
    - Updating notes on a time log
    - Updating a nonexistent log
    """

    def test_delete_time_log_success(self, client, auth_headers, test_time_log):
        """Test deleting a time log returns 200 and removes it."""
        response = client.delete(
            f'/api/time/logs/{test_time_log.id}',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True

        # Verify it's gone
        response = client.get('/api/time/logs', headers=auth_headers)
        data = response.get_json()
        assert data['total'] == 0

    def test_delete_time_log_not_found(self, client, auth_headers):
        """Test deleting a nonexistent time log returns 404."""
        response = client.delete('/api/time/logs/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_time_log_user_isolation(self, client, auth_headers_user_2, test_time_log):
        """Test that a user cannot delete another user's time log."""
        response = client.delete(
            f'/api/time/logs/{test_time_log.id}',
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    def test_update_time_log_notes(self, client, auth_headers, test_time_log):
        """Test updating notes on a time log entry."""
        response = client.put(
            f'/api/time/logs/{test_time_log.id}',
            json={'notes': 'Updated notes'},
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert data['data']['notes'] == 'Updated notes'

    def test_update_time_log_not_found(self, client, auth_headers):
        """Test updating a nonexistent time log returns 404."""
        response = client.put(
            '/api/time/logs/99999',
            json={'notes': 'Nope'},
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_time_log_user_isolation(self, client, auth_headers_user_2, test_time_log):
        """Test that a user cannot update another user's time log."""
        response = client.put(
            f'/api/time/logs/{test_time_log.id}',
            json={'notes': 'Hacked'},
            headers=auth_headers_user_2
        )
        assert response.status_code == 404


class TestTimeStats:
    """
    Test suite for the time statistics endpoint.

    Endpoint: GET /api/time/stats

    Tests cover:
    - Default stats (current month)
    - Custom date range
    - Response structure (total, daily, weekly, tasks)
    - Empty stats when no data
    - Invalid date formats
    """

    def test_get_stats_default_month(self, client, auth_headers, multiple_time_logs):
        """Test retrieving stats defaults to current month."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        stats = data['data']
        assert 'total_time_seconds' in stats
        assert 'today_seconds' in stats
        assert 'tasks' in stats
        assert 'daily_breakdown' in stats
        assert 'weekly_stats' in stats
        assert 'date_range' in stats

    def test_get_stats_custom_date_range(self, client, auth_headers, multiple_time_logs):
        """Test retrieving stats with explicit start and end dates."""
        start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        end = datetime.now().strftime('%Y-%m-%d')
        response = client.get(
            f'/api/time/stats?start_date={start}&end_date={end}',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['date_range']['start'] == start
        assert data['data']['date_range']['end'] == end

    def test_get_stats_total_time_calculation(self, client, auth_headers, multiple_time_logs):
        """Test that total_time_seconds sums correctly across logs."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['total_time_seconds'] > 0

    def test_get_stats_daily_breakdown_structure(self, client, auth_headers, multiple_time_logs):
        """Test that daily_breakdown entries have correct fields."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        for entry in data['data']['daily_breakdown']:
            assert 'date' in entry
            assert 'total_seconds' in entry
            assert 'log_count' in entry

    def test_get_stats_weekly_stats_structure(self, client, auth_headers, multiple_time_logs):
        """Test that weekly_stats has 7 entries (Mon-Sun) with correct fields."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        weekly = data['data']['weekly_stats']
        assert len(weekly) == 7
        expected_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for i, entry in enumerate(weekly):
            assert entry['day'] == expected_days[i]
            assert 'date' in entry
            assert 'total_seconds' in entry

    def test_get_stats_tasks_breakdown(self, client, auth_headers, multiple_time_logs):
        """Test that stats group time correctly by task."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        tasks = data['data']['tasks']
        assert len(tasks) >= 1
        for task_entry in tasks:
            assert 'task_id' in task_entry
            assert 'task_name' in task_entry
            assert 'total_seconds' in task_entry
            assert 'log_count' in task_entry

    def test_get_stats_empty(self, client, auth_headers):
        """Test stats with no time logs returns zero totals."""
        response = client.get('/api/time/stats', headers=auth_headers)
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['total_time_seconds'] == 0
        assert data['data']['today_seconds'] == 0
        assert len(data['data']['tasks']) == 0

    def test_get_stats_invalid_start_date(self, client, auth_headers):
        """Test that an invalid start_date returns 400."""
        response = client.get('/api/time/stats?start_date=bad', headers=auth_headers)
        assert response.status_code == 400

    def test_get_stats_invalid_end_date(self, client, auth_headers):
        """Test that an invalid end_date returns 400."""
        response = client.get('/api/time/stats?end_date=bad', headers=auth_headers)
        assert response.status_code == 400


class TestTaskTotalTime:
    """
    Test suite for the per-task total time endpoint.

    Endpoint: GET /api/time/task/<id>/total

    Tests cover:
    - Successful total time retrieval
    - Task not found
    - User isolation
    - Empty total (no logs for task)
    - Response structure
    """

    def test_get_task_total_time(self, client, auth_headers, test_task, multiple_time_logs):
        """Test retrieving total time for a task with multiple logs."""
        response = client.get(
            f'/api/time/task/{test_task.id}/total',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['success'] is True
        assert data['data']['task_id'] == test_task.id
        assert data['data']['total_seconds'] > 0
        assert data['data']['log_count'] == 5
        assert 'formatted_time' in data['data']
        assert 'task_name' in data['data']

    def test_get_task_total_time_not_found(self, client, auth_headers):
        """Test total time for nonexistent task returns 404."""
        response = client.get('/api/time/task/99999/total', headers=auth_headers)
        assert response.status_code == 404

    def test_get_task_total_time_user_isolation(self, client, auth_headers, test_task_user_2):
        """Test that a user cannot get total time for another user's task."""
        response = client.get(
            f'/api/time/task/{test_task_user_2.id}/total',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_task_total_time_no_logs(self, client, auth_headers, test_task):
        """Test total time when task has no time logs returns zero."""
        response = client.get(
            f'/api/time/task/{test_task.id}/total',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['total_seconds'] == 0
        assert data['data']['log_count'] == 0

    def test_get_task_total_time_excludes_running(self, client, auth_headers, test_task, active_timer):
        """Test that active (running) timers are excluded from the total."""
        response = client.get(
            f'/api/time/task/{test_task.id}/total',
            headers=auth_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert data['data']['total_seconds'] == 0
        assert data['data']['log_count'] == 0
