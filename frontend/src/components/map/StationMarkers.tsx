import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRailwayStore } from '../../store/useRailwayStore';

export const StationMarkers: React.FC = () => {
  const stations = useRailwayStore((state) => state.stations);
  const screen = useRailwayStore((state) => state.screen);
  const theme = useRailwayStore((state) => state.theme);
  const fromStation = useRailwayStore((state) => state.fromStation);
  const toStation = useRailwayStore((state) => state.toStation);
  const setFromStation = useRailwayStore((state) => state.setFromStation);
  const setToStation = useRailwayStore((state) => state.setToStation);

  const isDark = theme === 'dark';

  const createStationIcon = (code: string, isFrom: boolean, isTo: boolean) => {
    const isSelected = isFrom || isTo;
    const dotColor = isFrom
      ? '#0066cc'
      : isTo
      ? '#30d158'
      : isDark
      ? '#64d2ff'
      : '#0066cc';

    const pillBg = isDark
      ? 'rgba(20, 20, 24, 0.88)'
      : 'rgba(255, 255, 255, 0.92)';

    const textColor = isDark ? '#ffffff' : '#1d1d1f';
    const borderColor = isSelected
      ? isFrom
        ? '#0066cc'
        : '#30d158'
      : isDark
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)';

    return L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: ${isSelected ? '3px 9px 3px 6px' : '2px 7px 2px 5px'};
          background: ${pillBg};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: ${isSelected ? '2px' : '1px'} solid ${borderColor};
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(0,0,0, ${isDark ? '0.45' : '0.12'});
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <div style="
            width: ${isSelected ? '10px' : '7px'};
            height: ${isSelected ? '10px' : '7px'};
            border-radius: 50%;
            background-color: ${dotColor};
            box-shadow: 0 0 8px ${dotColor};
            flex-shrink: 0;
          "></div>
          <span style="
            font-size: ${isSelected ? '12px' : '11px'};
            font-weight: 600;
            color: ${textColor};
            letter-spacing: -0.2px;
            font-family: system-ui, -apple-system, sans-serif;
            white-space: nowrap;
          ">${code}</span>
        </div>
      `,
      iconSize: [0, 0],
    });
  };

  // On Screen 2, only show origin and destination stations for maximum clarity
  const displayedStations =
    screen === 'section'
      ? stations.filter((s) => s.code === fromStation || s.code === toStation)
      : stations;

  return (
    <>
      {displayedStations.map((station) => {
        const isFrom = station.code === fromStation;
        const isTo = station.code === toStation;

        return (
          <Marker
            key={station.code}
            position={[station.lat, station.lng]}
            icon={createStationIcon(station.code, isFrom, isTo)}
          >
            <Popup className="custom-station-popup">
              <div className="p-1 space-y-1.5 min-w-[170px]">
                <div className="font-semibold text-sm text-ink dark:text-white flex items-center justify-between">
                  <span>{station.name}</span>
                  <span className="text-xs bg-primary/10 text-primary font-mono px-1.5 py-0.5 rounded">
                    {station.code}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {station.state} · {station.zone} Zone
                </div>

                {screen === 'selection' && (
                  <div className="pt-2 flex gap-1.5 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setFromStation(station.code)}
                      className="flex-1 text-[11px] font-medium bg-primary text-white py-1 px-2 rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      Set Origin
                    </button>
                    <button
                      onClick={() => setToStation(station.code)}
                      className="flex-1 text-[11px] font-medium bg-zinc-800 text-white py-1 px-2 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Set Dest
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
