/**
 * API utilities for DreamDuo Chrome Extension
 *
 * All persistent state uses chrome.storage.local (works in both popup and
 * service worker contexts, unlike localStorage).
 */

const DEFAULT_API_URL = 'https://attack-on-titan-backend.onrender.com/api';
const DEFAULT_FRONTEND_URL = 'https://dreamduo.netlify.app';

// ── Storage helpers (async, chrome.storage.local) ──────────────────────────

const storageGet = (keys) =>
  new Promise((resolve) => chrome.storage.local.get(keys, resolve));

const storageSet = (items) =>
  new Promise((resolve) => chrome.storage.local.set(items, resolve));

const storageRemove = (keys) =>
  new Promise((resolve) => chrome.storage.local.remove(keys, resolve));

const getApiUrl = async () => {
  const { dreamduo_api_url } = await storageGet(['dreamduo_api_url']);
  return dreamduo_api_url || DEFAULT_API_URL;
};

const setApiUrl = async (url) => {
  await storageSet({ dreamduo_api_url: url });
};

const getFrontendUrl = async () => {
  const { dreamduo_frontend_url } = await storageGet(['dreamduo_frontend_url']);
  return dreamduo_frontend_url || DEFAULT_FRONTEND_URL;
};

const setFrontendUrl = async (url) => {
  await storageSet({ dreamduo_frontend_url: url });
};

const getStoredToken = async () => {
  const { dreamduo_token } = await storageGet(['dreamduo_token']);
  return dreamduo_token || null;
};

const setStoredToken = async (token) => {
  await storageSet({ dreamduo_token: token });
};

const clearStoredToken = async () => {
  await storageRemove(['dreamduo_token']);
};

// ── Offline retry queue ────────────────────────────────────────────────────

const getPendingSync = async () => {
  const { pending_sync } = await storageGet(['pending_sync']);
  return pending_sync || [];
};

const setPendingSync = async (queue) => {
  await storageSet({ pending_sync: queue });
};

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
    try {
      await apiRequest(item.endpoint, item.options, { skipQueue: true });
    } catch {
      // 4xx errors are not retryable — drop them; keep network errors
      remaining.push(item);
    }
  }
  await setPendingSync(remaining);
};

// ── Core request helper ────────────────────────────────────────────────────

/**
 * Make an authenticated API request.
 * Uses Bearer token from chrome.storage if available, with cookie fallback.
 * On network failure of mutation requests, enqueues for later retry.
 */
const apiRequest = async (endpoint, options = {}, { skipQueue = false } = {}) => {
  const baseUrl = await getApiUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // Attach Bearer token if we have one
  const token = await getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    credentials: 'include',
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    // Network-level failure (offline, DNS, etc.)
    const isMutation = options.method && options.method !== 'GET';
    if (isMutation && !skipQueue) {
      await enqueueRequest(endpoint, options);
    }
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearStoredToken();
      throw new Error('UNAUTHORIZED');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  // Successful request — try flushing any queued items in the background
  if (!skipQueue) {
    flushPendingSync().catch(() => {});
  }

  return response.json();
};

// ── Auth API ───────────────────────────────────────────────────────────────

const auth = {
  /**
   * Check authentication.  Tries cookie-based profile fetch first.
   * If that works, also exchanges for a Bearer token so future requests
   * are reliable regardless of SameSite cookie restrictions.
   */
  checkAuth: async () => {
    // First try with whatever auth we currently have (cookie or stored token)
    try {
      const response = await apiRequest('/user/profile');
      // Authenticated — try to exchange for a Bearer token if we don't have one
      const existingToken = await getStoredToken();
      if (!existingToken) {
        try {
          const tokenResponse = await apiRequest('/auth/extension-token');
          if (tokenResponse.token) {
            await setStoredToken(tokenResponse.token);
          }
        } catch {
          // Token exchange failed — continue with cookie auth
        }
      }
      return { authenticated: true, user: response.user };
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') {
        return { authenticated: false, user: null };
      }
      throw error;
    }
  },

  /**
   * Force a fresh token exchange (e.g. after web login detected).
   */
  refreshToken: async () => {
    try {
      const tokenResponse = await apiRequest('/auth/extension-token');
      if (tokenResponse.token) {
        await setStoredToken(tokenResponse.token);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  logout: async () => {
    await clearStoredToken();
    await storageRemove(['paused_task']);
  },
};

// ── Tasks API ──────────────────────────────────────────────────────────────

const tasks = {
  getTasks: async (date = null) => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ client_today: today });
    if (date) params.append('date', date);
    return apiRequest(`/tasks/?${params.toString()}`);
  },

  searchTasks: async (query = '', timeScope = 'daily') => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      time_scope: timeScope,
      client_today: today,
      anchor_date: today,
    });
    if (query) params.append('search_query', query);
    return apiRequest(`/tasks/search?${params.toString()}`);
  },
};

// ── Time Tracking API ──────────────────────────────────────────────────────

// ── Theme API ───────────────────────────────────────────────────────────────

const theme = {
  getThemePreferences: async () => {
    try {
      const response = await apiRequest('/user/theme');
      return response.theme || {};
    } catch (error) {
      console.error('Error fetching theme preferences:', error);
      return {};
    }
  },
};

// ── Time Tracking API ──────────────────────────────────────────────────────

const time = {
  startTimer: async (taskId, { notes = null, source = 'chrome_extension', activeUrl = null } = {}) => {
    const body = { task_id: taskId, source };
    if (notes) body.notes = notes;
    if (activeUrl) body.active_url = activeUrl;

    return apiRequest('/time/start', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  stopTimer: async (notes = null) => {
    const body = notes ? { notes } : {};
    return apiRequest('/time/stop', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getActiveTimer: async () => {
    return apiRequest('/time/active');
  },

  getLogs: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.taskId) params.append('task_id', options.taskId);
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    return apiRequest(`/time/logs?${params.toString()}`);
  },

  deleteLog: async (logId) => {
    return apiRequest(`/time/logs/${logId}`, { method: 'DELETE' });
  },

  getStats: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiRequest(`/time/stats?${params.toString()}`);
  },

  getTaskTotal: async (taskId) => {
    return apiRequest(`/time/task/${taskId}/total`);
  },
};

// ── Formatting helpers ─────────────────────────────────────────────────────

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

// ── Exports ────────────────────────────────────────────────────────────────

export {
  getApiUrl,
  setApiUrl,
  getFrontendUrl,
  setFrontendUrl,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getPendingSync,
  flushPendingSync,
  storageGet,
  storageSet,
  storageRemove,
  apiRequest,
  auth,
  tasks,
  time,
  theme,
  formatDuration,
  formatDurationShort,
};
