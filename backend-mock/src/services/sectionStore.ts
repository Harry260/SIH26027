import {
  Station,
  ResourceInfo,
  Train,
  Trip,
  BlockIssue,
  ResourceId,
  TrainId,
  IssueId,
  IssueType,
  IssueSeverity,
  SubmitIssueBody,
  ResourceBlock,
  RepairRequest,
  RouteCorridor,
} from '../types/index.js';
import {
  findStationByCode,
  POPULAR_CORRIDORS,
} from '../data/stations.js';
import {
  generateResourcesForCorridor,
  getNextIssueId,
} from '../generators/resourceGenerator.js';
import {
  generateTripsForCorridor,
  solveTimetablePlan,
} from '../generators/planGenerator.js';

export interface CorridorData {
  corridor: string;
  fromStation: Station;
  toStation: Station;
  meta: RouteCorridor;
  trains: Train[];
  trips: Trip[];
  resources: ResourceInfo[];
  repairs: RepairRequest[];
}

class CorridorStore {
  private cache: Map<string, CorridorData> = new Map();

  public normalizeKey(corridorStr: string): { from: string; to: string; key: string } {
    const clean = corridorStr.trim().toUpperCase().replace('-', '_');
    const parts = clean.split('_');
    if (parts.length >= 2) {
      return { from: parts[0], to: parts[1], key: `${parts[0]}_${parts[1]}` };
    }
    return { from: clean, to: '', key: clean };
  }

  /**
   * Retrieves or dynamically initializes a corridor
   */
  public getOrCreateCorridor(corridorStr: string): CorridorData {
    const { from, to, key } = this.normalizeKey(corridorStr);
    const existing = this.cache.get(key);
    if (existing) {
      return existing;
    }

    const fromStation = findStationByCode(from);
    const toStation = findStationByCode(to);

    if (!fromStation) {
      throw new Error(`Station not found with code: '${from}'`);
    }
    if (!toStation) {
      throw new Error(`Station not found with code: '${to}'`);
    }

    const { resources, totalBlocks, distanceKm } = generateResourcesForCorridor(
      fromStation,
      toStation
    );

    const resourceIds = resources.map((r) => r.resource.id);
    const { trains, trips } = generateTripsForCorridor(
      fromStation,
      toStation,
      resourceIds,
      key
    );

    const meta: RouteCorridor = POPULAR_CORRIDORS.find(
      (c) =>
        (c.fromCode === from && c.toCode === to) ||
        (c.fromCode === to && c.toCode === from)
    ) || {
      id: fromStation.id * 100 + toStation.id,
      code: key,
      fromCode: from,
      toCode: to,
      name: `${fromStation.name} ↔ ${toStation.name} Corridor`,
      zone: fromStation.zone,
      distance_km: distanceKm,
      total_blocks: totalBlocks,
      description: 'Standard Automatic Block Signal Territory.',
    };

    const data: CorridorData = {
      corridor: key,
      fromStation,
      toStation,
      meta,
      trains,
      trips,
      resources,
      repairs: [],
    };

    this.cache.set(key, data);
    return data;
  }

  public findResource(
    resourceId: ResourceId
  ): { resourceInfo: ResourceInfo; corridor: CorridorData } | undefined {
    for (const corridor of this.cache.values()) {
      const match = corridor.resources.find((r) => r.resource.id === resourceId);
      if (match) {
        return { resourceInfo: match, corridor };
      }
    }
    return undefined;
  }

  public findTrain(trainId: TrainId): Train | undefined {
    for (const corridor of this.cache.values()) {
      const match = corridor.trains.find((t) => t.id === trainId);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  public getResourceIssues(resourceId: ResourceId): BlockIssue[] {
    const target = this.findResource(resourceId);
    return target ? target.resourceInfo.issues : [];
  }

  public addIssue(
    resourceId: ResourceId,
    body: SubmitIssueBody
  ): { success: boolean; issue_id: IssueId; severity: IssueSeverity } {
    const target = this.findResource(resourceId);
    const issueId = getNextIssueId();
    const severity: IssueSeverity =
      body.severity || this.predictIssueSeverity(body.issue_type, body.description);

    const newIssue: BlockIssue = {
      issue_id: issueId,
      issue_type: body.issue_type,
      description: body.description,
      severity,
      reported_by: body.reported_by || 'Chief Section Controller',
      timestamp: body.timestamp || new Date().toISOString(),
    };

    if (target) {
      target.resourceInfo.issues.unshift(newIssue);
    }

    return { success: true, issue_id: issueId, severity };
  }

  public predictIssueSeverity(issueType: IssueType, description: string = ''): IssueSeverity {
    const desc = description.toLowerCase();
    if (
      desc.includes('critical') ||
      desc.includes('derail') ||
      desc.includes('broken') ||
      desc.includes('fracture') ||
      desc.includes('fire') ||
      desc.includes('blocked') ||
      desc.includes('collision') ||
      desc.includes('flood') ||
      desc.includes('fallen') ||
      desc.includes('emergency') ||
      desc.includes('red signal') ||
      issueType === 'obstruction'
    ) {
      return 'high';
    }
    if (
      desc.includes('slow') ||
      desc.includes('caution') ||
      desc.includes('tsr') ||
      desc.includes('delay') ||
      desc.includes('intermittent') ||
      desc.includes('glitch') ||
      issueType === 'signal_fault' ||
      issueType === 'speed_restriction'
    ) {
      return 'medium';
    }
    if (issueType === 'maintenance') {
      return 'low';
    }
    return 'medium';
  }

  public resolveIssue(
    resourceId: ResourceId,
    issueId: IssueId
  ): { resolved: boolean } {
    const target = this.findResource(resourceId);
    if (!target) {
      return { resolved: false };
    }

    const prevCount = target.resourceInfo.issues.length;
    target.resourceInfo.issues = target.resourceInfo.issues.filter(
      (i) => i.issue_id !== issueId
    );

    return { resolved: target.resourceInfo.issues.length < prevCount };
  }

  public addResourceBlock(block: ResourceBlock): { success: boolean } {
    const target = this.findResource(block.resource_id);
    if (!target) {
      return { success: false };
    }

    target.corridor.repairs.push({
      resource_id: block.resource_id,
      time_start: block.start,
      time_end: block.end,
    });

    return { success: true };
  }

  public optimizePlan(corridorKey: string): Trip[] {
    const corridor = this.getOrCreateCorridor(corridorKey);
    const result = solveTimetablePlan({
      trips: corridor.trips,
      resources: corridor.resources.map((r) => r.resource),
      repairs: corridor.repairs,
    });
    corridor.trips = result.trips;
    return result.trips;
  }
}

export const corridorStore = new CorridorStore();
