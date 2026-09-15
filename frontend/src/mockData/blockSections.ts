import { ResourceInfo, Station } from '../types';
import { findStation } from './stations';

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

export function generateDynamicResources(fromStation: Station, toStation: Station): ResourceInfo[] {
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

  const resources: ResourceInfo[] = [];
  const pointsPerBlock = Math.floor(coords.length / numBlocks);
  const baseResourceId = fromStation.id * 1000 + toStation.id * 10;

  for (let i = 0; i < numBlocks; i++) {
    const startIdx = i * pointsPerBlock;
    const endIdx = i === numBlocks - 1 ? coords.length : (i + 1) * pointsPerBlock + 1;
    const blockCoords = coords.slice(startIdx, endIdx);
    const seq = i + 1;
    const resourceId = baseResourceId + seq;
    const mid = blockCoords[Math.floor(blockCoords.length / 2)] || [fromStation.lng, fromStation.lat];

    resources.push({
      resource: {
        id: resourceId,
        kind: 'block_section',
        lane_count: 2,
      },
      name: `ABS-${fromStation.code}-${100 + i * 2}UP`,
      sequence: seq,
      location: [mid[0], mid[1]],
      coordinates: blockCoords,
      length_m: 1200 + (i % 5) * 100,
      max_speed_kmh: 130,
      gradient: i % 3 === 0 ? 'Level' : i % 3 === 1 ? '1 in 200 Rising' : '1 in 150 Falling',
      occupancy: i === 3 ? 'occupied' : i === 4 ? 'reserved' : 'free',
      active_train: i === 3 ? 22436 : undefined,
      train_name: i === 3 ? 'Vande Bharat Express' : undefined,
      issues:
        i === 7
          ? [
              {
                issue_id: 1001,
                issue_type: 'speed_restriction',
                description: 'Caution Order 40 km/h active due to ballast stabilization',
                severity: 'medium',
                reported_by: 'P-WAY Section Incharge',
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
              },
            ]
          : [],
    });
  }

  return resources;
}

export function getBlockSectionsForRoute(fromCode: string, toCode: string): ResourceInfo[] | null {
  const fromStation = findStation(fromCode);
  const toStation = findStation(toCode);

  if (!fromStation || !toStation) {
    return null;
  }

  return generateDynamicResources(fromStation, toStation);
}
