import api from './api';
import { ThemePreset, ThemeColors, ThemeTypography, ThemeShapes, ThemeSpacing, ThemeEffects } from '../config/themePresets';

export interface ThemePreferences {
  presetId?: string;
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  shapes?: Partial<ThemeShapes>;
  spacing?: Partial<ThemeSpacing>;
  effects?: Partial<ThemeEffects>;
}

export interface CustomTheme {
  id: string;
  name: string;
  theme: ThemePreset;
  createdAt: string;
  updatedAt: string;
}

export const getThemePreferences = async (): Promise<ThemePreferences> => {
  try {
    const response = await api.get('/user/theme');
    return response.data.theme || {};
  } catch (error) {
    console.error('Error fetching theme preferences:', error);
    throw error;
  }
};

export const saveThemePreferences = async (theme: ThemePreferences): Promise<ThemePreferences> => {
  try {
    const response = await api.put('/user/theme', theme);
    return response.data.theme;
  } catch (error) {
    console.error('Error saving theme preferences:', error);
    throw error;
  }
};

// Custom themes API
export const getCustomThemes = async (): Promise<Record<string, CustomTheme>> => {
  try {
    const response = await api.get('/user/custom-themes');
    return response.data.customThemes || {};
  } catch (error) {
    console.error('Error fetching custom themes:', error);
    throw error;
  }
};

export const createCustomTheme = async (id: string, name: string, theme: ThemePreset): Promise<Record<string, CustomTheme>> => {
  try {
    const response = await api.post('/user/custom-themes', { id, name, theme });
    return response.data.customThemes;
  } catch (error) {
    console.error('Error creating custom theme:', error);
    throw error;
  }
};

export const updateCustomTheme = async (id: string, data: { name?: string; theme?: ThemePreset }): Promise<Record<string, CustomTheme>> => {
  try {
    const response = await api.put(`/user/custom-themes/${id}`, data);
    return response.data.customThemes;
  } catch (error) {
    console.error('Error updating custom theme:', error);
    throw error;
  }
};

export const deleteCustomTheme = async (id: string): Promise<Record<string, CustomTheme>> => {
  try {
    const response = await api.delete(`/user/custom-themes/${id}`);
    return response.data.customThemes;
  } catch (error) {
    console.error('Error deleting custom theme:', error);
    throw error;
  }
};

export const exportTheme = (theme: ThemePreferences | ThemePreset): string => {
  return JSON.stringify(theme, null, 2);
};

export const importTheme = (jsonString: string): ThemePreferences | null => {
  try {
    const theme = JSON.parse(jsonString);
    // Basic validation
    if (typeof theme !== 'object') {
      throw new Error('Invalid theme format');
    }
    return theme;
  } catch (error) {
    console.error('Error importing theme:', error);
    return null;
  }
};

