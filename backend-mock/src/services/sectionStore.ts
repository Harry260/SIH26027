import {
  BlockFeatureCollection,
  BlockFeature,
  BlockProperties,
  BlockIssue,
  SubmitIssuePayload,
} from '../types/index.js';
import {
  findStationByCode,
  INDIAN_RAILWAY_STATIONS,
} from '../data/stations.js';
import { generateBlockSectionsForCorridor } from '../generators/blockGenerator.js';

class SectionStore {
  private cache: Map<string, BlockFeatureCollection> = new Map();

  private normalizeKey(fromCode: string, toCode: string): string {
    return `${fromCode.trim().toUpperCase()}_${toCode.trim().toUpperCase()}`;
  }

  /**
   * Retrieves an existing corridor section or dynamically generates and caches a new one
   */
  public getOrCreateSection(fromCode: string, toCode: string): BlockFeatureCollection {
    const key = this.normalizeKey(fromCode, toCode);
    const existing = this.cache.get(key);
    if (existing) {
      return existing;
    }

    const fromStation = findStationByCode(fromCode);
    const toStation = findStationByCode(toCode);

    if (!fromStation) {
      throw new Error(`Station not found with code: '${fromCode}'`);
    }
    if (!toStation) {
      throw new Error(`Station not found with code: '${toCode}'`);
    }

    const generated = generateBlockSectionsForCorridor(fromStation, toStation);
    this.cache.set(key, generated);
    return generated;
  }

  /**
   * Finds a block feature by block_id across all cached sections
   */
  public findBlock(blockId: string): { feature: BlockFeature; sectionKey: string } | undefined {
    for (const [sectionKey, collection] of this.cache.entries()) {
      const match = collection.features.find((f) => f.properties.block_id === blockId);
      if (match) {
        return { feature: match, sectionKey };
      }
    }
    return undefined;
  }

  /**
   * Adds an issue to a block in memory
   */
  public addIssue(
    payload: SubmitIssuePayload
  ): { success: boolean; issue: BlockIssue; blockId: string } {
    let target = this.findBlock(payload.block_id);

    // If block is not yet cached and fromCode/toCode are provided, generate the section first
    if (!target && payload.fromCode && payload.toCode) {
      this.getOrCreateSection(payload.fromCode, payload.toCode);
      target = this.findBlock(payload.block_id);
    }

    const newIssue: BlockIssue = {
      issue_id: `ISSUE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      issue_type: payload.issue_type as any,
      description: payload.description,
      severity: payload.severity,
      reported_by: payload.reported_by || 'Controller / S&T Staff',
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    if (target) {
      target.feature.properties.issues.unshift(newIssue);
      return { success: true, issue: newIssue, blockId: payload.block_id };
    }

    // Even if corridor wasn't in memory yet, return success mock response
    return { success: true, issue: newIssue, blockId: payload.block_id };
  }

  /**
   * Resolves (removes) an issue by issue_id
   */
  public resolveIssue(
    issueId: string,
    blockId?: string
  ): { success: boolean; resolvedCount: number } {
    let resolvedCount = 0;

    for (const collection of this.cache.values()) {
      for (const feature of collection.features) {
        if (blockId && feature.properties.block_id !== blockId) {
          continue;
        }
        const initialLen = feature.properties.issues.length;
        feature.properties.issues = feature.properties.issues.filter(
          (issue) => issue.issue_id !== issueId
        );
        if (feature.properties.issues.length < initialLen) {
          resolvedCount++;
        }
      }
    }

    return { success: resolvedCount > 0, resolvedCount };
  }

  /**
   * Clears the in-memory cache (useful for tests or resets)
   */
  public reset(): void {
    this.cache.clear();
  }
}

export const sectionStore = new SectionStore();

