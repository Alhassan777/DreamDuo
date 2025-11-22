"""
Simple script to add OAuth fields to the users table
Run this with: python add_oauth_fields.py
"""
import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'dev.db')

print(f"Connecting to database: {db_path}")

try:
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    
    print(f"Current columns in users table: {columns}")
    
    # Add auth_provider column if it doesn't exist
    if 'auth_provider' not in columns:
        print("Adding auth_provider column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email'
        """)
        print("✅ Added auth_provider column")
    else:
        print("⏭️  auth_provider column already exists")
    
    # Add provider_id column if it doesn't exist
    if 'provider_id' not in columns:
        print("Adding provider_id column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN provider_id VARCHAR(255)
        """)
        print("✅ Added provider_id column")
    else:
        print("⏭️  provider_id column already exists")
    
    # Add provider_data column if it doesn't exist
    if 'provider_data' not in columns:
        print("Adding provider_data column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN provider_data TEXT
        """)
        print("✅ Added provider_data column")
    else:
        print("⏭️  provider_data column already exists")
    
    # Commit the changes
    conn.commit()
    
    # Verify the changes
    cursor.execute("PRAGMA table_info(users)")
    new_columns = [column[1] for column in cursor.fetchall()]
    print(f"\n✅ Migration complete! New columns: {new_columns}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    if conn:
        conn.rollback()
        conn.close()
    raise

