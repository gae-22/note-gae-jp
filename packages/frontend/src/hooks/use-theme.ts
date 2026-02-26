import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.style.setProperty('--color-void-950', '#ffffff');
      root.style.setProperty('--color-void-900', '#fafafa');
      root.style.setProperty('--color-void-800', '#f0f0f0');
      root.style.setProperty('--color-void-700', '#e5e5e5');
      root.style.setProperty('--color-void-600', '#d4d4d4');
      root.style.setProperty('--color-void-500', '#a3a3a3');
      root.style.setProperty('--color-void-400', '#737373');
      root.style.setProperty('--color-void-300', '#525252');
      root.style.setProperty('--color-void-200', '#404040');
      root.style.setProperty('--color-void-100', '#262626');
      root.style.setProperty('--color-void-50', '#171717');
      root.style.setProperty('--color-glass-bg', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--color-glass-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--color-accent-glow', 'rgba(160, 204, 0, 0.15)');
    } else {
      root.classList.remove('light');
      root.style.removeProperty('--color-void-950');
      root.style.removeProperty('--color-void-900');
      root.style.removeProperty('--color-void-800');
      root.style.removeProperty('--color-void-700');
      root.style.removeProperty('--color-void-600');
      root.style.removeProperty('--color-void-500');
      root.style.removeProperty('--color-void-400');
      root.style.removeProperty('--color-void-300');
      root.style.removeProperty('--color-void-200');
      root.style.removeProperty('--color-void-100');
      root.style.removeProperty('--color-void-50');
      root.style.removeProperty('--color-glass-bg');
      root.style.removeProperty('--color-glass-border');
      root.style.removeProperty('--color-accent-glow');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
