import React, { useEffect } from 'react';
import { useRailwayStore } from './store/useRailwayStore';
import { MapCanvas } from './components/map/MapCanvas';
import { StationSelector } from './components/selection/StationSelector';
import { SectionHeader } from './components/section/SectionHeader';
import { Legend } from './components/section/Legend';
import { ReportPanel } from './components/report/ReportPanel';
import { Toast } from './components/common/Toast';

export const App: React.FC = () => {
  const screen = useRailwayStore((state) => state.screen);
  const theme = useRailwayStore((state) => state.theme);
  const initialize = useRailwayStore((state) => state.initialize);
  const isLoadingInit = useRailwayStore((state) => state.isLoadingInit);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync dark class on document element and body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  if (isLoadingInit) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center bg-canvas dark:bg-zinc-950 text-ink dark:text-white ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex items-center gap-3 p-4 rounded-2xl glass-panel shadow-apple-product">
          <svg className="animate-spin h-6 w-6 text-primary dark:text-primary-dark" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className="text-sm font-semibold tracking-tight text-ink dark:text-white">
            Initializing Indian Railways Signaling Telemetry...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none ${theme === 'dark' ? 'dark' : ''}`}>
      <main className="w-full h-full text-ink dark:text-white bg-canvas dark:bg-zinc-950">
        {/* 100% Fullscreen Map Layer (100% Free Open-Source, Zero API Keys) */}
        <MapCanvas />

        {/* Screen 1: Corridor & Station Selection Overlay */}
        {screen === 'selection' && <StationSelector />}

        {/* Screen 2: Section Operation Controls */}
        {screen === 'section' && (
          <>
            <SectionHeader />

            {/* Floating Legend (Bottom Left) */}
            <div className="fixed bottom-6 left-6 z-30 pointer-events-auto">
              <Legend />
            </div>

            {/* Floating Incident & Status Report Panel */}
            <ReportPanel />
          </>
        )}

        {/* Toast Notification Container */}
        <Toast />
      </main>
    </div>
  );
};

export default App;
