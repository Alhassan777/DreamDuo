import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db
from datetime import datetime


class TimeLog(db.Model):
    """Model for tracking time spent on tasks."""
    __tablename__ = 'time_logs'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    end_time = db.Column(db.DateTime, nullable=True)  # Null means timer is currently running
    duration_seconds = db.Column(db.Integer, nullable=True)  # Calculated when timer stops
    notes = db.Column(db.Text, nullable=True)
    source = db.Column(db.String(30), nullable=False, default='web')
    active_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)

    # Relationships
    task = db.relationship('Task', backref=db.backref('time_logs', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('time_logs', lazy=True, cascade='all, delete-orphan'))

    def __repr__(self):
        return f"<TimeLog {self.id}: Task {self.task_id}, User {self.user_id}, Duration {self.duration_seconds}s>"

    def to_dict(self):
        """Convert time log to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'task_name': self.task.name if self.task else None,
            'user_id': self.user_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_seconds': self.duration_seconds,
            'notes': self.notes,
            'source': self.source,
            'active_url': self.active_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_running': self.end_time is None
        }

    def stop_timer(self):
        """Stop the timer and calculate duration."""
        if self.end_time is None:
            self.end_time = datetime.now()
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        return self.duration_seconds
