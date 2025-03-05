from .db import db
from .task import Task
from .task_hierarchy import TaskHierarchy
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from datetime import datetime

def add_task(session: Session,
             name: str,
             user_id: int,  # Make user_id required
             description: str = None,
             parent_id: int = None,
             category_id: int = None,
             priority: str = None,
             creation_date: datetime = None,
             deadline: datetime = None) -> Task:
    """
    Add a new task with proper hierarchy management.
    Automatically sets creation_date via the DB default.
    """

    new_task = Task(
        name=name,
        description=description,
        parent_id=parent_id,
        user_id=user_id,
        category_id=category_id,
        priority=priority,
        creation_date=creation_date,
        deadline=deadline)
    
    session.add(new_task)
    session.flush()  # Acquire the new task ID

    # Insert into task_hierarchy
    if parent_id:
        # If there's a parent, copy the parent's hierarchy
        session.execute(
            text("""
                INSERT INTO task_hierarchy (ancestor, descendant, depth)
                SELECT ancestor, :new_task_id, depth + 1
                FROM task_hierarchy
                WHERE descendant = :parent_id
                UNION ALL
                SELECT :new_task_id, :new_task_id, 0
            """),
            {"new_task_id": new_task.id, "parent_id": parent_id}
        )
    else:
        # Root task: self-referencing entry
        session.execute(
            text("""
                INSERT INTO task_hierarchy (ancestor, descendant, depth)
                VALUES (:task_id, :task_id, 0)
            """),
            {"task_id": new_task.id}
        )

    session.commit()
    return new_task


def get_root_tasks(session: Session, user_id: int) -> List[Task]:
    """Returns all top-level (root) tasks for this user."""
    return session.query(Task).filter(Task.user_id == user_id, Task.parent_id == None).all()


def get_task_with_subtasks(session: Session, task_id: int, user_id: int = None) -> Dict[str, Any]:
    """
    Retrieves one task plus all its subtasks in a nested structure.
    """
    task_query = session.query(Task).filter(Task.id == task_id)
    if user_id:
        task_query = task_query.filter(Task.user_id == user_id)

    task = task_query.first()
    if not task:
        return None

    # Query the hierarchy table for all descendants
    subtasks_query = session.execute(
        text("""
            SELECT t.*, h.depth, c.name as category_name, c.icon as category_icon,
                   p.color as priority_color
            FROM tasks t
            JOIN task_hierarchy h ON t.id = h.descendant
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN priorities p ON t.priority = p.level
            WHERE h.ancestor = :task_id AND h.depth > 0
            ORDER BY h.depth ASC
        """),
        {"task_id": task_id}
    )

    subtasks_flat = [dict(row._mapping) for row in subtasks_query]

    # Get category information for the main task
    category = task.category
    category_info = {
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'icon': category.icon
    } if category else None

    # Build a nested structure
    # Get priority color for the main task
    priority_color = None
    if task.priority:
        priority_query = session.execute(
            text("SELECT color FROM priorities WHERE level = :priority AND user_id = :user_id"),
            {"priority": task.priority, "user_id": task.user_id}
        ).first()
        if priority_query:
            priority_color = priority_query[0]

    task_dict = {
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'priority': priority_color,
        'category_id': task.category_id,
        'category': category_info,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'subtasks': build_subtask_hierarchy(subtasks_flat, task.id)
    }

    return task_dict


def build_subtask_hierarchy(subtasks_flat: List[Dict[str, Any]], parent_id: int) -> List[Dict[str, Any]]:
    """Recursively builds nested subtask dictionaries."""
    direct_children = [s for s in subtasks_flat if s['parent_id'] == parent_id]

    result = []
    for child in direct_children:
        child_dict = {
            'id': child['id'],
            'name': child['name'],
            'completed': child['completed'],
            'priority': child.get('priority_color'),  # optional
            'category_id': child.get('category_id'),
            'subtasks': build_subtask_hierarchy(subtasks_flat, child['id'])
        }
        result.append(child_dict)
    return result


def delete_task(session: Session, task_id: int, user_id: int = None) -> bool:
    """Deletes a task and all its subtasks from the DB."""
    task_query = session.query(Task).filter(Task.id == task_id)
    if user_id:
        task_query = task_query.filter(Task.user_id == user_id)

    task = task_query.first()
    if not task:
        return False

    try:
        # Find all descendants
        descendants_query = session.execute(
            text("""
                SELECT descendant FROM task_hierarchy
                WHERE ancestor = :task_id AND depth > 0
            """),
            {"task_id": task_id}
        )
        descendant_ids = [row[0] for row in descendants_query]

        # Remove hierarchy references
        session.execute(
            text("""
                DELETE FROM task_hierarchy
                WHERE ancestor = :task_id OR descendant = :task_id
                OR ancestor IN :descendant_ids OR descendant IN :descendant_ids
            """),
            {"task_id": task_id, "descendant_ids": tuple(descendant_ids) if descendant_ids else (-1,)}
        )

        # Delete the subtasks
        if descendant_ids:
            session.execute(
                text("""
                    DELETE FROM tasks
                    WHERE id IN :ids
                """),
                {"ids": tuple(descendant_ids)}
            )

        # Finally, delete the main task
        session.delete(task)
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Error deleting task: {e}")
        return False


def move_subtask(session: Session, subtask_id: int, new_parent_id: int = None, user_id: int = None) -> bool:
    """Moves a task (and all of its descendants) under a new parent or makes it a root task."""
    subtask_query = session.query(Task).filter(Task.id == subtask_id)
    if user_id:
        subtask_query = subtask_query.filter(Task.user_id == user_id)

    subtask = subtask_query.first()
    if not subtask:
        return False

    # If new_parent_id is None, we're making this a root task
    if new_parent_id is not None:
        new_parent_query = session.query(Task).filter(Task.id == new_parent_id)
        if user_id:
            new_parent_query = new_parent_query.filter(Task.user_id == user_id)
        new_parent = new_parent_query.first()
        if not new_parent:
            return False

        # Prevent circular references
        if subtask_id == new_parent_id:
            return False

        # Check if new_parent is a descendant of subtask
        is_descendant = session.query(TaskHierarchy).filter(
            TaskHierarchy.ancestor == subtask_id,
            TaskHierarchy.descendant == new_parent_id
        ).first()
        if is_descendant:
            return False
            
        # Removing the restriction that prevents root tasks from becoming subtasks
        # The following check was preventing root tasks from being moved:
        # if subtask.parent_id is None:
        #     # Don't allow root tasks to become subtasks
        #     return False

    try:
        # Get all descendants
        descendants_query = session.execute(
            text("""
                SELECT descendant FROM task_hierarchy
                WHERE ancestor = :subtask_id
            """),
            {"subtask_id": subtask_id}
        )
        descendant_ids = [row[0] for row in descendants_query]

        # Remove old hierarchy entries that connect subtask's chain to old ancestors
        session.execute(
            text("""
                DELETE FROM task_hierarchy
                WHERE descendant IN :descendant_ids
                AND ancestor NOT IN :descendant_ids
            """),
            {"descendant_ids": tuple(descendant_ids)}
        )

        if new_parent_id is not None:
            # Link subtask's chain to the new parent's ancestors
            ancestors_query = session.execute(
                text("""
                    SELECT ancestor, depth FROM task_hierarchy
                    WHERE descendant = :new_parent_id
                """),
                {"new_parent_id": new_parent_id}
            )

            for ancestor_row in ancestors_query:
                ancestor_id = ancestor_row[0]
                depth = ancestor_row[1]

                for descendant_id in descendant_ids:
                    subtask_depth_query = session.execute(
                        text("""
                            SELECT depth FROM task_hierarchy
                            WHERE ancestor = :subtask_id
                            AND descendant = :descendant_id
                        """),
                        {"subtask_id": subtask_id, "descendant_id": descendant_id}
                    ).first()

                    if subtask_depth_query:
                        subtask_depth = subtask_depth_query[0]
                        new_depth = depth + subtask_depth + 1
                        session.execute(
                            text("""
                                INSERT INTO task_hierarchy (ancestor, descendant, depth)
                                VALUES (:ancestor_id, :descendant_id, :depth)
                                ON CONFLICT (ancestor, descendant) DO UPDATE
                                SET depth = EXCLUDED.depth
                            """),
                            {
                                "ancestor_id": ancestor_id,
                                "descendant_id": descendant_id,
                                "depth": new_depth
                            }
                        )
        else:
            # Make it a root task - create self-referencing entries for the task and its descendants
            for descendant_id in descendant_ids:
                subtask_depth_query = session.execute(
                    text("""
                        SELECT depth FROM task_hierarchy
                        WHERE ancestor = :subtask_id
                        AND descendant = :descendant_id
                    """),
                    {"subtask_id": subtask_id, "descendant_id": descendant_id}
                ).first()

                if subtask_depth_query:
                    subtask_depth = subtask_depth_query[0]
                    session.execute(
                        text("""
                            INSERT INTO task_hierarchy (ancestor, descendant, depth)
                            VALUES (:subtask_id, :descendant_id, :depth)
                            ON CONFLICT (ancestor, descendant) DO UPDATE
                            SET depth = EXCLUDED.depth
                        """),
                        {
                            "subtask_id": subtask_id,
                            "descendant_id": descendant_id,
                            "depth": subtask_depth
                        }
                    )

        # Update the parent_id in tasks table
        subtask.parent_id = new_parent_id
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Error moving task: {e}")
        return False


def toggle_task_completion(session: Session, task_id: int, user_id: int = None) -> Dict[str, Any]:
    """Toggles the completion status of a task."""
    task_query = session.query(Task).filter(Task.id == task_id)
    if user_id:
        task_query = task_query.filter(Task.user_id == user_id)

    task = task_query.first()
    if not task:
        return None

    # Flip the completed status
    task.completed = not task.completed
    session.commit()

    return {
        'id': task.id,
        'completed': task.completed
    }


def get_tasks_stats_by_date_range(session: Session, user_id: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Get task statistics for each day in a date range, including parent tasks in calculations."""
    stats = session.execute(
        text("""
            WITH RECURSIVE task_stats AS (
                SELECT 
                    t.id,
                    t.parent_id,
                    t.completed,
                    DATE(CASE WHEN t.parent_id IS NULL THEN t.creation_date ELSE p.creation_date END) as task_date,
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM tasks st WHERE st.parent_id = t.id) THEN true
                        ELSE false
                    END as has_subtasks
                FROM tasks t
                LEFT JOIN tasks p ON t.parent_id = p.id
                WHERE t.user_id = :user_id
                AND (
                    (t.parent_id IS NULL AND DATE(t.creation_date) BETWEEN DATE(:start_date) AND DATE(:end_date))
                    OR
                    (t.parent_id IS NOT NULL AND DATE(p.creation_date) BETWEEN DATE(:start_date) AND DATE(:end_date))
                )
            ),
            task_hierarchy AS (
                SELECT 
                    t.id,
                    t.parent_id,
                    t.completed,
                    t.task_date,
                    t.has_subtasks,
                    CASE
                        WHEN t.has_subtasks THEN (
                            SELECT bool_and(COALESCE(st.completed, false))
                            FROM tasks st
                            WHERE st.parent_id = t.id
                        )
                        ELSE t.completed
                    END as is_fully_completed
                FROM task_stats t
            ),
            daily_stats AS (
                SELECT 
                    task_date,
                    COUNT(DISTINCT id) as total_tasks,
                    SUM(CASE 
                        WHEN parent_id IS NULL AND is_fully_completed THEN 1
                        WHEN parent_id IS NOT NULL AND completed THEN 1
                        ELSE 0
                    END) as completed_tasks,
                    SUM(CASE
                        WHEN parent_id IS NULL AND NOT is_fully_completed AND EXISTS (
                            SELECT 1 FROM tasks st 
                            WHERE st.parent_id = task_hierarchy.id 
                            AND st.completed = true
                            AND DATE(st.creation_date) = task_hierarchy.task_date
                        ) THEN 1
                        WHEN parent_id IS NOT NULL AND NOT completed THEN 1
                        ELSE 0
                    END) as in_progress_tasks
                FROM task_hierarchy
                GROUP BY task_date
            )
            SELECT 
                task_date,
                total_tasks,
                completed_tasks,
                CASE 
                    WHEN total_tasks = 0 THEN 'Free'
                    WHEN completed_tasks = total_tasks THEN 'Completed'
                    WHEN in_progress_tasks > 0 THEN 'inprogress'
                    ELSE 'Not started'
                END as status,
                CASE 
                    WHEN total_tasks > 0 THEN 
                        CAST(ROUND(CAST(completed_tasks AS NUMERIC) / CAST(total_tasks AS NUMERIC) * 100, 2) AS NUMERIC)
                    ELSE 0
                END as completion_percentage
            FROM daily_stats
            ORDER BY task_date
        """),
        {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date
        }
    )
    
    return [{
        "date": str(row.task_date),
        "total_tasks": row.total_tasks,
        "completed_tasks": row.completed_tasks,
        "status": row.status,
        "completion_percentage": row.completion_percentage
    } for row in stats]
