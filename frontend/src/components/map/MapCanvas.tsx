import React from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Plus, Minus } from 'lucide-react';
import { useRailwayStore } from '../../store/useRailwayStore';
import { MapController } from './MapController';
import { StationMarkers } from './StationMarkers';
import { BlockGeoJsonLayer } from './BlockGeoJsonLayer';
import { RailwayNetworkLayer } from './RailwayNetworkLayer';

// Sleek floating zoom controls
const ZoomControls: React.FC = () => {
  const map = useMap();

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-1.5 p-1 rounded-2xl glass-panel shadow-apple-glass dark:shadow-apple-glass-dark pointer-events-auto">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom In"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-white transition-colors active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>
      <div className="w-full h-px bg-black/10 dark:bg-white/10" />
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom Out"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-white transition-colors active:scale-95 cursor-pointer"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

export const MapCanvas: React.FC = () => {
  const theme = useRailwayStore((state) => state.theme);
  const screen = useRailwayStore((state) => state.screen);
  const isDark = theme === 'dark';

  // 100% Free, Road-Free, Highway-Free Canvas Basemaps (Zero API Keys)
  // These basemaps contain ONLY clean geographic land/water contours and major place names — no roads or streets.
  const baseTileUrl = isDark
    ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    : 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  const labelTileUrl = isDark
    ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
    : 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

  const attribution =
    '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> &copy; Indian Railways GIS';

  return (
    <div className="absolute inset-0 w-full h-full">
      <MapContainer
        center={[28.6143, 77.2189]}
        zoom={6}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        {/* 1. Road-free, Highway-free Clean Canvas Base */}
        <TileLayer
          key={isDark ? 'dark-canvas-base' : 'light-canvas-base'}
          url={baseTileUrl}
          maxZoom={16}
          attribution={attribution}
        />

        {/* 2. Authentic Indian Railways Trunk Corridors */}
        <RailwayNetworkLayer />

        {/* 3. Interactive 4-Aspect Section Blocks (Screen 2) */}
        {screen === 'section' && <BlockGeoJsonLayer />}

        {/* 4. Relevant Place & City Names Only (No road or street labels) */}
        <TileLayer
          key={isDark ? 'dark-canvas-labels' : 'light-canvas-labels'}
          url={labelTileUrl}
          maxZoom={16}
          opacity={isDark ? 0.75 : 0.85}
        />

        {/* 5. Station Nodes and Hub Pins */}
        <StationMarkers />

        {/* 6. Smooth Camera Animator */}
        <MapController />

        {/* 7. Floating Zoom Controls */}
        <ZoomControls />
      </MapContainer>
    </div>
  );
};
