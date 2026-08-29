import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';

export const Legend: React.FC = () => {
  const mode = useRailwayStore((state) => state.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 w-72 max-w-[calc(100vw-32px)] text-ink dark:text-white">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary dark:text-primary-dark" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-white">
            {mode === 'report' ? 'Signal & Status Guide' : mode === 'ai-plan' ? 'AI Train Schedules' : 'Asset Idle Scale'}
          </span>
        </div>
        <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 pt-1 text-xs border-t border-black/5 dark:border-white/10 space-y-2">
          {mode === 'report' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-fault shadow-sm" />
                  <span className="text-ink dark:text-gray-200 font-medium">Critical Fault</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">High Severity Issue</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-degraded shadow-sm" />
                  <span className="text-ink dark:text-gray-200 font-medium">Degraded Block</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Speed/Minor Caution</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-occupied dark:bg-status-occupiedDark shadow-sm" />
                  <span className="text-ink dark:text-gray-200 font-medium">Occupied</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Train on Block</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-reserved shadow-sm" />
                  <span className="text-ink dark:text-gray-200 font-medium">Reserved</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Route Locked / Next</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-free shadow-sm" />
                  <span className="text-ink dark:text-gray-200 font-medium">Clear / Free</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Available Section</span>
              </div>

              <div className="mt-2.5 p-2 bg-black/5 dark:bg-white/10 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
                Click any block on the map to view issues or file a live incident report.
              </div>
            </div>
          )}

          {mode === 'ai-plan' && (
            <div className="space-y-2 pt-1">
              <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-snug">
                AI Automatic Dispatch Allocation — tracking train paths across sequential blocks:
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#0066cc]" />
                    <span className="text-ink dark:text-gray-200 font-medium">12002 Shatabdi</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Premier</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#30d158]" />
                    <span className="text-ink dark:text-gray-200 font-medium">22436 Vande Bharat</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Premier</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#bf5af2]" />
                    <span className="text-ink dark:text-gray-200 font-medium">12952 Rajdhani</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Superfast</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff375f]" />
                    <span className="text-ink dark:text-gray-200 font-medium">Freight Container</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Freight</span>
                </div>
              </div>

              <div className="mt-2 p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] leading-snug">
                Hover over blocks to inspect planned entry/exit timestamps & headway intervals.
              </div>
            </div>
          )}

          {mode === 'asset' && (
            <div className="space-y-3 pt-1">
              <p className="text-zinc-600 dark:text-zinc-300 text-[11px]">
                Asset Idle Delay Contributed (Minutes):
              </p>

              {/* Gradient bar representation */}
              <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner">
                <div className="bg-[#30d158] flex-1" title="0-10m Optimal" />
                <div className="bg-[#64d2ff] flex-1" title="11-25m Low" />
                <div className="bg-[#ffd60a] flex-1" title="26-50m Moderate" />
                <div className="bg-[#ff9f0a] flex-1" title="51-90m High" />
                <div className="bg-[#ff453a] flex-1" title="90m+ Critical" />
              </div>

              <div className="flex justify-between text-[10px] text-zinc-400 px-0.5">
                <span>0m (Optimal)</span>
                <span>45m</span>
                <span>120m+ (Severe)</span>
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">≤ 10 min</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Normal Flow</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-medium">26 – 90 min</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Caution Delay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-500 font-medium">&gt; 90 min</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Critical Bottleneck</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
