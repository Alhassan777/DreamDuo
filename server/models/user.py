import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .db import db
from datetime import datetime
from passlib.hash import pbkdf2_sha256

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(40), nullable=False)
    last_name = db.Column(db.String(40), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)  # Nullable for OAuth users
    profile_photo = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # OAuth fields
    auth_provider = db.Column(db.String(20), default='email')  # 'email', 'google', 'github', etc.
    provider_id = db.Column(db.String(255), nullable=True)  # ID from OAuth provider
    provider_data = db.Column(db.JSON, nullable=True)  # Additional provider metadata
    
    tasks = db.relationship('Task', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = pbkdf2_sha256.hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return pbkdf2_sha256.verify(password, self.password_hash)