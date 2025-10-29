/**
 * localStorage utility for managing persisted user preferences
 * All keys are prefixed with 'aot-todo-' to avoid conflicts
 */

const STORAGE_PREFIX = 'aot-todo-';

// Storage keys
export const STORAGE_KEYS = {
  VIEW_MODE: `${STORAGE_PREFIX}view-mode`,
  TIME_SCOPE: `${STORAGE_PREFIX}time-scope`,
  ANCHOR_DATE: `${STORAGE_PREFIX}anchor-date`,
  FILTERS: `${STORAGE_PREFIX}filters`,
  THEME_PREFERENCES: `${STORAGE_PREFIX}theme-preferences`,
} as const;

/**
 * Safely get item from localStorage
 * Returns null if item doesn't exist or parsing fails
 */
export const getStorageItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely set item in localStorage
 * Returns true if successful, false otherwise
 */
export const setStorageItem = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

/**
 * Clear all app-specific items from localStorage
 */
export const clearAppStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

