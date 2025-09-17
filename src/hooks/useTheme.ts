'use client';

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Obtener tema guardado del localStorage o usar preferencia del sistema
    const savedTheme = localStorage.getItem('inklink-theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    setMounted(true);
    
    // Aplicar tema al documento
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Guardar en localStorage
    localStorage.setItem('inklink-theme', newTheme);
    
    // Aplicar al documento
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Guardar en localStorage
    localStorage.setItem('inklink-theme', newTheme);
    
    // Aplicar al documento
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted
  };
}