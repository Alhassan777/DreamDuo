/**
 * DreamDuo Chrome Extension Background Service Worker
 * Manages timer state, badge updates, and pause awareness.
 */

let activeTimer = null;
const TIMER_ALARM = 'dreamduo-timer-update';

// ── Default URLs (overridden by chrome.storage values set via Settings panel) ──

const DEFAULT_API_URL      = 'http://localhost:3001/api';
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

// ── Storage helpers ────────────────────────────────────────────────────────

const storageGet = (keys) =>
  new Promise((resolve) => chrome.storage.local.get(keys, resolve));

const storageRemove = (keys) =>
  new Promise((resolve) => chrome.storage.local.remove(keys, resolve));

// ── Lifecycle ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  console.log('DreamDuo Time Tracker installed');
  chrome.action.setPopup({ popup: 'popup/popup.html' });
  clearBadge();

  // Seed default URLs only if nothing is saved yet
  const { dreamduo_api_url, dreamduo_frontend_url } = await storageGet([
    'dreamduo_api_url',
    'dreamduo_frontend_url',
  ]);

  const updates = {};
  if (!dreamduo_api_url)      updates.dreamduo_api_url      = DEFAULT_API_URL;
  if (!dreamduo_frontend_url) updates.dreamduo_frontend_url = DEFAULT_FRONTEND_URL;

  if (Object.keys(updates).length > 0) {
    await new Promise((resolve) => chrome.storage.local.set(updates, resolve));
    console.log('DreamDuo: URLs seeded with defaults', updates);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('DreamDuo Time Tracker started');
  chrome.action.setPopup({ popup: 'popup/popup.html' });
  checkActiveTimer();
});

self.addEventListener('activate', () => {
  // Run in background — do NOT use event.waitUntil() here.
  // waitUntil blocks service worker activation until the promise settles,
  // which on a cold Render backend can take 30–60 s and prevents the popup from opening.
  checkActiveTimer();
});

// ── Message handling ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'DREAMDUO_TOKEN':
      // Content script captured a login token from the web app — persist it
      if (message.token) {
        chrome.storage.local.set({ dreamduo_token: message.token }, () => {
          console.log('[DreamDuo SW] Token stored from web app login');
        });
        if (message.user) {
          chrome.storage.local.set({ dreamduo_user: message.user });
        }
      }
      break;
    case 'TIMER_STARTED':
      handleTimerStarted(message.timer);
      break;
    case 'TIMER_STOPPED':
      handleTimerStopped();
      break;
    case 'TIMER_PAUSED':
      handleTimerPaused(message.pausedTask);
      break;
    case 'UPDATE_BADGE':
      updateBadge(message.elapsed);
      break;
    case 'GET_ACTIVE_TIMER':
      sendResponse({ timer: activeTimer });
      return true;
  }
});

// ── Alarm: periodic badge refresh while timer is running ───────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TIMER_ALARM) {
    updateBadgeFromTimer();
  }
});

// ── Timer lifecycle handlers ───────────────────────────────────────────────

function handleTimerStarted(timer) {
  activeTimer = timer;

  chrome.alarms.create(TIMER_ALARM, { periodInMinutes: 1 });
  updateBadgeFromTimer();

  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: 'Timer Started',
    message: `Tracking time for: ${timer.task_name || 'Task'}`,
    silent: true,
  });
}

function handleTimerStopped() {
  const taskName = activeTimer?.task_name;
  activeTimer = null;

  chrome.alarms.clear(TIMER_ALARM);
  clearBadge();

  if (taskName) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Timer Stopped',
      message: `Stopped tracking: ${taskName}`,
      silent: true,
    });
  }
}

function handleTimerPaused(pausedTask) {
  const taskName = activeTimer?.task_name || pausedTask?.taskName;
  activeTimer = null;

  chrome.alarms.clear(TIMER_ALARM);
  setBadgePaused();

  if (taskName) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Timer Paused',
      message: `Paused: ${taskName}`,
      silent: true,
    });
  }
}

// ── Badge helpers ──────────────────────────────────────────────────────────

function updateBadgeFromTimer() {
  if (!activeTimer) return;
  const startTime = new Date(activeTimer.start_time);
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
  updateBadge(elapsed);
}

function updateBadge(elapsedSeconds) {
  const hours   = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);

  let badgeText;
  if (hours > 0)        badgeText = `${hours}h`;
  else if (minutes > 0) badgeText = `${minutes}m`;
  else                  badgeText = '\u2022'; // bullet

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
}

function setBadgePaused() {
  chrome.action.setBadgeText({ text: '||' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

// ── Startup: restore timer state from server ───────────────────────────────

async function checkActiveTimer() {
  try {
    const { dreamduo_api_url, dreamduo_token } = await storageGet([
      'dreamduo_api_url',
      'dreamduo_token',
    ]);
    const apiUrl = dreamduo_api_url || DEFAULT_API_URL;

    const headers = { 'Content-Type': 'application/json' };
    if (dreamduo_token) {
      headers['Authorization'] = `Bearer ${dreamduo_token}`;
    }

    const response = await fetch(`${apiUrl}/time/active`, {
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        activeTimer = result.data;
        chrome.alarms.create(TIMER_ALARM, { periodInMinutes: 1 });
        updateBadgeFromTimer();
        return;
      }
    }

    // No active timer — check for paused state
    const { paused_task } = await storageGet(['paused_task']);
    if (paused_task) {
      setBadgePaused();
    } else {
      clearBadge();
    }
  } catch (error) {
    console.error('Failed to check active timer:', error);
  }
}
