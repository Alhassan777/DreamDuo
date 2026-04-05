/**
 * DreamDuo Chrome Extension Popup
 */

import {
  auth, tasks, time, theme,
  formatDuration, formatDurationShort,
  getApiUrl, setApiUrl,
  getFrontendUrl, setFrontendUrl,
  getPendingSync, storageGet, storageSet, storageRemove,
} from '../utils/api.js';
import { getThemeById, applyTheme } from '../utils/themePresets.js';

// ── DOM refs ───────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const authSection        = $('authSection');
const mainSection        = $('mainSection');
const settingsSection    = $('settingsSection');
const activeTimerSection = $('activeTimerSection');
const pausedTaskSection  = $('pausedTaskSection');
const taskSelectionSection = $('taskSelectionSection');
const taskList           = $('taskList');
const taskSearch         = $('taskSearch');
const activeTaskName     = $('activeTaskName');
const pausedTaskName     = $('pausedTaskName');
const timerDisplay       = $('timerDisplay');
const pauseTimerBtn      = $('pauseTimerBtn');
const stopTimerBtn       = $('stopTimerBtn');
const resumeTimerBtn     = $('resumeTimerBtn');
const dismissPausedBtn   = $('dismissPausedBtn');
const settingsBtn        = $('settingsBtn');
const loginLink          = $('loginLink');
const dashboardLink      = $('dashboardLink');
const apiUrlInput        = $('apiUrlInput');
const frontendUrlInput   = $('frontendUrlInput');
const presetLocalBtn     = $('presetLocalBtn');
const presetProdBtn      = $('presetProdBtn');
const saveSettingsBtn    = $('saveSettingsBtn');
const cancelSettingsBtn  = $('cancelSettingsBtn');
const todayTime          = $('todayTime');
const weekTime           = $('weekTime');
const syncIndicator      = $('syncIndicator');

// URL presets
const URL_PRESETS = {
  local: {
    api: 'http://localhost:3001/api',
    frontend: 'http://localhost:5173'
  },
  production: {
    api: 'https://attack-on-titan-backend.onrender.com/api',
    frontend: 'https://dreamduo.netlify.app'
  }
};

// ── State ──────────────────────────────────────────────────────────────────

let currentUser = null;
let activeTimer = null;
let timerInterval = null;
let allTasks = [];
let taskTimeMap = new Map();

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  await updateSyncIndicator();
  await checkAuth();
}

function setupEventListeners() {
  settingsBtn.addEventListener('click', showSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', hideSettings);
  presetLocalBtn.addEventListener('click', () => applyPreset('local'));
  presetProdBtn.addEventListener('click', () => applyPreset('production'));

  pauseTimerBtn.addEventListener('click', handlePauseTimer);
  stopTimerBtn.addEventListener('click', handleStopTimer);
  resumeTimerBtn.addEventListener('click', handleResumeTimer);
  dismissPausedBtn.addEventListener('click', handleDismissPaused);

  taskSearch.addEventListener('input', debounce(handleSearch, 300));

  loginLink.addEventListener('click', openDreamDuo);
  dashboardLink.addEventListener('click', openDashboard);
}

function applyPreset(presetName) {
  const preset = URL_PRESETS[presetName];
  if (preset) {
    apiUrlInput.value = preset.api;
    frontendUrlInput.value = preset.frontend;
    showToast(`Applied ${presetName} preset`, 'success');
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────

async function checkAuth() {
  try {
    const result = await auth.checkAuth();
    if (result.authenticated) {
      currentUser = result.user;
      showMainSection();
      await loadData();
    } else {
      showAuthSection();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showAuthSection();
  }
}

// ── Section visibility ─────────────────────────────────────────────────────

function showAuthSection() {
  authSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  settingsSection.classList.add('hidden');
}

function showMainSection() {
  authSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  settingsSection.classList.add('hidden');
}

async function showSettings() {
  authSection.classList.add('hidden');
  mainSection.classList.add('hidden');
  settingsSection.classList.remove('hidden');
  apiUrlInput.value = await getApiUrl();
  frontendUrlInput.value = await getFrontendUrl();
}

function hideSettings() {
  currentUser ? showMainSection() : showAuthSection();
}

async function saveSettings() {
  const apiUrl = apiUrlInput.value.trim();
  const frontendUrl = frontendUrlInput.value.trim();
  
  if (apiUrl) {
    await setApiUrl(apiUrl);
  }
  if (frontendUrl) {
    await setFrontendUrl(frontendUrl);
  }
  
  showToast('Settings saved', 'success');
  hideSettings();
  checkAuth();
}

// ── Data loading ───────────────────────────────────────────────────────────

async function loadData() {
  await Promise.all([
    loadTheme(),
    loadActiveTimer(),
    loadPausedTask(),
    loadStats(),
  ]);
  await loadTasks();
}

async function loadTheme() {
  try {
    const prefs = await theme.getThemePreferences();
    if (prefs.presetId) {
      const themeColors = getThemeById(prefs.presetId);
      applyTheme(themeColors);
    } else if (prefs.colors) {
      applyTheme({
        primary: prefs.colors.primary || '#646cff',
        primaryHover: prefs.colors.secondary || '#535bf2',
        secondary: prefs.colors.accent || '#61dafb',
        background: prefs.colors.background || '#242424',
        surface: prefs.colors.surface || '#1a1a1a',
        cardBackground: prefs.colors.cardBackground || '#2a2a2a',
        text: prefs.colors.text || '#ffffff',
        textSecondary: prefs.colors.textSecondary || 'rgba(255, 255, 255, 0.87)',
        textMuted: 'rgba(255, 255, 255, 0.6)',
        border: prefs.colors.border || '#404040',
        success: prefs.colors.success || '#4ade80',
        warning: prefs.colors.warning || '#fbbf24',
        danger: prefs.colors.error || '#ef4444',
        dangerHover: prefs.colors.buttonDangerHover || '#dc2626',
      });
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
}

async function loadTasks() {
  taskList.innerHTML = '<div class="loading">Loading tasks...</div>';
  try {
    const result = await tasks.getTasks();
    allTasks = flattenTasks(result);
    renderTasks(allTasks);
  } catch (error) {
    console.error('Failed to load tasks:', error);
    taskList.innerHTML = '<div class="empty-state">Failed to load tasks</div>';
  }
}

function flattenTasks(taskTree, depth = 0) {
  let result = [];
  for (const task of taskTree) {
    result.push({ ...task, depth });
    if (task.subtasks && task.subtasks.length > 0) {
      result = result.concat(flattenTasks(task.subtasks, depth + 1));
    }
  }
  return result;
}

function renderTasks(taskArray) {
  if (taskArray.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
        <p>No tasks for today</p>
      </div>`;
    return;
  }

  taskList.innerHTML = taskArray.map(createTaskItem).join('');

  taskList.querySelectorAll('.start-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStartTimer(parseInt(btn.dataset.taskId)));
  });
}

function createTaskItem(task) {
  const indent = task.depth * 16;
  const priorityClass = task.priority ? `priority-${task.priority.level || task.priority}` : '';
  const trackedSeconds = taskTimeMap.get(task.id) || 0;
  const timeBadge = trackedSeconds > 0
    ? `<span class="task-time-badge">${formatDurationShort(trackedSeconds)}</span>`
    : '';

  return `
    <div class="task-item" style="padding-left: ${12 + indent}px">
      <div class="task-info">
        <div class="task-item-name">
          ${task.depth > 0 ? '&#8627; ' : ''}${escapeHtml(task.name)}
        </div>
        <div class="task-item-meta">
          ${task.priority ? `<span class="priority-dot ${priorityClass}"></span>` : ''}
          ${task.category ? `<span class="category-badge">${escapeHtml(task.category.name || '')}</span>` : ''}
          ${timeBadge}
        </div>
      </div>
      <button class="start-btn" data-task-id="${task.id}" title="Start timer">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </button>
    </div>`;
}

// ── Timer: active ──────────────────────────────────────────────────────────

async function loadActiveTimer() {
  try {
    const result = await time.getActiveTimer();
    if (result.data) {
      activeTimer = result.data;
      showActiveTimer();
      startTimerDisplay();
    } else {
      activeTimer = null;
      hideActiveTimer();
    }
  } catch (error) {
    console.error('Failed to load active timer:', error);
  }
}

function showActiveTimer() {
  activeTimerSection.classList.remove('hidden');
  taskSelectionSection.classList.add('hidden');
  pausedTaskSection.classList.add('hidden');
  activeTaskName.textContent = activeTimer.task_name || 'Unknown task';
}

function hideActiveTimer() {
  activeTimerSection.classList.add('hidden');
  taskSelectionSection.classList.remove('hidden');
  stopTimerInterval();
}

function startTimerDisplay() {
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (!activeTimer) return;
  const startTime = new Date(activeTimer.start_time);
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
  timerDisplay.textContent = formatDuration(elapsed);

  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', elapsed });
}

// ── Timer: start / pause / stop / resume ───────────────────────────────────

async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url || null;
  } catch {
    return null;
  }
}

async function handleStartTimer(taskId) {
  try {
    const activeUrl = await getCurrentTabUrl();
    const result = await time.startTimer(taskId, { activeUrl });

    if (result.success) {
      activeTimer = result.data;
      // Clear any paused state for this task since we started fresh
      await storageRemove(['paused_task']);
      showActiveTimer();
      startTimerDisplay();
      showToast('Timer started', 'success');

      chrome.runtime.sendMessage({ type: 'TIMER_STARTED', timer: activeTimer });
      loadStats();
    }
  } catch (error) {
    console.error('Failed to start timer:', error);
    showToast(error.message || 'Failed to start timer', 'error');
  }
}

async function handlePauseTimer() {
  try {
    const result = await time.stopTimer();

    if (result.success) {
      const duration = result.data.duration_seconds;
      const pausedTask = {
        taskId: activeTimer.task_id,
        taskName: activeTimer.task_name,
      };
      await storageSet({ paused_task: pausedTask });

      activeTimer = null;
      hideActiveTimer();
      showPausedBanner(pausedTask);
      showToast(`Paused after ${formatDurationShort(duration)}`, 'success');

      chrome.runtime.sendMessage({ type: 'TIMER_PAUSED', pausedTask });
      loadStats();
    }
  } catch (error) {
    console.error('Failed to pause timer:', error);
    showToast(error.message || 'Failed to pause', 'error');
  }
}

async function handleStopTimer() {
  try {
    const result = await time.stopTimer();

    if (result.success) {
      const duration = result.data.duration_seconds;
      activeTimer = null;
      await storageRemove(['paused_task']);
      hideActiveTimer();
      hidePausedBanner();
      showToast(`Timer stopped: ${formatDurationShort(duration)}`, 'success');

      chrome.runtime.sendMessage({ type: 'TIMER_STOPPED' });
      loadStats();
    }
  } catch (error) {
    console.error('Failed to stop timer:', error);
    showToast(error.message || 'Failed to stop timer', 'error');
  }
}

async function handleResumeTimer() {
  const { paused_task } = await storageGet(['paused_task']);
  if (!paused_task) return;

  try {
    const activeUrl = await getCurrentTabUrl();
    const result = await time.startTimer(paused_task.taskId, { activeUrl });

    if (result.success) {
      activeTimer = result.data;
      await storageRemove(['paused_task']);
      hidePausedBanner();
      showActiveTimer();
      startTimerDisplay();
      showToast('Timer resumed', 'success');

      chrome.runtime.sendMessage({ type: 'TIMER_STARTED', timer: activeTimer });
      loadStats();
    }
  } catch (error) {
    console.error('Failed to resume timer:', error);
    showToast(error.message || 'Failed to resume', 'error');
  }
}

async function handleDismissPaused() {
  await storageRemove(['paused_task']);
  hidePausedBanner();
}

// ── Paused task banner ─────────────────────────────────────────────────────

async function loadPausedTask() {
  const { paused_task } = await storageGet(['paused_task']);
  if (paused_task && !activeTimer) {
    showPausedBanner(paused_task);
  }
}

function showPausedBanner(pausedTask) {
  pausedTaskSection.classList.remove('hidden');
  pausedTaskName.textContent = pausedTask.taskName || 'Unknown task';
}

function hidePausedBanner() {
  pausedTaskSection.classList.add('hidden');
}

// ── Stats ──────────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const result = await time.getStats();
    if (result.success) {
      todayTime.textContent = formatDurationShort(result.data.today_seconds);
      const weekTotal = result.data.weekly_stats.reduce((sum, day) => sum + day.total_seconds, 0);
      weekTime.textContent = formatDurationShort(weekTotal);

      taskTimeMap = new Map();
      if (result.data.tasks) {
        for (const t of result.data.tasks) {
          taskTimeMap.set(t.task_id, t.total_seconds);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// ── Search ─────────────────────────────────────────────────────────────────

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderTasks(allTasks);
    return;
  }
  const filtered = allTasks.filter((task) =>
    task.name.toLowerCase().includes(query) ||
    (task.category && task.category.name && task.category.name.toLowerCase().includes(query))
  );
  renderTasks(filtered);
}

// ── Background messages ────────────────────────────────────────────────────
// Reserved for future service worker → popup push events

// ── Navigation ─────────────────────────────────────────────────────────────

async function openDreamDuo(e) {
  e.preventDefault();
  const frontendUrl = await getFrontendUrl();
  chrome.tabs.create({ url: frontendUrl });
}

async function openDashboard(e) {
  e.preventDefault();
  const frontendUrl = await getFrontendUrl();
  chrome.tabs.create({ url: `${frontendUrl}/dashboard` });
}

// ── Sync indicator ─────────────────────────────────────────────────────────

async function updateSyncIndicator() {
  const queue = await getPendingSync();
  if (queue.length > 0) {
    syncIndicator.classList.remove('hidden');
    syncIndicator.title = `${queue.length} pending sync item(s)`;
  } else {
    syncIndicator.classList.add('hidden');
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
