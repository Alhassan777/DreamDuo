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

**Note:** Ensure PostgreSQL is running before attempting to initialize or connect to the database.

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
