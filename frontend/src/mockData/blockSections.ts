import { BlockFeature, BlockFeatureCollection, Station } from '../types';
import { findStation } from './stations';

/**
 * Calculates Great Circle distance between two lat/lng coordinates in km using Haversine formula
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generates dynamic block sections between any two stations on the client side
 */
function generateDynamicBlockSections(fromStation: Station, toStation: Station): BlockFeatureCollection {
  const straightDist = calculateHaversineDistance(
    fromStation.lat,
    fromStation.lng,
    toStation.lat,
    toStation.lng
  );
  const railDistanceKm = Math.round(straightDist * 1.18);
  const numBlocks = Math.max(16, Math.min(32, Math.round(railDistanceKm / 14)));

  const pointsCount = numBlocks * 3 + 1;
  const coords: [number, number][] = [];

  const p0: [number, number] = [fromStation.lng, fromStation.lat];
  const p3: [number, number] = [toStation.lng, toStation.lat];
  const dx = p3[0] - p0[0];
  const dy = p3[1] - p0[1];
  const dist = Math.hypot(dx, dy);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  const p1: [number, number] = [p0[0] + dx * 0.33 + nx * 0.05 * dist, p0[1] + dy * 0.33 + ny * 0.05 * dist];
  const p2: [number, number] = [p0[0] + dx * 0.66 - nx * 0.04 * dist, p0[1] + dy * 0.66 - ny * 0.04 * dist];

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const invT = 1 - t;
    const lng = invT * invT * invT * p0[0] + 3 * invT * invT * t * p1[0] + 3 * invT * t * t * p2[0] + t * t * t * p3[0];
    const lat = invT * invT * invT * p0[1] + 3 * invT * invT * t * p1[1] + 3 * invT * t * t * p2[1] + t * t * t * p3[1];
    coords.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }

  const features: BlockFeature[] = [];
  const pointsPerBlock = Math.floor(coords.length / numBlocks);

  for (let i = 0; i < numBlocks; i++) {
    const startIdx = i * pointsPerBlock;
    const endIdx = i === numBlocks - 1 ? coords.length : (i + 1) * pointsPerBlock + 1;
    const blockCoords = coords.slice(startIdx, endIdx);
    const seq = i + 1;
    const blockId = `${fromStation.code}-${toStation.code}-BLK-${String(seq).padStart(2, '0')}`;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: blockCoords,
      },
      properties: {
        block_id: blockId,
        sequence: seq,
        start_signal: `ABS-${fromStation.code}-${100 + i * 2}UP`,
        end_signal: `ABS-${fromStation.code}-${102 + i * 2}UP`,
        occupancy: i === 3 ? 'occupied' : i === 4 ? 'reserved' : 'free',
        train_id: i === 3 ? '22436' : undefined,
        train_name: i === 3 ? 'Vande Bharat Express' : undefined,
        length_m: 1200 + (i % 5) * 100,
        max_speed_kmh: 130,
        gradient: i % 3 === 0 ? 'Level' : i % 3 === 1 ? '1 in 200 Rising' : '1 in 150 Falling',
        issues:
          i === 7
            ? [
                {
                  issue_id: `ISSUE-${fromStation.code}-07`,
                  issue_type: 'speed_restriction',
                  description: 'Caution Order 40 km/h active due to ballast stabilization',
                  severity: 'medium',
                  reported_by: 'P-WAY Section Incharge',
                  timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                },
              ]
            : [],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Returns block GeoJSON for any corridor
 */
export function getBlockSectionsForRoute(fromCode: string, toCode: string): BlockFeatureCollection | null {
  const fromStation = findStation(fromCode);
  const toStation = findStation(toCode);

  if (!fromStation || !toStation) {
    return null;
  }

  return generateDynamicBlockSections(fromStation, toStation);
}
