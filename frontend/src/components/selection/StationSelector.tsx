import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Sparkles, MapPin, AlertTriangle, ArrowRight, Train } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';
import { Button } from '../common/Button';
import { ThemeToggle } from '../section/ThemeToggle';

export const StationSelector: React.FC = () => {
  const stations = useRailwayStore((state) => state.stations);
  const supportedCorridors = useRailwayStore((state) => state.supportedCorridors);
  const fromStation = useRailwayStore((state) => state.fromStation);
  const toStation = useRailwayStore((state) => state.toStation);
  const setFromStation = useRailwayStore((state) => state.setFromStation);
  const setToStation = useRailwayStore((state) => state.setToStation);
  const selectCorridorPreset = useRailwayStore((state) => state.selectCorridorPreset);
  const loadSection = useRailwayStore((state) => state.loadSection);
  const isLoadingSection = useRailwayStore((state) => state.isLoadingSection);
  const selectionError = useRailwayStore((state) => state.selectionError);

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  const selectedFromStation = stations.find((s) => s.code === fromStation);
  const selectedToStation = stations.find((s) => s.code === toStation);

  const filteredFromStations = useMemo(() => {
    if (!fromQuery) return stations;
    const q = fromQuery.toLowerCase();
    return stations.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.state.toLowerCase().includes(q)
    );
  }, [stations, fromQuery]);

  const filteredToStations = useMemo(() => {
    if (!toQuery) return stations;
    const q = toQuery.toLowerCase();
    return stations.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.state.toLowerCase().includes(q)
    );
  }, [stations, toQuery]);

  // Check if current pair is one of the supported corridors
  const matchedCorridor = useMemo(() => {
    if (!fromStation || !toStation) return null;
    return supportedCorridors.find(
      (c) =>
        (c.fromCode === fromStation && c.toCode === toStation) ||
        (c.fromCode === toStation && c.toCode === fromStation)
    );
  }, [fromStation, toStation, supportedCorridors]);

  const isPairValid = !!matchedCorridor;

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleLoad = () => {
    if (fromStation && toStation && isPairValid) {
      loadSection(fromStation, toStation);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar: Title & Theme Toggle */}
      <div className="pointer-events-auto flex items-center justify-between">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full glass-panel text-ink dark:text-white">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ink dark:text-white tracking-tight leading-tight">
              AI Automatic Block Planning
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Indian Railways · SIH26027 (OpenStreetMap, Zero API Keys)
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Center/Floating Corridor Selector Card with deep backdrop blur */}
      <div className="pointer-events-auto mx-auto w-full max-w-xl glass-panel rounded-3xl p-6 md:p-8 space-y-6 animate-scale-up text-ink dark:text-white">
        {/* Header */}
        <div className="space-y-1 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:text-primary-dark">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Railway Corridor</span>
          </span>
          <h2 className="text-2xl font-semibold text-ink dark:text-white tracking-tight-title">
            Configure Section Operations
          </h2>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
            Choose station anchors to initialize 4-aspect automatic block telemetry and train routing.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-2">
            {/* From Station */}
            <div className="relative">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">
                Origin Station
              </label>
              <div
                onClick={() => {
                  setIsFromOpen(true);
                  setIsToOpen(false);
                }}
                className="mt-1 flex items-center justify-between p-3 rounded-2xl glass-card cursor-pointer hover:border-primary transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-sm text-ink dark:text-white mr-1.5">
                      {selectedFromStation?.code || 'Select'}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
                      {selectedFromStation?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* From Dropdown Autocomplete */}
              {isFromOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl glass-panel shadow-2xl p-2 max-h-60 overflow-y-auto space-y-1">
                  <input
                    type="text"
                    placeholder="Search station code or city..."
                    value={fromQuery}
                    onChange={(e) => setFromQuery(e.target.value)}
                    autoFocus
                    className="w-full text-xs p-2.5 rounded-xl glass-input text-ink dark:text-white border border-transparent focus:border-primary focus:outline-none mb-1"
                  />
                  {filteredFromStations.map((s) => (
                    <div
                      key={s.code}
                      onClick={() => {
                        setFromStation(s.code);
                        setIsFromOpen(false);
                        setFromQuery('');
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-primary/15 hover:text-primary cursor-pointer transition-colors text-ink dark:text-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.code}</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{s.zone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:pt-4">
              <button
                type="button"
                onClick={handleSwapStations}
                className="p-2.5 rounded-full glass-card hover:bg-white/70 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-transform active:rotate-180"
                title="Swap stations"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* To Station */}
            <div className="relative">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">
                Destination Station
              </label>
              <div
                onClick={() => {
                  setIsToOpen(true);
                  setIsFromOpen(false);
                }}
                className="mt-1 flex items-center justify-between p-3 rounded-2xl glass-card cursor-pointer hover:border-primary transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-sm text-ink dark:text-white mr-1.5">
                      {selectedToStation?.code || 'Select'}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
                      {selectedToStation?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* To Dropdown Autocomplete */}
              {isToOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl glass-panel shadow-2xl p-2 max-h-60 overflow-y-auto space-y-1">
                  <input
                    type="text"
                    placeholder="Search station code or city..."
                    value={toQuery}
                    onChange={(e) => setToQuery(e.target.value)}
                    autoFocus
                    className="w-full text-xs p-2.5 rounded-xl glass-input text-ink dark:text-white border border-transparent focus:border-primary focus:outline-none mb-1"
                  />
                  {filteredToStations.map((s) => (
                    <div
                      key={s.code}
                      onClick={() => {
                        setToStation(s.code);
                        setIsToOpen(false);
                        setToQuery('');
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-primary/15 hover:text-primary cursor-pointer transition-colors text-ink dark:text-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.code}</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{s.zone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Validation & Supported Corridors Notice */}
          {!isPairValid && fromStation && toStation && (
            <div className="p-3 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 backdrop-blur-md flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-medium">Selected station pair is not currently modeled in demo telemetry.</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5">
                  Demo data is pre-configured for: <span className="font-semibold text-amber-700 dark:text-amber-300">NDLS ↔ AGC</span>,{' '}
                  <span className="font-semibold text-amber-700 dark:text-amber-300">MAS ↔ SBC</span>, or{' '}
                  <span className="font-semibold text-amber-700 dark:text-amber-300">MMCT ↔ BRC</span>.
                </p>
              </div>
            </div>
          )}

          {selectionError && (
            <div className="p-3 rounded-xl bg-red-500/15 dark:bg-red-500/25 border border-red-500/30 backdrop-blur-md text-xs text-red-600 dark:text-red-300">
              {selectionError}
            </div>
          )}
        </div>

        {/* Quick Corridor Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            High-Density Mainline Corridors
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {supportedCorridors.map((c) => {
              const isSelected =
                (fromStation === c.fromCode && toStation === c.toCode) ||
                (fromStation === c.toCode && toStation === c.fromCode);

              return (
                <button
                  key={`${c.fromCode}-${c.toCode}`}
                  type="button"
                  onClick={() => selectCorridorPreset(c.fromCode, c.toCode)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-primary/20 dark:bg-primary/30 border-primary text-primary dark:text-primary-dark font-medium shadow-sm ring-1 ring-primary backdrop-blur-md'
                      : 'glass-card text-ink dark:text-gray-100 hover:border-zinc-400'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>
                      {c.fromCode} ↔ {c.toCode}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{c.distance_km}km</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate mt-0.5">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Load Section Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleLoad}
          disabled={!isPairValid || isLoadingSection}
          isLoading={isLoadingSection}
          className="w-full gap-2 text-base font-semibold shadow-lg"
        >
          <span>Load Section & Blocks</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Footer Info */}
      <div className="pointer-events-auto text-center text-xs text-zinc-600 dark:text-zinc-400 font-medium">
        Click any station node on the map or select from the corridor list above.
      </div>
    </div>
  );
};
