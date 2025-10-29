import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemePreset, defaultTheme, aotTheme, getPresetById } from '../config/themePresets';
import { getThemePreferences, saveThemePreferences, ThemePreferences } from '../services/theme';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/localStorage';

interface ThemeContextType {
  currentTheme: ThemePreset;
  currentPresetId: string;
  isCustomTheme: boolean;
  setThemePreset: (presetId: string) => void;
  setCustomTheme: (theme: Partial<ThemePreset>) => void;
  updateThemeColors: (colors: Partial<ThemePreset['colors']>) => void;
  updateThemeTypography: (typography: Partial<ThemePreset['typography']>) => void;
  updateThemeShapes: (shapes: Partial<ThemePreset['shapes']>) => void;
  updateThemeSpacing: (spacing: Partial<ThemePreset['spacing']>) => void;
  updateThemeEffects: (effects: Partial<ThemePreset['effects']>) => void;
  saveToBackend: () => Promise<void>;
  resetToDefault: () => void;
  // Legacy support for AoT mode
  isAotMode: boolean;
  toggleAotMode: () => void;
  playThemeTransition: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultTheme);
  const [currentPresetId, setCurrentPresetId] = useState<string>('default');
  const [isCustomTheme, setIsCustomTheme] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Apply theme to DOM
  const applyTheme = (theme: ThemePreset) => {
    const root = document.documentElement;
    
    // Apply base colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-card-background', theme.colors.cardBackground);
    
    // Apply semantic colors
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Apply button colors
    root.style.setProperty('--color-button-primary', theme.colors.buttonPrimary);
    root.style.setProperty('--color-button-primary-hover', theme.colors.buttonPrimaryHover);
    root.style.setProperty('--color-button-primary-text', theme.colors.buttonPrimaryText);
    root.style.setProperty('--color-button-secondary', theme.colors.buttonSecondary);
    root.style.setProperty('--color-button-secondary-hover', theme.colors.buttonSecondaryHover);
    root.style.setProperty('--color-button-secondary-text', theme.colors.buttonSecondaryText);
    root.style.setProperty('--color-button-danger', theme.colors.buttonDanger);
    root.style.setProperty('--color-button-danger-hover', theme.colors.buttonDangerHover);
    root.style.setProperty('--color-button-danger-text', theme.colors.buttonDangerText);
    
    // Apply status colors
    root.style.setProperty('--color-status-pending', theme.colors.statusPending);
    root.style.setProperty('--color-status-in-progress', theme.colors.statusInProgress);
    root.style.setProperty('--color-status-completed', theme.colors.statusCompleted);
    root.style.setProperty('--color-status-cancelled', theme.colors.statusCancelled);
    
    // Apply interactive state colors
    root.style.setProperty('--color-hover-overlay', theme.colors.hoverOverlay);
    root.style.setProperty('--color-focus-ring', theme.colors.focusRing);
    root.style.setProperty('--color-active-state', theme.colors.activeState);
    
    // Apply chart colors
    root.style.setProperty('--color-chart-primary', theme.colors.chartPrimary);
    root.style.setProperty('--color-chart-secondary', theme.colors.chartSecondary);
    root.style.setProperty('--color-chart-tertiary', theme.colors.chartTertiary);

    // Apply typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-family-heading', theme.typography.headingFontFamily || theme.typography.fontFamily);
    root.style.setProperty('--font-size-base', `${theme.typography.fontSize}px`);
    root.style.setProperty('--font-weight-base', theme.typography.fontWeight.toString());
    root.style.setProperty('--line-height-base', theme.typography.lineHeight.toString());

    // Apply shapes
    root.style.setProperty('--border-radius-sm', `${theme.shapes.borderRadiusSm}px`);
    root.style.setProperty('--border-radius-md', `${theme.shapes.borderRadiusMd}px`);
    root.style.setProperty('--border-radius-lg', `${theme.shapes.borderRadiusLg}px`);
    root.style.setProperty('--border-radius-xl', `${theme.shapes.borderRadiusXl}px`);

    // Apply spacing
    root.style.setProperty('--spacing-scale', theme.spacing.scale.toString());

    // Apply effects
    root.style.setProperty('--animation-duration', `${theme.effects.animationDuration}ms`);
    root.style.setProperty('--opacity-card', theme.effects.cardOpacity.toString());
    root.style.setProperty('--opacity-overlay', theme.effects.overlayOpacity.toString());
    root.style.setProperty('--reduced-motion', theme.effects.reducedMotion ? '1' : '0');

    // Apply body class for theme-specific styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`);

    // Handle legacy AoT theme class
    if (theme.id === 'aot') {
      document.body.classList.add('aot-theme');
    } else {
      document.body.classList.remove('aot-theme');
    }

    // Apply light theme class for dyslexia theme
    if (theme.id === 'dyslexia') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  };

  // Load theme from localStorage and backend on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check localStorage for legacy AoT mode
        const legacyAotMode = localStorage.getItem('aotMode');
        
        // First, try to load from localStorage for instant theme application
        const localPreferences = getStorageItem<ThemePreferences>(STORAGE_KEYS.THEME_PREFERENCES);
        
        // Apply local preferences immediately if available
        if (localPreferences && localPreferences.presetId) {
          const preset = getPresetById(localPreferences.presetId);
          if (preset) {
            setCurrentTheme(preset);
            setCurrentPresetId(preset.id);
            applyTheme(preset);
          }
        } else if (localPreferences && Object.keys(localPreferences).length > 0 && !localPreferences.presetId) {
          // Custom theme from localStorage
          const customTheme: ThemePreset = {
            ...defaultTheme,
            id: 'custom',
            name: 'Custom',
            description: 'User customized theme',
            ...localPreferences,
            colors: { ...defaultTheme.colors, ...localPreferences.colors },
            typography: { ...defaultTheme.typography, ...localPreferences.typography },
            shapes: { ...defaultTheme.shapes, ...localPreferences.shapes },
            spacing: { ...defaultTheme.spacing, ...localPreferences.spacing },
            effects: { ...defaultTheme.effects, ...localPreferences.effects },
          };
          setCurrentTheme(customTheme);
          setCurrentPresetId('custom');
          setIsCustomTheme(true);
          applyTheme(customTheme);
        }
        
        // Then try to load from backend (for sync across devices)
        const preferences = await getThemePreferences();
        
        if (preferences.presetId) {
          const preset = getPresetById(preferences.presetId);
          if (preset) {
            setCurrentTheme(preset);
            setCurrentPresetId(preset.id);
            applyTheme(preset);
            // Update localStorage with backend data
            setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, { presetId: preset.id });
          }
        } else if (legacyAotMode === 'true') {
          // Migrate legacy AoT mode
          setCurrentTheme(aotTheme);
          setCurrentPresetId('aot');
          applyTheme(aotTheme);
          // Save to backend and localStorage
          await saveThemePreferences({ presetId: 'aot' });
          setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, { presetId: 'aot' });
          localStorage.removeItem('aotMode');
        } else if (Object.keys(preferences).length > 0) {
          // Custom theme from backend
          const customTheme: ThemePreset = {
            ...defaultTheme,
            id: 'custom',
            name: 'Custom',
            description: 'User customized theme',
            ...preferences,
            colors: { ...defaultTheme.colors, ...preferences.colors },
            typography: { ...defaultTheme.typography, ...preferences.typography },
            shapes: { ...defaultTheme.shapes, ...preferences.shapes },
            spacing: { ...defaultTheme.spacing, ...preferences.spacing },
            effects: { ...defaultTheme.effects, ...preferences.effects },
          };
          setCurrentTheme(customTheme);
          setCurrentPresetId('custom');
          setIsCustomTheme(true);
          applyTheme(customTheme);
          // Update localStorage with backend data
          setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
        } else if (!localPreferences) {
          // No preferences anywhere - use default theme
          applyTheme(defaultTheme);
          setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, { presetId: 'default' });
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // If backend fails but we have local preferences, keep using them
        // Otherwise apply default
        const localPreferences = getStorageItem<ThemePreferences>(STORAGE_KEYS.THEME_PREFERENCES);
        if (!localPreferences) {
          applyTheme(defaultTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setThemePreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setCurrentTheme(preset);
      setCurrentPresetId(presetId);
      setIsCustomTheme(false);
      applyTheme(preset);
      // Persist to localStorage immediately
      setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, { presetId });
    }
  };

  const setCustomTheme = (themeUpdate: Partial<ThemePreset>) => {
    const newTheme: ThemePreset = {
      ...currentTheme,
      ...themeUpdate,
      id: 'custom',
      name: 'Custom',
      colors: { ...currentTheme.colors, ...themeUpdate.colors },
      typography: { ...currentTheme.typography, ...themeUpdate.typography },
      shapes: { ...currentTheme.shapes, ...themeUpdate.shapes },
      spacing: { ...currentTheme.spacing, ...themeUpdate.spacing },
      effects: { ...currentTheme.effects, ...themeUpdate.effects },
    };
    setCurrentTheme(newTheme);
    setCurrentPresetId('custom');
    setIsCustomTheme(true);
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const updateThemeColors = (colors: Partial<ThemePreset['colors']>) => {
    const newTheme = { ...currentTheme, colors: { ...currentTheme.colors, ...colors } };
    setCurrentTheme(newTheme);
    setIsCustomTheme(true);
    setCurrentPresetId('custom');
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const updateThemeTypography = (typography: Partial<ThemePreset['typography']>) => {
    const newTheme = { ...currentTheme, typography: { ...currentTheme.typography, ...typography } };
    setCurrentTheme(newTheme);
    setIsCustomTheme(true);
    setCurrentPresetId('custom');
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const updateThemeShapes = (shapes: Partial<ThemePreset['shapes']>) => {
    const newTheme = { ...currentTheme, shapes: { ...currentTheme.shapes, ...shapes } };
    setCurrentTheme(newTheme);
    setIsCustomTheme(true);
    setCurrentPresetId('custom');
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const updateThemeSpacing = (spacing: Partial<ThemePreset['spacing']>) => {
    const newTheme = { ...currentTheme, spacing: { ...currentTheme.spacing, ...spacing } };
    setCurrentTheme(newTheme);
    setIsCustomTheme(true);
    setCurrentPresetId('custom');
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const updateThemeEffects = (effects: Partial<ThemePreset['effects']>) => {
    const newTheme = { ...currentTheme, effects: { ...currentTheme.effects, ...effects } };
    setCurrentTheme(newTheme);
    setIsCustomTheme(true);
    setCurrentPresetId('custom');
    applyTheme(newTheme);
    // Persist to localStorage immediately
    const preferences: ThemePreferences = {
      colors: newTheme.colors,
      typography: newTheme.typography,
      shapes: newTheme.shapes,
      spacing: newTheme.spacing,
      effects: newTheme.effects,
    };
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
  };

  const saveToBackend = async () => {
    try {
      const preferences: ThemePreferences = isCustomTheme
        ? {
            colors: currentTheme.colors,
            typography: currentTheme.typography,
            shapes: currentTheme.shapes,
            spacing: currentTheme.spacing,
            effects: currentTheme.effects,
          }
        : { presetId: currentPresetId };

      await saveThemePreferences(preferences);
      // Also save to localStorage
      setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, preferences);
    } catch (error) {
      console.error('Error saving theme to backend:', error);
      throw error;
    }
  };

  const resetToDefault = () => {
    setCurrentTheme(defaultTheme);
    setCurrentPresetId('default');
    setIsCustomTheme(false);
    applyTheme(defaultTheme);
    // Persist to localStorage immediately
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCES, { presetId: 'default' });
  };

  // Legacy AoT mode support
  const playThemeTransition = () => {
    const existingAudio = document.querySelector('audio[data-aot-audio]');
    if (existingAudio instanceof HTMLAudioElement) {
      existingAudio.pause();
      existingAudio.remove();
      return;
    }

    const button = document.querySelector('[aria-label="Toggle Theme"]');
    const audio = new Audio('/src/assets/audio/eren_scream.mp3');
    audio.setAttribute('data-aot-audio', 'true');
    const mainContent = document.querySelector('#root');
    
    mainContent?.classList.add('shake-container');
    button?.classList.add('shake-animation');
    document.body.classList.add('aot-theme-transition');
    
    audio.play();
    
    audio.onended = () => {
      setTimeout(() => {
        button?.classList.remove('shake-animation');
        mainContent?.classList.remove('shake-container');
        document.body.classList.add('aot-theme');
        setThemePreset('aot');
        saveToBackend();
      }, 500);
    };
  };

  const toggleAotMode = () => {
    if (currentPresetId === 'aot') {
      setThemePreset('default');
      saveToBackend();
    } else {
      playThemeTransition();
    }
  };

  const isAotMode = currentPresetId === 'aot';

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        currentPresetId,
        isCustomTheme,
        setThemePreset,
        setCustomTheme,
        updateThemeColors,
        updateThemeTypography,
        updateThemeShapes,
        updateThemeSpacing,
        updateThemeEffects,
        saveToBackend,
        resetToDefault,
        isAotMode,
        toggleAotMode,
        playThemeTransition,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
