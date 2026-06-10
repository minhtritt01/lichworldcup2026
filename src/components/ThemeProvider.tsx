'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem('theme', theme);
  } catch {
    // Ignore storage failures.
  }

  window.document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;

    return window.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  } catch {
    return window.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(() => initialTheme ?? getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'theme' && (event.newValue === 'dark' || event.newValue === 'light')) {
        setTheme(event.newValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyTheme(next);
      persistTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
