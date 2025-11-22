from .db import db
from .task import Task
from .task_hierarchy import TaskHierarchy
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from datetime import datetime, timedelta

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
    # Get priority information for the main task
    priority_info = None
    if task.priority:
        priority_query = session.execute(
            text("SELECT color, level FROM priorities WHERE level = :priority AND user_id = :user_id"),
            {"priority": task.priority, "user_id": task.user_id}
        ).first()
        if priority_query:
            priority_info = {
                'color': priority_query[0],
                'level': priority_query[1]
            }

    task_dict = {
        'id': task.id,
        'name': task.name,
        'description': task.description,
        'completed': task.completed,
        'priority': priority_info,
        'category_id': task.category_id,
        'category': category_info,
        'parent_id': task.parent_id,
        'creation_date': task.creation_date.isoformat() if task.creation_date else None,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'position_x': task.position_x,
        'position_y': task.position_y,
        'canvas_color': task.canvas_color,
        'canvas_shape': task.canvas_shape,
        'subtasks': build_subtask_hierarchy(subtasks_flat, task.id)
    }

    return task_dict


def build_subtask_hierarchy(subtasks_flat: List[Dict[str, Any]], parent_id: int) -> List[Dict[str, Any]]:
    """Recursively builds nested subtask dictionaries."""
    direct_children = [s for s in subtasks_flat if s['parent_id'] == parent_id]

    result = []
    for child in direct_children:
        # Create priority info object if priority exists
        priority_info = None
        if child.get('priority'):
            priority_info = {
                'color': child.get('priority_color'),
                'level': child.get('priority')
            }
            
        child_dict = {
            'id': child['id'],
            'name': child['name'],
            'completed': child['completed'],
            'priority': priority_info,  # now includes both color and level
            'category_id': child.get('category_id'),
            'parent_id': child.get('parent_id'),
            'position_x': child.get('position_x'),
            'position_y': child.get('position_y'),
            'canvas_color': child.get('canvas_color'),
            'canvas_shape': child.get('canvas_shape'),
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

        # Remove hierarchy references and delete tasks
        if descendant_ids:
            # If there are descendants, include them in the deletion
            all_ids = [task_id] + descendant_ids
            placeholders = ','.join([':id' + str(i) for i in range(len(all_ids))])
            params = {'id' + str(i): all_ids[i] for i in range(len(all_ids))}
            
            session.execute(
                text(f"""
                    DELETE FROM task_hierarchy
                    WHERE ancestor IN ({placeholders}) OR descendant IN ({placeholders})
                """),
                params
            )
            
            # Delete all tasks (including parent and subtasks)
            session.execute(
                text(f"""
                    DELETE FROM tasks
                    WHERE id IN ({placeholders})
                """),
                params
            )
        else:
            # No descendants, just delete the task's hierarchy entry
            session.execute(
                text("""
                    DELETE FROM task_hierarchy
                    WHERE ancestor = :task_id OR descendant = :task_id
                """),
                {"task_id": task_id}
            )
            
            # Delete the main task
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


def get_tasks_with_filters(
    session: Session,
    user_id: int,
    start_date: datetime,
    end_date: datetime,
    search_query: Optional[str] = None,
    category_ids: Optional[List[int]] = None,
    priority_levels: Optional[List[str]] = None,
    deadline_before: Optional[datetime] = None,
    deadline_after: Optional[datetime] = None,
    completion_status: str = 'all'
) -> List[Dict[str, Any]]:
    """
    Get tasks with comprehensive filtering support.
    Returns root tasks with nested subtask structure, expanding parent tasks when subtasks match search.
    """
    from sqlalchemy import or_, and_
    from models.category import Category
    
    # Build base query for root tasks within date range
    query = session.query(Task).filter(
        Task.user_id == user_id,
        Task.parent_id == None,
        db.func.date(Task.creation_date) >= start_date.date(),
        db.func.date(Task.creation_date) <= end_date.date()
    )
    
    # Apply completion status filter
    if completion_status == 'completed':
        # Subquery: find parent task IDs where parent OR any subtask is completed
        completed_subtasks_subquery = session.query(Task.parent_id).filter(
            Task.parent_id != None,
            Task.completed == True
        ).distinct()
        
        query = query.filter(
            or_(
                Task.completed == True,  # Parent itself is completed
                Task.id.in_(completed_subtasks_subquery)  # Has completed subtask
            )
        )
    elif completion_status == 'incomplete':
        # Subquery: find parent task IDs where parent OR any subtask is incomplete
        incomplete_subtasks_subquery = session.query(Task.parent_id).filter(
            Task.parent_id != None,
            Task.completed == False
        ).distinct()
        
        query = query.filter(
            or_(
                Task.completed == False,  # Parent itself is incomplete
                Task.id.in_(incomplete_subtasks_subquery)  # Has incomplete subtask
            )
        )
    
    # Apply category filter
    if category_ids:
        query = query.filter(Task.category_id.in_(category_ids))
    
    # Apply priority filter
    if priority_levels:
        query = query.filter(Task.priority.in_(priority_levels))
    
    # Apply deadline filters
    if deadline_before:
        query = query.filter(Task.deadline <= deadline_before)
    if deadline_after:
        query = query.filter(Task.deadline >= deadline_after)
    
    root_tasks = query.all()
    
    # If there's a search query, we need to check both root tasks and subtasks
    if search_query:
        search_pattern = f"%{search_query.lower()}%"
        matching_task_ids = set()
        
        # Find all tasks (root and subtasks) matching the search
        all_tasks_query = session.query(Task).filter(
            Task.user_id == user_id,
            or_(
                db.func.lower(Task.name).like(search_pattern),
                db.func.lower(Task.description).like(search_pattern)
            )
        )
        
        # Also search category names
        category_matching_tasks = session.query(Task).join(Category).filter(
            Task.user_id == user_id,
            db.func.lower(Category.name).like(search_pattern)
        ).all()
        
        # Collect all matching task IDs
        for task in all_tasks_query.all():
            matching_task_ids.add(task.id)
        for task in category_matching_tasks:
            matching_task_ids.add(task.id)
        
        # Get root task IDs for matching tasks (including parents of matching subtasks)
        def get_root_task_id(task_id):
            """Recursively find the root task ID for a given task."""
            task = session.query(Task).filter(Task.id == task_id).first()
            if not task:
                return None
            if task.parent_id is None:
                return task.id
            return get_root_task_id(task.parent_id)
        
        root_task_ids_to_include = set()
        for task_id in matching_task_ids:
            root_id = get_root_task_id(task_id)
            if root_id:
                root_task_ids_to_include.add(root_id)
        
        # Filter root tasks to only those that match or have matching subtasks
        root_tasks = [t for t in root_tasks if t.id in root_task_ids_to_include]
    
    # Build the full task structure with subtasks
    result = []
    for task in root_tasks:
        task_data = get_task_with_subtasks(session, task.id, user_id)
        if task_data:
            # Add creation_date to the task data
            task_data['creation_date'] = task.creation_date.isoformat() if task.creation_date else None
            task_data['parent_id'] = task.parent_id
            result.append(task_data)
    
    return result


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
                    EXTRACT(DOW FROM CASE WHEN t.parent_id IS NULL THEN t.creation_date ELSE p.creation_date END) as weekday,
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
                    t.weekday,
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
                    weekday,
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
                GROUP BY task_date, weekday
            )
            SELECT 
                task_date,
                weekday,
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
    
    # Convert query results to a dictionary for easier lookup
    stats_dict = {}
    for row in stats:
        stats_dict[str(row.task_date)] = {
            "date": str(row.task_date),
            "weekday": row.weekday,  # 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            "total_tasks": row.total_tasks,
            "completed_tasks": row.completed_tasks,
            "status": row.status,
            "completion_percentage": row.completion_percentage
        }
    
    # Generate a complete list of dates in the range
    complete_stats = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = current_date.strftime('%Y-%m-%d')
        if date_str in stats_dict:
            complete_stats.append(stats_dict[date_str])
        else:
            # Add empty stats for dates with no tasks
            complete_stats.append({
                "date": date_str,
                "weekday": current_date.weekday(),  # Add weekday for empty dates too
                "total_tasks": 0,
                "completed_tasks": 0,
                "status": "Free",
                "completion_percentage": 0
            })
        current_date += timedelta(days=1)
    
    return complete_stats
