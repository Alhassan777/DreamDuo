import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Connect to PostgreSQL server
conn = psycopg2.connect(
    host="localhost",
    user="postgres",
    password="123456",
    port=5432
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

cursor = conn.cursor()
try:
    # Terminate all connections to the database
    cursor.execute("""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'aot_todo'
        AND pid <> pg_backend_pid();
    """)
    
    # Drop the database
    cursor.execute("DROP DATABASE IF EXISTS aot_todo;")
    print("SUCCESS: Dropped existing database 'aot_todo'")
    
    # Recreate the database
    cursor.execute("CREATE DATABASE aot_todo;")
    print("SUCCESS: Created fresh database 'aot_todo'")
    
except Exception as e:
    print(f"ERROR: {e}")
finally:
    cursor.close()
    conn.close()

