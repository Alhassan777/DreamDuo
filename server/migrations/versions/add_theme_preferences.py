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
    # Add theme_preferences column to user_settings table
    op.add_column('user_settings', sa.Column('theme_preferences', TEXT, nullable=True))


def downgrade():
    # Remove theme_preferences column from user_settings table
    op.drop_column('user_settings', 'theme_preferences')

