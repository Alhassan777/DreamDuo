"""make password_hash nullable for OAuth users

Revision ID: password_hash_nullable_001
Revises: oauth_fields_001
Create Date: 2025-11-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'password_hash_nullable_001'
down_revision = 'oauth_fields_001'
branch_labels = None
depends_on = None


def upgrade():
    """Make password_hash nullable for OAuth users"""
    conn = op.get_bind()
    dialect_name = conn.dialect.name
    
    # Check if password_hash is already nullable (idempotent)
    inspector = sa.inspect(conn)
    columns = inspector.get_columns('users')
    password_hash_col = next((col for col in columns if col['name'] == 'password_hash'), None)
    
    if password_hash_col and password_hash_col['nullable']:
        print("✅ password_hash is already nullable, skipping migration")
        return
    
    if dialect_name == 'sqlite':
        # SQLite doesn't support ALTER COLUMN, need to recreate table
        with op.batch_alter_table('users', schema=None) as batch_op:
            # Batch operations will handle table recreation
            batch_op.alter_column('password_hash',
                                  type_=sa.String(128),
                                  nullable=True)
    else:
        # PostgreSQL, MySQL, etc. support ALTER COLUMN directly
        op.alter_column('users', 'password_hash',
                        type_=sa.String(128),
                        nullable=True)


def downgrade():
    """Make password_hash NOT NULL again"""
    # WARNING: This will fail if there are OAuth users with NULL passwords
    # Only use this if you've removed all OAuth users first
    
    conn = op.get_bind()
    dialect_name = conn.dialect.name
    
    # Check for OAuth users with NULL passwords
    result = conn.execute(sa.text("SELECT COUNT(*) FROM users WHERE password_hash IS NULL"))
    oauth_users_count = result.scalar()
    
    if oauth_users_count > 0:
        raise Exception(
            f"Cannot downgrade: {oauth_users_count} OAuth users exist with NULL passwords. "
            "Remove OAuth users first or set passwords for them."
        )
    
    if dialect_name == 'sqlite':
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.alter_column('password_hash',
                                  type_=sa.String(128),
                                  nullable=False)
    else:
        op.alter_column('users', 'password_hash',
                        type_=sa.String(128),
                        nullable=False)

