"""add theme_preferences to user_settings

Revision ID: theme_preferences_001
Revises: 
Create Date: 2025-10-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.types import TEXT

# revision identifiers, used by Alembic.
revision = 'theme_preferences_001'
down_revision = None  # Update this to the latest migration revision if needed
branch_labels = None
depends_on = None


def upgrade():
    """Add theme_preferences column to user_settings table (idempotent)"""
    # Get connection to check if column already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if user_settings table exists
    tables = inspector.get_table_names()
    if 'user_settings' not in tables:
        print("⚠️  user_settings table doesn't exist yet, skipping migration")
        return
    
    # Check if theme_preferences column exists
    columns = [col['name'] for col in inspector.get_columns('user_settings')]
    
    # Add theme_preferences column if it doesn't exist (idempotent)
    if 'theme_preferences' not in columns:
        op.add_column('user_settings', sa.Column('theme_preferences', TEXT, nullable=True))
        print("✅ Added theme_preferences column")
    else:
        print("✅ theme_preferences column already exists, skipping")


def downgrade():
    """Remove theme_preferences column from user_settings table (idempotent)"""
    # Check if column exists before dropping
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if user_settings table exists
    tables = inspector.get_table_names()
    if 'user_settings' not in tables:
        return
    
    columns = [col['name'] for col in inspector.get_columns('user_settings')]
    
    if 'theme_preferences' in columns:
        op.drop_column('user_settings', 'theme_preferences')
        print("✅ Removed theme_preferences column")

