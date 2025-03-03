import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db
from datetime import datetime

class Priority(db.Model):
    __tablename__ = 'priorities'

    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with User model
    user = db.relationship('User', backref=db.backref('priorities', lazy=True))

    # Ensure uniqueness of priority level per user
    __table_args__ = (db.UniqueConstraint('level', 'user_id', name='unique_priority_per_user'),)