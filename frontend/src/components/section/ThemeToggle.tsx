import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';

export const ThemeToggle: React.FC = () => {
  const theme = useRailwayStore((state) => state.theme);
  const toggleTheme = useRailwayStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Light/Dark Theme"
      className="flex items-center justify-center w-10 h-10 rounded-full glass-panel text-ink dark:text-white hover:opacity-90 active:scale-95 transition-all shadow-md"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-700" />
      )}
    </button>
  );
};
