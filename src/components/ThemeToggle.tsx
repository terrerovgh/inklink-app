'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  // Evitar hidratación incorrecta
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <div className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 hover:bg-white dark:hover:bg-white hover:text-black dark:hover:text-black transition-colors"
    >
      {theme === 'light' ? (
        <Sun className="h-4 w-4 text-white" />
      ) : (
        <Moon className="h-4 w-4 text-white" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      </span>
    </Button>
  );
}

// Componente alternativo con switch más elaborado
export function ThemeSwitch() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-11 h-6 bg-gray-200 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-white" />
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${theme === 'dark' ? 'bg-white' : 'bg-black'}
        `}
      >
        <span className="sr-only">
          {theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        </span>
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <Moon className="h-4 w-4 text-white" />
    </div>
  );
}