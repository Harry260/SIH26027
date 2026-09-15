import React from 'react';
import { ArrowLeft, GitBranch, Radio, Navigation } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';
import { ModeSwitcher } from './ModeSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../common/Button';

export const SectionHeader: React.FC = () => {
  const currentCorridor = useRailwayStore((state) => state.currentCorridor);
  const resources = useRailwayStore((state) => state.resources);
  const resetToSelection = useRailwayStore((state) => state.resetToSelection);

  const blockCount = resources.length;

  return (
    <header className="fixed top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-none">
      {/* Left: Corridor Card & Change Section Button */}
      <div className="pointer-events-auto flex items-center gap-2">
        <Button
          variant="pearl"
          size="md"
          onClick={resetToSelection}
          className="glass-panel gap-2 font-medium text-ink dark:text-white"
        >
          <ArrowLeft className="w-4 h-4 text-primary dark:text-primary-dark" />
          <span>Change Section</span>
        </Button>

        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full glass-panel text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-white">
            <Navigation className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
            <span>{currentCorridor?.name || 'Railway Corridor'}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Auto Signaling</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <GitBranch className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
            <span>{blockCount} Blocks ({currentCorridor?.distance_km || 195} km)</span>
          </div>
        </div>
      </div>

      {/* Center: Mode Switcher */}
      <div className="pointer-events-auto">
        <ModeSwitcher />
      </div>

      {/* Right: Theme Toggle & Indian Railways Live Badge */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full glass-panel text-xs font-medium text-ink dark:text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SIH26027 Control Desk</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};
