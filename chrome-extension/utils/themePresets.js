/**
 * Theme presets for DreamDuo Chrome Extension
 * Simplified versions of the main app themes, containing only colors needed for the extension UI.
 */

export const themePresets = {
  default: {
    primary: '#646cff',
    primaryHover: '#535bf2',
    secondary: '#61dafb',
    background: '#242424',
    surface: '#1a1a1a',
    cardBackground: '#2a2a2a',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.87)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    border: '#404040',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#ef4444',
    dangerHover: '#dc2626',
  },
  aot: {
    primary: '#8b4513',
    primaryHover: '#a0522d',
    secondary: '#b8860b',
    background: '#1a1410',
    surface: '#2d2416',
    cardBackground: '#3a2f1f',
    text: '#f5deb3',
    textSecondary: '#d4af88',
    textMuted: 'rgba(245, 222, 179, 0.6)',
    border: '#5a4a3a',
    success: '#6b8e23',
    warning: '#cd853f',
    danger: '#8b0000',
    dangerHover: '#a50000',
  },
  'high-contrast': {
    primary: '#ffffff',
    primaryHover: '#e0e0e0',
    secondary: '#00ffff',
    background: '#000000',
    surface: '#000000',
    cardBackground: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#ffffff',
    textMuted: '#ffffff',
    border: '#ffffff',
    success: '#00ff00',
    warning: '#ffff00',
    danger: '#ff0000',
    dangerHover: '#e00000',
  },
  deuteranopia: {
    primary: '#0066cc',
    primaryHover: '#0052a3',
    secondary: '#ffa500',
    background: '#1a1a2e',
    surface: '#16213e',
    cardBackground: '#0f3460',
    text: '#e8e8e8',
    textSecondary: '#c4c4c4',
    textMuted: 'rgba(232, 232, 232, 0.6)',
    border: '#4a5568',
    success: '#0099ff',
    warning: '#ffcc00',
    danger: '#ff6600',
    dangerHover: '#ff4500',
  },
  protanopia: {
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    secondary: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    cardBackground: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: 'rgba(241, 245, 249, 0.6)',
    border: '#475569',
    success: '#14b8a6',
    warning: '#f59e0b',
    danger: '#7c3aed',
    dangerHover: '#6d28d9',
  },
  tritanopia: {
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    secondary: '#ec4899',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    cardBackground: '#404040',
    text: '#fafafa',
    textSecondary: '#d4d4d4',
    textMuted: 'rgba(250, 250, 250, 0.6)',
    border: '#525252',
    success: '#22c55e',
    warning: '#f97316',
    danger: '#991b1b',
    dangerHover: '#7f1d1d',
  },
  'low-vision': {
    primary: '#ffffff',
    primaryHover: '#d0d0d0',
    secondary: '#ffeb3b',
    background: '#000000',
    surface: '#1a1a1a',
    cardBackground: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#f0f0f0',
    textMuted: '#f0f0f0',
    border: '#ffffff',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    dangerHover: '#e53935',
  },
  dyslexia: {
    primary: '#5b9bd5',
    primaryHover: '#4a8fc4',
    secondary: '#70ad47',
    background: '#fafafa',
    surface: '#ffffff',
    cardBackground: '#f5f5f5',
    text: '#2c2c2c',
    textSecondary: '#5a5a5a',
    textMuted: 'rgba(44, 44, 44, 0.6)',
    border: '#d0d0d0',
    success: '#70ad47',
    warning: '#ffc000',
    danger: '#c55a11',
    dangerHover: '#a84b0e',
  },
};

export const getThemeById = (id) => {
  return themePresets[id] || themePresets.default;
};

export const applyTheme = (themeColors) => {
  const root = document.documentElement;
  
  root.style.setProperty('--primary', themeColors.primary);
  root.style.setProperty('--primary-hover', themeColors.primaryHover);
  root.style.setProperty('--secondary', themeColors.secondary);
  root.style.setProperty('--bg-primary', themeColors.background);
  root.style.setProperty('--bg-secondary', themeColors.surface);
  root.style.setProperty('--bg-tertiary', themeColors.cardBackground);
  root.style.setProperty('--text-primary', themeColors.text);
  root.style.setProperty('--text-secondary', themeColors.textSecondary);
  root.style.setProperty('--text-muted', themeColors.textMuted);
  root.style.setProperty('--border-color', themeColors.border);
  root.style.setProperty('--success', themeColors.success);
  root.style.setProperty('--warning', themeColors.warning);
  root.style.setProperty('--danger', themeColors.danger);
  root.style.setProperty('--danger-hover', themeColors.dangerHover);
};
