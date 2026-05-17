/**
 * ThemeContext - Dark/Light theme management
 *
 * Provides theme state and toggle functionality throughout the app.
 * Persists theme preference to localStorage.
 * Applies CSS custom properties for theme-aware colors.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

/** Get initial theme from localStorage or system preference */
function getInitialTheme(): Theme {
  // Check localStorage first
  try {
    const stored = localStorage.getItem('tetris-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}

  // Fall back to system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const isDark = theme === 'dark';

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('tetris-theme', newTheme);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      // ── Dark theme (neon arcade) ──
      root.style.setProperty('--bg-primary', '#0a0a0f');
      root.style.setProperty('--bg-secondary', '#12121a');
      root.style.setProperty('--bg-tertiary', '#1a1a25');
      root.style.setProperty('--bg-panel', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--bg-panel-hover', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--border-panel', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-strong', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#c0c0c0');
      root.style.setProperty('--text-muted', '#9ca3af');
      root.style.setProperty('--text-dim', '#6b7280');
      root.style.setProperty('--text-faint', '#4b5563');
      root.style.setProperty('--cell-empty-bg', 'rgba(255, 255, 255, 0.02)');
      root.style.setProperty('--cell-empty-border', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.75)');
      root.style.setProperty('--scanline-color', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--board-shadow', '0 0 30px rgba(0, 245, 255, 0.1), inset 0 0 30px rgba(0, 245, 255, 0.05)');
      root.style.setProperty('--board-border', 'rgba(0, 245, 255, 0.4)');
      root.style.setProperty('--divider-color', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--btn-bg', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--btn-bg-active', 'rgba(0, 245, 255, 0.2)');
      root.style.setProperty('--btn-border', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--btn-border-active', 'rgba(0, 245, 255, 0.5)');
      root.style.setProperty('--btn-color', '#c0c0c0');
      root.style.setProperty('--btn-color-active', '#00f5ff');
      root.style.setProperty('--dir-btn-bg', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--dir-btn-border', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--dir-btn-color', '#e0e0e0');
      root.style.setProperty('--ghost-bg', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--ghost-border', 'rgba(255, 255, 255, 0.3)');
      root.style.setProperty('--empty-slot-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--empty-slot-text', '#6b7280');
      root.style.setProperty('--keyboard-hint', '#6b7280');
      root.style.setProperty('--subtitle-color', '#6b7280');
    } else {
      // ── Light theme (clean, bright) ──
      root.style.setProperty('--bg-primary', '#f0f0f5');
      root.style.setProperty('--bg-secondary', '#e8e8ee');
      root.style.setProperty('--bg-tertiary', '#dddde5');
      root.style.setProperty('--bg-panel', 'rgba(255, 255, 255, 0.6)');
      root.style.setProperty('--bg-panel-hover', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--border-panel', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--border-strong', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--text-primary', '#1a1a2e');
      root.style.setProperty('--text-secondary', '#2d2d44');
      root.style.setProperty('--text-muted', '#4b5563');
      root.style.setProperty('--text-dim', '#5a5a7a');
      root.style.setProperty('--text-faint', '#7a7a9a');
      root.style.setProperty('--cell-empty-bg', 'rgba(0, 0, 0, 0.03)');
      root.style.setProperty('--cell-empty-border', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--overlay-bg', 'rgba(255, 255, 255, 0.85)');
      root.style.setProperty('--scanline-color', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--board-shadow', '0 0 20px rgba(0, 245, 255, 0.15), inset 0 0 20px rgba(0, 245, 255, 0.05)');
      root.style.setProperty('--board-border', 'rgba(0, 245, 255, 0.5)');
      root.style.setProperty('--divider-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--btn-bg', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--btn-bg-active', 'rgba(0, 245, 255, 0.25)');
      root.style.setProperty('--btn-border', 'rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--btn-border-active', 'rgba(0, 245, 255, 0.6)');
      root.style.setProperty('--btn-color', '#4b5563');
      root.style.setProperty('--btn-color-active', '#0099a0');
      root.style.setProperty('--dir-btn-bg', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--dir-btn-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--dir-btn-color', '#374151');
      root.style.setProperty('--ghost-bg', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--ghost-border', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--empty-slot-border', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--empty-slot-text', '#7a7a9a');
      root.style.setProperty('--keyboard-hint', '#7a7a9a');
      root.style.setProperty('--subtitle-color', '#7a7a9a');
    }

    // Toggle a class on the body for any Tailwind dark: variants
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const value = useMemo(() => ({ theme, isDark, toggleTheme, setTheme }), [theme, isDark, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Hook to access theme context */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
