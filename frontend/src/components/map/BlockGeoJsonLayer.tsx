import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRailwayStore } from '../../store/useRailwayStore';
import { getResourceBlockColor, getDerivedStatus, getStatusLabel } from '../../utils/status';
import { formatIssueTypeName, formatTime } from '../../utils/formatters';
import { ResourceInfo, Trip, AppMode } from '../../types';

export const BlockGeoJsonLayer: React.FC = () => {
  const map = useMap();
  const resources = useRailwayStore((state) => state.resources);
  const trips = useRailwayStore((state) => state.trips);
  const mode = useRailwayStore((state) => state.mode);
  const theme = useRailwayStore((state) => state.theme);
  const selectedResourceId = useRailwayStore((state) => state.selectedResourceId);
  const hoveredResourceId = useRailwayStore((state) => state.hoveredResourceId);
  const setSelectedResource = useRailwayStore((state) => state.setSelectedResource);
  const setHoveredResource = useRailwayStore((state) => state.setHoveredResource);

  const isDark = theme === 'dark';
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineMapRef = useRef<Map<number, { casing: L.Polyline; core: L.Polyline }>>(new Map());

  // Helper to find trip allocation for a resource
  const findTripAllocation = (resourceId: number) => {
    for (const trip of trips) {
      const alloc = trip.resource_allocations?.find((a) => a.resource_id === resourceId);
      if (alloc) {
        return { trip, alloc };
      }
    }
    return undefined;
  };

  // Initialize and render Leaflet Polylines for each resource
  useEffect(() => {
    if (!resources || resources.length === 0 || !map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      layerGroupRef.current.clearLayers();
    }

    polylineMapRef.current.clear();

    resources.forEach((resInfo) => {
      const resourceId = resInfo.resource.id;
      const latLngs: L.LatLngExpression[] = resInfo.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      const tripData = findTripAllocation(resourceId);
      const color = getResourceBlockColor(
        mode,
        resInfo,
        tripData?.alloc,
        tripData?.trip.train,
        isDark
      );

      const isSelected = selectedResourceId === resourceId;
      const isHovered = hoveredResourceId === resourceId;

      // 1. Outer Casing
      const casing = L.polyline(latLngs, {
        color: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        weight: isSelected ? 11 : isHovered ? 9 : 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // 2. Inner Colored Line
      const core = L.polyline(latLngs, {
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 7 : isHovered ? 6 : 4.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: `resource-line-${resourceId}`,
      });

      const handleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (mode === 'report') {
          setSelectedResource(resourceId);
        }
      };

      casing.on('click', handleClick);
      core.on('click', handleClick);

      const handleMouseOver = () => setHoveredResource(resourceId);
      const handleMouseOut = () => setHoveredResource(null);

      casing.on('mouseover', handleMouseOver);
      casing.on('mouseout', handleMouseOut);
      core.on('mouseover', handleMouseOver);
      core.on('mouseout', handleMouseOut);

      attachTooltip(core, resInfo, mode, tripData?.trip);

      casing.addTo(layerGroupRef.current!);
      core.addTo(layerGroupRef.current!);

      polylineMapRef.current.set(resourceId, { casing, core });
    });

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [resources, map]);

  // Restyle existing layers when mode, selection, or issue state updates
  useEffect(() => {
    if (!resources) return;

    resources.forEach((resInfo) => {
      const resourceId = resInfo.resource.id;
      const pair = polylineMapRef.current.get(resourceId);

      if (pair) {
        const { casing, core } = pair;
        const tripData = findTripAllocation(resourceId);
        const color = getResourceBlockColor(
          mode,
          resInfo,
          tripData?.alloc,
          tripData?.trip.train,
          isDark
        );

        const isSelected = selectedResourceId === resourceId;
        const isHovered = hoveredResourceId === resourceId;

        casing.setStyle({
          color: isSelected ? (isDark ? '#2997ff' : '#0066cc') : isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          weight: isSelected ? 11 : isHovered ? 9 : 7,
          opacity: isSelected ? 0.9 : 0.8,
        });

        core.setStyle({
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 7 : isHovered ? 6 : 4.5,
          opacity: 1,
          dashArray: isSelected ? '4, 6' : undefined,
        });

        const coreEl = core.getElement() as HTMLElement | SVGElement | null;
        const casingEl = casing.getElement() as HTMLElement | SVGElement | null;
        const cursor = mode === 'report' ? 'pointer' : 'default';

        if (coreEl && 'style' in coreEl) coreEl.style.cursor = cursor;
        if (casingEl && 'style' in casingEl) casingEl.style.cursor = cursor;

        attachTooltip(core, resInfo, mode, tripData?.trip);
      }
    });
  }, [mode, isDark, selectedResourceId, hoveredResourceId, resources, trips]);

  return null;
};

/**
 * Tooltip builder for ResourceInfo
 */
function attachTooltip(
  polyline: L.Polyline,
  resInfo: ResourceInfo,
  mode: AppMode,
  trip?: Trip
) {
  let content = '';

  if (mode === 'report') {
    const derivedStatus = getDerivedStatus(resInfo);
    const statusLabel = getStatusLabel(derivedStatus);
    const issuesCount = resInfo.issues?.length || 0;

    content = `
      <div style="min-width: 200px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; letter-spacing: -0.2px;">${resInfo.name}</span>
          <span style="font-size: 10px; color: #8e8e93; font-family: monospace;">ID: #${resInfo.resource.id}</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="color: #8e8e93;">Status:</span>
          <span style="font-weight: 600;">${statusLabel}</span>
        </div>
        <div style="font-size: 11px; color: #8e8e93; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px; display: flex; justify-content: space-between;">
          <span>Length: ${resInfo.length_m}m</span>
          <span style="color: ${issuesCount > 0 ? '#ff9f0a' : '#30d158'}; font-weight: 600;">
            ${issuesCount === 0 ? 'Clear (0 issues)' : `${issuesCount} issue${issuesCount > 1 ? 's' : ''}`}
          </span>
        </div>
        ${
          issuesCount > 0
            ? `<div style="font-size: 10px; color: #ff453a; margin-top: 3px;">${formatIssueTypeName(
                resInfo.issues[0].issue_type
              )}</div>`
            : ''
        }
        <div style="font-size: 9px; color: #2997ff; margin-top: 5px; text-align: right; font-weight: 500;">Click to inspect / report</div>
      </div>
    `;
  } else if (mode === 'ai-plan') {
    const trainId = trip?.train || resInfo.active_train || 'None';
    const trainName = trip?.train_name || resInfo.train_name || 'Unassigned';
    const alloc = trip?.resource_allocations?.find((a) => a.resource_id === resInfo.resource.id);
    const entryFormatted = alloc ? formatTime(alloc.entry_time) : '10:00 AM';
    const exitFormatted = alloc ? formatTime(alloc.exit_time) : '10:04 AM';
    const speed = alloc?.planned_speed_kmh || resInfo.max_speed_kmh || 130;
    const headway = alloc?.headway_seconds || 180;

    content = `
      <div style="min-width: 210px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: #30d158;">AI Timetable Plan</span>
          <span style="font-size: 10px; color: #8e8e93;">#${resInfo.resource.id}</span>
        </div>
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 2px;">
          Train #${trainId} · ${trainName}
        </div>
        <div style="font-size: 11px; color: #8e8e93; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px; margin-top: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Planned Slot:</span>
            <span style="color: #ffffff; font-weight: 600;">${entryFormatted} → ${exitFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Target Speed:</span>
            <span style="color: #64d2ff; font-weight: 600;">${speed} km/h</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Min Headway:</span>
            <span style="color: #ffd60a;">${headway}s</span>
          </div>
        </div>
      </div>
    `;
  }

  polyline.unbindTooltip();
  polyline.bindTooltip(content, {
    className: 'custom-rail-tooltip',
    sticky: true,
    direction: 'top',
    opacity: 0.98,
  });
}
