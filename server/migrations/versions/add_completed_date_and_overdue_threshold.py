"""add completed_date to tasks and overdue_warning_threshold to user_settings

Revision ID: completed_date_001
Revises: 
Create Date: 2025-12-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'completed_date_001'
down_revision = 'password_hash_nullable_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add completed_date column to tasks and overdue_warning_threshold to user_settings (idempotent)"""
    # Get connection to check if columns already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if tasks table exists
    tables = inspector.get_table_names()
    
    # Add completed_date to tasks table
    if 'tasks' in tables:
        columns = [col['name'] for col in inspector.get_columns('tasks')]
        
        if 'completed_date' not in columns:
            op.add_column('tasks', sa.Column('completed_date', sa.DateTime, nullable=True))
            print("✅ Added completed_date column to tasks")
        else:
            print("✅ completed_date column already exists in tasks, skipping")
    else:
        print("⚠️  tasks table doesn't exist yet, skipping tasks migration")
    
    # Add overdue_warning_threshold to user_settings table
    if 'user_settings' in tables:
        columns = [col['name'] for col in inspector.get_columns('user_settings')]
        
        if 'overdue_warning_threshold' not in columns:
            op.add_column('user_settings', sa.Column('overdue_warning_threshold', sa.Integer, nullable=True, server_default='7'))
            print("✅ Added overdue_warning_threshold column to user_settings")
        else:
            print("✅ overdue_warning_threshold column already exists in user_settings, skipping")
    else:
        print("⚠️  user_settings table doesn't exist yet, skipping user_settings migration")


def downgrade():
    """Remove completed_date from tasks and overdue_warning_threshold from user_settings (idempotent)"""
    # Check if columns exist before dropping
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    tables = inspector.get_table_names()
    
    # Remove completed_date from tasks
    if 'tasks' in tables:
        columns = [col['name'] for col in inspector.get_columns('tasks')]
        
        if 'completed_date' in columns:
            op.drop_column('tasks', 'completed_date')
            print("✅ Removed completed_date column from tasks")
    
    # Remove overdue_warning_threshold from user_settings
    if 'user_settings' in tables:
        columns = [col['name'] for col in inspector.get_columns('user_settings')]
        
        if 'overdue_warning_threshold' in columns:
            op.drop_column('user_settings', 'overdue_warning_threshold')
            print("✅ Removed overdue_warning_threshold column from user_settings")

