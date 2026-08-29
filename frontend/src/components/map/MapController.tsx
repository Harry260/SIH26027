import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRailwayStore } from '../../store/useRailwayStore';

export const MapController: React.FC = () => {
  const map = useMap();
  const screen = useRailwayStore((state) => state.screen);
  const blocksData = useRailwayStore((state) => state.blocksData);
  const fromStation = useRailwayStore((state) => state.fromStation);
  const toStation = useRailwayStore((state) => state.toStation);
  const stations = useRailwayStore((state) => state.stations);

  // Screen 1: Center on India on initial load
  useEffect(() => {
    if (screen === 'selection') {
      const from = stations.find((s) => s.code === fromStation);
      const to = stations.find((s) => s.code === toStation);

      if (from && to) {
        const bounds = L.latLngBounds([
          [from.lat, from.lng],
          [to.lat, to.lng],
        ]);
        map.flyToBounds(bounds, { padding: [100, 100], duration: 1.2 });
      } else {
        map.flyTo([22.5, 78.9], 5, { duration: 1.2 }); // Center of India
      }
    }
  }, [screen, map, stations, fromStation, toStation]);

  // Screen 2: Fit bounds to block LineString geometry
  useEffect(() => {
    if (screen === 'section' && blocksData && blocksData.features.length > 0) {
      const allCoords: [number, number][] = [];
      blocksData.features.forEach((feature) => {
        feature.geometry.coordinates.forEach(([lng, lat]) => {
          allCoords.push([lat, lng]);
        });
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.flyToBounds(bounds, {
          padding: [80, 80],
          maxZoom: 13,
          duration: 1.5,
        });
      }
    }
  }, [screen, blocksData, map]);

  return null;
};

