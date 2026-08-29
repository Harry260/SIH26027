import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';

export const Toast: React.FC = () => {
  const toastMessage = useRailwayStore((state) => state.toastMessage);
  const clearToast = useRailwayStore((state) => state.clearToast);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/90 dark:bg-zinc-800/95 text-white backdrop-blur-xl border border-white/15 rounded-full shadow-2xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium tracking-tight pr-2">{toastMessage}</span>
        <button
          onClick={clearToast}
          className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

