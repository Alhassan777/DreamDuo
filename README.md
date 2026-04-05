# DreamDuo

A full-stack task management application with hierarchical task organization, real-time multi-device synchronization, an interactive canvas visualization, a Chrome extension for time tracking, and a rich set of productivity tools. Built with React/TypeScript on the frontend and Flask/Python on the backend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start-tldr)
- [Prerequisites](#prerequisites)
- [Installation & Local Setup](#installation--local-setup)
  - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
  - [Step 2 — Backend Setup (Flask)](#step-2--backend-setup-flask)
  - [Step 3 — Frontend Setup (React)](#step-3--frontend-setup-react)
  - [Step 4 — Open the App](#step-4--open-the-app-and-create-an-account)
  - [Step 5 — Chrome Extension Setup](#step-5--chrome-extension-setup)
- [Running the App — Summary](#running-the-app--summary)
- [Environment Variables Reference](#environment-variables-reference)
- [Chrome Extension](#chrome-extension)
  - [How it Works](#how-it-works)
  - [Authentication Flow](#authentication-flow)
  - [Time Tracking Data Flow](#time-tracking-data-flow)
- [Running Tests](#running-tests)
- [Architecture Overview](#architecture-overview)
- [Known Limitations](#known-limitations)
- [Academic Note](#academic-note)

---

## Features

### Task Management
- **Hierarchical tasks** — Create tasks with unlimited subtask nesting. Break any task down as deep as needed; the tree structure is stored via self-referential SQLAlchemy relationships.
- **Task dependencies** — Link tasks so that one must be completed before another. The backend runs a depth-first search to prevent circular dependency graphs.
- **Priorities & categories** — Assign priority levels and custom categories (with emoji and color) to organize work.
- **Due dates & overdue detection** — Set deadlines on tasks; overdue tasks are automatically flagged.
- **Tags & filtering** — Filter tasks by completion status, priority, category, or date range using the filter panel and chip selectors.

### Views
- **List view** — Collapsible, drag-and-droppable task hierarchy. Reorder and reparent tasks by dragging. Each task card displays its total tracked time.
- **Canvas / Mind Map view** — Tasks become draggable nodes on an infinite canvas (powered by React Flow). Edges represent dependencies; edge style and color are customizable per-connection.
- **Calendar view** — Tasks with due dates are aggregated by day. Click any day to see all tasks due then.
- **Dashboard** — Separated into "Task Completion" (progress, streaks, weekly/monthly distribution) and "Time Tracking" (today/week/month totals, per-task charts, weekly breakdown) sections.
- **Tags page** — Manage categories, priority colors, and completion-status labels in one place.

### Time Tracking (Chrome Extension)
- **Task selection** — Browse and search your DreamDuo tasks from the extension popup.
- **Start / Pause / Stop** — Toggl-style timer controls with distinct visual styling (amber pause, red stop).
- **Pause & Resume** — Pause your current task and resume later; the extension remembers your paused task.
- **Per-task elapsed time** — Each task in the extension list shows its accumulated tracked time.
- **Tab context capture** — Optionally records the active tab URL when a timer starts (captured once, not continuously monitored).
- **Offline resilience** — Failed API calls are queued locally and retried on the next successful connection.
- **Dashboard integration** — Tracked time appears on the main dashboard with per-task breakdowns and weekly charts.
- **Badge indicator** — See active/paused timer status in the Chrome toolbar.
- **Theme synchronization** — The extension automatically matches your selected app theme (default, AOT, accessibility themes, etc.).

### Real-Time Sync
- Changes made on one device (create, update, delete, reorder) are broadcast via **Socket.IO** to all other sessions for the same user instantly, with no refresh required.

### Authentication
- **Email/password** registration and login with **JWT tokens** stored in HTTP-only cookies (XSS-safe).
- **OAuth** sign-in via Google, GitHub, and Facebook, powered by **Supabase Auth**.
- **Dual auth for Chrome extension** — The backend accepts JWTs from both cookies and `Authorization: Bearer` headers, allowing the extension to authenticate reliably in both development and production environments.

### Theming & Customization
- **Theme presets** — Multiple built-in color themes including accessibility-focused options (High Contrast, Deuteranopia, Protanopia, Tritanopia, Low Vision, Dyslexia-Friendly) and the Attack on Titan theme.
- **Custom theme builder** — Pick any accent color and background using the color picker; preferences are persisted per-user.
- **Dark/light mode** — Controlled through CSS custom properties, toggled without a page rebuild.
- **Extension theme sync** — The Chrome extension automatically applies your selected theme for a consistent experience across the app and extension.

### Progressive Web App (PWA)
- Installable on desktop and mobile as a standalone app.
- Service worker with auto-update strategy via Vite PWA plugin.

### Profile
- Edit display name, profile picture, and theme preferences from the profile page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| UI component library | Chakra UI v2 |
| Animations | Framer Motion |
| Canvas / graph view | @xyflow/react (React Flow) |
| Drag and drop | @hello-pangea/dnd |
| HTTP client | Axios |
| Real-time (client) | socket.io-client |
| Date utilities | date-fns |
| Color picker | react-colorful |
| OAuth client | @supabase/supabase-js |
| Backend framework | Flask 2.3 |
| ORM | SQLAlchemy 2 |
| Database migrations | Flask-Migrate (Alembic) |
| Real-time (server) | Flask-SocketIO + gevent |
| Authentication | Flask-JWT-Extended (cookies + Bearer) |
| OAuth provider | Supabase |
| Database | PostgreSQL (production) / SQLite (development) |
| Chrome Extension | Manifest V3 (vanilla JS) |
| Python version | 3.11.9 |

---

## Project Structure

```
DreamDuo/
├── client/                        # React/TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # OAuth button components
│   │   │   ├── canvas/            # React Flow canvas nodes/edges
│   │   │   ├── dashboard/         # Time tracking cards + charts
│   │   │   ├── tags/              # Category & status management
│   │   │   ├── tasks/             # Task list, forms, modals
│   │   │   └── theme/             # Theme customization UI
│   │   ├── contexts/              # React Context (auth, theme, sidebar)
│   │   ├── hooks/                 # Custom hooks (useTasks, useCanvasView, …)
│   │   ├── pages/                 # Top-level route pages
│   │   ├── services/              # Axios API client + WebSocket + time service
│   │   ├── config/                # Supabase client + theme presets
│   │   └── styles/                # Global CSS variables & theme overrides
│   ├── package.json
│   └── vite.config.ts             # Dev proxy to backend on :3001
│
├── server/                        # Flask backend
│   ├── models/                    # SQLAlchemy models (User, Task, Category, TimeLog, …)
│   ├── routes/                    # Blueprint route handlers (auth, tasks, user, tags, time)
│   ├── services/                  # Supabase auth service
│   ├── migrations/                # Alembic migration scripts
│   │   └── versions/              # Individual migration files
│   ├── testing/                   # Pytest test suite
│   ├── config/                    # Supabase server config
│   ├── app.py                     # Flask application factory + entry point
│   ├── socket_events.py           # Socket.IO event handlers
│   ├── run_migrations.py          # Migration helper script
│   └── requirements.txt           # Python dependencies
│
├── chrome-extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json              # Extension configuration
│   ├── popup/                     # Popup UI (HTML, CSS, JS)
│   ├── background/                # Service worker for badge + timer state
│   ├── utils/                     # API client + theme presets (Bearer auth, offline queue)
│   ├── icons/                     # Extension icons (DD logo, 16/48/128 px)
│   └── README.md                  # Extension-specific documentation
│
├── render.yaml                    # Render.com deployment config
└── README.md
```

---

## Quick Start (TL;DR)

If you are already familiar with Flask and React, here is the shortest path:

```bash
# 1. Clone
git clone <your-repo-url> && cd DreamDuo

# 2. Backend
cd server && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
touch .env                    # then fill in values — see Step 2d below
python app.py                 # runs on http://localhost:3001

# 3. Frontend (new terminal)
cd client && npm install && npm run dev   # runs on http://localhost:5173

# 4. Extension
# Load chrome-extension/ as unpacked in chrome://extensions/
```

For the full step-by-step guide, continue reading.

---

## Prerequisites

Verify each tool is installed before proceeding. Run the check commands in your terminal to confirm.

| Tool | Minimum version | Install link | Verify |
|---|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) | `node --version` |
| **npm** | 9+ | Included with Node.js | `npm --version` |
| **Python** | 3.11 | [python.org](https://www.python.org/downloads/) | `python3 --version` |
| **pip** | latest | Included with Python | `pip --version` |
| **Google Chrome** | 88+ | [google.com/chrome](https://www.google.com/chrome/) | `chrome://version` in address bar |
| **Git** | any | [git-scm.com](https://git-scm.com/) | `git --version` |

> **No PostgreSQL needed for local development.** The app defaults to SQLite — a file-based database built into Python. You only need PostgreSQL if you want to mirror the production environment exactly.

---

## Installation & Local Setup

### Step 1 — Clone the Repository

Open a terminal and run:

```bash
git clone <your-repo-url>
cd DreamDuo
```

You should now have a `DreamDuo/` folder containing `client/`, `server/`, and `chrome-extension/`.

---

### Step 2 — Backend Setup (Flask)

All commands in this step are run from the `server/` directory.

#### Step 2a — Navigate to the server folder

```bash
cd server
```

#### Step 2b — Create a Python virtual environment

A virtual environment keeps the project's Python packages isolated from the rest of your system.

```bash
python3 -m venv venv
```

Now **activate** it. You must do this every time you open a new terminal to work on the backend.

**macOS / Linux:**
```bash
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

You will see `(venv)` appear at the start of your terminal prompt when the environment is active.

#### Step 2c — Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO, and all other backend packages. It takes about 30–60 seconds on first run.

#### Step 2d — Create the backend environment file

The backend reads its configuration from a `.env` file in the `server/` directory. This file is **not** included in the repository (it contains secrets), so you must create it manually.

Create the file:

```bash
# macOS / Linux
touch .env

# Windows PowerShell
New-Item .env -ItemType File

# Or simply create a new file called ".env" in the server/ folder using any text editor
```

Open `.env` in your editor and paste in the following. The minimum required values for a working local setup are marked with `# REQUIRED`:

```env
# ── Database ──────────────────────────────────────────────────────────────────
# REQUIRED — SQLite is easiest for local dev. No extra software needed.
DATABASE_URL=sqlite:///dreamduo_dev.db

# PostgreSQL alternative (only if you have Postgres installed):
# DATABASE_URL=postgresql://your_username:your_password@localhost:5432/dreamduo

# ── JWT ───────────────────────────────────────────────────────────────────────
# REQUIRED — Change this to any long random string. Keep it secret.
JWT_SECRET_KEY=change-this-to-a-long-random-secret-string

# ── Flask ─────────────────────────────────────────────────────────────────────
# REQUIRED
FLASK_ENV=development

# ── CORS ──────────────────────────────────────────────────────────────────────
# REQUIRED — must match the URL where your frontend runs
FRONTEND_URL=http://localhost:5173

# ── Database migration ────────────────────────────────────────────────────────
# Leave as false for SQLite (tables are created automatically on first start)
AUTO_MIGRATE=false

# ── Chrome Extension (optional) ──────────────────────────────────────────────
# After loading the extension in Chrome, paste its ID here.
# Adds the extension origin to the CORS allow-list.
# CHROME_EXTENSION_ID=your-extension-id-here

# ── Supabase OAuth (optional) ────────────────────────────────────────────────
# Only needed if you want Google / GitHub / Facebook social login.
# Email + password login works without these.
# SUPABASE_URL=https://<your-project>.supabase.co
# SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

> **Your minimum working `.env` needs exactly four lines:**
> `DATABASE_URL`, `JWT_SECRET_KEY`, `FLASK_ENV`, and `FRONTEND_URL`.
> Everything else is optional for local development.

#### Step 2e — Verify the backend starts

```bash
python app.py
```

You should see output similar to:

```
🔍 Environment Check:
   - FLASK_ENV: development
   - AUTO_MIGRATE: false
   - Database: SQLite (dreamduo_dev.db)
ℹ️  Auto-migration disabled, using db.create_all()
✅ Database initialized successfully using db.create_all()
 * Running on http://0.0.0.0:3001
 * Running on http://127.0.0.1:3001
```

The backend is now running at **http://localhost:3001**. Leave this terminal open.

> **Common errors:**
> - `ModuleNotFoundError` → You forgot to activate the virtual environment. Run `source venv/bin/activate` first.
> - `Address already in use` → Another process is using port 3001. Stop it, or set `PORT=3002` in `.env` and update `FRONTEND_URL` accordingly.
> - `No .env file found` → Make sure the `.env` file is inside the `server/` folder, not the project root.

---

### Step 3 — Frontend Setup (React)

Open a **second terminal window**. Do not close the backend terminal.

#### Step 3a — Navigate to the client folder

```bash
cd DreamDuo/client
```

#### Step 3b — Install Node.js dependencies

```bash
npm install
```

This downloads all frontend packages into `node_modules/`. It takes about 1–2 minutes on first run.

#### Step 3c — Check the frontend environment file

The `client/.env` file controls Supabase OAuth. For basic email/password login, **no changes are needed** — the app works out of the box without Supabase.

If you want to enable Google / GitHub / Facebook login, open `client/.env` and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

> **Skip this entirely if you just want to test with email and password.**

#### Step 3d — Start the frontend

```bash
npm run dev
```

Expected output:

```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend is now running at **http://localhost:5173**. Leave this terminal open too.

> **How the frontend talks to the backend:** Vite is configured to automatically proxy any request to `/api/*` from the frontend to `http://localhost:3001`. You do not need to configure CORS or change any URLs — it just works.

---

### Step 4 — Open the App and Create an Account

With both the backend and frontend running, open your browser and go to:

**http://localhost:5173**

1. Click **Sign Up** and create an account with any email and password.
2. You will be redirected to the **Tasks** page.
3. Click **+ Add Task** to create your first task.
4. Explore the **Dashboard**, **Calendar**, and **Canvas** views from the sidebar.

---

### Step 5 — Chrome Extension Setup

The Chrome extension lets you track time on your DreamDuo tasks from any browser tab.

> **Important:** Complete Steps 1–4 first. The extension only works when the backend is running and you are logged in to the web app.

#### Step 5a — Load the extension in Chrome

1. Open Chrome and go to **chrome://extensions/** in the address bar.
2. Turn on **Developer mode** using the toggle in the **top-right corner**.
3. Click **Load unpacked**.
4. In the file picker, navigate to your `DreamDuo/` project folder and select the **`chrome-extension`** folder. Click **Select** (or **Open**).
5. The DreamDuo extension now appears in the list with the DD logo icon.

#### Step 5b — Pin the extension to the toolbar

1. Click the **puzzle piece icon** (🧩) in the top-right of Chrome's toolbar.
2. Find **DreamDuo Time Tracker** in the list.
3. Click the **pin icon** (📌) next to it.

The DD icon now appears permanently in your toolbar for easy access.

#### Step 5c — Log in to capture your auth token

The extension authenticates using a Bearer token that is automatically captured when you log in through the web app. You **must** log in via the web app at least once after loading the extension so that the content script can store your token.

1. With the extension loaded, navigate to **http://localhost:5173** in Chrome.
2. Log in with your email and password.
3. The extension's content script silently captures the token from the login response and stores it in `chrome.storage.local`.
4. That's it — the extension is now authenticated and ready to use.

> **Why this approach?** Chrome extensions run in a separate origin (`chrome-extension://...`), which makes `SameSite` cookie sharing unreliable across different environments. Capturing the Bearer token at login time and storing it locally is the most reliable cross-environment solution.

#### Step 5d — Use the Extension

1. Click the **DD icon** in the Chrome toolbar.
2. A brief loading spinner appears while the extension checks your session.
3. Your tasks for today automatically appear in the popup.
4. Click the **▶ play button** next to any task to start the timer.
5. Click **Pause** (amber) to temporarily stop — the task is remembered.
6. Click **Stop** (red) to finalize the session and save it to the database.
7. Open the **Dashboard** in the web app to see your tracked time.

#### Step 5e — Switching between Local Dev and Production

The extension ships defaulting to **local dev** (`http://localhost:3001/api`). To point it at the production backend without editing code:

1. Click the **gear icon (⚙)** in the extension popup header.
2. Use the **Production** or **Local Dev** preset buttons to fill in the correct URLs instantly.
3. Click **Save**.
4. The extension immediately reconnects to the selected backend.

> **Switching to production also requires a fresh token.** After saving the production preset, visit `https://dreamduo.netlify.app`, log in, and the content script will capture and store the production token automatically.

> **Resetting stored URLs:** If you need a clean slate, open the service worker console (`chrome://extensions` → DreamDuo → "service worker") and run:
> ```javascript
> chrome.storage.local.remove(['dreamduo_api_url', 'dreamduo_frontend_url'], () => console.log('cleared'));
> ```

---

## Running the App — Summary

Once setup is complete, you only need two commands each time:

| Terminal | Command | URL |
|---|---|---|
| Terminal 1 (backend) | `cd server && source venv/bin/activate && python app.py` | http://localhost:3001 |
| Terminal 2 (frontend) | `cd client && npm run dev` | http://localhost:5173 |

The Chrome extension works automatically as long as both servers are running and you are logged in.

---

## Environment Variables Reference

### Backend (`server/.env`)

The minimum required set for local development is the first four rows.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | SQLite: `sqlite:///dreamduo_dev.db`. PostgreSQL: `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET_KEY` | **Yes** | — | Any long random string used to sign JWT tokens. Change this before deploying. |
| `FLASK_ENV` | **Yes** | — | Set to `development` locally. Set to `production` when deploying. |
| `FRONTEND_URL` | **Yes** | — | The URL of the React frontend. Local: `http://localhost:5173`. Added to CORS allow-list. |
| `AUTO_MIGRATE` | No | `false` | Set to `true` to run Alembic migrations automatically on startup. Leave `false` with SQLite. |
| `CHROME_EXTENSION_ID` | No | — | Extension ID from `chrome://extensions/`. Explicitly adds `chrome-extension://<id>` to CORS. Not needed in most cases. |
| `PORT` | No | `3001` | Port the Flask server listens on. |
| `SUPABASE_URL` | No* | — | Supabase project URL. Only needed for Google / GitHub / Facebook OAuth. |
| `SUPABASE_SERVICE_KEY` | No* | — | Supabase service-role key for verifying OAuth tokens server-side. |

### Frontend (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No* | Supabase project URL for the client-side OAuth flow. |
| `VITE_SUPABASE_ANON_KEY` | No* | Supabase anonymous/public key for the client-side SDK. |

*Only required for Google / GitHub / Facebook social login. Email/password login works without them.

### Copy-paste ready `.env` for local development

Save this as `server/.env` to get started immediately:

```env
DATABASE_URL=sqlite:///dreamduo_dev.db
JWT_SECRET_KEY=local-dev-secret-replace-before-deploying
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
AUTO_MIGRATE=false
```

---

## Chrome Extension

### How it Works

The DreamDuo Chrome Extension is a **Manifest V3** extension that acts as a companion to the web app. It lets you track time on your tasks without keeping the web app open.

**Components:**

| Component | Purpose |
|---|---|
| `popup/` | The UI you see when clicking the extension icon — task list, timer, stats |
| `background/service-worker.js` | Manages badge updates, notifications, and timer state persistence |
| `utils/api.js` | Shared API client with Bearer token auth, offline queue, `chrome.storage` |

**Key behaviors:**

- Tasks are fetched from the same backend API used by the web app
- Only one timer can be active at a time (enforced server-side)
- Pause stores the task locally and stops the server timer; Resume starts a new session for the same task
- All time sessions are aggregated per-task on the dashboard
- The extension sends `source: 'chrome_extension'` with every timer start so tracked time can be distinguished from web-originated entries
- If the network is unavailable, start/stop requests are queued in `chrome.storage.local` and retried automatically

### Authentication Flow

The web app uses JWT tokens in HTTP-only cookies. Chrome extensions run in a separate origin (`chrome-extension://...`), which makes `SameSite` cookie sharing unreliable. The extension uses a **content-script token capture** approach to avoid this entirely.

**How it works:**

1. A content script runs on the DreamDuo web app pages (`localhost:5173` or `dreamduo.netlify.app`).
2. It intercepts `fetch` responses that come from `/auth/login` and extracts the `access_token` from the JSON body.
3. The token is sent to the background service worker via `chrome.runtime.sendMessage`.
4. The service worker stores it in `chrome.storage.local` under `dreamduo_token`.
5. All extension API requests attach the token as `Authorization: Bearer <token>`.
6. If no stored token exists, the popup shows "Please log in to DreamDuo" and the user must log in on the web app to capture a fresh token.

```
User navigates to web app and logs in
        │
        ▼
POST /api/auth/login  →  { access_token: "..." }
        │
        ▼
Content script intercepts response
        │
        ▼
sendMessage → service worker
        │
        ▼
chrome.storage.local.set({ dreamduo_token: "..." })
        │
        ▼
Extension popup opens
        │
        ├── GET /api/user/profile  (Authorization: Bearer <token>)
        │       │
        │       ├── 200 → show tasks
        │       └── 401 → show "Please log in" (token missing or expired)
        ▼
All subsequent calls use Bearer token from storage
```

> **Token expiry:** Tokens expire after 1 hour. When a session expires, open the web app, log out and log back in — the content script captures a fresh token automatically.

### Time Tracking Data Flow

```
Chrome Extension                    Flask Backend                   Dashboard
─────────────────                   ─────────────                   ─────────
Select task                              │                              │
    │                                    │                              │
Start timer ──── POST /time/start ──────▶│                              │
  (source: chrome_extension,             │                              │
   active_url: current tab)              │── Insert TimeLog row ───────▶│ (DB)
    │                                    │                              │
Pause ────────── POST /time/stop ───────▶│── Finalize TimeLog ─────────▶│
  (store paused_task locally)            │                              │
    │                                    │                              │
Resume ───────── POST /time/start ──────▶│── New TimeLog row ──────────▶│
    │                                    │                              │
Stop ─────────── POST /time/stop ───────▶│── Finalize TimeLog ─────────▶│
    │                                    │                              │
    │                                    │                              │
    │                          GET /time/stats ◀────────────────────────│
    │                                    │── Aggregates all sessions ──▶│
    │                                    │   per task, per day, weekly  │
    │                                    │                              │
    │                                    │              Dashboard renders:
    │                                    │              • TimeTrackingCard
    │                                    │              • TaskTimeChart
    │                                    │              • WeeklyTimeChart
```

---

## Running Tests

The backend test suite uses **pytest** against an in-memory SQLite database — no extra setup needed.

```bash
# 1. Make sure the virtual environment is active
cd server
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1

# 2. Run all tests
pytest testing/ -v
```

To run a specific test file:

```bash
pytest testing/test_tasks.py -v
pytest testing/test_auth.py -v
pytest testing/test_dependencies.py -v
pytest testing/test_websocket.py -v
```

---

## Troubleshooting

### Backend won't start

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'flask'` | Virtual environment is not active. Run `source venv/bin/activate` (or `.\venv\Scripts\Activate.ps1` on Windows) before `python app.py`. |
| `Address already in use :3001` | Another process is using port 3001. Find and stop it, or add `PORT=3002` to `server/.env` and update `FRONTEND_URL` if needed. |
| `FileNotFoundError: .env not found` or blank JWT key error | The `.env` file is missing or in the wrong directory. It must be at `DreamDuo/server/.env`. |
| `sqlalchemy.exc.OperationalError: no such column` | The database schema is out of date. Delete `server/instance/dreamduo_dev.db` and restart the backend — tables are recreated automatically. |

### Frontend won't start

| Symptom | Fix |
|---|---|
| `npm: command not found` | Node.js is not installed. Download it from [nodejs.org](https://nodejs.org). |
| `Error: Cannot find module` | Dependencies are missing. Run `npm install` inside the `client/` folder. |
| Blank white page in browser | The backend is not running. Start `python app.py` in Terminal 1 first. |
| API calls return `404` | The Vite proxy is not set up. Make sure you are accessing `http://localhost:5173` (not `3001`) in the browser. |

### Chrome Extension issues

| Symptom | Fix |
|---|---|
| "Please log in" even when logged in | The extension's token is missing or expired. Go to `http://localhost:5173`, log **out** and log **in** again — the content script captures a fresh token on login. |
| Popup shows a spinner indefinitely | The backend is unreachable. Confirm `python app.py` is running and try refreshing the extension. |
| Tasks don't load / "Failed to load tasks" | Click the gear icon ⚙, confirm the API URL shows `http://localhost:3001/api`, then click Save. Also ensure you are logged in on the web app so a token is stored. |
| "Failed to fetch" / network error | The Flask backend is not running. Start it in Terminal 1. |
| Extension shows old tasks after changes | Close and reopen the popup, or click inside it to trigger a refresh. |
| Changes in `chrome-extension/` not reflected | Go to `chrome://extensions/` and click the **refresh icon** (🔄) on the extension card. For deeper changes (e.g. manifest), click **Remove** then **Load unpacked** again. |
| Need to reset stored URLs to defaults | Open the service worker console (`chrome://extensions` → DreamDuo → "service worker") and run: `chrome.storage.local.remove(['dreamduo_api_url', 'dreamduo_frontend_url'], () => console.log('cleared'))`, then reload the extension. |
| Switching to production backend | Click ⚙ in the popup → **Production** preset → Save. Then log in at `https://dreamduo.netlify.app` to capture a production token. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Chrome)                     │
│                                                         │
│  ┌─────────────────────┐   ┌────────────────────────┐  │
│  │  React SPA (Vite)   │   │  Chrome Extension (MV3)│  │
│  │  localhost:5173      │   │  popup + service worker│  │
│  └──────────┬──────────┘   └───────────┬────────────┘  │
│             │ Axios + cookies           │ fetch + Bearer│
│             │ Socket.IO                 │               │
└─────────────┼───────────────────────────┼───────────────┘
              │                           │
              ▼                           ▼
      ┌───────────────────────────────────────┐
      │        Flask Backend (port 3001)       │
      │                                       │
      │  JWT Auth (cookies + Bearer headers)  │
      │  Supabase OAuth verification          │
      │  SQLAlchemy ORM                       │
      │  Socket.IO (gevent)                   │
      └───────────────────┬───────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  PostgreSQL / SQLite  │
              │                       │
              │  users, tasks,        │
              │  categories,          │
              │  time_logs,           │
              │  task_hierarchy, ...  │
              └───────────────────────┘
```

### Key design patterns

- **Flask Application Factory** — `app.py` uses `create_app()` so the app can be instantiated with different configs for development, testing, and production.
- **SQLAlchemy self-referential model** — `Task` references itself via `parent_id`, enabling arbitrary-depth subtask trees without schema changes.
- **DFS cycle detection** — Before saving a new task dependency, the server traverses the existing dependency graph to confirm no cycle would be introduced.
- **Room-based Socket.IO** — Each authenticated user joins a private room; broadcasts go only to that user's connected sessions, ensuring isolation.
- **Dual JWT auth** — The server reads tokens from both HTTP-only cookies (web app) and `Authorization: Bearer` headers (Chrome extension), allowing the same endpoints to serve both clients.
- **Offline-resilient extension** — The Chrome extension queues failed mutation requests in `chrome.storage.local` and retries them on the next successful connection.
- **React Context for global state** — Auth, theme, and sidebar state live in Context providers (`AuthContext`, `ThemeContext`, `SidebarContext`), avoiding prop drilling.
- **Recursive React components** — `SubtaskCard` renders itself for each child, supporting unlimited nesting with a single component definition.
- **CSS custom properties theming** — All brand colors are CSS variables in `theme-variables.css`. Changing the theme updates variables at the `:root` level with no rebuild required.

---

## Known Limitations

- **Token expiry** — Extension Bearer tokens expire after 1 hour (matching the web session). The extension will re-authenticate on the next popup open, but a long-running timer may experience a brief auth gap. A production system would implement refresh tokens.
- **No continuous tab tracking** — The active tab URL is captured once when a timer starts, not continuously updated. This is a deliberate privacy choice.
- **Pause is client-side** — Pausing stops the server-side timer and stores the paused task locally. If the user clears extension storage, the paused task context is lost (but all completed sessions remain in the database).
- **Single active timer** — Only one timer can run at a time (server-enforced). This is intentional for clear time attribution.
- **Extension requires web login** — The extension does not have its own login form. The user must first log in via the DreamDuo web app in the same browser.
- **WebSocket integration** — Timer start/stop events are emitted via Socket.IO but the web frontend does not currently subscribe to these events for live updates. A page refresh shows updated data.

---

## Academic Note

This project was developed as a capstone submission. The following summarizes the implementation scope:

**Implemented:**
- Full-stack task management with hierarchical tasks, dependencies, and filtering
- Real-time multi-device sync via WebSockets
- Authentication via email/password and OAuth (Google, GitHub, Facebook)
- Interactive canvas/mind-map view with customizable edges
- Calendar view with date-based task aggregation
- Custom theming with CSS variables and user-persisted preferences
- 8 accessibility-focused theme presets (High Contrast, colorblind-safe options, Low Vision, Dyslexia-Friendly)
- Chrome Extension (Manifest V3) for time tracking with Toggl-style pause/resume
- Extension theme synchronization with the main app
- Per-task elapsed time display in both extension and task cards
- Offline-resilient extension with local queue and retry
- Dashboard with separated Task Completion and Time Tracking sections
- Database migrations via Alembic
- Backend test suite with pytest

**Future work (not implemented):**
- Refresh token rotation for longer extension sessions
- Continuous tab/domain tracking during active timer
- Time tracking from within the web app UI (currently extension-only for starting timers)
- Pomodoro timer mode
- Team/shared task features
- Export tracked time to CSV/PDF
- Chrome Web Store publication
- End-to-end frontend tests
