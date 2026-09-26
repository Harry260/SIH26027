import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Clock,
  Sparkles,
  Wrench,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';
import { Trip, TripId, RepairRequest, Time } from '../../types';
import { formatTime } from '../../utils/formatters';
import { Button } from '../common/Button';

export const PlanModifyModal: React.FC = () => {
  const isModifyModalOpen = useRailwayStore((state) => state.isModifyModalOpen);
  const activeModifyTripId = useRailwayStore((state) => state.activeModifyTripId);
  const closeModifyModal = useRailwayStore((state) => state.closeModifyModal);
  const trips = useRailwayStore((state) => state.trips);
  const resources = useRailwayStore((state) => state.resources);
  const isSolvingPlan = useRailwayStore((state) => state.isSolvingPlan);
  const updatePlanWithOptimization = useRailwayStore(
    (state) => state.updatePlanWithOptimization
  );

  // Local draft state for modifying trips
  const [draftTrips, setDraftTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<TripId | null>(null);

  // Maintenance repair requests draft
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [isAddingRepair, setIsAddingRepair] = useState(false);
  const [repairResourceId, setRepairResourceId] = useState<number>(
    resources[0]?.resource.id || 1001
  );
  const [repairStart, setRepairStart] = useState<Time>(620); // 10:20 AM
  const [repairEnd, setRepairEnd] = useState<Time>(660); // 11:00 AM

  // Sync draft state when modal opens
  useEffect(() => {
    if (isModifyModalOpen && trips.length > 0) {
      setDraftTrips(JSON.parse(JSON.stringify(trips)));
      setSelectedTripId(activeModifyTripId || trips[0].id);
      setRepairs([]);
      setIsAddingRepair(false);
    }
  }, [isModifyModalOpen, trips, activeModifyTripId]);

  if (!isModifyModalOpen || draftTrips.length === 0) return null;

  const currentTrip = draftTrips.find((t) => t.id === selectedTripId) || draftTrips[0];

  // Helper to shift departure time for the selected trip
  const handleShiftDeparture = (deltaMinutes: number) => {
    setDraftTrips((prev) =>
      prev.map((t) => {
        if (t.id === currentTrip.id) {
          const updatedStations = t.stations.map((s) => {
            const shift = deltaMinutes;
            return {
              ...s,
              arrival: Math.max(0, s.arrival + shift),
              departure: Math.max(0, s.departure + shift),
            };
          });

          return {
            ...t,
            stations: updatedStations,
          };
        }
        return t;
      })
    );
  };

  // Helper to update dwell time at a specific stop
  const handleUpdateDwell = (stopIndex: number, newDwell: number) => {
    const validDwell = Math.max(1, newDwell);
    setDraftTrips((prev) =>
      prev.map((t) => {
        if (t.id === currentTrip.id) {
          const updatedStations = [...t.stations];
          const stop = updatedStations[stopIndex];
          if (stop) {
            updatedStations[stopIndex] = {
              ...stop,
              min_dwell: validDwell,
              departure: stop.arrival + validDwell,
            };
          }
          return {
            ...t,
            stations: updatedStations,
          };
        }
        return t;
      })
    );
  };

  // Add a maintenance repair window
  const handleAddRepair = () => {
    if (repairEnd <= repairStart) return;

    setRepairs((prev) => [
      ...prev,
      {
        resource_id: repairResourceId,
        time_start: repairStart,
        time_end: repairEnd,
      },
    ]);
    setIsAddingRepair(false);
  };

  const handleRemoveRepair = (index: number) => {
    setRepairs((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit modifications to AI Solver
  const handleApplyOptimization = async () => {
    await updatePlanWithOptimization(draftTrips, repairs);
  };

  const originStop = currentTrip.stations?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-ink dark:text-white border border-black/10 dark:border-white/10 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between glass-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-primary-dark">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight leading-tight">
                Modify Timetable & Dispatch Constraints
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Adjust departure slots, dwell times, or insert track repair windows.
              </p>
            </div>
          </div>

          <button
            onClick={closeModifyModal}
            aria-label="Close"
            className="p-1.5 rounded-full text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Train Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Select Train Schedule to Edit
            </label>
            <div className="grid grid-cols-3 gap-2">
              {draftTrips.map((trip) => {
                const isSelected = trip.id === currentTrip.id;
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-2.5 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 dark:bg-primary/25 border-primary text-primary dark:text-primary-dark font-semibold shadow-sm ring-1 ring-primary/40'
                        : 'glass-card text-ink dark:text-gray-200 hover:bg-white/30'
                    }`}
                  >
                    <div className="font-semibold truncate">#{trip.train}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {trip.train_name || 'Express'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Departure Slot Shift Card */}
          <div className="p-4 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary dark:text-primary-dark" />
                <span>Origin Departure Timing</span>
              </span>
              <span className="font-mono text-xs font-semibold text-primary dark:text-primary-dark">
                {originStop ? formatTime(originStop.departure) : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Shift departure offset:
              </span>
              <div className="flex items-center gap-1.5">
                {[-15, -5, +5, +15].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleShiftDeparture(delta)}
                    className="text-xs px-2.5 py-1.5 rounded-xl glass-input border border-black/10 dark:border-white/10 hover:border-primary font-mono text-ink dark:text-white transition-all cursor-pointer active:scale-95"
                  >
                    {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Station Dwell Times Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Station Stops & Dwell Durations
              </label>
            </div>

            <div className="space-y-2">
              {currentTrip.stations?.map((stop, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl glass-card text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-ink dark:text-white flex items-center gap-1.5">
                      <span>{stop.station_code}</span>
                      <span className="text-[11px] font-normal text-zinc-500">
                        ({idx === 0 ? 'Origin' : idx === currentTrip.stations.length - 1 ? 'Destination' : 'Intermediate'})
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      Arrival: {formatTime(stop.arrival)} · Departure: {formatTime(stop.departure)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px]">Dwell:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={stop.min_dwell}
                      onChange={(e) => handleUpdateDwell(idx, parseInt(e.target.value, 10) || 1)}
                      className="w-14 text-xs font-mono p-1 text-center rounded-lg glass-input border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[11px] text-zinc-500">mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Repair Blocks Section */}
          <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Track Maintenance Blocks ({repairs.length})
                </span>
              </div>

              {!isAddingRepair && (
                <button
                  type="button"
                  onClick={() => setIsAddingRepair(true)}
                  className="text-xs text-primary dark:text-primary-dark font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block Window</span>
                </button>
              )}
            </div>

            {/* New Repair Form */}
            {isAddingRepair && (
              <div className="p-3.5 rounded-2xl glass-card space-y-3 border border-amber-500/30 text-xs animate-scale-up">
                <div className="font-semibold text-ink dark:text-white flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span>Schedule Maintenance Window on Track</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-500">Block Resource</label>
                    <select
                      value={repairResourceId}
                      onChange={(e) => setRepairResourceId(parseInt(e.target.value, 10))}
                      className="w-full text-xs p-2 rounded-xl glass-input border border-black/10 dark:border-white/10 text-ink dark:text-white"
                    >
                      {resources.map((r) => (
                        <option key={r.resource.id} value={r.resource.id}>
                          {r.name} (#{r.resource.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-500">Start (Minutes 0-1440)</label>
                    <input
                      type="number"
                      step={5}
                      value={repairStart}
                      onChange={(e) => setRepairStart(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs p-2 rounded-xl glass-input border border-black/10 dark:border-white/10 text-ink dark:text-white"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatTime(repairStart)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-500">End (Minutes 0-1440)</label>
                    <input
                      type="number"
                      step={5}
                      value={repairEnd}
                      onChange={(e) => setRepairEnd(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs p-2 rounded-xl glass-input border border-black/10 dark:border-white/10 text-ink dark:text-white"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatTime(repairEnd)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="pearl"
                    size="sm"
                    onClick={() => setIsAddingRepair(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddRepair}
                    disabled={repairEnd <= repairStart}
                    className="text-xs"
                  >
                    Insert Block
                  </Button>
                </div>
              </div>
            )}

            {/* Active Repairs List */}
            {repairs.length > 0 && (
              <div className="space-y-1.5">
                {repairs.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl glass-card text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink dark:text-white">
                        Resource #{r.resource_id}
                      </span>
                      <span className="text-zinc-500">
                        {formatTime(r.time_start)} → {formatTime(r.time_end)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRepair(idx)}
                      className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                      title="Delete maintenance window"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 glass-card shrink-0 flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>AI solver guarantees non-conflicting block allocations.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="pearl"
              size="md"
              onClick={closeModifyModal}
              disabled={isSolvingPlan}
              className="text-xs font-medium"
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleApplyOptimization}
              isLoading={isSolvingPlan}
              disabled={isSolvingPlan}
              className="gap-1.5 text-xs font-semibold shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-calculate with AI Solver</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
