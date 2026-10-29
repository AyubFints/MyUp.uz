import { useState } from 'react';
import { THEME_PRESETS } from '../components/SettingsSection';

const DEFAULT_THEME = THEME_PRESETS?.[0] || {
  bg: '#0e0e10',
  panel: '#1a1a1c',
  card: '#222225',
  border: 'rgba(255,255,255,0.08)',
  accent: '#38bdf8',
};

/**
 * Mavzu (Theme) holati va sozlamalarini boshqaruvchi Custom Hook
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('myup_theme_palette');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object' && parsed.bg) return parsed;
      return DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const isLight = Boolean(
    theme?.isLight ||
    theme?.id === 'default-white' ||
    theme?.bg === '#f8fafc' ||
    theme?.bg === '#ffffff'
  );

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('myup_theme_palette', JSON.stringify(newTheme));
  };

  return { theme, isLight, updateTheme };
}
