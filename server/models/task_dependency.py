import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db
from sqlalchemy.exc import IntegrityError

class TaskDependency(db.Model):
    __tablename__ = 'task_dependencies'

    id = db.Column(db.Integer, primary_key=True)
    source_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    target_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    source_task = db.relationship('Task', foreign_keys=[source_task_id], backref='outgoing_dependencies')
    target_task = db.relationship('Task', foreign_keys=[target_task_id], backref='incoming_dependencies')

    def __repr__(self):
        return f"<TaskDependency {self.id}: Task {self.source_task_id} -> Task {self.target_task_id}>"

    def to_dict(self):
        """Convert dependency to dictionary for API responses"""
        return {
            'id': self.id,
            'source_task_id': self.source_task_id,
            'target_task_id': self.target_task_id,
            'user_id': self.user_id
        }


def add_dependency(session, source_id: int, target_id: int, user_id: int):
    """
    Add a dependency between two tasks.
    Validates that the dependency doesn't create a cycle.
    """
    from .task import Task
    
    # Validate tasks exist and belong to user
    source_task = session.query(Task).filter_by(id=source_id, user_id=user_id).first()
    target_task = session.query(Task).filter_by(id=target_id, user_id=user_id).first()
    
    if not source_task or not target_task:
        raise ValueError("One or both tasks not found or do not belong to user")
    
    if source_id == target_id:
        raise ValueError("Cannot create dependency to the same task")
    
    # Check if dependency already exists
    existing = session.query(TaskDependency).filter_by(
        source_task_id=source_id,
        target_task_id=target_id,
        user_id=user_id
    ).first()
    
    if existing:
        raise ValueError("Dependency already exists")
    
    # Check for cycles
    if would_create_cycle(session, source_id, target_id, user_id):
        raise ValueError("Cannot create dependency: would create a circular dependency")
    
    # Create the dependency
    dependency = TaskDependency(
        source_task_id=source_id,
        target_task_id=target_id,
        user_id=user_id
    )
    
    session.add(dependency)
    session.commit()
    
    return dependency


def remove_dependency(session, dependency_id: int, user_id: int):
    """Remove a dependency"""
    dependency = session.query(TaskDependency).filter_by(
        id=dependency_id,
        user_id=user_id
    ).first()
    
    if not dependency:
        raise ValueError("Dependency not found or does not belong to user")
    
    session.delete(dependency)
    session.commit()
    
    return True


def get_user_dependencies(session, user_id: int):
    """Get all dependencies for a user"""
    dependencies = session.query(TaskDependency).filter_by(user_id=user_id).all()
    return [dep.to_dict() for dep in dependencies]


def get_task_dependencies(session, task_id: int, user_id: int):
    """Get all dependencies related to a specific task"""
    from .task import Task
    
    # Verify task belongs to user
    task = session.query(Task).filter_by(id=task_id, user_id=user_id).first()
    if not task:
        raise ValueError("Task not found or does not belong to user")
    
    # Get both incoming and outgoing dependencies
    outgoing = session.query(TaskDependency).filter_by(
        source_task_id=task_id,
        user_id=user_id
    ).all()
    
    incoming = session.query(TaskDependency).filter_by(
        target_task_id=task_id,
        user_id=user_id
    ).all()
    
    return {
        'outgoing': [dep.to_dict() for dep in outgoing],
        'incoming': [dep.to_dict() for dep in incoming]
    }


def would_create_cycle(session, source_id: int, target_id: int, user_id: int) -> bool:
    """
    Check if adding a dependency from source_id to target_id would create a cycle.
    Uses DFS to detect cycles.
    """
    # Build adjacency list of current dependencies
    dependencies = session.query(TaskDependency).filter_by(user_id=user_id).all()
    
    # Create graph
    graph = {}
    for dep in dependencies:
        if dep.source_task_id not in graph:
            graph[dep.source_task_id] = []
        graph[dep.source_task_id].append(dep.target_task_id)
    
    # Add the proposed new edge
    if target_id not in graph:
        graph[target_id] = []
    graph[target_id].append(source_id)
    
    # Check for cycle using DFS from source_id
    visited = set()
    rec_stack = set()
    
    def has_cycle(node):
        visited.add(node)
        rec_stack.add(node)
        
        if node in graph:
            for neighbor in graph[node]:
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
        
        rec_stack.remove(node)
        return False
    
    return has_cycle(source_id)


