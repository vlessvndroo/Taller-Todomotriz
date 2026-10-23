import { useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'todomotriz-theme';

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage puede no estar disponible (modo privado)
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme = readTheme()) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Al imprimir se usa siempre el tema claro (texto oscuro sobre papel blanco) */
export function setupPrintTheme() {
  let wasDark = false;
  window.addEventListener('beforeprint', () => {
    wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
  });
  window.addEventListener('afterprint', () => {
    if (wasDark) document.documentElement.classList.add('dark');
  });
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // sin persistencia, el tema dura solo esta sesión
    }
  };

  return { theme, toggleTheme };
}
