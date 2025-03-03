import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db

class TaskHierarchy(db.Model):
    __tablename__ = 'task_hierarchy'

    ancestor = db.Column(db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
    descendant = db.Column(db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
    depth = db.Column(db.Integer, nullable=False)

    __table_args__ = (db.UniqueConstraint('ancestor', 'descendant', name='uq_task_hierarchy'),)

    def __repr__(self):
        return f"<Hierarchy: {self.ancestor} -> {self.descendant} (Depth {self.depth})>"
