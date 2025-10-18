"""
Quick script to add theme_preferences column to user_settings table
Run this with: python add_theme_column.py
"""
from app import create_app
from models.db import db
from sqlalchemy import text

def add_theme_column():
    app = create_app()
    
    with app.app_context():
        try:
            # Add the columns if they don't exist
            with db.engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_preferences TEXT"
                ))
                conn.execute(text(
                    "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS custom_themes TEXT"
                ))
                conn.commit()
                print("✅ Successfully added theme_preferences and custom_themes columns to user_settings table!")
                
                # Verify it was added
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_settings'"
                ))
                columns = [row[0] for row in result]
                print(f"\n📋 Columns in user_settings table: {', '.join(columns)}")
                
                if 'theme_preferences' in columns:
                    print("\n✅ theme_preferences column is now available!")
                else:
                    print("\n❌ theme_preferences column was NOT added. Please check database permissions.")
                    
        except Exception as e:
            print(f"\n❌ Error adding column: {str(e)}")
            print("\nTry running this SQL command manually in your PostgreSQL client:")
            print("ALTER TABLE user_settings ADD COLUMN theme_preferences TEXT;")

if __name__ == '__main__':
    add_theme_column()

