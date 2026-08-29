import { Station } from '../types/index.js';
import { SeededRandom } from '../utils/pseudoRandom.js';

/**
 * Calculates Great Circle distance between two lat/lng coordinates in km using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
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
 * Generates realistic curved railway geometry as a sequence of [lng, lat] coordinate points
 * using cubic Bezier / spline interpolation with seeded natural terrain curvature.
 */
export function generateCurvedRailwayLine(
  fromStation: Station,
  toStation: Station,
  numSamplePoints = 100
): [number, number][] {
  const rng = new SeededRandom(`${fromStation.code}-${toStation.code}`);

  const p0: [number, number] = [fromStation.lng, fromStation.lat];
  const p3: [number, number] = [toStation.lng, toStation.lat];

  const dx = p3[0] - p0[0];
  const dy = p3[1] - p0[1];
  const distance = Math.hypot(dx, dy);

  // Normal vector perpendicular to the straight line
  const nx = -dy / (distance || 1);
  const ny = dx / (distance || 1);

  // Magnitude of curvature (subtle bend characteristic of railway civil engineering)
  const curveScale1 = rng.nextFloat(-0.08, 0.08) * distance;
  const curveScale2 = rng.nextFloat(-0.06, 0.06) * distance;

  // Control points for cubic Bezier
  const p1: [number, number] = [
    p0[0] + dx * 0.33 + nx * curveScale1,
    p0[1] + dy * 0.33 + ny * curveScale1,
  ];

  const p2: [number, number] = [
    p0[0] + dx * 0.66 + nx * curveScale2,
    p0[1] + dy * 0.66 + ny * curveScale2,
  ];

  const points: [number, number][] = [];

  for (let i = 0; i <= numSamplePoints; i++) {
    const t = i / numSamplePoints;
    const invT = 1 - t;

    // Cubic Bezier formulation
    const lng =
      invT * invT * invT * p0[0] +
      3 * invT * invT * t * p1[0] +
      3 * invT * t * t * p2[0] +
      t * t * t * p3[0];

    const lat =
      invT * invT * invT * p0[1] +
      3 * invT * invT * t * p1[1] +
      3 * invT * t * t * p2[1] +
      t * t * t * p3[1];

    // Subtle micro-perturbation for realism
    const microJitter = (rng.next() - 0.5) * 0.0002;
    points.push([
      Number((lng + microJitter).toFixed(6)),
      Number((lat + microJitter).toFixed(6)),
    ]);
  }

  // Ensure exact endpoints match station locations
  points[0] = [fromStation.lng, fromStation.lat];
  points[points.length - 1] = [toStation.lng, toStation.lat];

  return points;
}

/**
 * Splits a full continuous polyline into N contiguous block section LineStrings
 */
export function splitLineIntoBlocks(
  fullLine: [number, number][],
  numBlocks: number
): [number, number][][] {
  const blocks: [number, number][][] = [];
  const totalPoints = fullLine.length;
  const pointsPerBlock = (totalPoints - 1) / numBlocks;

  for (let i = 0; i < numBlocks; i++) {
    const startIndex = Math.floor(i * pointsPerBlock);
    const endIndex = Math.min(
      Math.floor((i + 1) * pointsPerBlock) + 1,
      totalPoints
    );

    const blockPoints = fullLine.slice(startIndex, endIndex);
    if (blockPoints.length < 2 && startIndex > 0) {
      blockPoints.unshift(fullLine[startIndex - 1]);
    }
    blocks.push(blockPoints);
  }

  return blocks;
}
