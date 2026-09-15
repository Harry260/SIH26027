import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { AppMode } from '../../types';
import { useRailwayStore } from '../../store/useRailwayStore';

export const ModeSwitcher: React.FC = () => {
  const mode = useRailwayStore((state) => state.mode);
  const setMode = useRailwayStore((state) => state.setMode);
  const isLoadingMode = useRailwayStore((state) => state.isLoadingMode);

  const modes: { id: AppMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'report', label: 'Report Mode', icon: AlertCircle },
    { id: 'ai-plan', label: 'AI Plan Mode', icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-full glass-panel">
      {modes.map((item) => {
        const isActive = mode === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            disabled={isLoadingMode}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 select-none ${
              isActive
                ? 'bg-primary text-white shadow-md'
                : 'text-ink dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
            } active:scale-95 disabled:pointer-events-none cursor-pointer`}
          >
            {isLoadingMode && isActive ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
