import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRailwayStore } from '../../store/useRailwayStore';
import { getBlockColor, getDerivedStatus, getStatusLabel } from '../../utils/status';
import { formatIssueTypeName } from '../../utils/formatters';

export const BlockGeoJsonLayer: React.FC = () => {
  const map = useMap();
  const blocksData = useRailwayStore((state) => state.blocksData);
  const mode = useRailwayStore((state) => state.mode);
  const theme = useRailwayStore((state) => state.theme);
  const selectedBlockId = useRailwayStore((state) => state.selectedBlockId);
  const hoveredBlockId = useRailwayStore((state) => state.hoveredBlockId);
  const aiPlanData = useRailwayStore((state) => state.aiPlanData);
  const assetData = useRailwayStore((state) => state.assetData);
  const setSelectedBlock = useRailwayStore((state) => state.setSelectedBlock);
  const setHoveredBlock = useRailwayStore((state) => state.setHoveredBlock);

  const isDark = theme === 'dark';
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineMapRef = useRef<Map<string, { casing: L.Polyline; core: L.Polyline }>>(new Map());

  // Initialize and render Leaflet Polylines for each block
  useEffect(() => {
    if (!blocksData || !map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      layerGroupRef.current.clearLayers();
    }

    polylineMapRef.current.clear();

    blocksData.features.forEach((feature) => {
      const props = feature.properties;
      const blockId = props.block_id;
      // Convert [lng, lat] to Leaflet [lat, lng]
      const latLngs: L.LatLngExpression[] = feature.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      const color = getBlockColor(
        mode,
        props,
        aiPlanData?.[blockId],
        assetData?.[blockId],
        isDark
      );

      const isSelected = selectedBlockId === blockId;
      const isHovered = hoveredBlockId === blockId;

      // 1. Outer Casing / Track Border
      const casing = L.polyline(latLngs, {
        color: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        weight: isSelected ? 11 : isHovered ? 9 : 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // 2. Inner Colored Status Line
      const core = L.polyline(latLngs, {
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 7 : isHovered ? 6 : 4.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: `block-line-${blockId}`,
      });

      // Click handler
      const handleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (mode === 'report') {
          setSelectedBlock(blockId);
        }
      };

      casing.on('click', handleClick);
      core.on('click', handleClick);

      // Hover handlers
      const handleMouseOver = () => setHoveredBlock(blockId);
      const handleMouseOut = () => setHoveredBlock(null);

      casing.on('mouseover', handleMouseOver);
      casing.on('mouseout', handleMouseOut);
      core.on('mouseover', handleMouseOver);
      core.on('mouseout', handleMouseOut);

      // Attach tooltip
      attachTooltip(core, blockId, props, mode, aiPlanData?.[blockId], assetData?.[blockId]);

      casing.addTo(layerGroupRef.current!);
      core.addTo(layerGroupRef.current!);

      polylineMapRef.current.set(blockId, { casing, core });
    });

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [blocksData, map]);

  // Restyle existing layers without re-parsing geometry on mode / selection / issue updates
  useEffect(() => {
    if (!blocksData) return;

    blocksData.features.forEach((feature) => {
      const props = feature.properties;
      const blockId = props.block_id;
      const pair = polylineMapRef.current.get(blockId);

      if (pair) {
        const { casing, core } = pair;
        const color = getBlockColor(
          mode,
          props,
          aiPlanData?.[blockId],
          assetData?.[blockId],
          isDark
        );

        const isSelected = selectedBlockId === blockId;
        const isHovered = hoveredBlockId === blockId;

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

        // Update cursor style
        const coreEl = core.getElement() as HTMLElement | SVGElement | null;
        const casingEl = casing.getElement() as HTMLElement | SVGElement | null;
        const cursor = mode === 'report' ? 'pointer' : 'default';

        if (coreEl && 'style' in coreEl) coreEl.style.cursor = cursor;
        if (casingEl && 'style' in casingEl) casingEl.style.cursor = cursor;

        // Re-attach mode-specific tooltip
        attachTooltip(
          core,
          blockId,
          props,
          mode,
          aiPlanData?.[blockId],
          assetData?.[blockId]
        );
      }
    });
  }, [mode, isDark, selectedBlockId, hoveredBlockId, blocksData, aiPlanData, assetData]);

  return null;
};

/**
 * Builds sleek Apple-style HTML tooltips for Leaflet polylines
 */
function attachTooltip(
  polyline: L.Polyline,
  blockId: string,
  props: any,
  mode: string,
  aiPlan?: any,
  asset?: any
) {
  let content = '';

  if (mode === 'report') {
    const derivedStatus = getDerivedStatus(props);
    const statusLabel = getStatusLabel(derivedStatus);
    const issuesCount = props.issues?.length || 0;

    content = `
      <div style="min-width: 200px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; letter-spacing: -0.2px;">${blockId}</span>
          <span style="font-size: 10px; color: #8e8e93; font-family: monospace;">#${props.sequence}</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="color: #8e8e93;">Status:</span>
          <span style="font-weight: 600;">${statusLabel}</span>
        </div>
        <div style="font-size: 11px; color: #8e8e93; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px; display: flex; justify-content: space-between;">
          <span>Length: ${props.length_m}m</span>
          <span style="color: ${issuesCount > 0 ? '#ff9f0a' : '#30d158'}; font-weight: 600;">
            ${issuesCount === 0 ? 'Clear (0 issues)' : `${issuesCount} issue${issuesCount > 1 ? 's' : ''}`}
          </span>
        </div>
        ${
          issuesCount > 0
            ? `<div style="font-size: 10px; color: #ff453a; margin-top: 3px;">${formatIssueTypeName(
                props.issues[0].issue_type
              )}</div>`
            : ''
        }
        <div style="font-size: 9px; color: #2997ff; margin-top: 5px; text-align: right; font-weight: 500;">Click to inspect / report</div>
      </div>
    `;
  } else if (mode === 'ai-plan') {
    const trainId = aiPlan?.train_id || props.train_id || 'None';
    const trainName = aiPlan?.train_name || props.train_name || 'Unassigned';
    const entry = aiPlan?.entry_time || '10:00';
    const exit = aiPlan?.exit_time || '10:04';
    const speed = aiPlan?.planned_speed_kmh || props.max_speed_kmh || 130;
    const headway = aiPlan?.headway_seconds || 180;

    content = `
      <div style="min-width: 210px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: #30d158;">AI Dispatch Plan</span>
          <span style="font-size: 10px; color: #8e8e93;">${blockId}</span>
        </div>
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 2px;">
          ${trainId} · ${trainName}
        </div>
        <div style="font-size: 11px; color: #8e8e93; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px; margin-top: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Planned Window:</span>
            <span style="color: #ffffff; font-weight: 600;">${entry} → ${exit}</span>
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
  } else if (mode === 'asset') {
    const idle = asset?.idle_minutes ?? 0;
    const assetId = asset?.asset_id || 'Loco WAP-7';
    const assetType = asset?.asset_type || 'Electric Locomotive';
    const status = asset?.asset_status || 'Optimal Transit';

    content = `
      <div style="min-width: 210px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: #64d2ff;">Asset Availability</span>
          <span style="font-size: 10px; color: #8e8e93;">${blockId}</span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px;">
          <span style="font-size: 22px; font-weight: 700; color: ${
            idle > 60 ? '#ff453a' : idle > 25 ? '#ffd60a' : '#30d158'
          };">${idle}</span>
          <span style="font-size: 11px; color: #8e8e93;">minutes idle delay</span>
        </div>
        <div style="font-size: 11px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #8e8e93;">Asset:</span>
            <span style="font-weight: 600; color: #ffffff;">${assetId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #8e8e93;">Type:</span>
            <span style="color: #cccccc;">${assetType}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #8e8e93;">Telemetry:</span>
            <span style="font-weight: 500; color: ${
              idle > 60 ? '#ff453a' : '#30d158'
            };">${status}</span>
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
