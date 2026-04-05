# DreamDuo Time Tracker Chrome Extension

A Chrome extension that integrates with DreamDuo to track time spent on your tasks directly from your browser.

## Features

- **Task Selection**: Browse and search your DreamDuo tasks
- **Per-Task Time Display**: Each task shows its total tracked time (e.g., "2h 15m")
- **Start / Pause / Stop**: Toggl-style timer controls with distinct visual styling
  - **Pause** (amber) — Temporarily stop, extension remembers your task
  - **Stop** (red) — Finalize and save the session
- **Real-Time Display**: See elapsed time while working
- **Quick Stats**: View today's and this week's tracked time
- **Badge Indicator**: See active/paused timer status in the extension icon
- **Tab Context**: Captures the active tab URL when a timer starts (privacy-respecting, one-time capture)
- **Offline Resilience**: Queues failed API calls locally and retries automatically
- **Bearer Token Auth**: Works reliably in both development and production environments
- **Theme Sync**: Automatically matches your selected app theme (default, AOT, accessibility themes, custom)
- **Environment Presets**: One-click switching between local development and production URLs

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder from the DreamDuo project
5. The extension will appear in your extensions list
6. (Optional) Copy the extension ID and set `CHROME_EXTENSION_ID` in `server/.env`

### Configuration

1. Click the DreamDuo extension icon in your Chrome toolbar
2. Click the settings (gear) icon
3. **Quick Setup (Recommended):** Use the preset buttons:
   - Click **"Local Dev"** for local development
   - Click **"Production"** for the deployed app
4. **Manual Setup:** Enter URLs manually:
   - **API URL** (backend):
     - Local: `http://localhost:3001/api`
     - Production: `https://attack-on-titan-backend.onrender.com/api`
   - **Frontend URL** (web app):
     - Local: `http://localhost:5173`
     - Production: `https://dreamduo.netlify.app`
5. Click **Save**

#### Environment URLs

| Environment | API URL | Frontend URL |
|-------------|---------|--------------|
| Local Dev | `http://localhost:3001/api` | `http://localhost:5173` |
| Production | `https://attack-on-titan-backend.onrender.com/api` | `https://dreamduo.netlify.app` |

## Usage

### Prerequisites

You must be logged into DreamDuo in the same Chrome browser. The extension detects your session automatically.

### Starting a Timer

1. Click the extension icon to open the popup
2. If prompted to log in, click "Open DreamDuo" and sign in
3. Search or browse your tasks for today
4. Click the play button next to a task to start tracking
5. The current tab URL is captured as context (one-time, on start only)

### Pausing a Timer

1. Click **Pause** to temporarily stop the timer
2. The paused task is remembered — you'll see a "Paused" banner
3. Click **Resume** to continue tracking (starts a new session for the same task)

### Stopping a Timer

1. Click **Stop** to finalize the session
2. The time is saved to the database immediately
3. View aggregated stats at the bottom of the popup or on the Dashboard

### Viewing Stats

The popup shows:
- **Today**: Total time tracked today
- **This Week**: Total time tracked this week

For detailed statistics, click **Open Dashboard** to view the full dashboard.

## Authentication

The extension uses a dual-auth approach:

1. On first open, it tries cookie-based authentication (if you're logged in on the web)
2. If cookies work, it exchanges the session for a **Bearer token** via `GET /api/auth/extension-token`
3. The token is stored in `chrome.storage.local` and used for all API calls
4. This avoids `SameSite` cookie restrictions that would otherwise block cross-origin requests from the extension in development mode

## Requirements

- Chrome browser (version 88 or later for Manifest V3)
- DreamDuo account (must be logged in via the web app)
- DreamDuo server running (local or deployed)

## Troubleshooting

### "Please log in" message
- Make sure you're logged into DreamDuo in the same browser
- Try clicking "Open DreamDuo", logging in, then reopening the extension
- Check that the API URL is correct in settings
- **If switching environments:** Log into the web app for that environment first

### Timer not syncing
- Check that the API URL is correct in settings
- Verify the DreamDuo server is running
- Look for the yellow sync indicator dot — it means requests are queued
- Check the browser console for errors (right-click extension popup > Inspect)

### Badge not updating
- The badge updates every minute when a timer is running
- Close and reopen the extension popup to refresh

### Switching between Local and Production
1. Open settings (gear icon)
2. Click the appropriate preset button (**Local Dev** or **Production**)
3. Click **Save**
4. Open the web app for that environment and log in
5. Reopen the extension — it will detect your session automatically

**Note:** Each environment has separate user accounts and data. Logging into production does not affect local development data.

## File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration (MV3)
├── README.md                  # This file
├── popup/
│   ├── popup.html             # Popup UI
│   ├── popup.css              # Styles (CSS variables for theming)
│   └── popup.js               # Popup logic (timer, search, auth, theme, settings)
├── background/
│   └── service-worker.js      # Badge updates, notifications, timer state
├── utils/
│   ├── api.js                 # API client (Bearer auth, offline queue, chrome.storage)
│   └── themePresets.js        # Theme definitions matching main app presets
└── icons/
    ├── icon16.svg             # Source icon (vector)
    ├── icon16.png             # Toolbar icon (generated from SVG)
    ├── icon48.png             # Extensions page icon (generated from SVG)
    └── icon128.png            # Notifications & Chrome Web Store icon (generated from SVG)
```

### Regenerating Icons

If you modify `icon16.svg`, regenerate the PNG files:

```bash
cd chrome-extension/icons
rsvg-convert -w 16 -h 16 icon16.svg -o icon16.png
rsvg-convert -w 48 -h 48 icon16.svg -o icon48.png
rsvg-convert -w 128 -h 128 icon16.svg -o icon128.png
```

Requires `librsvg` (`brew install librsvg` on macOS).

## Theme Synchronization

The extension automatically syncs with your selected theme from the DreamDuo web app:

1. When the popup opens, it fetches your theme preference from `/api/user/theme`
2. If you've selected a preset theme (default, AOT, high-contrast, etc.), those colors are applied
3. If you've customized colors, those are applied instead
4. All UI elements (backgrounds, text, buttons, badges) update to match

**Supported themes:**
- Default (blue-purple dark)
- Attack on Titan (brown/amber)
- High Contrast (WCAG AAA)
- Deuteranopia Safe (blue/orange)
- Protanopia Safe (purple/teal)
- Tritanopia Safe (red/pink)
- Low Vision (large contrast)
- Dyslexia-Friendly (light, soft colors)

## Local Storage Keys

The extension uses `chrome.storage.local` for persistent state:

| Key | Description |
|-----|-------------|
| `dreamduo_api_url` | Backend API URL (e.g., `http://localhost:3001/api`) |
| `dreamduo_frontend_url` | Frontend app URL (e.g., `https://dreamduo.netlify.app`) |
| `dreamduo_token` | JWT Bearer token for API authentication |
| `paused_task` | `{ taskId, taskName }` — Remembers paused task for resume |
| `pending_sync` | Array of queued API requests (offline resilience) |

To inspect storage in DevTools: right-click the extension popup → Inspect → Application → Storage → Local Storage.

## Privacy

This extension:
- Only communicates with your DreamDuo server
- Stores minimal data locally (API URL, frontend URL, auth token, paused task state, offline queue)
- Captures the active tab URL **once** on timer start (not continuously)
- Does not track browsing activity or monitor tabs in the background
- Requires login to your DreamDuo account
