import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { INDIAN_RAILWAYS_TRUNK_NETWORK } from '../../mockData/railwayNetwork';
import { useRailwayStore } from '../../store/useRailwayStore';

export const RailwayNetworkLayer: React.FC = () => {
  const screen = useRailwayStore((state) => state.screen);
  const theme = useRailwayStore((state) => state.theme);
  const isDark = theme === 'dark';

  const isSectionScreen = screen === 'section';
  const trackColor = isDark ? '#3e3e46' : '#a1a1aa';
  const trackWeight = isSectionScreen ? 2 : 3;
  const trackOpacity = isSectionScreen ? 0.25 : 0.7;

  return (
    <>
      {INDIAN_RAILWAYS_TRUNK_NETWORK.map((line) => {
        const latLngs: L.LatLngExpression[] = line.coordinates.map(([lng, lat]) => [lat, lng]);

        return (
          <React.Fragment key={line.id}>
            {/* Outer Rail Corridor Line */}
            <Polyline
              positions={latLngs}
              pathOptions={{
                color: trackColor,
                weight: trackWeight,
                opacity: trackOpacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              {!isSectionScreen && (
                <Tooltip
                  direction="top"
                  className="custom-rail-tooltip"
                  sticky
                  opacity={0.95}
                >
                  <div className="text-xs font-medium text-white">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Indian Railways Trunk
                    </div>
                    {line.name}
                  </div>
                </Tooltip>
              )}
            </Polyline>

            {/* Inner Sleeper Dash Track */}
            {!isSectionScreen && (
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: isDark ? '#1c1c20' : '#ffffff',
                  weight: 1.2,
                  opacity: 0.85,
                  dashArray: '3, 6',
                  lineCap: 'butt',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
