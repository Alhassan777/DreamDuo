"""
Fix: Make password_hash nullable for OAuth users
Run this with: python fix_password_hash.py
"""
import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'dev.db')

print(f"Fixing database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # SQLite doesn't support ALTER COLUMN directly
    # We need to recreate the table
    
    print("Creating new users table with nullable password_hash...")
    
    # Step 1: Create new table with correct schema
    cursor.execute("""
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name VARCHAR(40) NOT NULL,
            last_name VARCHAR(40) NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            password_hash VARCHAR(128),
            profile_photo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            auth_provider VARCHAR(20) DEFAULT 'email',
            provider_id VARCHAR(255),
            provider_data TEXT
        )
    """)
    
    # Step 2: Copy data from old table
    print("Copying existing user data...")
    cursor.execute("""
        INSERT INTO users_new 
        SELECT id, first_name, last_name, email, password_hash, profile_photo, 
               created_at, auth_provider, provider_id, provider_data
        FROM users
    """)
    
    # Step 3: Drop old table
    print("Removing old table...")
    cursor.execute("DROP TABLE users")
    
    # Step 4: Rename new table
    print("Renaming new table...")
    cursor.execute("ALTER TABLE users_new RENAME TO users")
    
    # Commit changes
    conn.commit()
    print("✅ Successfully fixed password_hash column!")
    print("✅ OAuth users can now be created without passwords!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    if conn:
        conn.rollback()
        conn.close()
    raise

