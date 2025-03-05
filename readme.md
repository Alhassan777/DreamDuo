# AOT To Do Application

A modern task management application built with Flask (Backend) and React + TypeScript (Frontend).

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL 12 or higher

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AOT To Do
```

### 2. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the server directory with the following content:
   ```
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
   JWT_SECRET_KEY=your_secret_key_here
   ```

5. Initialize the database:
   ```bash
   flask db upgrade
   ```

6. Start the backend server:
   ```bash
   python app.py
   ```
   The server will run on http://localhost:3001

### 3. Frontend Setup

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

## Features

- User authentication and authorization
- Task management with categories
- Task prioritization
- Task hierarchies
- User settings and preferences

## Development

- Backend API runs on port 3001
- Frontend development server runs on port 5173
- CORS is configured to allow communication between these ports

## Database Schema

The application uses PostgreSQL with the following main models:
- Users
- Tasks
- Categories
- Task Hierarchies
- User Settings

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.