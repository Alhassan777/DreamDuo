from .db import db
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from sqlalchemy import text
from datetime import datetime, timedelta

def get_weekly_task_distribution(session: Session, user_id: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """
    Get task statistics aggregated by weekday (0-6) for a date range.
    Returns data suitable for weekly dashboard view.
    """
    # First get the daily stats using the existing function
    from .task_utils import get_tasks_stats_by_date_range
    daily_stats = get_tasks_stats_by_date_range(session, user_id, start_date, end_date)
    
    # Aggregate by weekday
    weekday_stats = {}
    for day in range(7):  # 0-6 (Sunday to Saturday)
        weekday_stats[day] = {
            "weekday": day,
            "weekday_name": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day],
            "total_tasks": 0,
            "completed_tasks": 0,
            "completion_percentage": 0
        }
    
    # Aggregate the daily stats by weekday
    for day_stat in daily_stats:
        weekday = day_stat.get("weekday")
        if weekday is not None:
            weekday = int(weekday)  # Ensure it's an integer
            weekday_stats[weekday]["total_tasks"] += day_stat["total_tasks"]
            weekday_stats[weekday]["completed_tasks"] += day_stat["completed_tasks"]
    
    # Calculate completion percentages
    for day in range(7):
        if weekday_stats[day]["total_tasks"] > 0:
            weekday_stats[day]["completion_percentage"] = round(
                (weekday_stats[day]["completed_tasks"] / weekday_stats[day]["total_tasks"]) * 100, 2
            )
    
    # Convert to list and sort by weekday
    result = list(weekday_stats.values())
    result.sort(key=lambda x: x["weekday"])
    
    return result

def get_monthly_task_distribution(session: Session, user_id: int, year: int, month: int) -> List[Dict[str, Any]]:
    """
    Get task statistics for each day in a specific month.
    Returns data suitable for monthly dashboard view.
    """
    # Calculate start and end dates for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    
    # Get daily stats for the month
    from .task_utils import get_tasks_stats_by_date_range
    monthly_stats = get_tasks_stats_by_date_range(session, user_id, start_date, end_date)
    
    # Return the daily stats which already contain all the information needed
    return monthly_stats