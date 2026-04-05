"""add source and active_url columns to time_logs

Revision ID: time_logs_source_001
Revises: time_logs_001
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'time_logs_source_001'
down_revision = 'time_logs_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add source and active_url columns to time_logs (idempotent)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'time_logs' in tables:
        existing_columns = [col['name'] for col in inspector.get_columns('time_logs')]

        if 'source' not in existing_columns:
            op.add_column('time_logs', sa.Column('source', sa.String(30), nullable=False, server_default='web'))
            print("  Added 'source' column to time_logs")

        if 'active_url' not in existing_columns:
            op.add_column('time_logs', sa.Column('active_url', sa.String(500), nullable=True))
            print("  Added 'active_url' column to time_logs")
    else:
        print("  time_logs table does not exist, skipping")


def downgrade():
    """Remove source and active_url columns from time_logs (idempotent)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'time_logs' in tables:
        existing_columns = [col['name'] for col in inspector.get_columns('time_logs')]

        if 'active_url' in existing_columns:
            op.drop_column('time_logs', 'active_url')

        if 'source' in existing_columns:
            op.drop_column('time_logs', 'source')
