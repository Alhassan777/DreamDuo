"""add time_logs table for time tracking

Revision ID: time_logs_001
Revises: completed_date_001
Create Date: 2026-03-18

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'time_logs_001'
down_revision = 'completed_date_001'
branch_labels = None
depends_on = None


def upgrade():
    """Create time_logs table for tracking time spent on tasks (idempotent)"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'time_logs' not in tables:
        op.create_table(
            'time_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('task_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('start_time', sa.DateTime(), nullable=False),
            sa.Column('end_time', sa.DateTime(), nullable=True),
            sa.Column('duration_seconds', sa.Integer(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes for common queries
        op.create_index('ix_time_logs_task_id', 'time_logs', ['task_id'])
        op.create_index('ix_time_logs_user_id', 'time_logs', ['user_id'])
        op.create_index('ix_time_logs_start_time', 'time_logs', ['start_time'])
        op.create_index('ix_time_logs_user_task', 'time_logs', ['user_id', 'task_id'])
        
        print("✅ Created time_logs table with indexes")
    else:
        print("✅ time_logs table already exists, skipping")


def downgrade():
    """Drop time_logs table (idempotent)"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'time_logs' in tables:
        # Drop indexes first
        op.drop_index('ix_time_logs_user_task', 'time_logs')
        op.drop_index('ix_time_logs_start_time', 'time_logs')
        op.drop_index('ix_time_logs_user_id', 'time_logs')
        op.drop_index('ix_time_logs_task_id', 'time_logs')
        
        op.drop_table('time_logs')
        print("✅ Dropped time_logs table")
