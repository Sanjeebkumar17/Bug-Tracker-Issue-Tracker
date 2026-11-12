import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext(null);

const applyThemeToDOM = (themeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  
  if (themeMode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
      body.setAttribute('data-theme', 'dark');
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
      body.setAttribute('data-theme', 'light');
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {}

    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) return 'dark';
      if (document.documentElement.classList.contains('light')) return 'light';
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Ensure DOM is synced immediately on mount and whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(prev => {
      const target = typeof newTheme === 'function' ? newTheme(prev) : newTheme;
      const resolved = target === 'dark' ? 'dark' : 'light';
      applyThemeToDOM(resolved);
      try {
        localStorage.setItem('theme', resolved);
      } catch (e) {}
      return resolved;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (e) {}
      return nextTheme;
    });
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
