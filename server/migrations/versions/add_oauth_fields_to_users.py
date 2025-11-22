"""add OAuth fields to users table

Revision ID: oauth_fields_001
Revises: theme_preferences_001
Create Date: 2025-11-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'oauth_fields_001'
down_revision = 'theme_preferences_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add OAuth fields to users table"""
    # Get connection to check if columns already exist
    conn = op.get_bind()
    
    # Check if auth_provider column exists
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Add auth_provider column if it doesn't exist (idempotent)
    if 'auth_provider' not in columns:
        op.add_column('users', sa.Column('auth_provider', sa.String(20), nullable=False, server_default='email'))
        print("✅ Added auth_provider column")
    
    # Add provider_id column if it doesn't exist (idempotent)
    if 'provider_id' not in columns:
        op.add_column('users', sa.Column('provider_id', sa.String(255), nullable=True))
        print("✅ Added provider_id column")
    
    # Add provider_data column if it doesn't exist (idempotent)
    if 'provider_data' not in columns:
        op.add_column('users', sa.Column('provider_data', sa.Text(), nullable=True))
        print("✅ Added provider_data column")


def downgrade():
    """Remove OAuth fields from users table"""
    # Check if columns exist before dropping (idempotent)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'provider_data' in columns:
        op.drop_column('users', 'provider_data')
    
    if 'provider_id' in columns:
        op.drop_column('users', 'provider_id')
    
    if 'auth_provider' in columns:
        op.drop_column('users', 'auth_provider')

