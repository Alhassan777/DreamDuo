export interface ThemeColors {
  // Base colors
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  cardBackground: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Button colors
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  buttonSecondaryText: string;
  buttonDanger: string;
  buttonDangerHover: string;
  buttonDangerText: string;
  
  // Status colors
  statusPending: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
  
  // Interactive states
  hoverOverlay: string;
  focusRing: string;
  activeState: string;
  
  // Dashboard specific
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  headingFontFamily?: string;
}

export interface ThemeShapes {
  borderRadiusSm: number;
  borderRadiusMd: number;
  borderRadiusLg: number;
  borderRadiusXl: number;
}

export interface ThemeSpacing {
  scale: number; // Multiplier for base spacing unit
}

export interface ThemeEffects {
  animationDuration: number;
  reducedMotion: boolean;
  cardOpacity: number;
  overlayOpacity: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accessibilityFeatures: string[];
  colors: ThemeColors;
  typography: ThemeTypography;
  shapes: ThemeShapes;
  spacing: ThemeSpacing;
  effects: ThemeEffects;
}

// Default theme (original app theme)
export const defaultTheme: ThemePreset = {
  id: 'default',
  name: 'Default',
  description: 'Original application theme with balanced colors and comfortable spacing',
  accessibilityFeatures: [],
  colors: {
    // Base colors
    primary: '#646cff',
    secondary: '#535bf2',
    background: '#242424',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.87)',
    accent: '#61dafb',
    border: '#404040',
    cardBackground: '#2a2a2a',
    
    // Semantic colors
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Button colors
    buttonPrimary: '#646cff',
    buttonPrimaryHover: '#535bf2',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#3f3f46',
    buttonSecondaryHover: '#52525b',
    buttonSecondaryText: '#ffffff',
    buttonDanger: '#ef4444',
    buttonDangerHover: '#dc2626',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#fbbf24',
    statusInProgress: '#3b82f6',
    statusCompleted: '#4ade80',
    statusCancelled: '#9ca3af',
    
    // Interactive states
    hoverOverlay: 'rgba(100, 108, 255, 0.1)',
    focusRing: '#646cff',
    activeState: '#535bf2',
    
    // Dashboard specific
    chartPrimary: '#646cff',
    chartSecondary: '#61dafb',
    chartTertiary: '#fbbf24',
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  shapes: {
    borderRadiusSm: 4,
    borderRadiusMd: 8,
    borderRadiusLg: 12,
    borderRadiusXl: 16,
  },
  spacing: {
    scale: 1.0,
  },
  effects: {
    animationDuration: 250,
    reducedMotion: false,
    cardOpacity: 1.0,
    overlayOpacity: 0.5,
  },
};

// Attack on Titan theme
export const aotTheme: ThemePreset = {
  id: 'aot',
  name: 'Attack on Titan',
  description: 'Immersive theme inspired by the Attack on Titan anime',
  accessibilityFeatures: ['High Contrast Elements'],
  colors: {
    // Base colors
    primary: '#8b4513',
    secondary: '#654321',
    background: '#1a1410',
    surface: '#2d2416',
    text: '#f5deb3',
    textSecondary: '#d4af88',
    accent: '#b8860b',
    border: '#5a4a3a',
    cardBackground: '#3a2f1f',
    
    // Semantic colors
    success: '#6b8e23',
    warning: '#cd853f',
    error: '#8b0000',
    info: '#4682b4',
    
    // Button colors
    buttonPrimary: '#8b4513',
    buttonPrimaryHover: '#a0522d',
    buttonPrimaryText: '#f5deb3',
    buttonSecondary: '#654321',
    buttonSecondaryHover: '#7a5124',
    buttonSecondaryText: '#f5deb3',
    buttonDanger: '#8b0000',
    buttonDangerHover: '#a50000',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#cd853f',
    statusInProgress: '#4682b4',
    statusCompleted: '#6b8e23',
    statusCancelled: '#696969',
    
    // Interactive states
    hoverOverlay: 'rgba(139, 69, 19, 0.15)',
    focusRing: '#b8860b',
    activeState: '#654321',
    
    // Dashboard specific
    chartPrimary: '#8b4513',
    chartSecondary: '#b8860b',
    chartTertiary: '#cd853f',
  },
  typography: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
  },
  shapes: {
    borderRadiusSm: 2,
    borderRadiusMd: 4,
    borderRadiusLg: 8,
    borderRadiusXl: 12,
  },
  spacing: {
    scale: 1.1,
  },
  effects: {
    animationDuration: 350,
    reducedMotion: false,
    cardOpacity: 0.95,
    overlayOpacity: 0.7,
  },
};

// High Contrast theme
export const highContrastTheme: ThemePreset = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for improved visibility (WCAG AAA compliant)',
  accessibilityFeatures: ['WCAG AAA', '7:1+ Contrast Ratio', 'Bold Borders'],
  colors: {
    // Base colors
    primary: '#ffffff',
    secondary: '#00ffff',
    background: '#000000',
    surface: '#000000',
    text: '#ffffff',
    textSecondary: '#ffffff',
    accent: '#ffff00',
    border: '#ffffff',
    cardBackground: '#1a1a1a',
    
    // Semantic colors
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    
    // Button colors
    buttonPrimary: '#ffffff',
    buttonPrimaryHover: '#e0e0e0',
    buttonPrimaryText: '#000000',
    buttonSecondary: '#00ffff',
    buttonSecondaryHover: '#00e0e0',
    buttonSecondaryText: '#000000',
    buttonDanger: '#ff0000',
    buttonDangerHover: '#e00000',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#ffff00',
    statusInProgress: '#00ffff',
    statusCompleted: '#00ff00',
    statusCancelled: '#808080',
    
    // Interactive states
    hoverOverlay: 'rgba(255, 255, 255, 0.2)',
    focusRing: '#ffff00',
    activeState: '#00ffff',
    
    // Dashboard specific
    chartPrimary: '#ffffff',
    chartSecondary: '#00ffff',
    chartTertiary: '#ffff00',
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.6,
  },
  shapes: {
    borderRadiusSm: 0,
    borderRadiusMd: 0,
    borderRadiusLg: 0,
    borderRadiusXl: 0,
  },
  spacing: {
    scale: 1.2,
  },
  effects: {
    animationDuration: 0,
    reducedMotion: true,
    cardOpacity: 1.0,
    overlayOpacity: 0.9,
  },
};

// Deuteranopia (red-green colorblind) theme
export const deuteranopiaTheme: ThemePreset = {
  id: 'deuteranopia',
  name: 'Deuteranopia Safe',
  description: 'Optimized for red-green color blindness using blue and yellow hues',
  accessibilityFeatures: ['Deuteranopia Safe', 'No Red-Green Dependency', 'High Contrast'],
  colors: {
    // Base colors
    primary: '#0066cc',
    secondary: '#004080',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#e8e8e8',
    textSecondary: '#c4c4c4',
    accent: '#ffa500',
    border: '#4a5568',
    cardBackground: '#0f3460',
    
    // Semantic colors
    success: '#0099ff',
    warning: '#ffcc00',
    error: '#ff6600',
    info: '#00ccff',
    
    // Button colors
    buttonPrimary: '#0066cc',
    buttonPrimaryHover: '#0052a3',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#ffa500',
    buttonSecondaryHover: '#ff8c00',
    buttonSecondaryText: '#000000',
    buttonDanger: '#ff6600',
    buttonDangerHover: '#ff4500',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#ffcc00',
    statusInProgress: '#0066cc',
    statusCompleted: '#0099ff',
    statusCancelled: '#6b7280',
    
    // Interactive states
    hoverOverlay: 'rgba(0, 102, 204, 0.15)',
    focusRing: '#ffa500',
    activeState: '#004080',
    
    // Dashboard specific
    chartPrimary: '#0066cc',
    chartSecondary: '#ffa500',
    chartTertiary: '#00ccff',
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
  },
  shapes: {
    borderRadiusSm: 6,
    borderRadiusMd: 10,
    borderRadiusLg: 14,
    borderRadiusXl: 18,
  },
  spacing: {
    scale: 1.1,
  },
  effects: {
    animationDuration: 200,
    reducedMotion: false,
    cardOpacity: 1.0,
    overlayOpacity: 0.6,
  },
};

// Protanopia (red-green colorblind, alternative) theme
export const protanopiaTheme: ThemePreset = {
  id: 'protanopia',
  name: 'Protanopia Safe',
  description: 'Alternative red-green colorblind theme with purple and teal',
  accessibilityFeatures: ['Protanopia Safe', 'No Red Perception', 'High Contrast'],
  colors: {
    // Base colors
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    accent: '#06b6d4',
    border: '#475569',
    cardBackground: '#334155',
    
    // Semantic colors
    success: '#14b8a6',
    warning: '#f59e0b',
    error: '#8b5cf6',
    info: '#06b6d4',
    
    // Button colors
    buttonPrimary: '#8b5cf6',
    buttonPrimaryHover: '#7c3aed',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#06b6d4',
    buttonSecondaryHover: '#0891b2',
    buttonSecondaryText: '#ffffff',
    buttonDanger: '#7c3aed',
    buttonDangerHover: '#6d28d9',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#f59e0b',
    statusInProgress: '#8b5cf6',
    statusCompleted: '#14b8a6',
    statusCancelled: '#64748b',
    
    // Interactive states
    hoverOverlay: 'rgba(139, 92, 246, 0.15)',
    focusRing: '#06b6d4',
    activeState: '#6d28d9',
    
    // Dashboard specific
    chartPrimary: '#8b5cf6',
    chartSecondary: '#06b6d4',
    chartTertiary: '#14b8a6',
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
  },
  shapes: {
    borderRadiusSm: 6,
    borderRadiusMd: 10,
    borderRadiusLg: 14,
    borderRadiusXl: 18,
  },
  spacing: {
    scale: 1.1,
  },
  effects: {
    animationDuration: 200,
    reducedMotion: false,
    cardOpacity: 1.0,
    overlayOpacity: 0.6,
  },
};

// Tritanopia (blue-yellow colorblind) theme
export const tritanopiaTheme: ThemePreset = {
  id: 'tritanopia',
  name: 'Tritanopia Safe',
  description: 'Optimized for blue-yellow color blindness using red and pink hues',
  accessibilityFeatures: ['Tritanopia Safe', 'No Blue-Yellow Dependency', 'High Contrast'],
  colors: {
    // Base colors
    primary: '#dc2626',
    secondary: '#991b1b',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#fafafa',
    textSecondary: '#d4d4d4',
    accent: '#ec4899',
    border: '#525252',
    cardBackground: '#404040',
    
    // Semantic colors
    success: '#22c55e',
    warning: '#f97316',
    error: '#dc2626',
    info: '#ec4899',
    
    // Button colors
    buttonPrimary: '#dc2626',
    buttonPrimaryHover: '#b91c1c',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#ec4899',
    buttonSecondaryHover: '#db2777',
    buttonSecondaryText: '#ffffff',
    buttonDanger: '#991b1b',
    buttonDangerHover: '#7f1d1d',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#f97316',
    statusInProgress: '#ec4899',
    statusCompleted: '#22c55e',
    statusCancelled: '#737373',
    
    // Interactive states
    hoverOverlay: 'rgba(220, 38, 38, 0.15)',
    focusRing: '#ec4899',
    activeState: '#991b1b',
    
    // Dashboard specific
    chartPrimary: '#dc2626',
    chartSecondary: '#ec4899',
    chartTertiary: '#f97316',
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
  },
  shapes: {
    borderRadiusSm: 6,
    borderRadiusMd: 10,
    borderRadiusLg: 14,
    borderRadiusXl: 18,
  },
  spacing: {
    scale: 1.1,
  },
  effects: {
    animationDuration: 200,
    reducedMotion: false,
    cardOpacity: 1.0,
    overlayOpacity: 0.6,
  },
};

// Low Vision theme
export const lowVisionTheme: ThemePreset = {
  id: 'low-vision',
  name: 'Low Vision',
  description: 'Larger text, simplified shapes, and high contrast for users with low vision',
  accessibilityFeatures: ['Large Text', 'High Contrast', 'Simplified UI', 'WCAG AAA'],
  colors: {
    // Base colors
    primary: '#ffffff',
    secondary: '#e0e0e0',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#f0f0f0',
    accent: '#ffeb3b',
    border: '#ffffff',
    cardBackground: '#2a2a2a',
    
    // Semantic colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Button colors
    buttonPrimary: '#ffffff',
    buttonPrimaryHover: '#d0d0d0',
    buttonPrimaryText: '#000000',
    buttonSecondary: '#ffeb3b',
    buttonSecondaryHover: '#fdd835',
    buttonSecondaryText: '#000000',
    buttonDanger: '#f44336',
    buttonDangerHover: '#e53935',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#ff9800',
    statusInProgress: '#2196f3',
    statusCompleted: '#4caf50',
    statusCancelled: '#9e9e9e',
    
    // Interactive states
    hoverOverlay: 'rgba(255, 255, 255, 0.2)',
    focusRing: '#ffeb3b',
    activeState: '#e0e0e0',
    
    // Dashboard specific
    chartPrimary: '#ffffff',
    chartSecondary: '#ffeb3b',
    chartTertiary: '#2196f3',
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.8,
  },
  shapes: {
    borderRadiusSm: 8,
    borderRadiusMd: 12,
    borderRadiusLg: 16,
    borderRadiusXl: 20,
  },
  spacing: {
    scale: 1.4,
  },
  effects: {
    animationDuration: 0,
    reducedMotion: true,
    cardOpacity: 1.0,
    overlayOpacity: 0.85,
  },
};

// Dyslexia-friendly theme
export const dyslexiaTheme: ThemePreset = {
  id: 'dyslexia',
  name: 'Dyslexia-Friendly',
  description: 'Optimized font, increased spacing, and muted colors for dyslexic users',
  accessibilityFeatures: ['Dyslexia Font', 'Increased Spacing', 'Reduced Visual Noise'],
  colors: {
    // Base colors
    primary: '#5b9bd5',
    secondary: '#4a7fb8',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#2c2c2c',
    textSecondary: '#5a5a5a',
    accent: '#70ad47',
    border: '#d0d0d0',
    cardBackground: '#f5f5f5',
    
    // Semantic colors
    success: '#70ad47',
    warning: '#ffc000',
    error: '#c55a11',
    info: '#5b9bd5',
    
    // Button colors
    buttonPrimary: '#5b9bd5',
    buttonPrimaryHover: '#4a8fc4',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#70ad47',
    buttonSecondaryHover: '#5f9638',
    buttonSecondaryText: '#ffffff',
    buttonDanger: '#c55a11',
    buttonDangerHover: '#a84b0e',
    buttonDangerText: '#ffffff',
    
    // Status colors
    statusPending: '#ffc000',
    statusInProgress: '#5b9bd5',
    statusCompleted: '#70ad47',
    statusCancelled: '#9e9e9e',
    
    // Interactive states
    hoverOverlay: 'rgba(91, 155, 213, 0.1)',
    focusRing: '#70ad47',
    activeState: '#4a7fb8',
    
    // Dashboard specific
    chartPrimary: '#5b9bd5',
    chartSecondary: '#70ad47',
    chartTertiary: '#ffc000',
  },
  typography: {
    fontFamily: '"Comic Sans MS", "OpenDyslexic", Verdana, sans-serif',
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.8,
  },
  shapes: {
    borderRadiusSm: 8,
    borderRadiusMd: 12,
    borderRadiusLg: 16,
    borderRadiusXl: 20,
  },
  spacing: {
    scale: 1.5,
  },
  effects: {
    animationDuration: 150,
    reducedMotion: true,
    cardOpacity: 1.0,
    overlayOpacity: 0.4,
  },
};

export const themePresets: ThemePreset[] = [
  defaultTheme,
  aotTheme,
  highContrastTheme,
  deuteranopiaTheme,
  protanopiaTheme,
  tritanopiaTheme,
  lowVisionTheme,
  dyslexiaTheme,
];

export const getPresetById = (id: string): ThemePreset | undefined => {
  return themePresets.find(preset => preset.id === id);
};

export const getPresetByName = (name: string): ThemePreset | undefined => {
  return themePresets.find(preset => preset.name === name);
};

