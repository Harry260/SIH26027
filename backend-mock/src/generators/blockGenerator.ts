import {
  Station,
  BlockFeature,
  BlockFeatureCollection,
  BlockProperties,
  BlockIssue,
  BaseOccupancy,
} from '../types/index.js';
import { SeededRandom } from '../utils/pseudoRandom.js';
import {
  calculateHaversineDistance,
  generateCurvedRailwayLine,
  splitLineIntoBlocks,
} from './geometryGenerator.js';

const SAMPLE_TRAIN_SERVICES = [
  { id: '22436', name: 'Vande Bharat Express' },
  { id: '12002', name: 'Shatabdi Express' },
  { id: '12301', name: 'Howrah Rajdhani Express' },
  { id: '12952', name: 'Mumbai Tejas Rajdhani' },
  { id: '12260', name: 'Duronto Express' },
  { id: 'BOXN-8842', name: 'Heavy-Haul Coal Freight' },
  { id: 'BCNA-4491', name: 'Container Freight Express' },
  { id: '12626', name: 'Kerala Superfast Express' },
];

const GRADIENTS = [
  'Level',
  '1 in 200 Rising',
  '1 in 150 Falling',
  '1 in 300 Rising',
  '1 in 250 Falling',
  'Level',
];

const SPEED_LIMITS = [110, 120, 130, 130, 140, 160];

const TYPICAL_ISSUES = [
  {
    type: 'speed_restriction' as const,
    severity: 'medium' as const,
    description: 'Track renewal in progress — 30 km/h temporary speed restriction enforced',
  },
  {
    type: 'signal_fault' as const,
    severity: 'high' as const,
    description: 'Track circuit voltage fluctuation; signal held at Danger',
  },
  {
    type: 'maintenance' as const,
    severity: 'low' as const,
    description: 'Routine overhead OHE contact wire inspection schedule',
  },
  {
    type: 'obstruction' as const,
    severity: 'high' as const,
    description: 'Fallen tree branch encroaching overhead pantograph clearance',
  },
  {
    type: 'speed_restriction' as const,
    severity: 'low' as const,
    description: 'Cattle guard repair work; 50 km/h caution order active',
  },
];

/**
 * Generates a full GeoJSON FeatureCollection of block sections between any two stations.
 */
export function generateBlockSectionsForCorridor(
  fromStation: Station,
  toStation: Station
): BlockFeatureCollection {
  const seedKey = `${fromStation.code}-${toStation.code}`;
  const rng = new SeededRandom(seedKey);

  // 1. Calculate distance
  const straightDist = calculateHaversineDistance(
    fromStation.lat,
    fromStation.lng,
    toStation.lat,
    toStation.lng
  );
  const railDistanceKm = Math.round(straightDist * 1.18);

  // Determine number of blocks based on distance (clamp between 16 and 32 blocks)
  const numBlocks = Math.max(16, Math.min(32, Math.round(railDistanceKm / 14)));

  // 2. Generate smooth geometry
  const fullLine = generateCurvedRailwayLine(fromStation, toStation, numBlocks * 4);
  const blockGeometries = splitLineIntoBlocks(fullLine, numBlocks);

  // 3. Pick 1-2 blocks for trains and 1-2 blocks for reservations
  const occupiedIndex1 = rng.nextInt(2, Math.floor(numBlocks / 2) - 1);
  const occupiedIndex2 = rng.nextInt(Math.floor(numBlocks / 2) + 2, numBlocks - 3);
  const reservedIndex1 = (occupiedIndex1 + 1) % numBlocks;
  const reservedIndex2 = (occupiedIndex2 + 1) % numBlocks;

  // Pick 2-3 blocks to have seeded initial issues
  const issueIndices = new Set<number>();
  issueIndices.add(rng.nextInt(1, Math.floor(numBlocks / 2)));
  issueIndices.add(rng.nextInt(Math.floor(numBlocks / 2) + 1, numBlocks - 2));
  if (rng.chance(0.5)) {
    issueIndices.add(rng.nextInt(0, numBlocks - 1));
  }

  const features: BlockFeature[] = [];

  for (let i = 0; i < numBlocks; i++) {
    const blockNum = i + 1;
    const blockId = `${fromStation.code}-${toStation.code}-BLK-${String(blockNum).padStart(2, '0')}`;
    const signalSeq = 100 + i * 2;
    const startSignal = `ABS-${fromStation.code}-${signalSeq}UP`;
    const endSignal = `ABS-${fromStation.code}-${signalSeq + 2}UP`;

    let occupancy: BaseOccupancy = 'free';
    let assignedTrain: { id: string; name: string } | undefined;

    if (i === occupiedIndex1 || i === occupiedIndex2) {
      occupancy = 'occupied';
      assignedTrain = rng.pick(SAMPLE_TRAIN_SERVICES);
    } else if (i === reservedIndex1 || i === reservedIndex2) {
      occupancy = 'reserved';
    }

    const issues: BlockIssue[] = [];
    if (issueIndices.has(i)) {
      const template = rng.pick(TYPICAL_ISSUES);
      issues.push({
        issue_id: `ISSUE-${fromStation.code}-${blockNum}-A`,
        issue_type: template.type,
        description: template.description,
        severity: template.severity,
        reported_by: rng.chance(0.7) ? 'P-WAY Inspector (Northern Div)' : 'Signal Maintainer (S&T Depot)',
        timestamp: new Date(Date.now() - rng.nextInt(600000, 36000000)).toISOString(),
      });

      // Occasional simultaneous issue on the same block
      if (rng.chance(0.35)) {
        const secondTemplate = rng.pick(
          TYPICAL_ISSUES.filter((t) => t.type !== template.type)
        );
        issues.push({
          issue_id: `ISSUE-${fromStation.code}-${blockNum}-B`,
          issue_type: secondTemplate.type,
          description: secondTemplate.description,
          severity: secondTemplate.severity,
          reported_by: 'Section Controller (Control Office)',
          timestamp: new Date(Date.now() - rng.nextInt(60000, 7200000)).toISOString(),
        });
      }
    }

    const blockProps: BlockProperties = {
      block_id: blockId,
      sequence: i,
      start_signal: startSignal,
      end_signal: endSignal,
      occupancy,
      issues,
      train_id: assignedTrain?.id,
      train_name: assignedTrain?.name,
      length_m: 1000 + rng.nextInt(0, 8) * 100,
      max_speed_kmh: rng.pick(SPEED_LIMITS),
      gradient: rng.pick(GRADIENTS),
    };

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: blockGeometries[i],
      },
      properties: blockProps,
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
