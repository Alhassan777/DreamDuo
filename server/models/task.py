import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    # Store dates in local timezone without any UTC conversion
    creation_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now().replace(hour=0, minute=0, second=0, microsecond=0))
    deadline = db.Column(db.DateTime, nullable=True)  # Optional deadline field
    
    # Canvas view fields
    position_x = db.Column(db.Float, nullable=True)  # X coordinate on canvas
    position_y = db.Column(db.Float, nullable=True)  # Y coordinate on canvas
    canvas_color = db.Column(db.String(20), nullable=True)  # Custom color hex code
    canvas_shape = db.Column(db.String(20), nullable=True, default='rounded')  # Shape: 'rectangle', 'rounded', 'circle'

    # Relationship for nesting subtasks
    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True)

    def __repr__(self):
        return f"<Task {self.id}: {self.name} (Parent: {self.parent_id})>"
