/**
 * DreamDuo Chrome Extension — Popup (self-contained, no ES module imports)
 *
 * api.js and themePresets.js utilities are inlined here so the popup loads
 * as a plain <script> tag, bypassing Chrome's cross-directory module
 * resolution quirks in MV3 popup pages.
 */

// ─────────────────────────────────────────────────────────────────────────────
// API UTILITIES  (inlined from utils/api.js @ 7347d28)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_API_URL      = 'http://localhost:3001/api';
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

// ── Storage helpers ───────────────────────────────────────────────────────────

const storageGet    = (keys)  => new Promise((resolve) => chrome.storage.local.get(keys, resolve));
const storageSet    = (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve));
const storageRemove = (keys)  => new Promise((resolve) => chrome.storage.local.remove(keys, resolve));

const getApiUrl = async () => {
  const { dreamduo_api_url } = await storageGet(['dreamduo_api_url']);
  return dreamduo_api_url || DEFAULT_API_URL;
};
const setApiUrl      = async (url) => storageSet({ dreamduo_api_url: url });

const getFrontendUrl = async () => {
  const { dreamduo_frontend_url } = await storageGet(['dreamduo_frontend_url']);
  return dreamduo_frontend_url || DEFAULT_FRONTEND_URL;
};
const setFrontendUrl = async (url) => storageSet({ dreamduo_frontend_url: url });

const getStoredToken   = async () => { const { dreamduo_token } = await storageGet(['dreamduo_token']); return dreamduo_token || null; };
const setStoredToken   = async (token) => storageSet({ dreamduo_token: token });
const clearStoredToken = async () => storageRemove(['dreamduo_token']);

// ── Offline retry queue ───────────────────────────────────────────────────────

const getPendingSync = async () => { const { pending_sync } = await storageGet(['pending_sync']); return pending_sync || []; };
const setPendingSync = async (queue) => storageSet({ pending_sync: queue });

const enqueueRequest = async (endpoint, options) => {
  const queue = await getPendingSync();
  queue.push({ endpoint, options, timestamp: Date.now() });
  await setPendingSync(queue);
};

const flushPendingSync = async () => {
  const queue = await getPendingSync();
  if (queue.length === 0) return;
  const remaining = [];
  for (const item of queue) {
    try { await apiRequest(item.endpoint, item.options, { skipQueue: true }); }
    catch { remaining.push(item); }
  }
  await setPendingSync(remaining);
};

// ── Core request helper ───────────────────────────────────────────────────────

const apiRequest = async (endpoint, options = {}, { skipQueue = false } = {}) => {
  const baseUrl = await getApiUrl();
  const url     = `${baseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const token = await getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchOptions = { credentials: 'include', ...options, headers };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    const isMutation = options.method && options.method !== 'GET';
    if (isMutation && !skipQueue) await enqueueRequest(endpoint, options);
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    if (response.status === 401) { await clearStoredToken(); throw new Error('UNAUTHORIZED'); }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (!skipQueue) flushPendingSync().catch(() => {});
  return response.json();
};

// ── Auth API ──────────────────────────────────────────────────────────────────

const auth = {
  checkAuth: async () => {
    try {
      const response = await apiRequest('/user/profile');
      const existingToken = await getStoredToken();
      if (!existingToken) {
        try {
          const tokenResponse = await apiRequest('/auth/extension-token');
          if (tokenResponse.token) await setStoredToken(tokenResponse.token);
        } catch { /* continue with cookie auth */ }
      }
      return { authenticated: true, user: response.user };
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') return { authenticated: false, user: null };
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const tokenResponse = await apiRequest('/auth/extension-token');
      if (tokenResponse.token) { await setStoredToken(tokenResponse.token); return true; }
    } catch { /* ignore */ }
    return false;
  },

  logout: async () => {
    await clearStoredToken();
    await storageRemove(['paused_task']);
  },
};

// ── Tasks API ─────────────────────────────────────────────────────────────────

const tasks = {
  getTasks: async (date = null) => {
    const today  = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ client_today: today });
    if (date) params.append('date', date);
    return apiRequest(`/tasks/?${params.toString()}`);
  },
  searchTasks: async (query = '', timeScope = 'daily') => {
    const today  = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ time_scope: timeScope, client_today: today, anchor_date: today });
    if (query) params.append('search_query', query);
    return apiRequest(`/tasks/search?${params.toString()}`);
  },
};

// ── Theme API ─────────────────────────────────────────────────────────────────

const theme = {
  getThemePreferences: async () => {
    try { const response = await apiRequest('/user/theme'); return response.theme || {}; }
    catch (error) { console.error('Error fetching theme preferences:', error); return {}; }
  },
};

// ── Time API ──────────────────────────────────────────────────────────────────

const time = {
  startTimer: async (taskId, { notes = null, source = 'chrome_extension', activeUrl = null } = {}) => {
    const body = { task_id: taskId, source };
    if (notes)     body.notes      = notes;
    if (activeUrl) body.active_url = activeUrl;
    return apiRequest('/time/start', { method: 'POST', body: JSON.stringify(body) });
  },
  stopTimer: async (notes = null) => {
    const body = notes ? { notes } : {};
    return apiRequest('/time/stop', { method: 'POST', body: JSON.stringify(body) });
  },
  getActiveTimer: async () => apiRequest('/time/active'),
  getLogs: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.taskId)    params.append('task_id',    options.taskId);
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate)   params.append('end_date',   options.endDate);
    if (options.limit)     params.append('limit',      options.limit);
    if (options.offset)    params.append('offset',     options.offset);
    return apiRequest(`/time/logs?${params.toString()}`);
  },
  deleteLog:    async (logId)                => apiRequest(`/time/logs/${logId}`, { method: 'DELETE' }),
  getStats:     async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate)   params.append('end_date',   endDate);
    return apiRequest(`/time/stats?${params.toString()}`);
  },
  getTaskTotal: async (taskId) => apiRequest(`/time/task/${taskId}/total`),
};

// ── Formatting helpers ────────────────────────────────────────────────────────

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatDurationShort = (seconds) => {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME PRESETS  (inlined from utils/themePresets.js @ 7347d28)
// ─────────────────────────────────────────────────────────────────────────────

const themePresets = {
  default: {
    primary: '#646cff', primaryHover: '#535bf2', secondary: '#61dafb',
    background: '#242424', surface: '#1a1a1a', cardBackground: '#2a2a2a',
    text: '#ffffff', textSecondary: 'rgba(255, 255, 255, 0.87)', textMuted: 'rgba(255, 255, 255, 0.6)',
    border: '#404040', success: '#4ade80', warning: '#fbbf24', danger: '#ef4444', dangerHover: '#dc2626',
  },
  aot: {
    primary: '#8b4513', primaryHover: '#a0522d', secondary: '#b8860b',
    background: '#1a1410', surface: '#2d2416', cardBackground: '#3a2f1f',
    text: '#f5deb3', textSecondary: '#d4af88', textMuted: 'rgba(245, 222, 179, 0.6)',
    border: '#5a4a3a', success: '#6b8e23', warning: '#cd853f', danger: '#8b0000', dangerHover: '#a50000',
  },
  'high-contrast': {
    primary: '#ffffff', primaryHover: '#e0e0e0', secondary: '#00ffff',
    background: '#000000', surface: '#000000', cardBackground: '#1a1a1a',
    text: '#ffffff', textSecondary: '#ffffff', textMuted: '#ffffff',
    border: '#ffffff', success: '#00ff00', warning: '#ffff00', danger: '#ff0000', dangerHover: '#e00000',
  },
  deuteranopia: {
    primary: '#0066cc', primaryHover: '#0052a3', secondary: '#ffa500',
    background: '#1a1a2e', surface: '#16213e', cardBackground: '#0f3460',
    text: '#e8e8e8', textSecondary: '#c4c4c4', textMuted: 'rgba(232, 232, 232, 0.6)',
    border: '#4a5568', success: '#0099ff', warning: '#ffcc00', danger: '#ff6600', dangerHover: '#ff4500',
  },
  protanopia: {
    primary: '#8b5cf6', primaryHover: '#7c3aed', secondary: '#06b6d4',
    background: '#0f172a', surface: '#1e293b', cardBackground: '#334155',
    text: '#f1f5f9', textSecondary: '#cbd5e1', textMuted: 'rgba(241, 245, 249, 0.6)',
    border: '#475569', success: '#14b8a6', warning: '#f59e0b', danger: '#7c3aed', dangerHover: '#6d28d9',
  },
  tritanopia: {
    primary: '#dc2626', primaryHover: '#b91c1c', secondary: '#ec4899',
    background: '#1a1a1a', surface: '#2d2d2d', cardBackground: '#404040',
    text: '#fafafa', textSecondary: '#d4d4d4', textMuted: 'rgba(250, 250, 250, 0.6)',
    border: '#525252', success: '#22c55e', warning: '#f97316', danger: '#991b1b', dangerHover: '#7f1d1d',
  },
  'low-vision': {
    primary: '#ffffff', primaryHover: '#d0d0d0', secondary: '#ffeb3b',
    background: '#000000', surface: '#1a1a1a', cardBackground: '#2a2a2a',
    text: '#ffffff', textSecondary: '#f0f0f0', textMuted: '#f0f0f0',
    border: '#ffffff', success: '#4caf50', warning: '#ff9800', danger: '#f44336', dangerHover: '#e53935',
  },
  dyslexia: {
    primary: '#5b9bd5', primaryHover: '#4a8fc4', secondary: '#70ad47',
    background: '#fafafa', surface: '#ffffff', cardBackground: '#f5f5f5',
    text: '#2c2c2c', textSecondary: '#5a5a5a', textMuted: 'rgba(44, 44, 44, 0.6)',
    border: '#d0d0d0', success: '#70ad47', warning: '#ffc000', danger: '#c55a11', dangerHover: '#a84b0e',
  },
};

const getThemeById = (id) => themePresets[id] || themePresets.default;

const applyTheme = (themeColors) => {
  const root = document.documentElement;
  root.style.setProperty('--primary',        themeColors.primary);
  root.style.setProperty('--primary-hover',  themeColors.primaryHover);
  root.style.setProperty('--secondary',      themeColors.secondary);
  root.style.setProperty('--bg-primary',     themeColors.background);
  root.style.setProperty('--bg-secondary',   themeColors.surface);
  root.style.setProperty('--bg-tertiary',    themeColors.cardBackground);
  root.style.setProperty('--text-primary',   themeColors.text);
  root.style.setProperty('--text-secondary', themeColors.textSecondary);
  root.style.setProperty('--text-muted',     themeColors.textMuted);
  root.style.setProperty('--border-color',   themeColors.border);
  root.style.setProperty('--success',        themeColors.success);
  root.style.setProperty('--warning',        themeColors.warning);
  root.style.setProperty('--danger',         themeColors.danger);
  root.style.setProperty('--danger-hover',   themeColors.dangerHover);
};

// ─────────────────────────────────────────────────────────────────────────────
// POPUP UI  (inlined from popup/popup.js @ 7347d28)
// ─────────────────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const authSection          = $('authSection');
const mainSection          = $('mainSection');
const settingsSection      = $('settingsSection');
const activeTimerSection   = $('activeTimerSection');
const pausedTaskSection    = $('pausedTaskSection');
const taskSelectionSection = $('taskSelectionSection');
const taskList             = $('taskList');
const taskSearch           = $('taskSearch');
const activeTaskName       = $('activeTaskName');
const pausedTaskName       = $('pausedTaskName');
const timerDisplay         = $('timerDisplay');
const pauseTimerBtn        = $('pauseTimerBtn');
const stopTimerBtn         = $('stopTimerBtn');
const resumeTimerBtn       = $('resumeTimerBtn');
const dismissPausedBtn     = $('dismissPausedBtn');
const settingsBtn          = $('settingsBtn');
const loginLink            = $('loginLink');
const dashboardLink        = $('dashboardLink');
const apiUrlInput          = $('apiUrlInput');
const frontendUrlInput     = $('frontendUrlInput');
const presetLocalBtn       = $('presetLocalBtn');
const presetProdBtn        = $('presetProdBtn');
const saveSettingsBtn      = $('saveSettingsBtn');
const cancelSettingsBtn    = $('cancelSettingsBtn');
const todayTime            = $('todayTime');
const weekTime             = $('weekTime');
const syncIndicator        = $('syncIndicator');

const URL_PRESETS = {
  local:      { api: 'http://localhost:3001/api',                            frontend: 'http://localhost:5173' },
  production: { api: 'https://attack-on-titan-backend.onrender.com/api',    frontend: 'https://dreamduo.netlify.app' },
};

let currentUser   = null;
let activeTimer   = null;
let timerInterval = null;
let allTasks      = [];
let taskTimeMap   = new Map();

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  await updateSyncIndicator();
  await checkAuth();
}

function setupEventListeners() {
  settingsBtn.addEventListener('click',      showSettings);
  saveSettingsBtn.addEventListener('click',  saveSettings);
  cancelSettingsBtn.addEventListener('click',hideSettings);
  presetLocalBtn.addEventListener('click',   () => applyPreset('local'));
  presetProdBtn.addEventListener('click',    () => applyPreset('production'));

  pauseTimerBtn.addEventListener('click',    handlePauseTimer);
  stopTimerBtn.addEventListener('click',     handleStopTimer);
  resumeTimerBtn.addEventListener('click',   handleResumeTimer);
  dismissPausedBtn.addEventListener('click', handleDismissPaused);

  taskSearch.addEventListener('input', debounce(handleSearch, 300));

  loginLink.addEventListener('click',    openDreamDuo);
  dashboardLink.addEventListener('click', openDashboard);
}

function applyPreset(presetName) {
  const preset = URL_PRESETS[presetName];
  if (preset) {
    apiUrlInput.value      = preset.api;
    frontendUrlInput.value = preset.frontend;
    showToast(`Applied ${presetName} preset`, 'success');
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Section visibility ────────────────────────────────────────────────────────

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
  apiUrlInput.value      = await getApiUrl();
  frontendUrlInput.value = await getFrontendUrl();
}

function hideSettings() { currentUser ? showMainSection() : showAuthSection(); }

async function saveSettings() {
  const apiUrl      = apiUrlInput.value.trim();
  const frontendUrl = frontendUrlInput.value.trim();
  if (apiUrl)      await setApiUrl(apiUrl);
  if (frontendUrl) await setFrontendUrl(frontendUrl);
  showToast('Settings saved', 'success');
  hideSettings();
  checkAuth();
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData() {
  await Promise.all([loadTheme(), loadActiveTimer(), loadPausedTask(), loadStats()]);
  await loadTasks();
}

async function loadTheme() {
  try {
    const prefs = await theme.getThemePreferences();
    if (prefs.presetId) {
      applyTheme(getThemeById(prefs.presetId));
    } else if (prefs.colors) {
      applyTheme({
        primary:        prefs.colors.primary        || '#646cff',
        primaryHover:   prefs.colors.secondary      || '#535bf2',
        secondary:      prefs.colors.accent         || '#61dafb',
        background:     prefs.colors.background     || '#242424',
        surface:        prefs.colors.surface        || '#1a1a1a',
        cardBackground: prefs.colors.cardBackground || '#2a2a2a',
        text:           prefs.colors.text           || '#ffffff',
        textSecondary:  prefs.colors.textSecondary  || 'rgba(255, 255, 255, 0.87)',
        textMuted:      'rgba(255, 255, 255, 0.6)',
        border:         prefs.colors.border         || '#404040',
        success:        prefs.colors.success        || '#4ade80',
        warning:        prefs.colors.warning        || '#fbbf24',
        danger:         prefs.colors.error          || '#ef4444',
        dangerHover:    prefs.colors.buttonDangerHover || '#dc2626',
      });
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
}

async function loadTasks() {
  taskList.innerHTML = '<div class="loading">Loading tasks...</div>';
  try {
    const today  = new Date().toISOString().split('T')[0];
    const result = await tasks.getTasks(today);
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
    if (task.subtasks && task.subtasks.length > 0)
      result = result.concat(flattenTasks(task.subtasks, depth + 1));
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
  const indent         = task.depth * 16;
  const priorityClass  = task.priority ? `priority-${task.priority.level || task.priority}` : '';
  const trackedSeconds = taskTimeMap.get(task.id) || 0;
  const timeBadge      = trackedSeconds > 0
    ? `<span class="task-time-badge">${formatDurationShort(trackedSeconds)}</span>` : '';
  return `
    <div class="task-item" style="padding-left: ${12 + indent}px">
      <div class="task-info">
        <div class="task-item-name">${task.depth > 0 ? '&#8627; ' : ''}${escapeHtml(task.name)}</div>
        <div class="task-item-meta">
          ${task.priority ? `<span class="priority-dot ${priorityClass}"></span>` : ''}
          ${task.category ? `<span class="category-badge">${escapeHtml(task.category.name || '')}</span>` : ''}
          ${timeBadge}
        </div>
      </div>
      <button class="start-btn" data-task-id="${task.id}" title="Start timer">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
    </div>`;
}

// ── Active timer ──────────────────────────────────────────────────────────────

async function loadActiveTimer() {
  try {
    const result = await time.getActiveTimer();
    if (result.data) { activeTimer = result.data; showActiveTimer(); startTimerDisplay(); }
    else             { activeTimer = null; hideActiveTimer(); }
  } catch (error) { console.error('Failed to load active timer:', error); }
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

function startTimerDisplay()  { updateTimerDisplay(); timerInterval = setInterval(updateTimerDisplay, 1000); }
function stopTimerInterval()  { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

function updateTimerDisplay() {
  if (!activeTimer) return;
  const elapsed = Math.floor((Date.now() - new Date(activeTimer.start_time).getTime()) / 1000);
  timerDisplay.textContent = formatDuration(elapsed);
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', elapsed });
}

// ── Timer controls ────────────────────────────────────────────────────────────

async function getCurrentTabUrl() {
  try { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); return tab?.url || null; }
  catch { return null; }
}

async function handleStartTimer(taskId) {
  try {
    const activeUrl = await getCurrentTabUrl();
    const result    = await time.startTimer(taskId, { activeUrl });
    if (result.success) {
      activeTimer = result.data;
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
      const pausedTask = { taskId: activeTimer.task_id, taskName: activeTimer.task_name };
      await storageSet({ paused_task: pausedTask });
      activeTimer = null;
      hideActiveTimer();
      showPausedBanner(pausedTask);
      showToast(`Paused after ${formatDurationShort(result.data.duration_seconds)}`, 'success');
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
      activeTimer = null;
      await storageRemove(['paused_task']);
      hideActiveTimer();
      hidePausedBanner();
      showToast(`Timer stopped: ${formatDurationShort(result.data.duration_seconds)}`, 'success');
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
    const result    = await time.startTimer(paused_task.taskId, { activeUrl });
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

// ── Paused task banner ────────────────────────────────────────────────────────

async function loadPausedTask() {
  const { paused_task } = await storageGet(['paused_task']);
  if (paused_task && !activeTimer) showPausedBanner(paused_task);
}

function showPausedBanner(pausedTask) {
  pausedTaskSection.classList.remove('hidden');
  pausedTaskName.textContent = pausedTask.taskName || 'Unknown task';
}

function hidePausedBanner() { pausedTaskSection.classList.add('hidden'); }

// ── Stats ─────────────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const result = await time.getStats();
    if (result.success) {
      todayTime.textContent = formatDurationShort(result.data.today_seconds);
      const weekTotal = result.data.weekly_stats.reduce((sum, day) => sum + day.total_seconds, 0);
      weekTime.textContent = formatDurationShort(weekTotal);
      taskTimeMap = new Map();
      if (result.data.tasks) {
        for (const t of result.data.tasks) taskTimeMap.set(t.task_id, t.total_seconds);
      }
    }
  } catch (error) { console.error('Failed to load stats:', error); }
}

// ── Search ────────────────────────────────────────────────────────────────────

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) { renderTasks(allTasks); return; }
  renderTasks(allTasks.filter((task) =>
    task.name.toLowerCase().includes(query) ||
    (task.category && task.category.name && task.category.name.toLowerCase().includes(query))
  ));
}

// ── Navigation ────────────────────────────────────────────────────────────────

async function openDreamDuo(e) {
  e.preventDefault();
  chrome.tabs.create({ url: await getFrontendUrl() });
}

async function openDashboard(e) {
  e.preventDefault();
  chrome.tabs.create({ url: `${await getFrontendUrl()}/dashboard` });
}

// ── Sync indicator ────────────────────────────────────────────────────────────

async function updateSyncIndicator() {
  const queue = await getPendingSync();
  if (queue.length > 0) {
    syncIndicator.classList.remove('hidden');
    syncIndicator.title = `${queue.length} pending sync item(s)`;
  } else {
    syncIndicator.classList.add('hidden');
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

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
  toast.className   = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
