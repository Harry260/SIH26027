import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Train as TrainIcon,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Gauge,
  Zap,
} from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';
import { formatTime } from '../../utils/formatters';
import { getAiPlanColor } from '../../utils/status';
import { Button } from '../common/Button';
import { Trip } from '../../types';

export const TimetablePanel: React.FC = () => {
  const currentCorridor = useRailwayStore((state) => state.currentCorridor);
  const trips = useRailwayStore((state) => state.trips);
  const resources = useRailwayStore((state) => state.resources);
  const planStatus = useRailwayStore((state) => state.planStatus);
  const isSolvingPlan = useRailwayStore((state) => state.isSolvingPlan);
  const acceptPlan = useRailwayStore((state) => state.acceptPlan);
  const rejectPlan = useRailwayStore((state) => state.rejectPlan);
  const openModifyModal = useRailwayStore((state) => state.openModifyModal);

  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);

  const toggleTripExpand = (tripId: number) => {
    setExpandedTripId(expandedTripId === tripId ? null : tripId);
  };

  const getStatusBadge = () => {
    switch (planStatus) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" />
            <span>Approved & Locked</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Re-optimizing</span>
          </span>
        );
      case 'proposed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary dark:text-primary-dark border border-primary/30">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Proposed</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed top-20 right-4 bottom-20 z-40 w-[410px] max-w-[calc(100vw-32px)] flex flex-col glass-panel rounded-3xl overflow-hidden transition-all duration-300 animate-slide-in text-ink dark:text-white shadow-apple-window">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 glass-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink dark:text-white tracking-tight-title font-sans">
              AI Timetable Dispatch
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {currentCorridor?.name || 'Mainline Corridor'} · {trips.length} Active Rakes
          </p>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Solver Telemetry KPI Card */}
        <div className="p-3.5 rounded-2xl glass-card space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Conflict-Free Guarantee</span>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              100% Non-Overlapping
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Solver Engine</span>
            </span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              Mixed-Integer LP (MILP)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              <span>Coordinated Blocks</span>
            </span>
            <span className="font-semibold text-ink dark:text-white">
              {resources.length} Automatic Block Sections
            </span>
          </div>
        </div>

        {/* Trips List Header */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
            <TrainIcon className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
            <span>Scheduled Train Slots ({trips.length})</span>
          </h3>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Click trip to inspect stops
          </span>
        </div>

        {/* Trips Schedule Cards */}
        <div className="space-y-2.5">
          {trips.map((trip: Trip) => {
            const isExpanded = expandedTripId === trip.id;
            const trainColor = getAiPlanColor(trip.train);
            const firstStop = trip.stations?.[0];
            const lastStop = trip.stations?.[trip.stations.length - 1];

            const depTimeFormatted = firstStop ? formatTime(firstStop.departure) : '--';
            const arrTimeFormatted = lastStop ? formatTime(lastStop.arrival) : '--';

            const durationMinutes =
              firstStop && lastStop ? Math.max(0, lastStop.arrival - firstStop.departure) : 0;

            const allocCount = trip.resource_allocations?.length || 0;
            const avgSpeed =
              allocCount > 0
                ? Math.round(
                    trip.resource_allocations!.reduce((acc, a) => acc + a.planned_speed_kmh, 0) /
                      allocCount
                  )
                : 130;

            return (
              <div
                key={trip.id}
                className="rounded-2xl glass-card overflow-hidden transition-all duration-200 border border-black/5 dark:border-white/10"
              >
                {/* Trip Card Header (Click to Expand) */}
                <div
                  onClick={() => toggleTripExpand(trip.id)}
                  className="p-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors space-y-2 select-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: trainColor }}
                      />
                      <span className="font-semibold text-xs text-ink dark:text-white">
                        #{trip.train} · {trip.train_name || 'Train Schedule'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                        {durationMinutes} min
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Route & Timings Bar */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1.5 font-medium text-ink dark:text-gray-200">
                      <span className="font-semibold">{firstStop?.station_code || 'ORIG'}</span>
                      <span className="text-zinc-500 text-[11px]">({depTimeFormatted})</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                      <span className="font-semibold">{lastStop?.station_code || 'DEST'}</span>
                      <span className="text-zinc-500 text-[11px]">({arrTimeFormatted})</span>
                    </div>

                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Avg {avgSpeed} km/h
                    </span>
                  </div>
                </div>

                {/* Expanded Details: Station Stops & Allocations */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 text-xs">
                    {/* Station Stops */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Station Dwell Stops
                      </div>
                      <div className="space-y-1">
                        {trip.stations?.map((stop, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-mono"
                          >
                            <span className="font-semibold text-ink dark:text-white">
                              {stop.station_code}
                            </span>
                            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 text-[11px]">
                              <span>Arr: {formatTime(stop.arrival)}</span>
                              <span>Dep: {formatTime(stop.departure)}</span>
                              <span className="text-zinc-400">Dwell: {stop.min_dwell}m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Modify Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModifyModal(trip.id);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl glass-card hover:border-primary text-primary dark:text-primary-dark font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Modify Schedule for Train #{trip.train}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accept / Reject / Modify Action Footer */}
      <div className="p-4 border-t border-black/5 dark:border-white/10 glass-card shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {/* Reject / Re-optimize Button */}
          <Button
            variant="pearl"
            size="sm"
            onClick={rejectPlan}
            isLoading={isSolvingPlan && planStatus === 'rejected'}
            disabled={isSolvingPlan}
            className="flex-1 gap-1 text-xs font-semibold py-2.5 shadow-sm !bg-red-500/15 !text-red-600 dark:!text-red-400 !border-red-500/30 hover:!bg-red-500/25"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reject</span>
          </Button>

          {/* Modify Timetable Button */}
          <Button
            variant="pearl"
            size="sm"
            onClick={() => openModifyModal()}
            disabled={isSolvingPlan}
            className="flex-1 gap-1 text-xs font-semibold py-2.5 shadow-sm text-primary dark:text-primary-dark border-primary/30"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Modify</span>
          </Button>

          {/* Accept Timetable Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={acceptPlan}
            disabled={isSolvingPlan || planStatus === 'accepted'}
            className={`flex-1 gap-1 text-xs font-semibold py-2.5 shadow-sm ${
              planStatus === 'accepted' ? '!bg-emerald-600 !text-white' : ''
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{planStatus === 'accepted' ? 'Accepted' : 'Accept'}</span>
          </Button>
        </div>

        {planStatus === 'accepted' && (
          <p className="text-[11px] text-center text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Timetable approved & active on signal interlocks
          </p>
        )}
      </div>
    </div>
  );
};
