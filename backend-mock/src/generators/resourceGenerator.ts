import {
  Station,
  ResourceInfo,
  BlockIssue,
  IssueId,
  ResourceId,
} from '../types/index.js';
import { SeededRandom } from '../utils/pseudoRandom.js';
import {
  calculateHaversineDistance,
  generateCurvedRailwayLine,
  splitLineIntoBlocks,
} from './geometryGenerator.js';

export const SAMPLE_TRAINS = [
  { id: 12002, name: 'Bhopal Shatabdi Express', tier: 'Premier' as const, speed: 130 },
  { id: 22436, name: 'Vande Bharat Express', tier: 'Premier' as const, speed: 140 },
  { id: 12952, name: 'Mumbai Tejas Rajdhani', tier: 'Premier' as const, speed: 130 },
  { id: 12301, name: 'Howrah Rajdhani Express', tier: 'Premier' as const, speed: 130 },
  { id: 12260, name: 'Sealdah AC Duronto', tier: 'Express' as const, speed: 110 },
  { id: 12626, name: 'Kerala Superfast Express', tier: 'Express' as const, speed: 105 },
  { id: 8842,  name: 'Heavy-Haul Coal Freight', tier: 'Freight' as const, speed: 75 },
  { id: 4491,  name: 'Container Freight Express', tier: 'Freight' as const, speed: 85 },
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

let globalIssueIdCounter = 1001;

export function getNextIssueId(): IssueId {
  return globalIssueIdCounter++;
}

/**
 * Generates an array of ResourceInfo objects representing track block sections for any corridor.
 */
export function generateResourcesForCorridor(
  fromStation: Station,
  toStation: Station
): { resources: ResourceInfo[]; totalBlocks: number; distanceKm: number } {
  const seedKey = `${fromStation.code}-${toStation.code}`;
  const rng = new SeededRandom(seedKey);

  // 1. Calculate distance
  const straightDist = calculateHaversineDistance(
    fromStation.lat,
    fromStation.lng,
    toStation.lat,
    toStation.lng
  );
  const distanceKm = Math.round(straightDist * 1.18);

  // 2. Determine number of blocks (16-32)
  const totalBlocks = Math.max(16, Math.min(32, Math.round(distanceKm / 14)));

  // 3. Generate smooth spline coordinates and slice into blocks
  const fullLine = generateCurvedRailwayLine(fromStation, toStation, totalBlocks * 4);
  const blockGeometries = splitLineIntoBlocks(fullLine, totalBlocks);

  // 4. Determine base resource ID offset (e.g. 1000..9000 based on station IDs)
  const baseResourceId = fromStation.id * 1000 + toStation.id * 10;

  // Pick occupied & reserved blocks
  const occupiedIdx1 = rng.nextInt(2, Math.floor(totalBlocks / 2) - 1);
  const occupiedIdx2 = rng.nextInt(Math.floor(totalBlocks / 2) + 2, totalBlocks - 3);
  const reservedIdx1 = (occupiedIdx1 + 1) % totalBlocks;
  const reservedIdx2 = (occupiedIdx2 + 1) % totalBlocks;

  const issueIndices = new Set<number>();
  issueIndices.add(rng.nextInt(1, Math.floor(totalBlocks / 2)));
  issueIndices.add(rng.nextInt(Math.floor(totalBlocks / 2) + 1, totalBlocks - 2));

  const resources: ResourceInfo[] = [];

  for (let i = 0; i < totalBlocks; i++) {
    const resourceId: ResourceId = baseResourceId + (i + 1);
    const seq = i + 1;
    const signalSeq = 100 + i * 2;
    const blockName = `ABS-${fromStation.code}-${signalSeq}UP`;

    const coords = blockGeometries[i];
    const midPoint = coords[Math.floor(coords.length / 2)] || [fromStation.lng, fromStation.lat];

    let occupancy: ResourceInfo['occupancy'] = 'free';
    let activeTrain: (typeof SAMPLE_TRAINS)[0] | undefined;

    if (i === occupiedIdx1 || i === occupiedIdx2) {
      occupancy = 'occupied';
      activeTrain = rng.pick(SAMPLE_TRAINS);
    } else if (i === reservedIdx1 || i === reservedIdx2) {
      occupancy = 'reserved';
    }

    const issues: BlockIssue[] = [];
    if (issueIndices.has(i)) {
      const template = rng.pick(TYPICAL_ISSUES);
      issues.push({
        issue_id: getNextIssueId(),
        issue_type: template.type,
        description: template.description,
        severity: template.severity,
        reported_by: rng.chance(0.7) ? 'P-WAY Inspector' : 'S&T Depot',
        timestamp: new Date(Date.now() - rng.nextInt(600000, 36000000)).toISOString(),
      });
    }

    resources.push({
      resource: {
        id: resourceId,
        kind: 'block_section',
        lane_count: 2,
      },
      name: blockName,
      sequence: seq,
      location: [midPoint[0], midPoint[1]],
      coordinates: coords,
      length_m: 1000 + rng.nextInt(0, 8) * 100,
      max_speed_kmh: rng.pick(SPEED_LIMITS),
      gradient: rng.pick(GRADIENTS),
      occupancy,
      active_train: activeTrain?.id,
      train_name: activeTrain?.name,
      issues,
    });
  }

  return { resources, totalBlocks, distanceKm };
}

