# AOT To-Do Application

A modern task management application built with Flask (Backend) and React + TypeScript (Frontend).

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 16 or higher
- **PostgreSQL** 12 or higher

## Getting Started

### 1. Clone the Repository

```sh
git clone <repository-url>
cd AOT-To-Do
```

## Backend Setup

### 2. Setup Virtual Environment

Navigate to the server directory:

```sh
cd server
```

Create and activate a virtual environment:

```sh
python -m venv venv
source venv/bin/activate  # On macOS
```

Install dependencies:

```sh
pip install -r requirements.txt
```

### PostgreSQL Database Setup (macOS)

### 3. Install and Start PostgreSQL

Install PostgreSQL using Homebrew:

```sh
brew install postgresql
```

Start PostgreSQL service:

```sh
brew services start postgresql
```

Verify PostgreSQL is running:

```sh
brew services list
```

### 4. Create a PostgreSQL Database and User

Access PostgreSQL interactive shell:

```sh
psql postgres
```

Create a new database:

```sql
CREATE DATABASE aot_todo;
```

Create a new user and set a password:

```sql
CREATE USER aot_user WITH ENCRYPTED PASSWORD 'yourpassword';
```

Grant privileges to the new user:

```sql
GRANT ALL PRIVILEGES ON DATABASE aot_todo TO aot_user;
```

Exit PostgreSQL:

```sh
\q
```

### 5. Configure Environment Variables

Create a `.env` file in the `server` directory and add the following:

```sh
DATABASE_URL=postgresql://aot_user:yourpassword@localhost:5432/aot_todo
JWT_SECRET_KEY=your_secret_key_here
```

### 6. Initialize the Database

Apply database migrations:

```sh
flask db upgrade
```

### 7. Start the Backend Server

```sh
python app.py
```

The backend server will run on [http://localhost:3001](http://localhost:3001).

## Troubleshooting Common Database Issues

### 1. PostgreSQL Service Not Running
**Symptoms:**
- Connection refused errors
- 'psql: could not connect to server' messages
- Unable to connect to database when running the application

**Solutions:**
1. Restart PostgreSQL service:
```sh
brew services restart postgresql
```

2. Verify PostgreSQL is running:
```sh
pg_isready
# or
brew services list | grep postgresql
```

3. Check PostgreSQL logs for errors:
```sh
cat $(brew --prefix)/var/log/postgresql.log
```

### 2. Database User and Privileges Issues
**Symptoms:**
- Permission denied for database 'aot_todo'
- Authentication failures
- "role aot_user does not exist"
- "database aot_todo does not exist"

**Solutions:**
1. Verify user exists and has correct privileges:
```sql
SELECT rolname, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = 'aot_user';
```

2. If user doesn't exist or has incorrect privileges:
```sql
-- Drop user if exists with incorrect settings
DROP USER IF EXISTS aot_user;

-- Recreate user with correct privileges
CREATE USER aot_user WITH ENCRYPTED PASSWORD 'yourpassword' CREATEDB;

-- Recreate database
DROP DATABASE IF EXISTS aot_todo;
CREATE DATABASE aot_todo;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE aot_todo TO aot_user;
\c aot_todo
GRANT ALL ON SCHEMA public TO aot_user;
```

### 3. Environment Variable and Configuration Issues
**Symptoms:**
- "DATABASE_URL environment variable is not set"
- Database connection errors
- JWT token related errors

**Solutions:**
1. Verify .env file exists in server directory:
```sh
ls -la server/.env
```

2. Ensure .env file contains correct configuration:
```sh
# server/.env
DATABASE_URL=postgresql://aot_user:yourpassword@localhost:5432/aot_todo
JWT_SECRET_KEY=your_secret_key_here  # Required for authentication
```

3. Validate environment variables are loaded:
```sh
echo $DATABASE_URL
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL'))"
```

### 4. Database Migration Issues
**Symptoms:**
- "Table does not exist" errors
- Missing columns or tables
- Alembic version errors

**Solutions:**
1. Clean migration setup (if having issues):
```sh
# Remove existing migration files if they're corrupted
rm -rf server/migrations/versions/*

# Initialize fresh migrations
flask db init
flask db migrate -m "initial migration"
flask db upgrade
```

2. If migrations fail or tables are out of sync:
```sh
# Reset migration state
flask db stamp head

# Create new migration
flask db migrate

# Apply migration
flask db upgrade
```

3. Verify database state:
```sql
-- Check existing tables
\dt

-- Check alembic version
SELECT * FROM alembic_version;
```

### 5. Python Environment and Dependency Issues
**Symptoms:**
- Import errors
- Module not found errors
- Version conflicts

**Solutions:**
1. Clean virtual environment setup:
```sh
# Remove existing venv if issues persist
rm -rf server/venv

# Create fresh venv
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

2. If dependency conflicts occur:
```sh
pip install -r requirements.txt --force-reinstall
```

3. Verify all required packages are installed:
```sh
pip freeze | grep -E "Flask|SQLAlchemy|psycopg2-binary|python-dotenv"
```

**Important Notes:**
- Always ensure PostgreSQL is running before attempting database operations
- Check PostgreSQL logs if connection issues persist
- Make sure to activate virtual environment before running any Python commands
- Keep track of migration files and don't modify them manually
- Backup your database before running migrations in production

## Frontend Setup

### 8. Install Dependencies

Open a new terminal and navigate to the `client` directory:

```sh
cd client
```

Install required dependencies:

```sh
npm install
```

### 9. Start the Frontend Development Server

```sh
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Features

- User authentication and authorization
- Task management with categories
- Task prioritization
- Task hierarchies
- User settings and preferences

## Development Notes

- Backend API runs on port `3001`
- Frontend development server runs on port `5173`
- CORS is configured to allow communication between these ports

## Database Schema

The application uses PostgreSQL with the following main models:

- **Users**
- **Tasks**
- **Categories**
- **Task Hierarchies**
- **User Settings**

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the **MIT License** - see the `LICENSE` file for details.
